import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { DoctorConsultation } from '@/lib/models/DoctorConsultation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const doctorId = request.nextUrl.searchParams.get('doctorId');
    const status = request.nextUrl.searchParams.get('status') || 'completed';

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    // Convert doctorId string to MongoDB ObjectId
    let doctorObjectId;
    try {
      doctorObjectId = new mongoose.Types.ObjectId(doctorId);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid Doctor ID format' },
        { status: 400 }
      );
    }

    const consultations = await DoctorConsultation.find({
      doctorId: doctorObjectId,
      status: status || { $in: ['completed', 'in-progress'] },
    })
      .populate('userId', '_id fullName email phone')
      .sort({ appointmentDate: -1 });

    return NextResponse.json(
      {
        message: 'Doctor consultations fetched successfully',
        consultations,
        total: consultations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get doctor consultations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
