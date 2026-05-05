import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        productId: String,
        productName: String,
        quantity: Number,
        price: Number,
        total: Number,
      },
    ],
    totalPrice: Number,
    deliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    shippingCharge: {
      type: Number,
      default: 0,
    },
    courier: {
      type: String,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    orderNotes: String,
    shiprocketOrderId: String,
    shiprocketShipmentId: String,
    awbNumber: String,
  },
  {
    timestamps: true,
  }
);

export const Order =
  mongoose.models.Order || mongoose.model('Order', orderSchema);
