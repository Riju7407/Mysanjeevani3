/**
 * SMS Templates for My Sanjeevni Portal
 * All templates use Pandeyra SMS API with DLT compliance
 */

export interface SmsTemplate {
  id: string;
  name: string;
  template: string;
  maxVariables: number;
  description: string;
}

export interface SendSmsOptions {
  phone: string;
  templateId: string;
  variables?: string[];
}

export interface SmsResponse {
  success: boolean;
  message: string;
  requestId?: string;
  timestamp: Date;
}

/**
 * SMS Templates with DLT-compliant messages
 */
export const SMS_TEMPLATES: Record<string, SmsTemplate> = {
  // Authentication Templates
  LOGIN_OTP: {
    id: 'LOGIN_OTP',
    name: 'Login OTP',
    template: 'OTP {#var#} is required to log in to your account on My Sanjeevni Portal (https://www.mysanjeevni.com/login). Do not share it with anyone.',
    maxVariables: 1,
    description: 'OTP for user login',
  },

  REGISTRATION_OTP: {
    id: 'REGISTRATION_OTP',
    name: 'Registration OTP',
    template: 'OTP {#var#} is required to verify your account on My Sanjeevni Portal (https://mysanjeevni.com/signup). Do not share it with anyone.',
    maxVariables: 1,
    description: 'OTP for new user registration',
  },

  PASSWORD_RESET_OTP: {
    id: 'PASSWORD_RESET_OTP',
    name: 'Password Reset OTP',
    template: 'OTP {#var#} is required to reset your password on My Sanjeevni Portal (https://mysanjeevni.com/forgot-password). Do not share it with anyone.',
    maxVariables: 1,
    description: 'OTP for password reset',
  },

  // Order and Transaction Templates
  ORDER_CONFIRMATION: {
    id: 'ORDER_CONFIRMATION',
    name: 'Order Confirmation',
    template: 'Thank you for your order, Order ID: {#var#} Track your order anytime at https://mysanjeevni.com/ and We will notify you once it is shipped.',
    maxVariables: 1,
    description: 'Order booking confirmation with tracking link',
  },

  // Lab Test Templates
  LAB_TEST_BOOKING: {
    id: 'LAB_TEST_BOOKING',
    name: 'Lab Test Booking Confirmation',
    template: 'Your lab test booking is confirmed, Booking ID: {#var#} Date & Time: {#var#} For details, visit https://mysanjeevni.com/',
    maxVariables: 2,
    description: 'Lab test booking confirmation with date and time',
  },

  // Doctor Consultation Templates
  DOCTOR_CONSULTATION_BOOKING: {
    id: 'DOCTOR_CONSULTATION_BOOKING',
    name: 'Doctor Consultation Booking',
    template: 'Your doctor consultation is scheduled, Consultation ID: {#var#} Date & Time: {#var#} Join via https://mysanjeevni.com/',
    maxVariables: 2,
    description: 'Doctor consultation booking confirmation',
  },

  // Additional Templates for future use
  PRESCRIPTION_READY: {
    id: 'PRESCRIPTION_READY',
    name: 'Prescription Ready',
    template: 'Your prescription is ready for download. Prescription ID: {#var#} Visit https://mysanjeevni.com/prescriptions to view it.',
    maxVariables: 1,
    description: 'Notification that prescription is ready',
  },

  PAYMENT_SUCCESS: {
    id: 'PAYMENT_SUCCESS',
    name: 'Payment Success',
    template: 'Payment successful for Order ID: {#var#} Amount: Rs.{#var#} Your order is being processed. Track it at https://mysanjeevni.com/',
    maxVariables: 2,
    description: 'Payment confirmation notification',
  },

  ORDER_SHIPPED: {
    id: 'ORDER_SHIPPED',
    name: 'Order Shipped',
    template: 'Your order {#var#} has been shipped. Tracking ID: {#var#} Track your delivery at https://mysanjeevni.com/track',
    maxVariables: 2,
    description: 'Order shipment notification',
  },

  ORDER_DELIVERED: {
    id: 'ORDER_DELIVERED',
    name: 'Order Delivered',
    template: 'Your order {#var#} has been delivered. Thank you for shopping at My Sanjeevni. Rate and review at https://mysanjeevni.com/orders',
    maxVariables: 1,
    description: 'Order delivery confirmation',
  },

  APPOINTMENT_REMINDER: {
    id: 'APPOINTMENT_REMINDER',
    name: 'Appointment Reminder',
    template: 'Reminder: Your appointment is scheduled for {#var#} at {#var#}. Join your consultation at https://mysanjeevni.com/doctor-consultation',
    maxVariables: 2,
    description: 'Appointment reminder before consultation',
  },

  REFUND_INITIATED: {
    id: 'REFUND_INITIATED',
    name: 'Refund Initiated',
    template: 'Refund for Order ID: {#var#} has been initiated. Amount: Rs.{#var#} It will be credited to your account in 5-7 business days.',
    maxVariables: 2,
    description: 'Refund notification',
  },
};

/**
 * Replace template variables with actual values
 * Template format uses {#var#} as placeholder
 */
export function replaceTemplateVariables(template: string, variables: string[]): string {
  let message = template;
  for (const variable of variables) {
    message = message.replace('{#var#}', variable);
  }
  return message;
}

/**
 * Get SMS template by ID
 */
export function getTemplate(templateId: string): SmsTemplate | null {
  return SMS_TEMPLATES[templateId] || null;
}

/**
 * Build SMS message from template
 */
export function buildSmsMessage(templateId: string, variables: string[]): string {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`SMS template not found: ${templateId}`);
  }

  if (variables.length > template.maxVariables) {
    throw new Error(
      `Too many variables for template ${templateId}. Expected max ${template.maxVariables}, got ${variables.length}`
    );
  }

  return replaceTemplateVariables(template.template, variables);
}

/**
 * Get all available templates
 */
export function getAllTemplates(): SmsTemplate[] {
  return Object.values(SMS_TEMPLATES);
}

/**
 * Validate template ID exists
 */
export function isValidTemplate(templateId: string): boolean {
  return templateId in SMS_TEMPLATES;
}
