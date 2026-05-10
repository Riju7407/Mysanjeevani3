'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddBankDetailsDoctorPage() {
  const router = useRouter();
  const [doctorId, setDoctorId] = useState<string>('');
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    preferredWithdrawalMethod: 'bank_transfer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setDoctorId(user.doctorId || user.id);
    }
  }, []);

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
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Bank details saved successfully!');
        router.push('/doctor/wallet');
      } else {
        setError(data.error || 'Failed to save bank details');
      }
    } catch (err) {
      setError('An error occurred while saving bank details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/doctor/wallet" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
            ← Back to Wallet
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Add Bank Details</h1>
          <p className="text-gray-600">Add your bank account for withdrawals</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 uppercase"
                required
              />
              <p className="text-gray-500 text-sm mt-1">Format: First 4 characters (bank name), 0, Last 6 characters (branch code)</p>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">UPI ID (Optional)</label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="e.g., yourusername@paytm"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Preferred Withdrawal Method</label>
              <select
                name="preferredWithdrawalMethod"
                value={formData.preferredWithdrawalMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="neft">NEFT</option>
                <option value="rtgs">RTGS</option>
                <option value="imps">IMPS</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Please ensure all details are correct as they will be used for payment transfers. Your bank details will be verified before processing withdrawals.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Saving...' : 'Save Bank Details'}
              </button>
              <Link
                href="/doctor/wallet"
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
