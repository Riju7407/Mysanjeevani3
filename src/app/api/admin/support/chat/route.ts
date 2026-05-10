import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SupportMessage } from '@/lib/models/SupportMessage';
import { User } from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const actorRole = request.headers.get('x-user-role');
    if (actorRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can view support chat.' },
        { status: 403 }
      );
    }

    await connectDB();

    const userId = (request.nextUrl.searchParams.get('userId') || '').trim();
    if (userId) {
      const messages = await SupportMessage.find({
        userId,
        channel: 'chat',
      })
        .sort({ createdAt: 1 })
        .lean();

      return NextResponse.json({ messages }, { status: 200 });
    }

    const latestMessages = await SupportMessage.find({ channel: 'chat' })
      .sort({ createdAt: -1 })
      .lean();

    const latestByUserId = new Map<string, any>();
    for (const message of latestMessages) {
      const key = String(message.userId || '').trim();
      if (!key || latestByUserId.has(key)) continue;
      latestByUserId.set(key, message);
    }

    const userIds = Array.from(latestByUserId.keys());
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } })
          .select('fullName email')
          .lean()
      : [];

    const userMap = new Map(
      users.map((user: any) => [String(user._id), user])
    );

    const conversations = userIds.map((id) => {
      const lastMessage = latestByUserId.get(id);
      const user = userMap.get(id);

      return {
        userId: id,
        userName: user?.fullName || 'Unknown User',
        userEmail: user?.email || '',
        lastMessage: lastMessage?.message || '',
        lastSender: lastMessage?.sender || 'user',
        updatedAt: lastMessage?.createdAt,
      };
    });

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error: any) {
    console.error('Admin support chat fetch error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch support chat.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const actorRole = request.headers.get('x-user-role');
    if (actorRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin can send support replies.' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'User ID and message are required.' },
        { status: 400 }
      );
    }

    const reply = await SupportMessage.create({
      userId: String(userId).trim(),
      sender: 'support',
      message: String(message).trim(),
      channel: 'chat',
    });

    return NextResponse.json(
      {
        message: 'Reply sent successfully.',
        supportMessage: reply,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Admin support reply error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to send support reply.' },
      { status: 500 }
    );
  }
}