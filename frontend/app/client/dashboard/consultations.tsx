'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { useClientAuth } from '@/lib/clientAuthContext';

interface Consultation {
  consultation_id: string;
  artist_id: string;
  artist_name: string;
  message: string;
  preferred_dates: string | null;
  status: string;
  artist_response: string | null;
  created_at: string;
  updated_at: string;
  artist_message_count: number;
}

interface ClientBooking {
  id: string;
  booking_reference: string;
  appointment_date: string;
  appointment_time?: string;
  appointment_status: string;
  artist_name?: string;
}

interface Msg {
  id: string;
  sender_type: 'client' | 'artist';
  body: string;
  created_at: string;
}

type OpenChat = { type: 'consultation'; id: string } | { type: 'booking'; id: string } | null;

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

function StatusBadge({ status, inDialogue = false }: { status: string; inDialogue?: boolean }) {
  if (status === 'pending' && inDialogue) {
    return (
      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', background: 'var(--gold-muted)', color: 'var(--gold)', ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        In dialogue
      </span>
    );
  }
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:           { bg: 'rgba(201,168,76,0.12)',  color: 'rgba(201,168,76,0.75)', label: 'Awaiting response' },
    responded:         { bg: 'rgba(201,168,76,0.12)',  color: 'var(--gold)', label: 'Responded' },
    approved:          { bg: 'rgba(34,197,94,0.12)',   color: 'rgba(34,197,94,0.85)', label: 'Chat open' },
    declined:          { bg: 'rgba(239,68,68,0.12)',   color: 'rgba(239,68,68,0.85)', label: 'Declined' },
    confirmed:         { bg: 'rgba(34,197,94,0.12)',   color: 'rgba(34,197,94,0.85)', label: 'Confirmed session' },
    completed:         { bg: 'rgba(201,168,76,0.12)',  color: 'var(--gold)', label: 'Completed' },
    pending_consent:   { bg: 'rgba(201,168,76,0.12)',  color: 'rgba(201,168,76,0.75)', label: 'Awaiting confirmation' },
    cancelled:         { bg: 'rgba(239,68,68,0.12)',   color: 'rgba(239,68,68,0.85)', label: 'Cancelled' },
  };
  const s = map[status] || { bg: 'rgba(155,155,155,0.12)', color: 'var(--text-mid)', label: status };
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', background: s.bg, color: s.color, ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

interface ChatPanelProps {
  chatKey: OpenChat;
  openChat: OpenChat;
  msgs: Msg[];
  msgsLoading: boolean;
  msgAreaRef: React.RefObject<HTMLDivElement>;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  sending: boolean;
  sendError: string;
  sendMessage: () => void;
}

