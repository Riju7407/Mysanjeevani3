'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Prescription {
  productId: string;
  productName: string;
  prescriptionUrl: string;
  uploadedAt: string;
}

interface PrescriptionViewerProps {
  prescriptions: Prescription[];
  orderId: string;
}

export default function PrescriptionViewer({
  prescriptions,
  orderId,
}: PrescriptionViewerProps) {
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">No prescriptions uploaded for this order</p>
      </div>
    );
  }

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsOpen(true);
  };

  return (
    <>
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-lg">📋</span> Prescriptions ({prescriptions.length})
        </h4>

        {prescriptions.map((prescription) => (
          <div
            key={prescription.productId}
            className="flex items-start justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {prescription.productName}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Uploaded:{' '}
                {new Date(prescription.uploadedAt).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleViewPrescription(prescription)}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition"
              >
                👁️ View
              </button>
              <a
                href={prescription.prescriptionUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition"
              >
                ⬇️ Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Full Screen Viewer Modal */}
      {isOpen && selectedPrescription && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedPrescription.productName}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Uploaded:{' '}
                  {new Date(selectedPrescription.uploadedAt).toLocaleString(
                    'en-IN'
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {selectedPrescription.prescriptionUrl.endsWith('.pdf') ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    PDF document - Click download to view
                  </p>
                  <iframe
                    src={`${selectedPrescription.prescriptionUrl}#toolbar=0`}
                    className="w-full h-[600px] border border-gray-300 rounded-lg"
                    title="Prescription PDF"
                  />
                </div>
              ) : (
                <img
                  src={selectedPrescription.prescriptionUrl}
                  alt={selectedPrescription.productName}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Order ID: {orderId}
              </p>
              <div className="flex gap-2">
                <a
                  href={selectedPrescription.prescriptionUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition"
                >
                  ⬇️ Download
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-400 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
