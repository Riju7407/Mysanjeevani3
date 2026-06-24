import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Vendor } from '@/lib/models/Vendor';

function formatVendorAddress(address: any) {
  if (!address) return '';
  const parts = [address.street, address.city, address.state, address.pincode, address.country].filter(Boolean);
  return parts.join(', ');
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user ID from query params
    const userId = request.nextUrl.searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user from database
    const user = await User.findById(userId).select('-password');

    if (user) {
      return NextResponse.json(
        {
          message: 'User profile fetched successfully',
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
            fullAddress: user.fullAddress,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
          },
        },
        { status: 200 }
      );
    }

    // Fallback for vendor accounts stored in Vendor collection
    const vendor = await Vendor.findById(userId).select('-password');
    if (vendor) {
      return NextResponse.json(
        {
          message: 'Vendor profile fetched successfully',
          user: {
            id: vendor._id,
            fullName: vendor.vendorName,
            email: vendor.email,
            phone: vendor.phone,
            profileImage: vendor.logo || '',
            fullAddress: formatVendorAddress(vendor.address),
            role: 'vendor',
            isVerified: vendor.status === 'verified',
            createdAt: vendor.createdAt,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
