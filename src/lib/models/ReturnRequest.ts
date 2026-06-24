import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    preferredResolution: {
      type: String,
      enum: ['replacement', 'refund', 'support-review'],
      default: 'support-review',
    },
    status: {
      type: String,
      enum: ['new', 'under-review', 'approved', 'rejected', 'completed'],
      default: 'new',
    },
    supportNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

export const ReturnRequest =
  mongoose.models.ReturnRequest || mongoose.model('ReturnRequest', returnRequestSchema);