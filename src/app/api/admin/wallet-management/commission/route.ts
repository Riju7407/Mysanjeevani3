import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Commission } from '@/lib/models/Commission';

// Verify admin role
function verifyAdmin(request: NextRequest) {
  const userRole = request.headers.get('x-user-role');
  return userRole === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get or create commission settings
    let commission = await Commission.findOne();

    if (!commission) {
      commission = await Commission.create({
        platformDefaultCommission: 10,
      });
    }

    return NextResponse.json(
      {
        message: 'Commission settings fetched successfully',
        commission: {
          id: commission._id,
          platformDefaultCommission: commission.platformDefaultCommission,
          doctorCommissions: commission.doctorCommissions || [],
          vendorCommissions: commission.vendorCommissions || [],
          categoryCommissions: commission.categoryCommissions || [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get commission error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commission settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { platformDefaultCommission, doctorId, vendorId, categoryId, commissionPercentage } = body;

    // Get or create commission settings
    let commission = await Commission.findOne();

    if (!commission) {
      commission = await Commission.create({
        platformDefaultCommission: platformDefaultCommission || 10,
      });
    }

    // Update platform default commission
    if (platformDefaultCommission !== undefined) {
      if (platformDefaultCommission < 0 || platformDefaultCommission > 100) {
        return NextResponse.json(
          { error: 'Commission percentage must be between 0 and 100' },
          { status: 400 }
        );
      }
      commission.platformDefaultCommission = platformDefaultCommission;
    }

    // Update doctor commission
    if (doctorId && commissionPercentage !== undefined) {
      if (commissionPercentage < 0 || commissionPercentage > 100) {
        return NextResponse.json(
          { error: 'Commission percentage must be between 0 and 100' },
          { status: 400 }
        );
      }

      const existingDoctor = commission.doctorCommissions.find(
        (dc) => dc.doctorId.toString() === doctorId
      );

      if (existingDoctor) {
        existingDoctor.commissionPercentage = commissionPercentage;
        existingDoctor.effectiveFrom = new Date();
      } else {
        commission.doctorCommissions.push({
          doctorId,
          commissionPercentage,
          effectiveFrom: new Date(),
        } as any);
      }
    }

    // Update vendor commission
    if (vendorId && commissionPercentage !== undefined) {
      if (commissionPercentage < 0 || commissionPercentage > 100) {
        return NextResponse.json(
          { error: 'Commission percentage must be between 0 and 100' },
          { status: 400 }
        );
      }

      const existingVendor = commission.vendorCommissions.find(
        (vc) => vc.vendorId.toString() === vendorId
      );

      if (existingVendor) {
        existingVendor.commissionPercentage = commissionPercentage;
        existingVendor.effectiveFrom = new Date();
      } else {
        commission.vendorCommissions.push({
          vendorId,
          commissionPercentage,
          effectiveFrom: new Date(),
        } as any);
      }
    }

    // Update category commission
    if (categoryId && commissionPercentage !== undefined) {
      if (commissionPercentage < 0 || commissionPercentage > 100) {
        return NextResponse.json(
          { error: 'Commission percentage must be between 0 and 100' },
          { status: 400 }
        );
      }

      const existingCategory = commission.categoryCommissions.find(
        (cc) => cc.category === categoryId
      );

      if (existingCategory) {
        existingCategory.commissionPercentage = commissionPercentage;
      } else {
        commission.categoryCommissions.push({
          category: categoryId,
          commissionPercentage,
        } as any);
      }
    }

    await commission.save();

    return NextResponse.json(
      {
        message: 'Commission settings updated successfully',
        commission: {
          id: commission._id,
          platformDefaultCommission: commission.platformDefaultCommission,
          doctorCommissions: commission.doctorCommissions,
          vendorCommissions: commission.vendorCommissions,
          categoryCommissions: commission.categoryCommissions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update commission error:', error);
    return NextResponse.json(
      { error: 'Failed to update commission settings' },
      { status: 500 }
    );
  }
}
