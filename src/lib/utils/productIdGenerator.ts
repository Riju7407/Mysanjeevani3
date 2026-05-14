import { ProductIdCounter } from '@/lib/models/ProductIdCounter';

/**
 * Generates the next numeric product ID
 * Uses a counter collection to ensure unique sequential IDs
 * @returns Promise<number> - The next numeric product ID
 */
export async function generateProductId(): Promise<number> {
  const result = await ProductIdCounter.findByIdAndUpdate(
    'productId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result.seq;
}

/**
 * Gets the current product ID counter value
 * @returns Promise<number> - The current counter value
 */
export async function getCurrentProductIdCounter(): Promise<number> {
  const result = await ProductIdCounter.findById('productId');
  return result?.seq || 1000;
}

/**
 * Resets the product ID counter (use with caution)
 * @param newValue - The new starting value for the counter
 */
export async function resetProductIdCounter(newValue: number = 1000): Promise<void> {
  await ProductIdCounter.findByIdAndUpdate(
    'productId',
    { seq: newValue },
    { upsert: true }
  );
}
