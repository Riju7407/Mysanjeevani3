/**
 * Comprehensive SMS Service for My Sanjeevni Portal
 * Handles all types of SMS notifications using Pandeyra SMS API
 */

import { buildSmsMessage, isValidTemplate, type SendSmsOptions } from './smsTemplates';

interface PandeyraResponse {
  status?: string;
  message?: string;
  error?: string;
  request_id?: string;
}

export interface SendSmsResult {
  success: boolean;
  message: string;
  requestId?: string;
  timestamp: Date;
  templateId?: string;
  phone?: string;
}

// Validation functions
function validatePhoneNumber(phone: string): string {
  const normalized = String(phone || '').replace(/\D/g, '');

  if (normalized.length < 10) {
    throw new Error('Invalid phone number - must be at least 10 digits');
  }

  if (normalized.length > 15) {
    throw new Error('Invalid phone number - exceeds maximum length');
  }

  return normalized;
}

function getPandeyraCredentials(): { username: string; apiKey: string; senderId: string } {
  const username = process.env.PANDEYRA_SMS_USERNAME;
  const apiKey = process.env.PANDEYRA_SMS_API_KEY;
  const senderId = process.env.PANDEYRA_SMS_SENDER_ID || 'MSNJVI';

  if (!username || !apiKey) {
    throw new Error('Pandeyra SMS credentials are not configured in environment variables');
  }

  return { username, apiKey, senderId };
}

/**
 * Send SMS using template and variables
 * @param options - SMS options with phone, templateId, and variables
 * @returns SendSmsResult with success status
 */
export async function sendSmsWithTemplate(options: SendSmsOptions): Promise<SendSmsResult> {
  const { phone, templateId, variables = [] } = options;

  // Validate phone number
  const normalizedPhone = validatePhoneNumber(phone);

  // Validate template
  if (!isValidTemplate(templateId)) {
    throw new Error(`Invalid SMS template: ${templateId}`);
  }

  // Build message from template
  const message = buildSmsMessage(templateId, variables);

  return sendSms(normalizedPhone, message, templateId);
}

/**
 * Send raw SMS message directly
 * @param phone - Phone number (will be normalized)
 * @param message - SMS message text
 * @param templateId - Optional template ID for logging
 * @returns SendSmsResult with success status
 */
