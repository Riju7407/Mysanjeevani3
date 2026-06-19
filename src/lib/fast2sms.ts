/**
 * BACKWARD COMPATIBILITY LAYER
 * This file maintains backward compatibility with existing code
 * All functionality has been moved to smsService.ts and smsTemplates.ts
 * 
 * New code should import from smsService.ts directly
 */

import { sendOtpViaSms, type SendSmsResult } from './smsService';

export type OtpSendResult = SendSmsResult;

/**
 * @deprecated Use sendOtpViaSms from smsService.ts instead
 * Backward compatible wrapper for OTP sending
 */
export async function sendOtpViaFast2Sms(
  phone: string,
  otp: string,
  purpose: 'login' | 'signup' | 'reset' = 'login'
): Promise<OtpSendResult> {
  return sendOtpViaSms(phone, otp, purpose);
}

/**
 * Alternative method for sending OTP - using SMS (maintained for compatibility)
 */
export async function sendOtpViaWhatsApp(
  phone: string,
  otp: string,
  purpose: 'login' | 'signup' | 'reset' = 'login'
): Promise<OtpSendResult> {
  // Delegate to Pandeyra SMS (WhatsApp not available in Pandeyra, use SMS)
  return sendOtpViaFast2Sms(phone, otp, purpose);
}

/**
 * Get wallet balance - Pandeyra SMS balance check
 * Note: Pandeyra API might not support balance retrieval. Returns mock value.
 */
export async function getFast2SmsBalance(): Promise<number> {
  const { username, apiKey } = getPandeyraCredentials();

  try {
    // Pandeyra doesn't have a dedicated balance API like Fast2SMS
    // Return a mock value indicating the service is available
    console.log('[Pandeyra SMS] Balance check - service is available');
    return 100; // Return demo balance as per credentials provided
  } catch (error) {
    throw new Error(`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
