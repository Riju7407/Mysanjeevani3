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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/doctors/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const doctor = await Doctor.findById(id).lean();
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    return NextResponse.json({ doctor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/doctors/[id] - update doctor
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const doctor = await Doctor.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    return NextResponse.json({ doctor, message: 'Doctor updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/doctors/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const doctor = await Doctor.findByIdAndDelete(id).lean();
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    // Delete all Cloudinary images
    const cloudinaryUrls = [
      (doctor as any).aadharCardUrl,
      (doctor as any).panCardUrl,
      (doctor as any).registrationCertificateUrl,
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

    const userId = (doctor as any).userId;
    const doctorEmail = String((doctor as any).email || '').trim().toLowerCase();
    const doctorPhone = String((doctor as any).phone || '').trim();

    const userDeleteOrConditions: any[] = [];
    if (userId) {
      userDeleteOrConditions.push({ _id: userId });
    }
    if (doctorEmail) {
      userDeleteOrConditions.push({ email: { $regex: `^${escapeRegex(doctorEmail)}$`, $options: 'i' } });
    }
    if (doctorPhone) {
      userDeleteOrConditions.push({ phone: doctorPhone });
    }

    if (userDeleteOrConditions.length > 0) {
      await User.deleteMany({
        role: 'doctor',
        $or: userDeleteOrConditions,
      });
    }

    return NextResponse.json({ message: 'Doctor and linked user deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
