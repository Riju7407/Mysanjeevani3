import mongoose from 'mongoose';

const productIdCounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'productId',
  },
  seq: {
    type: Number,
    default: 1000, // Start from 1000
  },
});

export const ProductIdCounter =
  mongoose.models.ProductIdCounter || mongoose.model('ProductIdCounter', productIdCounterSchema);
