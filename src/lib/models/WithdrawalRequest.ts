import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    bankDetailsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankDetails',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    withdrawalMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'neft', 'rtgs', 'imps'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: () => new Date(),
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: Date,
    transactionReference: String, // Payment reference from bank or gateway
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    failureReason: String,
    adminNotes: String,
    razorpayPayoutId: String, // If using Razorpay Payouts API
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
withdrawalRequestSchema.index({ walletId: 1 });
withdrawalRequestSchema.index({ userId: 1 });
withdrawalRequestSchema.index({ doctorId: 1 });
withdrawalRequestSchema.index({ vendorId: 1 });
withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ createdAt: -1 });

export const WithdrawalRequest = mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
