/**
 * Lab Test Booking API with SMS Notification
 * Example implementation showing SMS integration for lab tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendLabTestBookingSms } from '@/lib/smsService';

interface LabTestBookingRequest {
  phone: string;
  email: string;
  testType: string;
  testName: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:MM (24-hour format)
  homeCollection: boolean;
  address?: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = (await request.json()) as LabTestBookingRequest;

    const { phone, email, testType, testName, bookingDate, bookingTime, homeCollection, address } = body;

    // Validation
    if (!phone || !email || !testType || !bookingDate || !bookingTime) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: phone, email, testType, bookingDate, bookingTime',
        },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(bookingTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' },
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

    // Create booking ID (format: LAB-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const bookingId = `LAB-${dateStr}-${randomStr}`;

    // Format date and time for SMS (e.g., "2024-06-20 10:30 AM")
    const bookingDateTime = formatDateTimeForSms(bookingDate, bookingTime);

    // TODO: Save lab test booking to database
    // const booking = await LabTestBooking.create({
    //   bookingId,
    //   phone: fullPhone,
    //   email,
    //   testType,
    //   testName,
    //   bookingDate,
    //   bookingTime,
    //   homeCollection,
    //   address: homeCollection ? address : null,
    //   status: 'CONFIRMED',
    //   createdAt: new Date(),
    // });

    // Send SMS notification
    try {
      await sendLabTestBookingSms(
        `+${fullPhone}`,
        bookingId,
        bookingDateTime
      );
      console.log(
        `[Lab Tests] SMS sent to ${fullPhone} for booking ${bookingId}`
      );
    } catch (smsError) {
      console.error(
        `[Lab Tests] Failed to send SMS to ${fullPhone}:`,
        smsError
      );
      // Don't fail the booking if SMS fails - log and continue
    }

    return NextResponse.json(
      {
        success: true,
        bookingId,
        bookingDateTime,
        testName,
        homeCollection,
        message:
          'Lab test booking confirmed. Check SMS for confirmation and booking details.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Lab Tests] Request failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create lab test booking';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Get lab test booking details
 */
export async function GET(request: NextRequest) {
  try {
    const bookingId = request.nextUrl.searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId query parameter is required' },
        { status: 400 }
      );
    }

    // TODO: Fetch booking from database
    // const booking = await LabTestBooking.findOne({ bookingId });

    return NextResponse.json(
      {
        success: true,
        booking: {
          bookingId,
          // ... booking details
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Lab Tests] GET request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch booking';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Cancel lab test booking
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, phone, reason } = body;

    if (!bookingId || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, phone' },
        { status: 400 }
      );
    }

    // TODO: Update booking status to CANCELLED
    // await LabTestBooking.findByIdAndUpdate(bookingId, { status: 'CANCELLED', cancelReason: reason });

    return NextResponse.json(
      {
        success: true,
        message: `Booking ${bookingId} has been cancelled. Refund will be processed within 5-7 business days.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Lab Tests] DELETE request failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to cancel booking';
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
