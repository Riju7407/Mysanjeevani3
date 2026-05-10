import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest';
import { Transaction } from '@/lib/models/Transaction';
import { Wallet } from '@/lib/models/Wallet';

// Verify admin role
function verifyAdmin(request: NextRequest) {
  const userRole = request.headers.get('x-user-role');
  return userRole === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const status = request.nextUrl.searchParams.get('status') || 'pending';
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    // Get withdrawal requests
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const total = await WithdrawalRequest.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const withdrawalRequests = await WithdrawalRequest.find(query)
      .populate('bankDetailsId', 'bankName accountNumber upiId')
      .populate('walletId', 'balance totalEarnings')
      .populate('doctorId', 'name email')
      .populate('vendorId', 'vendorName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json(
      {
        message: 'Withdrawal requests fetched successfully',
        requests: withdrawalRequests.map((wr) => ({
          id: wr._id,
          amount: wr.amount,
          status: wr.status,
          withdrawalMethod: wr.withdrawalMethod,
          userType: wr.doctorId ? 'doctor' : wr.vendorId ? 'vendor' : 'user',
          userName: wr.doctorId?.name || wr.vendorId?.vendorName || 'Unknown',
          userEmail: wr.doctorId?.email || wr.vendorId?.email,
          bankAccount: {
            bankName: wr.bankDetailsId?.bankName,
            accountNumber: wr.bankDetailsId?.accountNumber,
            upiId: wr.bankDetailsId?.upiId,
          },
          requestedAt: wr.requestedAt,
          approvedAt: wr.approvedAt,
          completedAt: wr.completedAt,
          failureReason: wr.failureReason,
          adminNotes: wr.adminNotes,
        })),
        pagination: { page, limit, total, pages },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { withdrawalRequestId, action, adminNotes, transactionReference } = body;

    if (!withdrawalRequestId || !action) {
      return NextResponse.json(
        { error: 'Withdrawal request ID and action are required' },
        { status: 400 }
      );
    }

    const withdrawalRequest = await WithdrawalRequest.findById(withdrawalRequestId);

    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      withdrawalRequest.status = 'approved';
      withdrawalRequest.approvedAt = new Date();
      withdrawalRequest.adminNotes = adminNotes || '';
    } else if (action === 'reject') {
      withdrawalRequest.status = 'failed';
      withdrawalRequest.failureReason = adminNotes || 'Rejected by admin';
      withdrawalRequest.adminNotes = adminNotes || '';
    } else if (action === 'mark-completed') {
      withdrawalRequest.status = 'completed';
      withdrawalRequest.completedAt = new Date();
      withdrawalRequest.transactionReference = transactionReference || '';
      withdrawalRequest.adminNotes = adminNotes || '';

      // Create a transaction record
      const transaction = await Transaction.create({
        walletId: withdrawalRequest.walletId,
        userId: withdrawalRequest.userId,
        doctorId: withdrawalRequest.doctorId,
        vendorId: withdrawalRequest.vendorId,
        type: 'withdrawal',
        amount: withdrawalRequest.amount,
        status: 'completed',
        description: `Withdrawal via ${withdrawalRequest.withdrawalMethod}`,
        relatedId: withdrawalRequest._id,
        relatedType: 'withdrawal',
        metadata: {
          bankName: (withdrawalRequest as any).bankDetailsId?.bankName || '',
          transactionReference: transactionReference || '',
        },
      });

      withdrawalRequest.transactionId = transaction._id;

      // Update wallet balance
      const wallet = await Wallet.findById(withdrawalRequest.walletId);
      if (wallet) {
        wallet.balance -= withdrawalRequest.amount;
        wallet.totalWithdrawn += withdrawalRequest.amount;
        await wallet.save();
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or mark-completed' },
        { status: 400 }
      );
    }

    await withdrawalRequest.save();

    return NextResponse.json(
      {
        message: `Withdrawal request ${action}ed successfully`,
        withdrawalRequest: {
          id: withdrawalRequest._id,
          status: withdrawalRequest.status,
          amount: withdrawalRequest.amount,
          approvedAt: withdrawalRequest.approvedAt,
          completedAt: withdrawalRequest.completedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update withdrawal request error:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal request' },
      { status: 500 }
    );
  }
}
