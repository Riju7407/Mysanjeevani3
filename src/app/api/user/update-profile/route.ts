import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Doctor } from '@/lib/models/Doctor';
import { Vendor } from '@/lib/models/Vendor';

function isCloudinaryImageUrl(url?: string) {
  return !!url && /^https?:\/\/res\.cloudinary\.com\//i.test(String(url).trim());
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, fullName, phone, fullAddress, profileImage } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!fullName || fullName.trim() === '') {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    if (profileImage !== undefined && profileImage && !isCloudinaryImageUrl(profileImage)) {
      return NextResponse.json(
        { error: 'Profile image must be uploaded to Cloudinary first' },
        { status: 400 }
      );
    }

    // Update user in database
    const updates: Record<string, unknown> = {
      fullName: fullName.trim(),
      phone: phone?.trim() || '',
    };

    if (fullAddress !== undefined) {
      updates.fullAddress = fullAddress?.trim() || '';
    }

    if (profileImage !== undefined) {
      updates.profileImage = profileImage || '';
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (updatedUser) {
      if (updatedUser.role === 'doctor' && profileImage !== undefined) {
        try {
          await Doctor.findOneAndUpdate(
            { email: updatedUser.email },
            { $set: { avatar: updatedUser.profileImage || '' } },
            { new: true }
          );
        } catch (doctorSyncError) {
          console.error('Failed to sync doctor avatar after user profile update:', doctorSyncError);
        }
      }

      return NextResponse.json(
        {
          message: 'Profile updated successfully',
          user: {
            id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            phone: updatedUser.phone,
            profileImage: updatedUser.profileImage,
            fullAddress: updatedUser.fullAddress,
            role: updatedUser.role,
            isVerified: updatedUser.isVerified,
          },
        },
        { status: 200 }
      );
    }

    // If no User found, try updating a Vendor record (for vendor accounts stored separately)
    try {
      const vendorUpdates: Record<string, unknown> = {};
      if (fullName !== undefined) vendorUpdates.vendorName = String(fullName).trim();
      if (phone !== undefined) vendorUpdates.phone = String(phone).trim();
      if (profileImage !== undefined) vendorUpdates.logo = profileImage || '';

      const updatedVendor = await Vendor.findByIdAndUpdate(
        userId,
        { $set: vendorUpdates },
        { new: true }
      );

      if (updatedVendor) {
        return NextResponse.json(
          {
            message: 'Profile updated successfully',
            user: {
              id: updatedVendor._id,
              fullName: updatedVendor.vendorName,
              email: updatedVendor.email,
              phone: updatedVendor.phone,
              profileImage: updatedVendor.logo || '',
              role: 'vendor',
            },
          },
          { status: 200 }
        );
      }
    } catch (vendorErr) {
      console.error('Vendor profile update error:', vendorErr);
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
