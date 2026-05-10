'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

type TabName = 'returns' | 'tickets' | 'chat';

function getUserFromStorage() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export default function ProfileSupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabName) || 'returns';

  const [tab, setTab] = useState<TabName>(initialTab);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  const [returnForm, setReturnForm] = useState({
    orderId: '',
    productName: '',
    reason: '',
    preferredResolution: 'support-review',
  });

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    message: '',
  });

  const [chatMessage, setChatMessage] = useState('');

  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const userId = String(storedUser?.id || storedUser?._id || '').trim();
    if (!userId) {
      router.push('/login');
      return;
    }

    setUser(storedUser);

    Promise.all([
      fetch(`/api/user/support/returns?userId=${encodeURIComponent(userId)}`).then((response) => response.json()),
      fetch(`/api/user/support/tickets?userId=${encodeURIComponent(userId)}`).then((response) => response.json()),
      fetch(`/api/user/support/chat?userId=${encodeURIComponent(userId)}`).then((response) => response.json()),
    ])
      .then(([returnsData, ticketsData, chatData]) => {
        setReturnsList(returnsData.requests || []);
        setTickets(ticketsData.tickets || []);
        setMessages(chatData.messages || []);
      })
      .catch(() => {
        setStatusType('error');
        setStatus('Could not load support history right now.');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const userId = useMemo(() => String(user?.id || user?._id || '').trim(), [user]);

  const submitReturnRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    setStatus('');

    try {
      const response = await fetch('/api/user/support/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName: user.fullName || user.name || '',
          userEmail: user.email || '',
          ...returnForm,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit return request');
      }

      setReturnsList((prev) => [data.request, ...prev]);
      setStatusType('success');
      setStatus('Return request submitted successfully.');
      setReturnForm({ orderId: '', productName: '', reason: '', preferredResolution: 'support-review' });
    } catch (error: any) {
      setStatusType('error');
      setStatus(error.message || 'Failed to submit return request');
    } finally {
      setBusy(false);
    }
  };

  const submitTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    setStatus('');

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-name': user.fullName || user.name || '',
          'x-user-email': user.email || '',
          'x-user-role': user.role || 'user',
        },
        body: JSON.stringify(ticketForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to raise ticket');
      }

      setTickets((prev) => [data.inquiry, ...prev]);
      setStatusType('success');
      setStatus('Ticket raised successfully.');
      setTicketForm({ subject: '', category: 'general', message: '' });
    } catch (error: any) {
      setStatusType('error');
      setStatus(error.message || 'Failed to raise ticket');
    } finally {
      setBusy(false);
    }
  };

  const sendChatMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !chatMessage.trim()) return;
    setBusy(true);
    setStatus('');

    try {
      const response = await fetch('/api/user/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName: user.fullName || user.name || '',
          message: chatMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages((prev) => [...prev, ...(data.messages || [])]);
      setChatMessage('');
    } catch (error: any) {
      setStatusType('error');
      setStatus(error.message || 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading support center...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const tabButtonClass = (name: TabName) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition ${
      tab === name ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <Link href="/profile" className="text-emerald-600 hover:text-emerald-700 font-medium">
              ← Back to Profile
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 mt-2">Support Center</h1>
            <p className="text-slate-600 mt-1">Returns, ticket raising, and chat support in one place.</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div>{user?.fullName}</div>
            <div>{user?.email}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button type="button" onClick={() => setTab('returns')} className={tabButtonClass('returns')}>
            Returns
          </button>
          <button type="button" onClick={() => setTab('tickets')} className={tabButtonClass('tickets')}>
            Tickets
          </button>
          <button type="button" onClick={() => setTab('chat')} className={tabButtonClass('chat')}>
            Chat
          </button>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              statusType === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {status}
          </div>
        )}

        {tab === 'returns' && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={submitReturnRequest} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Raise a Return Request</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Order ID</label>
                <input
                  value={returnForm.orderId}
                  onChange={(e) => setReturnForm((prev) => ({ ...prev, orderId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your order ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Product Name</label>
                <input
                  value={returnForm.productName}
                  onChange={(e) => setReturnForm((prev) => ({ ...prev, productName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Product you want to return"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Reason</label>
                <textarea
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm((prev) => ({ ...prev, reason: e.target.value }))}
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Tell us why you need a return"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Preferred Resolution</label>
                <select
                  value={returnForm.preferredResolution}
                  onChange={(e) => setReturnForm((prev) => ({ ...prev, preferredResolution: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="support-review">Support Review</option>
                  <option value="replacement">Replacement</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </form>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Recent Requests</h2>
              <div className="space-y-3 max-h-120 overflow-auto pr-1">
                {returnsList.length === 0 ? (
                  <p className="text-slate-500 text-sm">No return requests yet.</p>
                ) : (
                  returnsList.map((item) => (
                    <div key={item._id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 capitalize">
                          {item.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">Order: {item.orderId}</div>
                      <div className="text-sm text-slate-600 mt-1">Resolution: {item.preferredResolution}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'tickets' && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={submitTicket} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Raise a Ticket</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Category</label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="general">General</option>
                  <option value="order">Order</option>
                  <option value="account">Account</option>
                  <option value="payment">Payment</option>
                  <option value="doctor">Doctor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Subject</label>
                <input
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Short subject"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Message</label>
                <textarea
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm((prev) => ({ ...prev, message: e.target.value }))}
                  rows={6}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe your issue"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Ticket History</h2>
              <div className="space-y-3 max-h-120 overflow-auto pr-1">
                {tickets.length === 0 ? (
                  <p className="text-slate-500 text-sm">No tickets raised yet.</p>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket._id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="font-semibold text-slate-900">{ticket.subject}</div>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 capitalize">
                          {ticket.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 capitalize">Category: {ticket.category}</div>
                      <div className="text-sm text-slate-600 mt-1">{ticket.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'chat' && (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Live Support Chat</h2>
              <p className="text-slate-600 text-sm">
                Send a message and the support team will reply here. This page keeps the conversation on your profile.
              </p>
              <form onSubmit={sendChatMessage} className="space-y-3">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Type your message"
                  required
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 text-white">
              <h2 className="text-2xl font-bold mb-4">Conversation</h2>
              <div className="space-y-3 max-h-120 overflow-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-slate-300 text-sm">No messages yet.</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        message.sender === 'user'
                          ? 'ml-auto bg-emerald-600 text-white'
                          : 'mr-auto bg-slate-800 text-slate-100'
                      }`}
                    >
                      {message.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}