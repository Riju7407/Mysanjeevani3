import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    platformDefaultCommission: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
      description: 'Default commission percentage for all doctors and vendors',
    },
    doctorCommissions: [
      {
        doctorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Doctor',
        },
        commissionPercentage: {
          type: Number,
          min: 0,
          max: 100,
        },
        effectiveFrom: Date,
        effectiveUntil: Date,
        reason: String,
      },
    ],
    vendorCommissions: [
      {
        vendorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Vendor',
        },
        commissionPercentage: {
          type: Number,
          min: 0,
          max: 100,
        },
        effectiveFrom: Date,
        effectiveUntil: Date,
        reason: String,
      },
    ],
    categoryCommissions: [
      {
        category: String,
        commissionPercentage: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Commission = mongoose.models.Commission || mongoose.model('Commission', commissionSchema);
