import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { LabTest } from '@/lib/models/LabTest';
import { Product } from '@/lib/models/Product';
import { fetchPartnerCatalog } from '@/lib/labPartners';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const category = request.nextUrl.searchParams.get('category') || '';

    // Build query for LabTest model
    const labTestQuery: any = { 
      isActive: true,
      popular: true,
    };
    if (category) {
      labTestQuery.category = category;
    }

    // Fetch from LabTest model
    const labTests = await LabTest.find(labTestQuery)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Build query for Product model
    const productQuery: any = {
      isActive: true,
      productType: 'Lab Tests',
      $or: [
        { popularSections: { $in: ['LabTests'] } },
        { popularSection: 'LabTests' },
      ],
    };
    if (category) {
      productQuery.category = category;
    }

    // Fetch from Product model (vendor lab tests)
    const products = await Product.find(productQuery)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Fetch from partner catalog
    const partnerTests = await fetchPartnerCatalog({
      category: category || undefined,
      limit,
    });

    // Combine and format all sources
    const allTests = [
      ...labTests.map((t: any) => ({
        _id: t._id?.toString(),
        testId: t.testId,
        name: t.testName,
        testName: t.testName,
        description: t.description,
        price: t.price,
        mrp: t.mrp,
        category: t.category,
        icon: t.icon || '🧪',
        image: t.image,
        rating: t.rating,
        reviews: t.reviews,
        popular: t.popular,
        isActive: t.isActive,
        source: 'local-lab-tests',
        stock: 10,
        currencySymbol: '₹',
      })),
      ...products.map((p: any) => ({
        _id: p._id?.toString(),
        testId: p._id?.toString(),
        name: p.name,
        testName: p.name,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        displayPrice: p.price,
        displayMrp: p.mrp,
        category: p.category,
        icon: p.icon || '🧪',
        image: p.image,
        rating: p.rating,
        reviews: p.reviews,
        popular: true,
        isActive: p.isActive,
        source: 'vendor-products',
        stock: p.stock || 10,
        currencySymbol: '₹',
      })),
      ...partnerTests.slice(0, limit).map((t: any) => ({
        ...t,
        source: t.provider || 'partner',
        testName: t.name || t.testName,
        icon: t.icon || '🧪',
        popular: true,
      })),
    ];

    // Remove duplicates and limit results
    const uniqueTests = Array.from(
      new Map(allTests.map((test) => [test._id, test])).values()
    ).slice(0, limit);

    return NextResponse.json({
      data: uniqueTests,
      total: uniqueTests.length,
      source: 'popular-lab-tests',
    });
  } catch (error: any) {
    console.error('Error fetching popular lab tests:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
