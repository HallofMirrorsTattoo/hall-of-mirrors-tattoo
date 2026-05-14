'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useClientAuth } from '@/lib/clientAuthContext';

interface Thread {
  id: string;
  booking_reference: string;
  appointment_date_time: string;
  appointment_status: string;
  artist_name: string | null;
  total_messages: number;
  unread_count: number;
  last_message_body: string | null;
  last_message_sender: string | null;
  last_message_at: string | null;
}

interface Message {
  id: string;
  booking_id: string;
  sender_type: 'client' | 'artist';
  body: string;
  created_at: string;
  read_at: string | null;
}

interface MessagesTabProps {
  onUnreadCountChange?: (count: number) => void;
}

const mono: React.CSSProperties = { fontFamily: '"DM Mono", monospace' };
const serif: React.CSSProperties = { fontFamily: '"Cormorant Garamond", serif' };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return `Today, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return `Yesterday, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + `, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

function fmtAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MessagesTab({ onUnreadCountChange }: MessagesTabProps) {
  const { accessToken } = useClientAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState('');

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const msgAreaRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/api/client/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setThreads(data.threads);
      const total = (data.threads as Thread[]).reduce((sum: number, t: Thread) => sum + (t.unread_count || 0), 0);
      onUnreadCountChange?.(total);
    } catch (e) {
      setThreadsError(e instanceof Error ? e.message : 'Failed to load conversations');
    } finally {
      setThreadsLoading(false);
    }
  }, [accessToken, API, onUnreadCountChange]);

  const fetchMessages = useCallback(async (bookingId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/api/client/messages/${bookingId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessages(data.messages);
      // refresh thread list to update unread counts
      fetchThreads();
    } catch {
      // non-fatal — keep showing old messages
    }
  }, [accessToken, API, fetchThreads]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // When selected booking changes: fetch messages + start polling
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedBookingId) return;

    setMessagesLoading(true);
    fetchMessages(selectedBookingId).finally(() => setMessagesLoading(false));

    pollRef.current = setInterval(() => fetchMessages(selectedBookingId), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedBookingId, fetchMessages]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    const el = msgAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim() || !selectedBookingId || sending) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch(`${API}/api/client/messages/${selectedBookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
      fetchThreads();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectedThread = threads.find((t) => t.id === selectedBookingId) ?? null;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (threadsLoading) {
    return (
      <p style={{ ...mono, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)', padding: '2rem 0' }}>
        Loading conversations...
      </p>
    );
  }

  if (threadsError) {
    return (
      <p style={{ fontSize: '0.875rem', color: 'var(--error-text)', padding: '2rem 0' }}>{threadsError}</p>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedBookingId ? '280px 1fr' : '1fr', gap: '1.5rem', alignItems: 'start', minHeight: '28rem' }}>
      {/* Thread list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {threads.length === 0 && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-low)', padding: '1rem 0' }}>
            No active bookings to message about yet.
          </p>
        )}
        {threads.map((t) => {
          const isSelected = selectedBookingId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedBookingId(isSelected ? null : t.id)}
              style={{
                padding: '1rem 1.125rem',
                background: isSelected ? 'rgba(201,168,76,0.08)' : 'var(--surface)',
                border: `1px solid ${isSelected ? 'rgba(201,168,76,0.35)' : 'var(--border)'}`,
                borderRadius: '0.625rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                <p style={{ margin: 0, ...serif, fontStyle: 'italic', fontWeight: 300, fontSize: '1rem', color: isSelected ? 'var(--gold)' : 'var(--cream)' }}>
                  {t.artist_name ?? 'Hall of Mirrors'}
                </p>
                {t.unread_count > 0 && (
                  <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.45rem', background: 'var(--gold)', color: 'var(--bg)', borderRadius: '2rem', ...mono, fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>
                    {t.unread_count}
                  </span>
                )}
              </div>
              <p style={{ margin: '0 0 0.375rem', ...mono, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                {t.booking_reference}
              </p>
              {t.last_message_body ? (
                <p style={{ margin: 0, fontSize: '0.75rem', color: t.unread_count > 0 ? 'var(--text)' : 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: t.unread_count > 0 ? 500 : 400 }}>
                  {t.last_message_sender === 'client' ? 'You: ' : `${t.artist_name ?? 'Studio'}: `}
                  {t.last_message_body}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-low)', fontStyle: 'italic' }}>
                  No messages yet — start the conversation
                </p>
              )}
              {t.last_message_at && (
                <p style={{ margin: '0.25rem 0 0', ...mono, fontSize: '0.65rem', letterSpacing: '0.06em', color: 'var(--text-low)' }}>
                  {fmtAgo(t.last_message_at)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Message thread */}
      {selectedBookingId && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', height: '24rem' }}>
          {/* Thread header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <p style={{ margin: 0, ...serif, fontStyle: 'italic', fontWeight: 300, fontSize: '1.125rem', color: 'var(--cream)' }}>
                {selectedThread?.artist_name ?? 'Hall of Mirrors'}
              </p>
              <p style={{ margin: '0.1rem 0 0', ...mono, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                {selectedThread?.booking_reference} · {selectedThread?.appointment_date_time
                  ? new Date(selectedThread.appointment_date_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : ''}
              </p>
            </div>
            <button
              onClick={() => setSelectedBookingId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}
            >×</button>
          </div>

          {/* Messages area */}
          <div ref={msgAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {messagesLoading && messages.length === 0 ? (
              <p style={{ ...mono, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)', textAlign: 'center', paddingTop: '4rem' }}>
                Loading...
              </p>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <p style={{ ...serif, fontStyle: 'italic', fontSize: '1.125rem', color: 'var(--text-mid)', marginBottom: '0.5rem' }}>
                  Start the conversation
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>
                  Send a message to {selectedThread?.artist_name ?? 'your artist'} about this booking.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => {
                  const isClient = msg.sender_type === 'client';
                  const prevMsg = messages[i - 1];
                  const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <p style={{ textAlign: 'center', ...mono, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.75rem 0 0.5rem' }}>
                          {new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: isClient ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '72%',
                          padding: '0.625rem 0.875rem',
                          borderRadius: isClient ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                          background: isClient ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isClient ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                        }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: isClient ? 'var(--cream)' : 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>
                            {msg.body}
                          </p>
                          <p style={{ margin: '0.25rem 0 0', ...mono, fontSize: '0.65rem', letterSpacing: '0.06em', color: isClient ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', textAlign: isClient ? 'right' : 'left' }}>
                            {fmtDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            {sendError && (
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--error-text)' }}>{sendError}</p>
            )}
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Write a message… (Enter to send)"
                rows={2}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  background: 'rgba(14,12,9,0.5)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--cream)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: '"DM Sans", sans-serif',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                className="btn-primary"
                style={{ padding: '0.625rem 1.125rem', flexShrink: 0, opacity: (!draft.trim() || sending) ? 0.5 : 1, cursor: (!draft.trim() || sending) ? 'default' : 'pointer' }}
              >
                {sending ? '…' : '→'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
