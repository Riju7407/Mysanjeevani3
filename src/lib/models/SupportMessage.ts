import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    sender: {
      type: String,
      enum: ['user', 'support'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    channel: {
      type: String,
      enum: ['chat', 'ticket'],
      default: 'chat',
    },
  },
  {
    timestamps: true,
  }
);

export const SupportMessage =
  mongoose.models.SupportMessage || mongoose.model('SupportMessage', supportMessageSchema);