function ChatPanel({ chatKey, openChat, msgs, msgsLoading, msgAreaRef, draft, setDraft, sending, sendError, sendMessage }: ChatPanelProps) {
  const isOpen = openChat && chatKey && openChat.type === chatKey.type && openChat.id === chatKey.id;
  if (!isOpen) return null;
  return (
    <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '22rem' }}>
      <div ref={msgAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {msgsLoading && msgs.length === 0 ? (
          <p style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)', textAlign: 'center', paddingTop: '3rem' }}>Loading…</p>
        ) : msgs.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
            <p style={{ ...serif, fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-mid)', marginBottom: '0.375rem' }}>Start the conversation</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>Send a message to get things started.</p>
          </div>
        ) : (
          msgs.map((msg, i) => {
            const isClient = msg.sender_type === 'client';
            const prev = msgs[i - 1];
            const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
            return (
              <div key={msg.id}>
                {showDate && (
                  <p style={{ textAlign: 'center', ...mono, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.75rem 0 0.5rem' }}>
                    {new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: isClient ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '72%', padding: '0.625rem 0.875rem', borderRadius: isClient ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', background: isClient ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isClient ? 'rgba(201,168,76,0.3)' : 'var(--border)'}` }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: isClient ? 'var(--cream)' : 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>{msg.body}</p>
                    <p style={{ margin: '0.25rem 0 0', ...mono, fontSize: '0.65rem', letterSpacing: '0.06em', color: isClient ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', textAlign: isClient ? 'right' : 'left' }}>{fmtDate(msg.created_at)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {sendError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--error-text)' }}>{sendError}</p>}
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Write a message… (Enter to send)"
            rows={2}
            style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'border-color 0.2s ease' }}
          />
          <button
            type="button"
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
  );
}

export default function ConsultationsTab() {
  const { accessToken } = useClientAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New consultation request form
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Unified chat state
  const [openChat, setOpenChat] = useState<OpenChat>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const msgAreaRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConsultations = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/api/client/consultations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setConsultations(data.consultations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, [accessToken, API]);

  const fetchBookings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/api/client/bookings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setBookings(data.bookings || []);
    } catch { /* non-critical */ }
  }, [accessToken, API]);

  useEffect(() => {
    Promise.all([fetchConsultations(), fetchBookings()]).finally(() => setLoading(false));
  }, [fetchConsultations, fetchBookings]);

  const fetchMsgs = useCallback(async (chat: OpenChat) => {
    if (!accessToken || !chat) return;
    try {
      const url = chat.type === 'consultation'
        ? `${API}/api/client/consultation-messages/${chat.id}`
        : `${API}/api/client/messages/${chat.id}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (res.ok) setMsgs(data.messages || []);
    } catch { /* non-fatal */ }
  }, [accessToken, API]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!openChat) { setMsgs([]); return; }
    setMsgsLoading(true);
    fetchMsgs(openChat).finally(() => setMsgsLoading(false));
    pollRef.current = setInterval(() => fetchMsgs(openChat), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [openChat, fetchMsgs]);

  useEffect(() => {
    const el = msgAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const handleNewConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/client/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ artist_id: 'artist-robyn-001', message: newMessage }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      await fetchConsultations();
      setNewMessage('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if (!draft.trim() || !openChat || sending) return;
    setSending(true);
    setSendError('');
    try {
      const url = openChat.type === 'consultation'
        ? `${API}/api/client/consultation-messages/${openChat.id}`
        : `${API}/api/client/messages/${openChat.id}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setMsgs((prev) => [...prev, data.message]);
      setDraft('');
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const toggleChat = (chat: OpenChat) => {
    const isSame = openChat && chat && openChat.type === chat.type && openChat.id === chat.id;
    setOpenChat(isSame ? null : chat);
    setDraft('');
    setSendError('');
  };

  const canChat = (c: Consultation) =>
    c.status === 'approved' || (c.status === 'pending' && c.artist_message_count > 0);

  // Active booking threads (confirmed / completed)
  const activeBookings = bookings.filter((b) =>
    b.appointment_status === 'confirmed' || b.appointment_status === 'completed'
  );

  if (loading) {
    return <p style={{ ...mono, fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-low)', padding: '2rem 0' }}>Loading...</p>;
  }

  return (
    <div>
      {/* Request new consultation */}
      {!submitSuccess ? (
        <div className="card-premium" style={{ marginBottom: '2rem' }}>
          <div className="card-premium-inner">
            <h3 style={{ ...serif, fontStyle: 'italic', fontWeight: 400, fontSize: '1.25rem', color: 'var(--cream)', marginBottom: '0.375rem' }}>
              Request a consultation
            </h3>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Describe your idea and Robyn will get back to you. Once she responds, you&apos;ll be able to message back and forth here.
            </p>
            <form onSubmit={handleNewConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Describe the design, style, size, and placement you have in mind…"
                rows={4}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.75rem', color: 'var(--cream)', fontSize: '0.9375rem', lineHeight: 1.6, resize: 'vertical', fontFamily: '"DM Sans", sans-serif', boxSizing: 'border-box' }}
              />
              <button type="submit" disabled={submitting || !newMessage.trim()} className="btn-primary" style={{ alignSelf: 'flex-start', opacity: (submitting || !newMessage.trim()) ? 0.5 : 1 }}>
                {submitting ? 'Sending…' : 'Send consultation request'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ padding: '1.25rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.625rem', marginBottom: '2rem' }}>
          <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'rgba(34,197,94,0.9)' }}>
            Consultation request sent — Robyn will be in touch soon.
          </p>
        </div>
      )}

      {error && <p style={{ fontSize: '0.875rem', color: 'var(--error-text)', marginBottom: '1rem' }}>{error}</p>}

      {/* ── Confirmed booking threads ── */}
      {activeBookings.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ ...mono, fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '0.875rem' }}>
            Your sessions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeBookings.map((b) => {
              const chatKey: OpenChat = { type: 'booking', id: b.id };
              const isOpen = openChat?.type === 'booking' && openChat.id === b.id;
              const dateStr = new Date(b.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
              return (
                <div key={b.id} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`, borderRadius: '0.75rem', overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
                  <div style={{ padding: '1.125rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 0.2rem', ...serif, fontStyle: 'italic', fontWeight: 400, fontSize: '1.0625rem', color: 'var(--cream)' }}>
                        {b.artist_name || 'Robyn'} · {dateStr}
                      </p>
                      <p style={{ margin: 0, ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--text-low)' }}>
                        {b.booking_reference}
                      </p>
                    </div>
                    <StatusBadge status={b.appointment_status} />
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => toggleChat(chatKey)}
                      style={{ width: '100%', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: isOpen ? 'var(--gold)' : 'var(--text-mid)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', transition: 'color 0.2s ease' }}
                    >
                      <span>{isOpen ? 'Close chat' : 'Message your artist'}</span>
                      <span style={{ ...mono, fontSize: '0.75rem', opacity: 0.7 }}>{isOpen ? '↑' : '↓'}</span>
                    </button>
                    <ChatPanel chatKey={chatKey} openChat={openChat} msgs={msgs} msgsLoading={msgsLoading} msgAreaRef={msgAreaRef} draft={draft} setDraft={setDraft} sending={sending} sendError={sendError} sendMessage={sendMessage} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Consultation threads ── */}
      {consultations.length === 0 && activeBookings.length === 0 ? (
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-low)', padding: '1rem 0' }}>
          No consultations yet — send your first request above.
        </p>
      ) : consultations.length > 0 && (
        <div>
          <p style={{ ...mono, fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '0.875rem' }}>
            Consultations
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {consultations.map((c) => {
              const chatKey: OpenChat = { type: 'consultation', id: c.consultation_id };
              const isOpen = openChat?.type === 'consultation' && openChat.id === c.consultation_id;
              const inDialogue = c.status === 'pending' && c.artist_message_count > 0;
              const chatAvailable = canChat(c);

              return (
                <div key={c.consultation_id} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`, borderRadius: '0.75rem', overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
                  <div style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <p style={{ margin: 0, ...serif, fontStyle: 'italic', fontWeight: 400, fontSize: '1.0625rem', color: 'var(--cream)' }}>
                        {c.artist_name || 'Robyn'}
                      </p>
                      <StatusBadge status={c.status} inDialogue={inDialogue} />
                    </div>

                    <p style={{ margin: '0 0 0.5rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.65 }}>
                      {c.message}
                    </p>

                    {c.artist_response && (
                      <div style={{ marginTop: '0.875rem', padding: '0.875rem 1rem', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '0.5rem' }}>
                        <p style={{ margin: '0 0 0.375rem', ...mono, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)' }}>
                          {c.artist_name || 'Robyn'}&apos;s response
                        </p>
                        <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.65 }}>
                          {c.artist_response}
                        </p>
                      </div>
                    )}

                    <p style={{ margin: '0.75rem 0 0', ...mono, fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--text-low)' }}>
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {chatAvailable && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      <button
                        type="button"
                        onClick={() => toggleChat(chatKey)}
                        style={{ width: '100%', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: isOpen ? 'var(--gold)' : 'var(--text-mid)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', transition: 'color 0.2s ease' }}
                      >
                        <span>{isOpen ? 'Close chat' : inDialogue ? 'Robyn has a question — open chat' : 'Open chat →'}</span>
                        <span style={{ ...mono, fontSize: '0.75rem', opacity: 0.7 }}>{isOpen ? '↑' : '↓'}</span>
                      </button>
                      <ChatPanel chatKey={chatKey} openChat={openChat} msgs={msgs} msgsLoading={msgsLoading} msgAreaRef={msgAreaRef} draft={draft} setDraft={setDraft} sending={sending} sendError={sendError} sendMessage={sendMessage} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
