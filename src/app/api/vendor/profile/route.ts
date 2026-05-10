import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Vendor } from '@/lib/models/Vendor';

function isCloudinaryImageUrl(url?: string) {
  return !!url && /^https?:\/\/res\.cloudinary\.com\//i.test(String(url).trim());
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const vendorId = request.nextUrl.searchParams.get('vendorId');
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Vendor profile retrieved',
      vendor,
    });
  } catch (error: any) {
    console.error('Vendor profile fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      vendorId,
      vendorName,
      phone,
      businessType,
      description,
      logo,
      street,
      city,
      state,
      pincode,
      country,
    } = body;

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    if (logo !== undefined && logo && !isCloudinaryImageUrl(logo)) {
      return NextResponse.json({ error: 'Profile image must be uploaded to Cloudinary first' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (vendorName !== undefined) updates.vendorName = vendorName;
    if (phone !== undefined) updates.phone = phone;
    if (businessType !== undefined) updates.businessType = businessType;
    if (description !== undefined) updates.description = description;
    if (logo !== undefined) updates.logo = logo || '';

    const addressUpdates: Record<string, unknown> = {};
    if (street !== undefined) addressUpdates.street = street;
    if (city !== undefined) addressUpdates.city = city;
    if (state !== undefined) addressUpdates.state = state;
    if (pincode !== undefined) addressUpdates.pincode = pincode;
    if (country !== undefined) addressUpdates.country = country;
    if (Object.keys(addressUpdates).length > 0) {
      updates.address = addressUpdates;
    }

    updates.updatedAt = new Date();

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: updates },
      { new: true }
    ).lean();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Vendor profile updated successfully',
      vendor,
    });
  } catch (error: any) {
    console.error('Vendor profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}