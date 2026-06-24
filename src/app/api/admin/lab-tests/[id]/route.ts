import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { LabTest } from '@/lib/models/LabTest';

// GET single lab test
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const test = await LabTest.findById(id);
    if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ labTest: test });
  } catch (error) {
    console.error('Error fetching lab test:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch lab test: ${errorMessage}` }, { status: 500 });
  }
}

// PUT update lab test
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    const updated = await LabTest.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ labTest: updated });
  } catch (error) {
    console.error('Error updating lab test:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to update lab test: ${errorMessage}` }, { status: 500 });
  }
}

// DELETE lab test
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await LabTest.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Lab test deleted' });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to delete lab test: ${errorMessage}` }, { status: 500 });
  }
}
