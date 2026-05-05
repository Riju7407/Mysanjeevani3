import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file format - only jpg, jpeg, png, pdf allowed
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, JPEG, PNG, and PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    const validMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPG, PNG, or PDF file.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine resource type based on file extension
    const resourceType: 'raw' | 'image' =
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png')
        ? 'image'
        : 'raw';

    // Upload to Cloudinary with sanitized public_id
    // Use only alphanumeric characters to avoid URL encoding issues
    const sanitizedId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'doctor-documents',
          resource_type: resourceType,
          public_id: sanitizedId,
          // Remove attachment flag to allow direct viewing in iframes
          invalidate: true,
          // Add quality settings for PDFs
          ...(fileName.endsWith('.pdf') && {
            quality: 'auto',
          }),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
