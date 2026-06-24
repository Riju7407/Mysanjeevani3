import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Prescription } from '@/lib/models/Prescription';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';
import { Doctor } from '@/lib/models/Doctor';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');
    const doctorId = request.nextUrl.searchParams.get('doctorId');
    const consultationId = request.nextUrl.searchParams.get('consultationId');
    const status = request.nextUrl.searchParams.get('status');

    const query: any = {};
    if (userId) query.userId = userId;
    if (doctorId) query.doctorId = doctorId;
    if (consultationId) query.consultationId = consultationId;
    if (status) query.status = status;

    const prescriptions = await Prescription.find(query)
      .populate('userId', 'fullName email phone')
      .populate('doctorId', 'name registrationNumber')
      .populate('consultationId')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: 'Prescriptions fetched successfully',
        prescriptions,
        total: prescriptions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get prescriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      userId,
      doctorId,
      consultationId,
      doctorName,
      doctorRegistrationNumber,
      doctorAddress,
      hospitalName,
      issueDate,
      expiryDate,
      medicines,
      diagnosis,
      notes,
    } = body;

    if (!userId || !doctorId || !consultationId || !doctorName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if consultation exists and belongs to the user
    const consultation = await DoctorConsultation.findById(consultationId);
    if (!consultation) {
      return NextResponse.json(
        { error: 'Consultation not found' },
        { status: 404 }
      );
    }

    if (consultation.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'Consultation does not belong to this user' },
        { status: 403 }
      );
    }

    // Check if prescription already exists for this consultation
    const existingPrescription = await Prescription.findOne({ consultationId });
    if (existingPrescription) {
      return NextResponse.json(
        { error: 'Prescription already exists for this consultation' },
        { status: 409 }
      );
    }

    const prescription = await Prescription.create({
      userId,
      doctorId,
      consultationId,
      doctorName,
      doctorRegistrationNumber,
      doctorAddress,
      hospitalName,
      issueDate: issueDate || new Date(),
      expiryDate,
      medicines: medicines || [],
      diagnosis: diagnosis || '',
      notes: notes || '',
      status: 'active',
    });

    // Update consultation with prescription reference
    await DoctorConsultation.findByIdAndUpdate(consultationId, {
      prescription: prescription._id,
    });

    return NextResponse.json(
      {
        message: 'Prescription created successfully',
        prescription: await prescription.populate('userId doctorId consultationId'),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create prescription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
