'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BankDetails {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  preferredWithdrawalMethod: string;
  isVerified: boolean;
}

export default function EditBankDetailsVendorPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string>('');
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    preferredWithdrawalMethod: 'bank_transfer',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setVendorId(user.vendorId || user.id);
    }
  }, []);

  useEffect(() => {
    if (!vendorId) return;
    fetchBankDetails();
  }, [vendorId]);

  const fetchBankDetails = async () => {
    try {
      const res = await fetch(`/api/bank-details?vendorId=${vendorId}`);
      const data = await res.json();
      if (data.bankDetails) {
        setBankDetails(data.bankDetails);
        setFormData({
          accountHolderName: data.bankDetails.accountHolderName,
          bankName: data.bankDetails.bankName,
          accountNumber: data.bankDetails.accountNumber,
          ifscCode: data.bankDetails.ifscCode,
          upiId: data.bankDetails.upiId,
          preferredWithdrawalMethod: data.bankDetails.preferredWithdrawalMethod,
        });
      }
    } catch (err) {
      setError('Failed to load bank details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.accountHolderName.trim()) {
      setError('Account holder name is required');
      return false;
    }
    if (!formData.bankName.trim()) {
      setError('Bank name is required');
      return false;
    }
    if (!formData.accountNumber.trim()) {
      setError('Account number is required');
      return false;
    }
    if (!formData.ifscCode.trim()) {
      setError('IFSC code is required');
      return false;
    }
    if (formData.ifscCode.length !== 11) {
      setError('IFSC code should be 11 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !bankDetails) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/bank-details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankDetailsId: bankDetails.id,
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Bank details updated successfully!');
        router.push('/vendor/wallet');
      } else {
        setError(data.error || 'Failed to update bank details');
      }
    } catch (err) {
      setError('An error occurred while updating bank details');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  if (!bankDetails) {
    return (
        <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/vendor/wallet" className="text-green-600 hover:text-green-800 mb-4 inline-block">
            ← Back to Wallet
          </Link>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No bank details found</p>
            <Link href="/vendor/wallet/add-bank-details" className="text-green-600 hover:text-green-800 font-semibold">
              Add Bank Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/vendor/wallet" className="text-green-600 hover:text-green-800 mb-4 inline-block">
            ← Back to Wallet
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Bank Details</h1>
          <p className="text-gray-600">Update your bank account information</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {bankDetails.isVerified && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              ✓ Your bank details are verified
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Account Holder Name *</label>
              <input
                type="text"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                placeholder="Enter account holder name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Bank Name *</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g., State Bank of India"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Account Number *</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="Enter account number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">IFSC Code * (11 characters)</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                placeholder="e.g., SBIN0001234"
                maxLength={11}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">UPI ID (Optional)</label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="e.g., yourusername@paytm"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Preferred Withdrawal Method</label>
              <select
                name="preferredWithdrawalMethod"
                value={formData.preferredWithdrawalMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="neft">NEFT</option>
                <option value="rtgs">RTGS</option>
                <option value="imps">IMPS</option>
              </select>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <p className="text-green-800 text-sm">
                <strong>Note:</strong> Any changes to your bank details will require re-verification before processing withdrawals.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {saving ? 'Saving...' : 'Update Bank Details'}
              </button>
              <Link
                href="/vendor/wallet"
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
