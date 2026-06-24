'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import PrescriptionUploadModal from './PrescriptionUploadModal';
import {
  getMissingPrescriptions,
  getPrescriptionData,
  storePrescriptionData,
  clearPrescriptionData,
} from '@/lib/prescriptionUtils';

interface CartItem {
  _id?: string;
  productId: string;
  productName: string;
  quantity: number;
  requiresPrescription?: boolean;
}

interface PrescriptionCheckerProps {
  cartItems: CartItem[];
  userId: string;
  onPrescriptionsReady?: (isReady: boolean) => void;
}

export default function PrescriptionChecker({
  cartItems,
  userId,
  onPrescriptionsReady,
}: PrescriptionCheckerProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CartItem | null>(null);
  const [uploadedPrescriptions, setUploadedPrescriptions] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string>('');
  
  // Track previous readiness state to avoid infinite callback loops
  const previousReadinessRef = useRef<boolean | null>(null);

  // Get Rx products in cart - memoized to prevent infinite loops
  const rxProducts = useMemo(() => 
    cartItems.filter((item) => item.requiresPrescription),
    [cartItems]
  );

  // Memoize product IDs for stable dependency tracking
  const rxProductIds = useMemo(() => 
    rxProducts.map((p) => p.productId).sort().join(','),
    [rxProducts]
  );

  // Load prescriptions from session storage when rx products change
  useEffect(() => {
    const prescriptions: Record<string, string> = {};
    rxProducts.forEach((product) => {
      const url = getPrescriptionData(product.productId);
      if (url) {
        prescriptions[product.productId] = url;
      }
    });
    setUploadedPrescriptions(prescriptions);
  }, [rxProductIds]);

  // Notify parent when prescriptions readiness changes - only call if state actually changed
  useEffect(() => {
    if (!onPrescriptionsReady || rxProducts.length === 0) {
      return;
    }
    
    const allReady = rxProducts.every((p) => uploadedPrescriptions[p.productId]);
    
    // Only call callback if readiness state has changed
    if (previousReadinessRef.current !== allReady) {
      previousReadinessRef.current = allReady;
      onPrescriptionsReady(allReady);
    }
  }, [uploadedPrescriptions, rxProductIds, onPrescriptionsReady, rxProducts]);

  const handleUploadClick = (product: CartItem) => {
    setSelectedProduct(product);
    setShowModal(true);
    setError('');
  };

  const handleUploadSuccess = (prescriptionUrl: string) => {
    if (!selectedProduct) return;

    // Store in session storage
    storePrescriptionData(selectedProduct.productId, prescriptionUrl);

    // Update state - the useEffect will handle notifying parent
    const updated = { ...uploadedPrescriptions };
    updated[selectedProduct.productId] = prescriptionUrl;
    setUploadedPrescriptions(updated);

    setShowModal(false);
  };

  const handleClearPrescription = (productId: string) => {
    clearPrescriptionData(productId);
    const updated = { ...uploadedPrescriptions };
    delete updated[productId];
    setUploadedPrescriptions(updated);
  };

  // Don't show anything if no Rx products
  if (rxProducts.length === 0) {
    return null;
  }

  const allUploaded = rxProducts.every((p) => uploadedPrescriptions[p.productId]);

  return (
    <div className="bg-white rounded-lg border border-amber-200 p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl">⚕️</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">
            Prescription Required
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {rxProducts.length} product{rxProducts.length !== 1 ? 's' : ''} in your cart
            {rxProducts.length === 1 ? ' requires' : ' require'} a valid prescription
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            allUploaded
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {allUploaded ? '✓ Complete' : 'Pending'}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Product List */}
      <div className="space-y-3">
        {rxProducts.map((product) => {
          const isUploaded = !!uploadedPrescriptions[product.productId];
          return (
            <div
              key={product.productId}
              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-semibold text-gray-900">{product.productName}</p>
                <p className="text-sm text-gray-600">
                  Qty: {product.quantity}
                </p>
                {isUploaded && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ Prescription uploaded
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {isUploaded && (
                  <button
                    onClick={() =>
                      window.open(uploadedPrescriptions[product.productId])
                    }
                    className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition"
                  >
                    View
                  </button>
                )}

                <button
                  onClick={() => handleUploadClick(product)}
                  className={`px-3 py-1 text-xs font-medium rounded transition ${
                    isUploaded
                      ? 'text-gray-600 border border-gray-300 hover:bg-gray-100'
                      : 'text-white bg-emerald-500 border border-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {isUploaded ? 'Replace' : 'Upload'}
                </button>

                {isUploaded && (
                  <button
                    onClick={() => handleClearPrescription(product.productId)}
                    className="px-3 py-1 text-xs font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-xs text-blue-800">
        <p className="font-semibold mb-1">📋 What we need:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>A clear photo or scan of a valid prescription</li>
          <li>Formats: JPG, JPEG, PNG, or PDF</li>
          <li>Max file size: 5MB</li>
          <li>Only you, admin, and vendors can view this</li>
        </ul>
      </div>

      {/* Status Banner */}
      {!allUploaded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-xs text-amber-800">
          <span className="font-semibold">⚠️ Note:</span> You must upload
          prescriptions for all Rx products before proceeding to checkout.
        </div>
      )}

      {allUploaded && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-4 text-xs text-emerald-800">
          <span className="font-semibold">✓ All set!</span> All prescriptions
          have been uploaded. You can proceed to checkout.
        </div>
      )}

      {/* Modal */}
      {selectedProduct && (
        <PrescriptionUploadModal
          isOpen={showModal}
          productId={selectedProduct.productId}
          productName={selectedProduct.productName}
          userId={userId}
          onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleUploadSuccess}
          onError={setError}
        />
      )}
    </div>
  );
}
