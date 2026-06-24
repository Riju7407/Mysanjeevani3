import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/lib/models/Doctor';
import { User } from '@/lib/models/User';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const doctorId = resolvedParams.id;
    const action = resolvedParams.action; // 'approve' or 'reject'
    const body = await request.json();
    const { approvalNote } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Find doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Find corresponding user
    const user = await User.findById(doctor.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Update doctor status
      doctor.approvalStatus = 'approved';
      doctor.isApproved = true;
      doctor.approvedBy = 'admin@MySanjeevni.com'; // You can get from admin session
      doctor.approvedAt = new Date();
      doctor.approvalNote = approvalNote || '';
      await doctor.save();

      // Update user status
      user.isApproved = true;
      user.approvalNote = approvalNote || '';
      user.approvedAt = new Date();
      user.approvedBy = 'admin@MySanjeevni.com';
      await user.save();

      return NextResponse.json(
        {
          message: 'Doctor approved successfully',
          doctor: {
            id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            approvalStatus: doctor.approvalStatus,
          },
        },
        { status: 200 }
      );
    } else if (action === 'reject') {
      // Delete all Cloudinary images before rejecting
      const cloudinaryUrls = [
        doctor.aadharCardUrl,
        doctor.panCardUrl,
        doctor.registrationCertificateUrl,
      ].filter(Boolean);

      for (const url of cloudinaryUrls) {
        try {
          const matches = url.match(/\/([^\/]+)\/([^\/]+)\.(jpg|jpeg|png|pdf)$/i);
          if (matches) {
            const folder = matches[1];
            const fileName = matches[2];
            const resourceType = url.includes('.pdf') ? 'raw' : 'image';
            const publicId = `${folder}/${fileName}`;
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
          }
        } catch (err) {
          console.error('Error deleting Cloudinary image:', err);
        }
      }

      // Update doctor status
      doctor.approvalStatus = 'rejected';
      doctor.isApproved = false;
      doctor.approvalNote = approvalNote || 'Rejected by admin';
      doctor.approvedBy = 'admin@MySanjeevni.com';
      doctor.approvedAt = new Date();
      await doctor.save();

      // Update user status
      user.isApproved = false;
      user.approvalNote = approvalNote || 'Rejected by admin';
      user.approvedBy = 'admin@MySanjeevni.com';
      user.approvedAt = new Date();
      await user.save();

      return NextResponse.json(
        {
          message: 'Doctor rejected',
          doctor: {
            id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            approvalStatus: doctor.approvalStatus,
          },
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Error processing doctor approval:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process approval' },
      { status: 500 }
    );
  }
}
