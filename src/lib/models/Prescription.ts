import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorConsultation',
      required: true,
    },
    prescriptionFile: String, // URL to uploaded file
    doctorName: {
      type: String,
      required: true,
    },
    doctorRegistrationNumber: {
      type: String,
      default: '',
    },
    doctorAddress: {
      type: String,
      default: '',
    },
    hospitalName: String,
    issueDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: Date,
    medicines: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
      },
    ],
    diagnosis: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'used'],
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Prescription =
  mongoose.models.Prescription ||
  mongoose.model('Prescription', prescriptionSchema);
