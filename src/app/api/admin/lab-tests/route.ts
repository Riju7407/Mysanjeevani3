import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { LabTest } from '@/lib/models/LabTest';
import { Product } from '@/lib/models/Product';
import { fetchPartnerCatalog } from '@/lib/labPartners';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const search = request.nextUrl.searchParams.get('search') || '';
    const category = request.nextUrl.searchParams.get('category') || '';

    // Build query
    const query: any = { isActive: true };
    if (search) {
      query.$or = [
        { testName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      query.category = category;
    }

    // Fetch from LabTest model
    const labTests = await LabTest.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalLabTests = await LabTest.countDocuments(query);

    // Fetch from Product model (for vendors)
    const productQuery = { ...query, productType: 'Lab Tests' };
    const products = await Product.find(productQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments(productQuery);

    // Fetch from partner catalog (Thyrocare, etc.)
    const partnerTests = await fetchPartnerCatalog({
      search: search || undefined,
      category: category || undefined,
      page,
      limit,
    });

    // Combine all sources
    const allTests = [
      ...labTests.map((t: any) => ({
        _id: t._id,
        testId: t.testId,
        testName: t.testName,
        description: t.description,
        price: t.price,
        mrp: t.mrp,
        category: t.category,
        icon: t.icon,
        image: t.image,
        rating: t.rating,
        reviews: t.reviews,
        popular: t.popular,
        isActive: t.isActive,
        testsIncluded: t.testsIncluded,
        provider: 'local',
      })),
      ...products.map((p: any) => ({
        _id: p._id,
        testId: p._id,
        testName: p.name,
        description: p.shortDescription || p.description,
        price: p.price,
        mrp: p.mrp,
        category: p.category,
        icon: p.icon,
        image: p.image,
        rating: p.rating,
        reviews: p.reviews,
        popular: p.popularSections?.includes('LabTests') || p.popularSection === 'LabTests',
        isActive: p.isActive,
        testsIncluded: p.specifications,
        provider: 'vendor',
      })),
      ...partnerTests.map((t: any) => ({
        ...t,
        provider: t.provider || 'partner',
      })),
    ];

    const total = allTests.length;

    return NextResponse.json({
      data: allTests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching lab tests:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
