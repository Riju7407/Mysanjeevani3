import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdminToken } from '@/lib/auth/adminAuth';
import mongoose from 'mongoose';

// Schema for storing popular partner test IDs
const popularPartnerTestsSchema = new mongoose.Schema(
  {
    testIds: {
      type: [String],
      default: [],
    },
    provider: {
      type: String,
      enum: ['thyrocare', 'healthians', 'all'],
      default: 'all',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

let PopularPartnerTests: any = null;

async function getPopularPartnerTestsModel() {
  if (!PopularPartnerTests) {
    await connectDB();
    if (mongoose.models.PopularPartnerTests) {
      PopularPartnerTests = mongoose.models.PopularPartnerTests;
    } else {
      PopularPartnerTests = mongoose.model('PopularPartnerTests', popularPartnerTestsSchema);
    }
  }
  return PopularPartnerTests;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const model = await getPopularPartnerTestsModel();
    
    const config = await model.findOne({ provider: 'all' }) || { testIds: [] };

    return NextResponse.json({
      data: config.testIds || [],
      success: true,
    });
  } catch (error: any) {
    console.error('Error fetching popular partner tests:', error);
    return NextResponse.json(
      { error: error.message || 'Server error', data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // Verify admin authentication
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { popularTestIds = [] } = body;

    if (!Array.isArray(popularTestIds)) {
      return NextResponse.json(
        { error: 'popularTestIds must be an array' },
        { status: 400 }
      );
    }

    await connectDB();
    const model = await getPopularPartnerTestsModel();

    const config = await model.findOneAndUpdate(
      { provider: 'all' },
      {
        testIds: popularTestIds,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      data: config.testIds,
      message: `Updated ${popularTestIds.length} popular partner tests`,
      success: true,
    });
  } catch (error: any) {
    console.error('Error updating popular partner tests:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
