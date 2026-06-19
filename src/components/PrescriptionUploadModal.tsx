'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface PrescriptionUploadModalProps {
  isOpen: boolean;
  productId: string;
  productName: string;
  userId: string;
  onClose: () => void;
  onSuccess: (prescriptionUrl: string) => void;
  onError: (error: string) => void;
}

export default function PrescriptionUploadModal({
  isOpen,
  productId,
  productName,
  userId,
  onClose,
  onSuccess,
  onError,
}: PrescriptionUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      onError('Invalid file type. Allowed: JPG, JPEG, PNG, PDF');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      onError('File size exceeds 5MB limit');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onError('Please select a file');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);
      formData.append('productName', productName);
      formData.append('userId', userId);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onSuccess(response.prescriptionUrl);
          setFile(null);
          setPreview(null);
          setUploadProgress(0);
          onClose();
        } else {
          const response = JSON.parse(xhr.responseText);
          onError(response.error || 'Upload failed');
          setUploadProgress(0);
        }
        setLoading(false);
      });

      xhr.addEventListener('error', () => {
        onError('Upload failed. Please try again.');
        setLoading(false);
      });

      xhr.open('POST', '/api/prescriptions/upload');
      xhr.send(formData);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">📋</div>
            <h2 className="text-2xl font-bold text-gray-900">Prescription Required</h2>
          </div>
          <p className="text-gray-600 text-sm">
            <span className="font-semibold">{productName}</span> requires a valid prescription before checkout.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-emerald-800">
            ✓ Upload a clear prescription photo or document<br />
            ✓ Formats: JPG, JPEG, PNG, or PDF<br />
            ✓ Maximum file size: 5MB<br />
            ✓ Only you, admin, and vendor can view this
          </p>
        </div>

        {/* File Upload Area */}
        <div className="mb-6">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition"
            >
              <div className="text-4xl mb-3">📁</div>
              <p className="text-gray-900 font-semibold mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                JPG, JPEG, PNG or PDF (max 5MB)
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-contain rounded-lg bg-gray-100"
              />
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File Info */}
        {file && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
            <p className="text-blue-900">
              <span className="font-semibold">Selected:</span> {file.name}
            </p>
            <p className="text-blue-700">
              Size: {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm font-semibold text-emerald-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Uploading...' : 'Upload Prescription'}
          </button>
        </div>

        {/* Privacy Notice */}
        <p className="text-xs text-gray-500 text-center mt-4">
          🔒 Your prescription is stored securely. Only you, our admin, and vendors can access it.
        </p>
      </div>
    </div>
  );
}
