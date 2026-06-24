'use client';

import { useState } from 'react';

interface PDFViewerProps {
  url?: string;
  label?: string;
  className?: string;
}

export function DocumentViewer({ url, label, className = '' }: PDFViewerProps) {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayLabel = label || 'View document';

  if (!url) {
    return <span className="text-gray-500">Not uploaded</span>;
  }

  const handleViewDocument = () => {
    setError(null);
    setShowModal(true);
  };

  // Use proxy endpoint to serve documents
  const proxyUrl = `/api/documents/proxy?url=${encodeURIComponent(url)}`;

  return (
    <>
      <button
        onClick={handleViewDocument}
        className={`text-blue-600 hover:text-blue-800 underline ${className}`}
        type="button"
      >
        {displayLabel}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold truncate">
                {String(displayLabel).substring(0, 100)}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0"
                type="button"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={proxyUrl}
                className="w-full h-full border rounded"
                title={String(displayLabel)}
                onError={() => setError('Failed to load document')}
                style={{ minHeight: '400px' }}
              />
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <a
                href={proxyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold text-sm"
              >
                Open Fullscreen
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold text-sm"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
