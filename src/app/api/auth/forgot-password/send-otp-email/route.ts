import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { EmailOtp } from '@/lib/models/EmailOtp';
import { sendOtpViaResend } from '@/lib/resend';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { User } from '@/lib/models/User';
import { Doctor } from '@/lib/models/Doctor';
import { Vendor } from '@/lib/models/Vendor';

const IS_DEV = process.env.NODE_ENV !== 'production';
const OTP_TTL_MS = Math.max(10, Number(process.env.OTP_TTL_SECONDS || '600')) * 1000; // 10 minutes default
const RESEND_COOLDOWN_SECONDS = Math.max(30, Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60'));

function hashOtp(email: string, otp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${email}:${otp}:${process.env.OTP_HASH_SECRET || 'MySanjeevni-email-otp'}`)
    .digest('hex');
}

function generateOtp(): string {
  if (process.env.OTP_TEST_MODE === 'true') {
    return '123456';
  }

  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeRole(role: string): 'user' | 'vendor' | 'doctor' {
  const normalized = role.toLowerCase().trim();
  if (normalized === 'vendor') return 'vendor';
  if (normalized === 'doctor') return 'doctor';
  return 'user';
}

async function findUserByEmail(
  email: string,
  role: 'user' | 'vendor' | 'doctor'
): Promise<{ user: any; name: string } | null> {
  try {
    if (role === 'doctor') {
      const doctor = await Doctor.findOne({ email }).lean();
      if (doctor) {
        return { user: doctor, name: doctor.name };
      }
    } else if (role === 'vendor') {
      const vendor = await Vendor.findOne({ email }).lean();
      if (vendor) {
        return { user: vendor, name: vendor.vendorName };
      }
    } else {
      const user = await User.findOne({ email }).lean();
      if (user) {
        return { user, name: user.fullName };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = String(body?.email || '').trim();
    const role = normalizeRole(String(body?.role || 'user'));
    const email = normalizeEmail(rawEmail);

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    await connectDB();

    const clientIp = getClientIp(request);

    // Rate limiting (relaxed in development)
    if (!IS_DEV) {
      const ipLimit = await consumeRateLimit(
        'forgot-password-email-send-otp-ip',
        clientIp,
        20,
        15 * 60 * 1000
      );
      if (!ipLimit.allowed) {
        return NextResponse.json(
          {
            error: `Too many OTP requests from this IP. Try again in ${ipLimit.retryAfterSeconds}s.`,
            retryAfterSeconds: ipLimit.retryAfterSeconds,
          },
          { status: 429 }
        );
      }

      const emailLimit = await consumeRateLimit(
        'forgot-password-email-send-otp-email',
        `${role}:${email}`,
        5,
        15 * 60 * 1000
      );
      if (!emailLimit.allowed) {
        return NextResponse.json(
          {
            error: `Too many OTP requests for this email. Try again in ${emailLimit.retryAfterSeconds}s.`,
            retryAfterSeconds: emailLimit.retryAfterSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Check if user exists
    const lookup = await findUserByEmail(email, role);
    if (!lookup) {
      // Don't reveal whether email exists for security
      return NextResponse.json(
        {
          error: 'If this email is registered, you will receive a password reset link.',
        },
        { status: 200 }
      );
    }

    const { user, name } = lookup;

    // Check vendor and doctor status
    if (role === 'vendor' && user.status) {
      if (user.status === 'rejected') {
        return NextResponse.json(
          { error: 'Your vendor account was rejected. Contact support.' },
          { status: 403 }
        );
      }

      if (user.status === 'suspended') {
        return NextResponse.json({ error: 'Your vendor account is suspended' }, { status: 403 });
      }
    }

    if (role === 'doctor' && !user.isApproved) {
      return NextResponse.json(
        {
          error: 'Your doctor account is pending admin approval. Please wait for approval before resetting password.',
          pendingApproval: true,
        },
        { status: 403 }
      );
    }

    // Check cooldown period
    const lastOtp = await EmailOtp.findOne({ email, role }).sort({ createdAt: -1 });
    if (lastOtp?.createdAt) {
      const elapsedSeconds = Math.floor((Date.now() - lastOtp.createdAt.getTime()) / 1000);
      const remaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;

      if (remaining > 0) {
        return NextResponse.json(
          {
            error: `Please wait ${remaining} seconds before requesting a new OTP.`,
            retryAfterSeconds: remaining,
          },
          { status: 429 }
        );
      }
    }

    // Generate and send OTP
    const otp = generateOtp();
    const otpHash = hashOtp(email, otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // Send email
    const emailResult = await sendOtpViaResend({
      to: email,
      otp,
      type: 'reset',
      userName: name,
    });

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return NextResponse.json(
        {
          error: 'Failed to send OTP email. Please try again later.',
        },
        { status: 500 }
      );
    }

    // Delete old OTPs and create new one
    await EmailOtp.deleteMany({ email, role, consumed: false });
    await EmailOtp.create({
      email,
      role,
      otpHash,
      expiresAt,
      consumed: false,
    });

    return NextResponse.json(
      {
        message: 'OTP sent successfully to your registered email',
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email for security
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    console.error('Error in send-otp:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
