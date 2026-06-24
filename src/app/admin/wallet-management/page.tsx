'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  withdrawalMethod: string;
  userType: string;
  userName: string;
  userEmail: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    upiId: string;
  };
  requestedAt: string;
  approvedAt: string;
  completedAt: string;
  failureReason: string;
}

export default function AdminWalletManagementPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

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
  }, [router]);

  useEffect(() => {
    fetchWithdrawals();
  }, [filter, page]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const userRole = localStorage.getItem('userRole');
      const res = await fetch(`/api/admin/wallet-management/withdrawals?status=${filter}&page=${page}&limit=20`, {
        headers: {
          'x-user-role': userRole || 'admin',
        },
      });

      const data = await res.json();
      if (data.requests) {
        setWithdrawals(data.requests);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      alert('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (withdrawalId: string, action: 'approve' | 'reject' | 'mark-completed') => {
    const userRole = localStorage.getItem('userRole');
    setProcessingAction(withdrawalId);

    try {
      const res = await fetch('/api/admin/wallet-management/withdrawals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole || 'admin',
        },
        body: JSON.stringify({
          withdrawalRequestId: withdrawalId,
          action,
          adminNotes: actionNotes,
          transactionReference: action === 'mark-completed' ? transactionRef : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Withdrawal ${action} successfully!`);
        setSelectedWithdrawal(null);
        setActionNotes('');
        setTransactionRef('');
        fetchWithdrawals();
      } else {
        alert(data.error || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Failed to process withdrawal');
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Wallet Management</h1>
          <p className="text-gray-600">Manage withdrawal requests and payments</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            {['pending', 'approved', 'processing', 'completed', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm md:text-base ${
                  filter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/wallet-management/commission"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">Commission Settings</h3>
            <p className="text-gray-600">Manage platform commissions</p>
          </Link>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Pending Withdrawals</h3>
            <p className="text-3xl font-bold text-yellow-600">{withdrawals.filter(w => w.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Total Requests</h3>
            <p className="text-3xl font-bold text-indigo-600">{total}</p>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading withdrawal requests...</p>
            </div>
          ) : withdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">User</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Method</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Bank Account</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Requested</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-800">{withdrawal.userName}</p>
                          <p className="text-gray-500 text-xs">{withdrawal.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          withdrawal.userType === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {withdrawal.userType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">₹{withdrawal.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">{withdrawal.withdrawalMethod}</td>
                      <td className="px-4 py-3 text-xs">
                        <p>{withdrawal.bankAccount.bankName}</p>
                        <p className="text-gray-500">****{withdrawal.bankAccount.accountNumber.slice(-4)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(withdrawal.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-600">
              No {filter} withdrawal requests found
            </div>
          )}
        </div>

        {/* Selected Withdrawal Modal */}
        {selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Withdrawal Request Details
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-600 text-sm mb-1">User</p>
                  <p className="font-semibold">{selectedWithdrawal.userName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-600 text-sm mb-1">Amount</p>
                  <p className="font-semibold text-lg text-indigo-600">₹{selectedWithdrawal.amount.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-600 text-sm mb-1">Bank Account</p>
                  <p className="font-semibold">{selectedWithdrawal.bankAccount.bankName}</p>
                  <p className="text-sm text-gray-600">****{selectedWithdrawal.bankAccount.accountNumber.slice(-4)}</p>
                </div>
              </div>

              {selectedWithdrawal.status === 'pending' && (
                <>
                  <textarea
                    placeholder="Admin notes"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-indigo-500"
                    rows={3}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(selectedWithdrawal.id, 'approve')}
                      disabled={processingAction !== null}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(selectedWithdrawal.id, 'reject')}
                      disabled={processingAction !== null}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWithdrawal(null);
                        setActionNotes('');
                        setTransactionRef('');
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

              {selectedWithdrawal.status === 'approved' && (
                <>
                  <input
                    type="text"
                    placeholder="Transaction Reference"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-indigo-500"
                  />
                  <textarea
                    placeholder="Admin notes"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-indigo-500"
                    rows={2}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(selectedWithdrawal.id, 'mark-completed')}
                      disabled={processingAction !== null || !transactionRef}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWithdrawal(null);
                        setActionNotes('');
                        setTransactionRef('');
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

              {['completed', 'failed', 'rejected'].includes(selectedWithdrawal.status) && (
                <button
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setActionNotes('');
                    setTransactionRef('');
                  }}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg transition"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
