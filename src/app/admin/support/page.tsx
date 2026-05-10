'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type ReturnStatus = 'new' | 'under-review' | 'approved' | 'rejected' | 'completed';

interface ReturnRequest {
  _id: string;
  userName: string;
  userEmail: string;
  orderId: string;
  productName: string;
  reason: string;
  preferredResolution: string;
  status: ReturnStatus;
  supportNote?: string;
  createdAt: string;
}

interface ChatConversation {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastSender: 'user' | 'support';
  updatedAt: string;
}

interface ChatMessage {
  _id: string;
  userId: string;
  sender: 'user' | 'support';
  message: string;
  createdAt: string;
}

const RETURN_STATUS_STYLES: Record<ReturnStatus, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  'under-review': 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-slate-200 text-slate-700 border-slate-300',
};

function getAdminRoleHeader() {
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  return {
    'x-user-role': user?.role || '',
  };
}

export default function AdminSupportPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'returns' | 'chat'>('returns');
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState('');

  const filteredReturns = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return returns.filter((item) => {
      const statusOk = statusFilter === 'all' || item.status === statusFilter;
      if (!statusOk) return false;
      if (!searchLower) return true;
      const haystack = [
        item.userName,
        item.userEmail,
        item.orderId,
        item.productName,
        item.reason,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchLower);
    });
  }, [returns, search, statusFilter]);

  const fetchReturns = async () => {
    const response = await fetch('/api/admin/support/returns', {
      headers: getAdminRoleHeader(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch returns');
    setReturns(data.requests || []);
  };

  const fetchConversations = async () => {
    const response = await fetch('/api/admin/support/chat', {
      headers: getAdminRoleHeader(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch conversations');
    setConversations(data.conversations || []);
  };

  const fetchMessagesForUser = async (userId: string) => {
    const response = await fetch(`/api/admin/support/chat?userId=${encodeURIComponent(userId)}`, {
      headers: getAdminRoleHeader(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch messages');
    setMessages(data.messages || []);
  };

  useEffect(() => {
    Promise.all([fetchReturns(), fetchConversations()])
      .catch((err: any) => setError(err.message || 'Failed to load support data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedConversation?.userId) return;
    fetchMessagesForUser(selectedConversation.userId).catch((err: any) =>
      setError(err.message || 'Failed to fetch conversation')
    );
  }, [selectedConversation?.userId]);

  const updateReturn = async (id: string, updates: Partial<ReturnRequest>) => {
    try {
      const response = await fetch(`/api/admin/support/returns/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminRoleHeader(),
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update return request');

      setReturns((prev) => prev.map((item) => (item._id === id ? data.request : item)));
    } catch (err: any) {
      setError(err.message || 'Failed to update return request');
    }
  };

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    const userId = selectedConversation?.userId;
    if (!userId || !reply.trim()) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/admin/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminRoleHeader(),
        },
        body: JSON.stringify({
          userId,
          message: reply.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send reply');

      const message: ChatMessage = data.supportMessage;
      setMessages((prev) => [...prev, message]);
      setReply('');
      fetchConversations().catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading support requests...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">Support Review</h1>
        <p className="text-slate-600 mt-1">Resolve return requests and reply to user support chat.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'returns' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'
          }`}
        >
          Returns
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'
          }`}
        >
          Chat
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {activeTab === 'returns' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, order, product, reason"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="under-review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {filteredReturns.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              No return requests found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReturns.map((item) => (
                <article key={item._id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-lg font-bold text-slate-900">{item.productName}</h2>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${RETURN_STATUS_STYLES[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {item.userName} • {item.userEmail}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Order: {item.orderId} • {new Date(item.createdAt).toLocaleString('en-IN')}
                      </p>
                      <p className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">{item.reason}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Preferred resolution: <span className="font-semibold">{item.preferredResolution}</span>
                      </p>

                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Support Note</label>
                        <textarea
                          defaultValue={item.supportNote || ''}
                          rows={3}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onBlur={(e) => {
                            if ((item.supportNote || '') !== e.target.value) {
                              updateReturn(item._id, { supportNote: e.target.value });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="lg:w-48">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Update Status</label>
                      <select
                        value={item.status}
                        onChange={(e) => updateReturn(item._id, { status: e.target.value as ReturnStatus })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="new">New</option>
                        <option value="under-review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Conversations</h2>
            </div>
            <div className="max-h-120 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No conversations yet.</p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.userId}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 ${
                      selectedConversation?.userId === conversation.userId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{conversation.userName}</p>
                    <p className="text-xs text-slate-500">{conversation.userEmail}</p>
                    <p className="mt-2 text-xs text-slate-700 line-clamp-2">{conversation.lastMessage}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 flex flex-col min-h-135">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedConversation ? `Chat with ${selectedConversation.userName}` : 'Select a conversation'}
              </h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3">
              {!selectedConversation ? (
                <p className="text-sm text-slate-500">Choose a conversation from the left panel.</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages in this thread.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      message.sender === 'support'
                        ? 'ml-auto bg-blue-600 text-white'
                        : 'mr-auto bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <p>{message.message}</p>
                    <p className={`mt-1 text-[11px] ${message.sender === 'support' ? 'text-blue-100' : 'text-slate-400'}`}>
                      {new Date(message.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendReply} className="p-4 border-t border-slate-200 flex gap-3">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={selectedConversation ? 'Type a support reply' : 'Select a conversation first'}
                disabled={!selectedConversation || sending}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!selectedConversation || sending || !reply.trim()}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Reply'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}