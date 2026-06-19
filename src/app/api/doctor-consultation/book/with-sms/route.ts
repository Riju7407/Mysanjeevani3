/**
 * Doctor Consultation Booking API with SMS Notification
 * Example implementation showing SMS integration for consultations
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendDoctorConsultationBookingSms, sendAppointmentReminderSms } from '@/lib/smsService';

interface ConsultationBookingRequest {
  phone: string;
  email: string;
  patientName: string;
  doctorId: string;
  consultationType: 'VIDEO' | 'AUDIO' | 'CHAT';
  consultationDate: string; // YYYY-MM-DD
  consultationTime: string; // HH:MM (24-hour format)
  symptoms?: string;
  medicalHistory?: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = (await request.json()) as ConsultationBookingRequest;

    const {
      phone,
      email,
      patientName,
      doctorId,
      consultationType,
      consultationDate,
      consultationTime,
      symptoms,
      medicalHistory,
    } = body;

    // Validation
    if (!phone || !email || !patientName || !doctorId || !consultationDate || !consultationTime) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: phone, email, patientName, doctorId, consultationDate, consultationTime',
        },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(consultationDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(consultationTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' },
        { status: 400 }
      );
    }

    // Validate consultation type
    if (!['VIDEO', 'AUDIO', 'CHAT'].includes(consultationType)) {
      return NextResponse.json(
        { error: 'Invalid consultation type. Must be VIDEO, AUDIO, or CHAT' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = String(phone).replace(/\D/g, '');
    if (normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const fullPhone = normalizedPhone.length === 10 ? `91${normalizedPhone}` : normalizedPhone;

    // Create consultation ID (format: CONS-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const consultationId = `CONS-${dateStr}-${randomStr}`;

    // Format date and time for SMS (e.g., "2024-06-20 10:30 AM")
    const consultationDateTime = formatDateTimeForSms(consultationDate, consultationTime);

    // TODO: Save consultation booking to database
    // const consultation = await DoctorConsultation.create({
    //   consultationId,
    //   phone: fullPhone,
    //   email,
    //   patientName,
    //   doctorId,
    //   consultationType,
    //   consultationDate,
    //   consultationTime,
    //   symptoms,
    //   medicalHistory,
    //   status: 'CONFIRMED',
    //   createdAt: new Date(),
    // });

    // Send SMS notification
    try {
      await sendDoctorConsultationBookingSms(
        `+${fullPhone}`,
        consultationId,
        consultationDateTime
      );
      console.log(
        `[Doctor Consultation] SMS sent to ${fullPhone} for consultation ${consultationId}`
      );
    } catch (smsError) {
      console.error(
        `[Doctor Consultation] Failed to send SMS to ${fullPhone}:`,
        smsError
      );
      // Don't fail the booking if SMS fails - log and continue
    }

    return NextResponse.json(
      {
        success: true,
        consultationId,
        consultationDateTime,
        consultationType,
        patientName,
        message:
          'Doctor consultation booking confirmed. Check SMS for consultation details and joining link.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Doctor Consultation] Request failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create consultation booking';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Get consultation details
 */
export async function GET(request: NextRequest) {
  try {
    const consultationId = request.nextUrl.searchParams.get('consultationId');

    if (!consultationId) {
      return NextResponse.json(
        { error: 'consultationId query parameter is required' },
        { status: 400 }
      );
    }

    // TODO: Fetch consultation from database
    // const consultation = await DoctorConsultation.findOne({ consultationId });

    return NextResponse.json(
      {
        success: true,
        consultation: {
          consultationId,
          // ... consultation details
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Doctor Consultation] GET request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch consultation';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Reschedule consultation
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultationId, phone, newDate, newTime } = body;

    if (!consultationId || !phone || !newDate || !newTime) {
      return NextResponse.json(
        { error: 'Missing required fields: consultationId, phone, newDate, newTime' },
        { status: 400 }
      );
    }

    // TODO: Update consultation in database
    // await DoctorConsultation.findByIdAndUpdate(consultationId, {
    //   consultationDate: newDate,
    //   consultationTime: newTime,
    // });

    return NextResponse.json(
      {
        success: true,
        message: 'Consultation rescheduled successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Doctor Consultation] PUT request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to reschedule consultation';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Cancel consultation
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultationId, phone, reason } = body;

    if (!consultationId || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: consultationId, phone' },
        { status: 400 }
      );
    }

    // TODO: Update consultation status to CANCELLED
    // await DoctorConsultation.findByIdAndUpdate(consultationId, {
    //   status: 'CANCELLED',
    //   cancelReason: reason,
    // });

    return NextResponse.json(
      {
        success: true,
        message: `Consultation ${consultationId} has been cancelled. Refund will be processed within 2-3 business days.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Doctor Consultation] DELETE request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel consultation';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Send appointment reminder SMS
 * This can be called by a scheduled job before consultation time
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultationId, phone, consultationDate, consultationTime } = body;

    if (!consultationId || !phone || !consultationDate || !consultationTime) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: consultationId, phone, consultationDate, consultationTime',
        },
        { status: 400 }
      );
    }

    // Send reminder SMS
    try {
      await sendAppointmentReminderSms(
        `+${phone.replace(/\D/g, '')}`,
        consultationDate,
        consultationTime
      );
      console.log(
        `[Doctor Consultation] Reminder SMS sent for consultation ${consultationId}`
      );
    } catch (smsError) {
      console.error(
        `[Doctor Consultation] Failed to send reminder SMS:`,
        smsError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Reminder SMS sent successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Doctor Consultation] PATCH request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send reminder';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Helper function to format date and time for SMS
 * Converts "2024-06-20" and "10:30" to "2024-06-20 10:30 AM"
 */
function formatDateTimeForSms(date: string, time: string): string {
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayTime = `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;

    return `${date} ${displayTime}`;
  } catch {
    // Fallback if parsing fails
    return `${date} ${time}`;
  }
}
