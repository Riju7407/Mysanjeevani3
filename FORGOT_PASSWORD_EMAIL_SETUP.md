# 📧 Email-Based Forgot Password System Setup Guide

## Overview

You now have an email-based forgot password system that works for Users, Doctors, and Vendors using **Resend** for sending OTP emails.

## ✅ What Was Implemented

### New Files Created:

1. **`src/lib/models/EmailOtp.ts`** - Database model for storing email OTPs
2. **`src/lib/resend.ts`** - Resend email integration utility
3. **`src/app/api/auth/forgot-password/send-otp-email/route.ts`** - API to send OTP via email
4. **`src/app/api/auth/forgot-password/reset-email/route.ts`** - API to reset password using email OTP
5. **`src/app/forgot-password/page.tsx`** - Updated UI (changed from phone to email)

## 🔧 Setup Instructions

### Step 1: Install Resend Package

```bash
npm install resend
```

### Step 2: Add Environment Variables to `.env.local`

Add the following to your `.env.local` file:

```env
# Resend Configuration
RESEND_API_KEY=re_UMrB9efp_FzS2ThYd9To4A94TrmVpjBfq
RESEND_FROM_EMAIL=noreply@mysanjeevani.com

# OTP Configuration (Optional - adjust if needed)
OTP_TTL_SECONDS=600
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_HASH_SECRET=MySanjeevni-email-otp
OTP_TEST_MODE=false
```

### ⚠️ Important Security Notes:

1. **Never commit the API key** - The `.env.local` file is in your `.gitignore` and should never be committed
2. **Protect your API key** - Keep `RESEND_API_KEY` secret and only accessible on the server
3. **Use environment variables** - Always load sensitive credentials from environment variables, never hardcode them

### Step 3: Verify Environment Setup

Run this command to verify your setup:

```bash
npm run dev
```

Then test the forgot password flow:

1. Visit: `http://localhost:3000/forgot-password`
2. Select User/Doctor/Vendor role
3. Enter a registered email
4. Click "Send OTP"
5. Check the email for OTP
6. Enter OTP and set new password

## 📋 API Endpoints

### Send OTP via Email

**POST** `/api/auth/forgot-password/send-otp-email`

**Request:**

```json
{
  "email": "user@example.com",
  "role": "user" // or "doctor", "vendor"
}
```

**Response:**

```json
{
  "message": "OTP sent successfully to your registered email",
  "email": "us***@example.com",
  "cooldownSeconds": 60
}
```

### Reset Password with Email OTP

**POST** `/api/auth/forgot-password/reset-email`

**Request:**

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123",
  "role": "user"
}
```

**Response:**

```json
{
  "message": "Password reset successful. You can now login with your new password.",
  "success": true
}
```

## 🛡️ Features

✅ **Role-Based Support** - Works for User, Doctor, and Vendor accounts
✅ **Email Verification** - Sends OTP via Resend email service
✅ **Rate Limiting** - Prevents brute force attacks (5 attempts per 15 minutes per email)
✅ **OTP Expiration** - OTPs expire after 10 minutes
✅ **Secure Hashing** - OTPs are hashed before storing in database
✅ **Account Status Checks** - Validates account status before allowing reset
✅ **Email Masking** - Returns masked email in response for privacy
✅ **Cooldown Period** - 60-second cooldown between resend requests
✅ **Beautiful Email Template** - Professional HTML email template

## 📧 Email Features

The system sends a beautifully formatted HTML email with:

- Professional header with MySanjeevani branding
- Clear OTP display
- Expiration time information
- Security warning
- Footer with company info

## 🔍 Testing

### Test OTP Mode

To test without sending real emails, set this in `.env.local`:

```env
OTP_TEST_MODE=true
```

When enabled, the system will always generate OTP: **123456**

## 🚀 Next Steps

1. Install Resend package: `npm install resend`
2. Configure environment variables in `.env.local`
3. Test the forgot password flow
4. Monitor email delivery in Resend dashboard

## 📞 Support

If you encounter issues:

1. Check that all environment variables are set
2. Verify Resend API key is valid
3. Check MongoDB connection is working
4. Monitor logs for error messages

---

**Created:** 2024
**Last Updated:** 2024
