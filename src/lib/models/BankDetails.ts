import mongoose from 'mongoose';

const bankDetailsSchema = new mongoose.Schema(
  {
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
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    upiId: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    preferredWithdrawalMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'neft', 'rtgs', 'imps'],
      default: 'bank_transfer',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    verificationDocument: String, // URL to bank statement or verification document
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
bankDetailsSchema.index({ userId: 1 });
bankDetailsSchema.index({ doctorId: 1 });
bankDetailsSchema.index({ vendorId: 1 });
bankDetailsSchema.index({ isActive: 1 });

export const BankDetails = mongoose.models.BankDetails || mongoose.model('BankDetails', bankDetailsSchema);
