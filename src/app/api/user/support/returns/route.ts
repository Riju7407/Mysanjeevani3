import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ReturnRequest } from '@/lib/models/ReturnRequest';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const requests = await ReturnRequest.find({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch return requests error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch return requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, userName, userEmail, orderId, productName, reason, preferredResolution } = body;

    if (!userId || !userName || !userEmail) {
      return NextResponse.json({ error: 'User information is required' }, { status: 400 });
    }

    if (!orderId || !productName || !reason) {
      return NextResponse.json(
        { error: 'Order ID, product name, and reason are required' },
        { status: 400 }
      );
    }

    const requestRecord = await ReturnRequest.create({
      userId,
      userName: String(userName).trim(),
      userEmail: String(userEmail).trim().toLowerCase(),
      orderId: String(orderId).trim(),
      productName: String(productName).trim(),
      reason: String(reason).trim(),
      preferredResolution: preferredResolution || 'support-review',
    });

    return NextResponse.json(
      {
        message: 'Return request submitted successfully',
        request: requestRecord,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create return request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit return request' },
      { status: 500 }
    );
  }
}