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

    // Filter partner tests to only include thyrocare
    const thyroCareTests = partnerTests.filter((t: any) => 
      t.provider?.toLowerCase() === 'thyrocare' || t.provider?.toLowerCase() === 'thyrocare_'
    );

    // Combine and format thyrocare tests only
    const allTests = thyroCareTests.slice(0, limit).map((t: any) => ({
      ...t,
      source: 'thyrocare',
      testName: t.name || t.testName,
      icon: t.icon || '🧪',
      popular: true,
    }));

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
