'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CommissionSettings {
  id: string;
  platformDefaultCommission: number;
  doctorCommissions: any[];
  vendorCommissions: any[];
  categoryCommissions: any[];
}

export default function CommissionSettingsPage() {
  const router = useRouter();
  const [commission, setCommission] = useState<CommissionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformCommission, setPlatformCommission] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'platform' | 'doctor' | 'vendor' | 'category'>('platform');

  useEffect(() => {
    // Check if user is admin by multiple possible stored keys
    const adminToken = localStorage.getItem('adminToken');
    const userRoleKey = localStorage.getItem('userRole') || localStorage.getItem('user_role');
    const userStr = localStorage.getItem('user');
    let isAdmin = false;

    if (adminToken) isAdmin = true;
    if (!isAdmin && userRoleKey === 'admin') isAdmin = true;
    if (!isAdmin && userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed?.role === 'admin') isAdmin = true;
      } catch (e) {
        /* ignore parse errors */
      }
    }

    if (!isAdmin) {
      router.push('/login');
      return;
    }

    fetchCommission();
  }, [router]);

  const fetchCommission = async () => {
    try {
      const userRole = localStorage.getItem('userRole');
      const res = await fetch('/api/admin/wallet-management/commission', {
        headers: {
          'x-user-role': userRole || 'admin',
        },
      });

      const data = await res.json();
      if (data.commission) {
        setCommission(data.commission);
        setPlatformCommission(data.commission.platformDefaultCommission.toString());
      }
    } catch (error) {
      console.error('Error fetching commission:', error);
      alert('Failed to fetch commission settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlatformCommission = async () => {
    const value = parseFloat(platformCommission);

    if (isNaN(value) || value < 0 || value > 100) {
      alert('Commission must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const userRole = localStorage.getItem('userRole');
      const res = await fetch('/api/admin/wallet-management/commission', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole || 'admin',
        },
        body: JSON.stringify({
          platformDefaultCommission: value,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCommission(data.commission);
        alert('Platform commission updated successfully!');
      } else {
        alert(data.error || 'Failed to update commission');
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Failed to update commission');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading commission settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/wallet-management" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
            ← Back to Wallet Management
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Commission Settings</h1>
          <p className="text-gray-600">Configure platform and user-specific commissions</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-blue-800">
            <strong>How it works:</strong> The platform commission is deducted from doctor and vendor earnings. You can set a default commission for all users or specific overrides for individual users.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 flex-wrap">
            <button
              onClick={() => setActiveTab('platform')}
              className={`flex-1 min-w-30 py-4 px-6 font-semibold text-center transition ${
                activeTab === 'platform'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Platform Default
            </button>
            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex-1 min-w-30 py-4 px-6 font-semibold text-center transition ${
                activeTab === 'doctor'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Doctor Overrides
            </button>
            <button
              onClick={() => setActiveTab('vendor')}
              className={`flex-1 min-w-30 py-4 px-6 font-semibold text-center transition ${
                activeTab === 'vendor'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Vendor Overrides
            </button>
            <button
              onClick={() => setActiveTab('category')}
              className={`flex-1 min-w-30 py-4 px-6 font-semibold text-center transition ${
                activeTab === 'category'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Category-Wise
            </button>
          </div>

          <div className="p-6">
            {/* Platform Default Tab */}
            {activeTab === 'platform' && commission && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Platform Default Commission</h3>

                <div className="bg-gray-50 rounded-lg p-6 max-w-md">
                  <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2">Default Commission Percentage</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={platformCommission}
                        onChange={(e) => setPlatformCommission(e.target.value)}
                        min="0"
                        max="100"
                        placeholder="Enter commission percentage"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                      />
                      <span className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold">%</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">This applies to all doctors and vendors unless they have a specific override.</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      <strong>Current:</strong> {commission.platformDefaultCommission}% commission on all transactions
                    </p>
                  </div>

                  <button
                    onClick={handleUpdatePlatformCommission}
                    disabled={saving}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {saving ? 'Saving...' : 'Save Commission'}
                  </button>
                </div>
              </div>
            )}

            {/* Doctor Overrides Tab */}
            {activeTab === 'doctor' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Doctor-Specific Commission Overrides</h3>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600 mb-4">Doctor-specific commission overrides will be displayed and manageable here.</p>
                  <p className="text-gray-500 text-sm">This feature is coming soon. You can currently manage commissions through the doctor profile administration.</p>
                </div>
              </div>
            )}

            {/* Vendor Overrides Tab */}
            {activeTab === 'vendor' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Vendor-Specific Commission Overrides</h3>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600 mb-4">Vendor-specific commission overrides will be displayed and manageable here.</p>
                  <p className="text-gray-500 text-sm">This feature is coming soon. You can currently manage commissions through the vendor profile administration.</p>
                </div>
              </div>
            )}

            {/* Category-Wise Tab */}
            {activeTab === 'category' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Category-Wise Commission</h3>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600 mb-4">Category-wise commissions will be displayed and manageable here.</p>
                  <p className="text-gray-500 text-sm">This feature is coming soon. Currently, a single platform-wide commission is applied to all transactions.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How Commission Works</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold text-lg">1.</span>
              <span>When a doctor completes a consultation or a vendor makes a sale, earnings are added to their wallet.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold text-lg">2.</span>
              <span>The platform commission is automatically deducted from the earnings.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold text-lg">3.</span>
              <span>The remaining balance is available for withdrawal.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 font-bold text-lg">4.</span>
              <span>Doctors and vendors can track their commissions in their transaction history.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
