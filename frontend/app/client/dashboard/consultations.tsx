'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
}

interface Msg {
  id: string;
  consultation_id: string;
  sender_type: 'client' | 'artist';
  body: string;
  created_at: string;
  read_at: string | null;
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:   { bg: 'rgba(234,179,8,0.12)',   color: '#CA8A04', label: 'Awaiting response' },
    responded: { bg: 'rgba(201,168,76,0.12)',  color: 'var(--gold)', label: 'Responded' },
    approved:  { bg: 'rgba(34,197,94,0.12)',   color: '#16A34A', label: 'Approved — chat open' },
    declined:  { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626', label: 'Declined' },
  };
  const s = map[status] || { bg: 'rgba(155,155,155,0.12)', color: 'var(--text-mid)', label: status };
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', background: s.bg, color: s.color, ...mono, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export default function ConsultationsTab() {
  const { accessToken } = useClientAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Chat state
  const [openChatId, setOpenChatId] = useState<string | null>(null);
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
      setError(err instanceof Error ? err.message : 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  }, [accessToken, API]);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  const fetchMsgs = useCallback(async (consultationId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API}/api/client/consultation-messages/${consultationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setMsgs(data.messages || []);
    } catch { /* non-fatal */ }
  }, [accessToken, API]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!openChatId) return;
    setMsgsLoading(true);
    fetchMsgs(openChatId).finally(() => setMsgsLoading(false));
    pollRef.current = setInterval(() => fetchMsgs(openChatId), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [openChatId, fetchMsgs]);

  useEffect(() => {
    const el = msgAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if (!draft.trim() || !openChatId || sending) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch(`${API}/api/client/consultation-messages/${openChatId}`, {
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

  if (loading) {
    return <p style={{ ...mono, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)', padding: '2rem 0' }}>Loading...</p>;
  }

  return (
    <div>
      {/* Request new consultation */}
      {!submitSuccess ? (
        <div className="card-premium" style={{ marginBottom: '2rem' }}>
          <div className="card-premium-inner">
            <h3 style={{ ...serif, fontStyle: 'italic', fontWeight: 300, fontSize: '1.25rem', color: 'var(--cream)', marginBottom: '1.25rem' }}>
              Request a consultation
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.75)', display: 'block', marginBottom: '0.5rem' }}>
                  Tell Robyn about your tattoo ideas
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe the design, style, size, and placement you have in mind…"
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.9375rem', lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: '"DM Sans", sans-serif' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <button type="submit" disabled={submitting || !newMessage.trim()} className="btn-primary" style={{ alignSelf: 'flex-start', opacity: (submitting || !newMessage.trim()) ? 0.5 : 1 }}>
                {submitting ? 'Sending…' : 'Send consultation request'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ padding: '1.25rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.625rem', marginBottom: '2rem' }}>
          <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'rgba(34,197,94,0.9)' }}>
            Request sent! Robyn will get back to you soon.
          </p>
        </div>
      )}

      {error && <p style={{ fontSize: '0.875rem', color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

      {/* Consultation list */}
      {consultations.length === 0 ? (
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-low)', padding: '2rem 0' }}>
          No consultations yet — send your first request above.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {consultations.map((c) => (
            <div key={c.consultation_id} style={{ background: 'var(--surface)', border: `1px solid ${openChatId === c.consultation_id ? 'rgba(201,168,76,0.35)' : 'var(--border)'}`, borderRadius: '0.75rem', overflow: 'hidden' }}>
              {/* Consultation header */}
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <p style={{ margin: 0, ...serif, fontStyle: 'italic', fontWeight: 300, fontSize: '1.0625rem', color: 'var(--cream)' }}>
                    {c.artist_name || 'Robyn'}
                  </p>
                  <StatusBadge status={c.status} />
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

                {c.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => setOpenChatId(openChatId === c.consultation_id ? null : c.consultation_id)}
                    className="btn-secondary"
                    style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                  >
                    {openChatId === c.consultation_id ? 'Close chat' : 'Open chat →'}
                  </button>
                )}
              </div>

              {/* Inline chat panel */}
              {openChatId === c.consultation_id && (
                <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '22rem' }}>
                  {/* Messages area */}
                  <div ref={msgAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {msgsLoading && msgs.length === 0 ? (
                      <p style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)', textAlign: 'center', paddingTop: '3rem' }}>Loading…</p>
                    ) : msgs.length === 0 ? (
                      <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
                        <p style={{ ...serif, fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-mid)', marginBottom: '0.375rem' }}>Start the conversation</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>Your consultation has been approved — say hello!</p>
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

                  {/* Input */}
                  <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                    {sendError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#f87171' }}>{sendError}</p>}
                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Write a message… (Enter to send)"
                        rows={2}
                        style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'none', outline: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'border-color 0.2s ease' }}
                        onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
