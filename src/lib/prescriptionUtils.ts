/**
 * Prescription management utilities for products requiring Rx
 */

export interface PrescriptionData {
  productId: string;
  productName: string;
  prescriptionUrl: string;
  uploadedAt: Date;
}

/**
 * Store prescription URLs in sessionStorage
 * Used during checkout to track which products have prescriptions uploaded
 */
export function storePrescriptionData(
  productId: string,
  prescriptionUrl: string
): void {
  try {
    const data = sessionStorage.getItem('prescriptions');
    const prescriptions = data ? JSON.parse(data) : {};
    prescriptions[productId] = prescriptionUrl;
    sessionStorage.setItem('prescriptions', JSON.stringify(prescriptions));
  } catch (error) {
    console.error('Error storing prescription:', error);
  }
}

/**
 * Get prescription URL for a specific product
 */
export function getPrescriptionData(productId: string): string | null {
  try {
    const data = sessionStorage.getItem('prescriptions');
    if (!data) return null;
    const prescriptions = JSON.parse(data);
    return prescriptions[productId] || null;
  } catch (error) {
    console.error('Error retrieving prescription:', error);
    return null;
  }
}

/**
 * Get all prescription URLs from sessionStorage
 */
export function getAllPrescriptions(): Record<string, string> {
  try {
    const data = sessionStorage.getItem('prescriptions');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error retrieving prescriptions:', error);
    return {};
  }
}

/**
 * Clear prescription data from sessionStorage
 */
export function clearPrescriptionData(productId?: string): void {
  try {
    if (productId) {
      const data = sessionStorage.getItem('prescriptions');
      if (data) {
        const prescriptions = JSON.parse(data);
        delete prescriptions[productId];
        sessionStorage.setItem('prescriptions', JSON.stringify(prescriptions));
      }
    } else {
      sessionStorage.removeItem('prescriptions');
    }
  } catch (error) {
    console.error('Error clearing prescriptions:', error);
  }
}

/**
 * Check if all Rx products in cart have prescriptions uploaded
 */
export function allPrescriptionsUploaded(
  cartItems: Array<{ productId: string; requiresPrescription?: boolean }>
): boolean {
  const rxProducts = cartItems.filter((item) => item.requiresPrescription);
  if (rxProducts.length === 0) return true; // No Rx products

  const prescriptions = getAllPrescriptions();
  return rxProducts.every((item) => prescriptions[item.productId]);
}

/**
 * Get list of Rx products without prescriptions
 */
export function getMissingPrescriptions(
  cartItems: Array<{ productId: string; productName: string; requiresPrescription?: boolean }>
): Array<{ productId: string; productName: string }> {
  const prescriptions = getAllPrescriptions();
  return cartItems.filter(
    (item) => item.requiresPrescription && !prescriptions[item.productId]
  );
}