export async function sendSms(
  phone: string,
  message: string,
  templateId?: string
): Promise<SendSmsResult> {
  // Validation
  const normalizedPhone = validatePhoneNumber(phone);

  // Test mode bypass
  if (process.env.SMS_TEST_MODE === 'true') {
    console.log(`[SMS_TEST_MODE] Skipping Pandeyra SMS for ${normalizedPhone}`);
    console.log(`[SMS_TEST_MODE] Template: ${templateId || 'RAW'}`);
    console.log(`[SMS_TEST_MODE] Message: ${message}`);
    return {
      success: true,
      message: 'SMS sent (test mode)',
      timestamp: new Date(),
      templateId,
      phone: normalizedPhone,
    };
  }

  const { username, apiKey, senderId } = getPandeyraCredentials();

  try {
    // Build URL with parameters for Pandeyra SMS API
    const params = new URLSearchParams({
      user: username,
      key: apiKey,
      mobile: normalizedPhone,
      message: message,
      senderid: senderId,
      accusage: '1',
    });

    const url = `https://sms.pandeyra.com/submitsms.jsp?${params.toString()}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data: PandeyraResponse | null = null;

    try {
      // Check content-type header
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        data = (await response.json()) as PandeyraResponse;
      } else {
        // API returned non-JSON response, try to parse as text
        const textResponse = await response.text();
        console.log('[Pandeyra SMS] Received non-JSON response:', textResponse);

        // Check if response indicates success
        if (
          textResponse &&
          (textResponse.toLowerCase().includes('success') ||
            textResponse.toLowerCase().includes('sent') ||
            textResponse.toLowerCase().includes('ok'))
        ) {
          data = {
            status: 'success',
            message: textResponse,
            request_id: textResponse,
          };
        } else {
          // Try to parse as JSON anyway, in case it's actually JSON
          try {
            data = JSON.parse(textResponse) as PandeyraResponse;
          } catch {
            // If still fails, treat as error
            throw new Error(`Unexpected response format: ${textResponse.substring(0, 50)}`);
          }
        }
      }
    } catch (parseError) {
      console.error('[Pandeyra SMS] Response parsing error:', parseError);
      throw new Error('Invalid response format from Pandeyra SMS API');
    }

    // Check response status
    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;

      console.error(`[Pandeyra SMS] HTTP Error: ${errorMessage}`, {
        statusCode: response.status,
        statusText: response.statusText,
        apiResponse: data,
        templateId,
        phone: normalizedPhone,
      });

      throw new Error(`Pandeyra SMS API error: ${errorMessage}`);
    }

    // Check API response status
    if (data && data.status !== 'success' && data.status !== '200') {
      // If we got a successful text response earlier, don't fail here
      if (
        !(
          data.message &&
          (data.message.toLowerCase().includes('sent') || data.message.toLowerCase().includes('success'))
        )
      ) {
        const errorMessage = data.error || data.message || 'API returned failure';

        console.error(`[Pandeyra SMS] API returned failure:`, data);

        throw new Error(errorMessage);
      }
    }

    console.log(`[Pandeyra SMS] SMS sent successfully to ${normalizedPhone}`, {
      templateId: templateId || 'RAW',
      requestId: data?.request_id,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'SMS sent successfully',
      requestId: data?.request_id,
      timestamp: new Date(),
      templateId,
      phone: normalizedPhone,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error(`[Pandeyra SMS] Exception:`, {
      error: errorMessage,
      phone: normalizedPhone,
      templateId: templateId || 'RAW',
      timestamp: new Date(),
    });

    // Throw error with descriptive message
    throw new Error(`Failed to send SMS: ${errorMessage}`);
  }
}

/**
 * Send OTP via SMS (backward compatible function)
 * @param phone - Phone number
 * @param otp - 6-digit OTP
 * @param purpose - Purpose of OTP (login, signup, reset)
 * @returns SendSmsResult
 */
export async function sendOtpViaSms(
  phone: string,
  otp: string,
  purpose: 'login' | 'signup' | 'reset' = 'login'
): Promise<SendSmsResult> {
  const templateMap: Record<string, string> = {
    login: 'LOGIN_OTP',
    signup: 'REGISTRATION_OTP',
    reset: 'PASSWORD_RESET_OTP',
  };

  const templateId = templateMap[purpose];

  return sendSmsWithTemplate({
    phone,
    templateId,
    variables: [otp],
  });
}

/**
 * Send order confirmation SMS
 * @param phone - Phone number
 * @param orderId - Order ID
 */
export async function sendOrderConfirmationSms(phone: string, orderId: string): Promise<SendSmsResult> {
  return sendSmsWithTemplate({
    phone,
    templateId: 'ORDER_CONFIRMATION',
    variables: [orderId],
  });
}

/**
 * Send lab test booking confirmation SMS
 * @param phone - Phone number
 * @param bookingId - Lab test booking ID
 * @param dateTime - Date and time of test
 */
export async function sendLabTestBookingSms(
  phone: string,
  bookingId: string,
  dateTime: string
): Promise<SendSmsResult> {
  return sendSmsWithTemplate({
    phone,
    templateId: 'LAB_TEST_BOOKING',
    variables: [bookingId, dateTime],
  });
}

/**
 * Send doctor consultation booking confirmation SMS
 * @param phone - Phone number
 * @param consultationId - Consultation ID
 * @param dateTime - Date and time of consultation
 */
export async function sendDoctorConsultationBookingSms(
  phone: string,
  consultationId: string,
  dateTime: string
): Promise<SendSmsResult> {
  return sendSmsWithTemplate({
    phone,
    templateId: 'DOCTOR_CONSULTATION_BOOKING',
    variables: [consultationId, dateTime],
  });
}

/**
 * Send prescription ready notification
 * @param phone - Phone number
 * @param prescriptionId - Prescription ID
 */
export async function sendPrescriptionReadySms(phone: string, prescriptionId: string): Promise<SendSmsResult> {
  return sendSmsWithTemplate({
    phone,
    templateId: 'PRESCRIPTION_READY',
    variables: [prescriptionId],
  });
}

/**
 * Send payment success notification
 * @param phone - Phone number
 * @param orderId - Order ID
 * @param amount - Payment amount
 */
export async function sendPaymentSuccessSms(phone: string, orderId: string, amount: string): Promise<SendSmsResult> {
  return sendSmsWithTemplate({
    phone,
    templateId: 'PAYMENT_SUCCESS',
    variables: [orderId, amount],
  });
}

/**
 * Send order shipped notification
 * @param phone - Phone number
 * @param orderId - Order ID
 * @param trackingId - Tracking ID
 */
export async function sendOrderShippedSms(
  phone: string,
  orderId: string,
  trackingId: string
): Promise<SendSmsResult> {
  return sendSmsWithTemplate({
    phone,
    templateId: 'ORDER_SHIPPED',
    variables: [orderId, trackingId],
  });
}

/**
 * Send order delivered notification
 * @param phone - Phone number
 * @param orderId - Order ID
 */
export async function sendOrderDeliveredSms(phone: string, orderId: string): Promise<SendSmsResult> {
  return sendSmsWithTemplate({
    phone,
    templateId: 'ORDER_DELIVERED',
    variables: [orderId],
  });
}

/**
 * Send appointment reminder
 * @param phone - Phone number
 * @param date - Appointment date
 * @param time - Appointment time
 */
export async function sendAppointmentReminderSms(phone: string, date: string, time: string): Promise<SendSmsResult> {
  return sendSmsWithTemplate({
    phone,
    templateId: 'APPOINTMENT_REMINDER',
    variables: [date, time],
  });
}

/**
 * Send refund initiated notification
 * @param phone - Phone number
 * @param orderId - Order ID
 * @param amount - Refund amount
 */
export async function sendRefundInitiatedSms(phone: string, orderId: string, amount: string): Promise<SendSmsResult> {
  return sendSmsWithTemplate({
    phone,
    templateId: 'REFUND_INITIATED',
    variables: [orderId, amount],
  });
}
