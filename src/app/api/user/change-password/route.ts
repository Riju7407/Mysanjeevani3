import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Vendor } from '@/lib/models/Vendor';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // Hash helper
    const hash = (s: string) =>
      crypto.createHash('sha256').update(String(s)).digest('hex');

    // Try updating User
    const user = await User.findById(userId).select('+password');
    if (user) {
      const currentHash = hash(currentPassword);
      if (String(user.password) !== currentHash) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      const newHash = hash(newPassword);
      user.password = newHash;
      await user.save();

      return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 });
    }

    // Try Vendor fallback
    const vendor = await Vendor.findById(userId).select('+password');
    if (vendor) {
      const currentHash = hash(currentPassword);
      if (String(vendor.password) !== currentHash) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      vendor.password = hash(newPassword);
      await vendor.save();

      return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
