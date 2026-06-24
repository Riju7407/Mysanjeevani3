import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { EmailOtp } from '@/lib/models/EmailOtp';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { User } from '@/lib/models/User';
import { Doctor } from '@/lib/models/Doctor';
import { Vendor } from '@/lib/models/Vendor';
import bcrypt from 'bcrypt';

const IS_DEV = process.env.NODE_ENV !== 'production';

function hashOtp(email: string, otp: string): string {
  return crypto
    .createHash('sha256')
    .update(`${email}:${otp}:${process.env.OTP_HASH_SECRET || 'MySanjeevni-email-otp'}`)
    .digest('hex');
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

async function updateUserPassword(
  email: string,
  role: 'user' | 'vendor' | 'doctor',
  newPassword: string
): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (role === 'doctor') {
      const result = await Doctor.updateOne(
        { email },
        { 
          password: hashedPassword,
          updatedAt: new Date(),
        }
      );
      return result.modifiedCount > 0;
    } else if (role === 'vendor') {
      const result = await Vendor.updateOne(
        { email },
        { 
          password: hashedPassword,
          updatedAt: new Date(),
        }
      );
      return result.modifiedCount > 0;
    } else {
      const result = await User.updateOne(
        { email },
        { 
          password: hashedPassword,
          updatedAt: new Date(),
        }
      );
      return result.modifiedCount > 0;
    }
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = String(body?.email || '').trim();
    const otp = String(body?.otp || '').trim();
    const newPassword = String(body?.newPassword || '').trim();
    const role = normalizeRole(String(body?.role || 'user'));

    const email = normalizeEmail(rawEmail);

    // Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return NextResponse.json(
        { error: 'Valid 6-digit OTP is required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    const clientIp = getClientIp(request);

    // Rate limiting
    if (!IS_DEV) {
      const ipLimit = await consumeRateLimit(
        'forgot-password-email-reset-ip',
        clientIp,
        40,
        15 * 60 * 1000
      );
      if (!ipLimit.allowed) {
        return NextResponse.json(
          {
            error: `Too many password reset attempts from this IP. Try again in ${ipLimit.retryAfterSeconds}s.`,
            retryAfterSeconds: ipLimit.retryAfterSeconds,
          },
          { status: 429 }
        );
      }

      const emailLimit = await consumeRateLimit(
        'forgot-password-email-reset-email',
        `${role}:${email}`,
        10,
        10 * 60 * 1000
      );
      if (!emailLimit.allowed) {
        return NextResponse.json(
          {
            error: `Too many attempts for this email. Try again in ${emailLimit.retryAfterSeconds}s.`,
            retryAfterSeconds: emailLimit.retryAfterSeconds,
          },
          { status: 429 }
        );
      }
    }

    // Verify OTP
    const otpHash = hashOtp(email, otp);
    const otpRecord = await EmailOtp.findOne({
      email,
      role,
      otpHash,
      consumed: false,
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await EmailOtp.updateOne({ _id: otpRecord._id }, { consumed: true });
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Update password
    const passwordUpdated = await updateUserPassword(email, role, newPassword);

    if (!passwordUpdated) {
      return NextResponse.json(
        { error: 'Failed to reset password. User not found.' },
        { status: 404 }
      );
    }

    // Mark OTP as consumed
    await EmailOtp.updateOne({ _id: otpRecord._id }, { consumed: true });

    return NextResponse.json(
      {
        message: 'Password reset successful. You can now login with your new password.',
        success: true,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    console.error('Error in reset-password-email:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
