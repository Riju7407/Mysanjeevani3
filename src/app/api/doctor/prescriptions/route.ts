import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Prescription } from '@/lib/models/Prescription';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const doctorId = request.nextUrl.searchParams.get('doctorId');
    const status = request.nextUrl.searchParams.get('status');

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const query: any = { doctorId };
    if (status) query.status = status;

    const prescriptions = await Prescription.find(query)
      .populate('userId', 'fullName email phone')
      .populate('consultationId', 'appointmentDate patientName consultationType')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: 'Doctor prescriptions fetched successfully',
        prescriptions,
        total: prescriptions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
