import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SupportMessage } from '@/lib/models/SupportMessage';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const messages = await SupportMessage.find({ userId, channel: 'chat' }).sort({ createdAt: 1 }).lean();

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch support chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, userName, message } = body;

    if (!userId || !userName || !message) {
      return NextResponse.json(
        { error: 'User information and message are required' },
        { status: 400 }
      );
    }

    const trimmedMessage = String(message).trim();
    if (!trimmedMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const userMessage = await SupportMessage.create({
      userId,
      sender: 'user',
      message: trimmedMessage,
      channel: 'chat',
    });

    const supportMessage = await SupportMessage.create({
      userId,
      sender: 'support',
      message: `Support team: Thanks ${String(userName).trim()}. We have received your message and will review it shortly.`,
      channel: 'chat',
    });

    return NextResponse.json(
      {
        message: 'Chat message sent successfully',
        messages: [userMessage, supportMessage],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create support chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}