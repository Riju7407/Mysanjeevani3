import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Prescription } from '@/lib/models/Prescription';
import { Notification } from '@/lib/models/Notification';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { prescriptionId } = body;

    if (!prescriptionId) {
      return NextResponse.json(
        { error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    // Get prescription details
    const prescription = await Prescription.findById(prescriptionId)
      .populate('userId', 'fullName email')
      .populate('doctorId', 'name')
      .populate('consultationId', 'patientName');

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Create notification for user
    const notification = await Notification.create({
      userId: prescription.userId._id,
      type: 'prescription',
      title: 'New Prescription Received',
      message: `Dr. ${prescription.doctorId.name} has sent you a prescription for your consultation`,
      relatedId: prescriptionId,
      read: false,
    });

    // TODO: Send email notification
    // await sendEmailNotification(prescription.userId.email, prescription);

    return NextResponse.json(
      {
        message: 'Prescription notification sent successfully',
        notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send prescription notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
