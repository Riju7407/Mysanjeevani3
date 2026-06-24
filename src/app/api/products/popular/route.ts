import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';

export const dynamic = 'force-dynamic';

async function fetchActiveVendorProducts(query: any, limit: number) {
  const pipeline: any[] = [
    { $match: query },
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $or: [
          { vendor: null },
          { 'vendor.isActive': true },
        ],
      },
    },
    { $sort: { updatedAt: -1, createdAt: -1 } },
    { $limit: limit },
    { $project: { vendor: 0 } },
  ];

  return Product.aggregate(pipeline);
}

export async function GET() {
  try {
    await connectDB();

    // Fetch products marked popular by admin first.
    let popularProducts = await fetchActiveVendorProducts(
      {
        isPopular: true,
        isActive: true,
        $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
      },
      8
    );

    // Fallback: if none marked as popular, return latest active products.
    if (popularProducts.length === 0) {
      popularProducts = await fetchActiveVendorProducts(
        {
          isActive: true,
          $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
        },
        8
      );
    }

    return NextResponse.json(
      {
        message: 'Popular products fetched successfully',
        products: popularProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get popular products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
