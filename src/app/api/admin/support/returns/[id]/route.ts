import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ReturnRequest } from '@/lib/models/ReturnRequest';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorRole = request.headers.get('x-user-role');
    if (actorRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can update return requests.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Return request ID is required.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, supportNote } = body;

    await connectDB();

    const updates: any = {};
    if (status) updates.status = status;
    if (typeof supportNote === 'string') updates.supportNote = supportNote.trim();

    const requestDoc = await ReturnRequest.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!requestDoc) {
      return NextResponse.json(
        { error: 'Return request not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Return request updated successfully.',
      request: requestDoc,
    });
  } catch (error: any) {
    console.error('Admin return request update error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to update return request.' },
      { status: 500 }
    );
  }
}