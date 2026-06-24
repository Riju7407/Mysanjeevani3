import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ReturnRequest } from '@/lib/models/ReturnRequest';

export async function GET(request: NextRequest) {
  try {
    const actorRole = request.headers.get('x-user-role');
    if (actorRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can view return requests.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || '').trim();
    const search = (searchParams.get('search') || '').trim();

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
      ];
    }

    const requests = await ReturnRequest.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ requests, total: requests.length });
  } catch (error: any) {
    console.error('Admin return requests fetch error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch return requests.' },
      { status: 500 }
    );
  }
}