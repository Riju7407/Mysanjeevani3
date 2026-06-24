import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';
import { generateProductId } from '@/lib/utils/productIdGenerator';
import { fetchPartnerCatalog } from '@/lib/labPartners';

async function fetchActiveVendorProducts(query: any, page: number, limit: number) {
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
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $project: { vendor: 0 } },
  ];

  return Product.aggregate(pipeline);
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');
    const genderParam = String(request.nextUrl.searchParams.get('gender') || '').toUpperCase();
    const gender = genderParam === 'FEMALE' ? 'FEMALE' : genderParam === 'MALE' ? 'MALE' : undefined;
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const query: any = { isActive: true, productType: 'Lab Tests' };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const localTests = await fetchActiveVendorProducts(query, page, limit);

    const localTotal = await Product.aggregate([
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
      { $count: 'total' },
    ]).then((result) => result[0]?.total || 0);
    const partnerTests = await fetchPartnerCatalog({
      category: category || undefined,
      search: search || undefined,
      page,
      limit,
      gender,
    });

    const tests = [...localTests, ...partnerTests]
      .sort((a: any, b: any) => {
        const left = new Date(a.createdAt || 0).getTime();
        const right = new Date(b.createdAt || 0).getTime();
        return right - left;
      })
      .slice(0, limit);

    const total = localTotal + partnerTests.length;

    return NextResponse.json(
      {
        message: 'Lab tests fetched successfully',
        tests,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get lab tests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      description,
      price,
      category,
      mrp,
    } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const test = await Product.create({
      _id: await generateProductId(),
      name,
      description,
      price,
      category,
      mrp,
      productType: 'Lab Tests',
      isActive: true,
    });

    return NextResponse.json(
      {
        message: 'Lab test created successfully',
        test,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create lab test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
