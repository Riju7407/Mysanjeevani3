import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Inquiry } from '@/lib/models/Inquiry';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const tickets = await Inquiry.find({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}