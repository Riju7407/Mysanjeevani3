import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { uploadImageBufferToCloudinary } from '@/lib/cloudinaryUtils';

/**
 * Upload prescription file (jpg, jpeg, png, pdf) to Cloudinary
 * For products requiring Rx before checkout
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const productName = formData.get('productName') as string;
    const userId = formData.get('userId') as string;

    // Validation
    if (!file || !productId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, productId, userId' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Allowed: jpg, jpeg, png, pdf',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Upload to Cloudinary
    const result = await uploadImageBufferToCloudinary(
      fileBuffer,
      `prescriptions/${userId}`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Prescription uploaded successfully',
        prescriptionUrl: result.url,
        publicId: result.publicId,
        productId,
        productName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Prescription upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
