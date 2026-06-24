import { Resend } from 'resend';

interface EmailOtpOptions {
  to: string;
  otp: string;
  type: 'reset' | 'verify';
  userName?: string;
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

export async function sendOtpViaResend({
  to,
  otp,
  type,
  userName = 'User',
}: EmailOtpOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const resend = getResendClient();
    const subject = type === 'reset' ? 'Password Reset OTP' : 'Email Verification OTP';
    const emailTemplate = generateOtpEmailTemplate(otp, userName, type);

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@mysanjeevani.com',
      to,
      subject,
      html: emailTemplate,
    });

    if (response.error) {
      return {
        success: false,
        error: response.error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP email';
    console.error('Resend error:', message);
    return {
      success: false,
      error: message,
    };
  }
}

function generateOtpEmailTemplate(
  otp: string,
  userName: string,
  type: 'reset' | 'verify'
): string {
  const title = type === 'reset' ? 'Password Reset Request' : 'Email Verification';
  const message =
    type === 'reset'
      ? 'You requested to reset your password. Use the OTP below to proceed.'
      : 'Verify your email address using the OTP below.';
  const expiryTime = '10 minutes';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
          color: #333333;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .message {
          font-size: 14px;
          color: #666666;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .otp-box {
          background-color: #f0fdf4;
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-label {
          font-size: 12px;
          color: #059669;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .otp-code {
          font-size: 36px;
          font-weight: 700;
          color: #10b981;
          letter-spacing: 4px;
          font-family: 'Courier New', monospace;
          margin: 10px 0;
        }
        .expiry {
          font-size: 12px;
          color: #dc2626;
          margin-top: 10px;
        }
        .note {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 13px;
          color: #92400e;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666666;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <div class="greeting">Hi ${userName},</div>
          <div class="message">${message}</div>
          <div class="otp-box">
            <div class="otp-label">Your One-Time Password</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry">This OTP will expire in ${expiryTime}</div>
          </div>
          <div class="note">
            <strong>⚠️ Important:</strong> Never share this OTP with anyone. MySanjeevani staff will never ask for your OTP.
          </div>
        </div>
        <div class="footer">
          <div class="footer-text">© ${new Date().getFullYear()} MySanjeevani. All rights reserved.</div>
          <div class="footer-text">This is an automated email. Please do not reply.</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
