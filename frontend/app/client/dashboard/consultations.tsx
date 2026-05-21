'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { useClientAuth } from '@/lib/clientAuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Consultation {
  consultation_id: string;
  artist_id: string;
  artist_name: string;
  booking_id: string | null;
  message: string;
  preferred_dates: string | null;
  status: string;
  artist_response: string | null;
  created_at: string;
  updated_at: string;
  artist_message_count: number;
  unread_artist_count: number;
}

interface ClientBooking {
  id: string;
  booking_reference: string;
  appointment_date: string; // returned as appointment_date_time AS appointment_date
  appointment_status: string;
  artist_name?: string;
}

interface Msg {
  id: string;
  sender_type: 'client' | 'artist';
  body: string | null;
  image_url: string | null;
  created_at: string;
}

type OpenChat = { type: 'consultation'; id: string } | { type: 'booking'; id: string } | null;

interface BookingForm {
  placement: string;
  size: string;
  preferred_date: string;
  notes: string;
}

// ── Style helpers ──────────────────────────────────────────────────────────────

const mono: React.CSSProperties = { fontFamily: '"DM Mono", monospace' };
const serif: React.CSSProperties = { fontFamily: '"Cormorant Garamond", serif' };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return `Today, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return `Yesterday, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  return (
    d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
    `, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  );
}

function StatusBadge({ status, inDialogue = false }: { status: string; inDialogue?: boolean }) {
  if (status === 'pending' && inDialogue) {
    return (
      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        In dialogue
      </span>
    );
  }
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:         { bg: 'rgba(201,168,76,0.12)', color: 'rgba(201,168,76,0.75)', label: 'Awaiting response' },
    responded:       { bg: 'rgba(201,168,76,0.12)', color: 'var(--gold)',           label: 'Responded' },
    approved:        { bg: 'rgba(34,197,94,0.12)',  color: 'rgba(34,197,94,0.85)',  label: 'Chat open' },
    declined:        { bg: 'rgba(239,68,68,0.12)',  color: 'rgba(239,68,68,0.85)', label: 'Declined' },
    confirmed:       { bg: 'rgba(34,197,94,0.12)',  color: 'rgba(34,197,94,0.85)', label: 'Confirmed' },
    completed:       { bg: 'rgba(201,168,76,0.12)', color: 'var(--gold)',           label: 'Completed' },
    pending_consent: { bg: 'rgba(201,168,76,0.12)', color: 'rgba(201,168,76,0.75)', label: 'Pending consent' },
    counter_offered: { bg: 'rgba(201,168,76,0.15)', color: 'var(--gold)',           label: 'Counter offered' },
    cancelled:       { bg: 'rgba(239,68,68,0.12)',  color: 'rgba(239,68,68,0.85)', label: 'Cancelled' },
  };
  const s = map[status] || { bg: 'rgba(155,155,155,0.12)', color: 'var(--text-mid)', label: status };
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', background: s.bg, color: s.color, ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ── Chat panel ─────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  chatKey: OpenChat;
  openChat: OpenChat;
  msgs: Msg[];
  msgsLoading: boolean;
  msgAreaRef: React.RefObject<HTMLDivElement>;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  imageFile: File | null;
  imagePreview: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  sending: boolean;
  sendError: string;
  sendMessage: () => void;
}

function ChatPanel({
  chatKey, openChat, msgs, msgsLoading, msgAreaRef,
  draft, setDraft, imageFile, imagePreview, onImageSelect, clearImage,
  sending, sendError, sendMessage,
}: ChatPanelProps) {
  // useRef must be called unconditionally — before any early return
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = openChat && chatKey &&
    openChat.type === chatKey.type && openChat.id === chatKey.id;
  if (!isOpen) return null;

  return (
    <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '22rem' }}>
      {/* Message list */}
      <div ref={msgAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {msgsLoading && msgs.length === 0 ? (
          <p style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)', textAlign: 'center', paddingTop: '3rem' }}>Loading…</p>
        ) : msgs.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
            <p style={{ ...serif, fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-mid)', marginBottom: '0.375rem' }}>Start the conversation</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>Send a message or attach a reference image.</p>
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
                  <div style={{
                    maxWidth: '72%',
                    padding: msg.image_url && !msg.body ? '0.375rem' : '0.625rem 0.875rem',
                    borderRadius: isClient ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                    background: isClient ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isClient ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                  }}>
                    {msg.body && (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: isClient ? 'var(--cream)' : 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>
                        {msg.body}
                      </p>
                    )}
                    {msg.image_url && (
                      <div style={{ marginTop: msg.body ? '0.5rem' : 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.image_url}
                          alt="Reference image"
                          style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '0.5rem', display: 'block', cursor: 'pointer' }}
                          onClick={() => window.open(msg.image_url!, '_blank')}
                        />
                      </div>
                    )}
                    <p style={{ margin: (msg.body || msg.image_url) ? '0.25rem 0 0' : 0, ...mono, fontSize: '0.65rem', letterSpacing: '0.06em', color: isClient ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', textAlign: isClient ? 'right' : 'left' }}>
                      {fmtDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {sendError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--error-text)' }}>{sendError}</p>}

        {/* Image preview strip */}
        {imagePreview && (
          <div style={{ marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" style={{ width: '3.5rem', height: '3.5rem', objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid rgba(201,168,76,0.3)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...mono, fontSize: '0.65rem', color: 'var(--text-low)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {imageFile?.name}
              </p>
            </div>
            <button
              type="button"
              onClick={clearImage}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontSize: '1rem', lineHeight: 1, padding: '0.25rem' }}
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onImageSelect}
          />
          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            style={{
              flexShrink: 0,
              padding: '0.625rem 0.75rem',
              background: imagePreview ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${imagePreview ? 'rgba(201,168,76,0.35)' : 'var(--border)'}`,
              borderRadius: '0.5rem',
              color: imagePreview ? 'var(--gold)' : 'var(--text-low)',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              transition: 'all 0.2s ease',
            }}
          >
            📎
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={imagePreview ? 'Add a caption… (optional)' : 'Write a message… (Enter to send)'}
            rows={2}
            style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'border-color 0.2s ease' }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={(!draft.trim() && !imagePreview) || sending}
            className="btn-primary"
            style={{ padding: '0.625rem 1.125rem', flexShrink: 0, opacity: ((!draft.trim() && !imagePreview) || sending) ? 0.5 : 1, cursor: ((!draft.trim() && !imagePreview) || sending) ? 'default' : 'pointer' }}
          >
            {sending ? '…' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ConsultationsTab() {
  const { accessToken } = useClientAuth();
  const API = process.env.NEXT_PUBLIC_API_URL;

  // Data
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New consultation form
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Chat state
  const [openChat, setOpenChat] = useState<OpenChat>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const msgAreaRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Booking conversion form
  const [showBookingForm, setShowBookingForm] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({ placement: '', size: '', preferred_date: '', notes: '' });
  const [convertingBooking, setConvertingBooking] = useState(false);
  const [convertError, setConvertError] = useState('');

  // ── Data fetching ─────────────────────────────────────────────────────────

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
      const url =
        chat.type === 'consultation'
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

  // Clean up object URL on unmount or change
  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const clearImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleNewConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`${API}/api/client/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ artist_id: 'artist-robyn-001', message: newMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send — please try again.');
      await fetchConsultations();
      setNewMessage('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 6000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if ((!draft.trim() && !imageFile) || !openChat || sending) return;
    setSending(true);
    setSendError('');
    try {
      const url =
        openChat.type === 'consultation'
          ? `${API}/api/client/consultation-messages/${openChat.id}`
          : `${API}/api/client/messages/${openChat.id}`;

      let response: Response;
      if (imageFile) {
        const fd = new FormData();
        if (draft.trim()) fd.append('body', draft.trim());
        fd.append('image', imageFile);
        response = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: fd,
        });
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ body: draft.trim() }),
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send');
      setMsgs((prev) => [...prev, data.message]);
      setDraft('');
      clearImage();
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
    clearImage();
  };

  const handleConvertToBooking = async (e: React.FormEvent, consultationId: string) => {
    e.preventDefault();
    if (!bookingForm.placement.trim()) return;
    setConvertingBooking(true);
    setConvertError('');
    try {
      const res = await fetch(`${API}/api/client/consultations/${consultationId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          placement: bookingForm.placement,
          estimated_size: bookingForm.size || undefined,
          preferred_date: bookingForm.preferred_date || undefined,
          notes: bookingForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await Promise.all([fetchConsultations(), fetchBookings()]);
      setShowBookingForm(null);
      setBookingForm({ placement: '', size: '', preferred_date: '', notes: '' });
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : 'Failed to create booking');
    } finally {
      setConvertingBooking(false);
    }
  };

  const canChatConsultation = (c: Consultation) =>
    c.status === 'approved' || (c.status === 'pending' && c.artist_message_count > 0);

  // ── Derived lists ─────────────────────────────────────────────────────────

  // All non-cancelled bookings for the conversations section
  const bookingConversations = bookings.filter(
    (b) => !['cancelled', 'declined', 'rejected'].includes(b.appointment_status)
  );

  // Only consultations not yet linked to a booking
  const standaloneConsultations = consultations.filter((c) => !c.booking_id);

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="skeleton" style={{ height: '1.1rem', width: '5rem' }} />
              <div className="skeleton" style={{ height: '1.4rem', width: '6rem', borderRadius: '2rem' }} />
            </div>
            <div className="skeleton" style={{ height: '0.85rem', width: '90%' }} />
            <div className="skeleton" style={{ height: '0.65rem', width: '4rem' }} />
          </div>
        ))}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Messaging</p>
        <h2 style={{ ...serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
          Conversations
        </h2>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6, marginTop: '0.5rem' }}>
          Your booking chats and standalone consultations, all in one place.
        </p>
      </div>

      {error && (
        <p style={{ fontSize: '0.875rem', color: 'var(--error-text)', marginBottom: '1rem' }}>{error}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* ── Booking conversations ─────────────────────────────────────── */}
        <section>
          <p style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '0.875rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            Booking conversations
          </p>

          {bookingConversations.length === 0 ? (
            <div style={{ padding: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', textAlign: 'center' }}>
              <p style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.5rem' }}>No booking conversations yet</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', margin: 0 }}>
                Once a booking is made you can message your artist directly here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bookingConversations.map((b) => {
                const chatKey: OpenChat = { type: 'booking', id: b.id };
                const isOpen = openChat?.type === 'booking' && openChat.id === b.id;
                const dateStr = b.appointment_date
                  ? new Date(b.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Date TBC';
                return (
                  <div key={b.id} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`, borderRadius: '0.75rem', overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
                    <div style={{ padding: '1.125rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                      <ChatPanel
                        chatKey={chatKey} openChat={openChat} msgs={msgs} msgsLoading={msgsLoading}
                        msgAreaRef={msgAreaRef} draft={draft} setDraft={setDraft}
                        imageFile={imageFile} imagePreview={imagePreview}
                        onImageSelect={handleImageSelect} clearImage={clearImage}
                        sending={sending} sendError={sendError} sendMessage={sendMessage}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Standalone consultations ──────────────────────────────────── */}
        <section>
          <p style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '0.875rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            Consultations
          </p>

          {/* New consultation request */}
          {!submitSuccess ? (
            <div className="card-premium" style={{ marginBottom: '1.25rem' }}>
              <div className="card-premium-inner">
                <h3 style={{ ...serif, fontStyle: 'italic', fontWeight: 400, fontSize: '1.175rem', color: 'var(--cream)', marginBottom: '0.375rem' }}>
                  Request a consultation
                </h3>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Describe your idea and Robyn will get back to you. No booking needed — this is just a conversation.
                </p>
                <form onSubmit={handleNewConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); if (submitError) setSubmitError(''); }}
                    placeholder="Describe the design, style, size, and placement you have in mind…"
                    rows={4}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.75rem', color: 'var(--cream)', fontSize: '0.9375rem', lineHeight: 1.6, resize: 'vertical', fontFamily: '"DM Sans", sans-serif', boxSizing: 'border-box' }}
                  />
                  {submitError && (
                    <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', lineHeight: 1.5 }}>
                      {submitError}
                    </p>
                  )}
                  <button type="submit" disabled={submitting || !newMessage.trim()} className="btn-primary" style={{ alignSelf: 'flex-start', opacity: (submitting || !newMessage.trim()) ? 0.5 : 1 }}>
                    {submitting ? 'Sending…' : 'Send consultation request'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.625rem', marginBottom: '1.25rem' }}>
              <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'rgba(34,197,94,0.9)' }}>
                Consultation request sent — Robyn will be in touch soon.
              </p>
            </div>
          )}

          {/* Standalone consultation threads */}
          {standaloneConsultations.length === 0 ? (
            <div style={{ padding: '2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', textAlign: 'center' }}>
              <p style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.5rem' }}>No consultations yet</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', margin: 0 }}>
                Send your first consultation request above — no commitment needed.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {standaloneConsultations.map((c) => {
                const chatKey: OpenChat = { type: 'consultation', id: c.consultation_id };
                const isOpen = openChat?.type === 'consultation' && openChat.id === c.consultation_id;
                const inDialogue = c.status === 'pending' && c.artist_message_count > 0;
                const chatAvailable = canChatConsultation(c);
                const bookingFormOpen = showBookingForm === c.consultation_id;

                return (
                  <div key={c.consultation_id} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`, borderRadius: '0.75rem', overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
                    {/* Consultation header */}
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

                    {/* Chat toggle */}
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
                        <ChatPanel
                          chatKey={chatKey} openChat={openChat} msgs={msgs} msgsLoading={msgsLoading}
                          msgAreaRef={msgAreaRef} draft={draft} setDraft={setDraft}
                          imageFile={imageFile} imagePreview={imagePreview}
                          onImageSelect={handleImageSelect} clearImage={clearImage}
                          sending={sending} sendError={sendError} sendMessage={sendMessage}
                        />
                      </div>
                    )}

                    {/* Convert to booking CTA — available for non-declined consultations */}
                    {c.status !== 'declined' && (
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowBookingForm(bookingFormOpen ? null : c.consultation_id);
                            setConvertError('');
                          }}
                          style={{ width: '100%', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bookingFormOpen ? 'rgba(201,168,76,0.05)' : 'none', border: 'none', cursor: 'pointer', color: bookingFormOpen ? 'var(--gold)' : 'var(--text-mid)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', transition: 'color 0.2s ease, background 0.2s ease' }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ ...mono, fontSize: '0.75rem', opacity: 0.6 }}>◈</span>
                            {bookingFormOpen ? 'Cancel' : 'Ready to book? Create a booking →'}
                          </span>
                          <span style={{ ...mono, fontSize: '0.75rem', opacity: 0.7 }}>{bookingFormOpen ? '↑' : '↓'}</span>
                        </button>

                        {bookingFormOpen && (
                          <form
                            onSubmit={(e) => handleConvertToBooking(e, c.consultation_id)}
                            style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(201,168,76,0.025)' }}
                          >
                            <div>
                              <p style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '0.75rem' }}>
                                Booking details
                              </p>
                              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', margin: '0 0 0.75rem', lineHeight: 1.6 }}>
                                Fill in the details below. Your consultation message history will be included automatically.
                              </p>
                            </div>

                            {/* Placement */}
                            <div>
                              <label style={{ display: 'block', ...mono, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.4rem' }}>
                                Placement *
                              </label>
                              <input
                                type="text"
                                required
                                value={bookingForm.placement}
                                onChange={(e) => setBookingForm((p) => ({ ...p, placement: e.target.value }))}
                                placeholder="e.g. Upper arm, ribcage, forearm…"
                                style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', fontFamily: '"DM Sans", sans-serif', boxSizing: 'border-box' }}
                              />
                            </div>

                            {/* Size */}
                            <div>
                              <label style={{ display: 'block', ...mono, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.4rem' }}>
                                Size preference
                              </label>
                              <select
                                value={bookingForm.size}
                                onChange={(e) => setBookingForm((p) => ({ ...p, size: e.target.value }))}
                                style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.7)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: bookingForm.size ? 'var(--cream)' : 'var(--text-low)', fontSize: '0.875rem', fontFamily: '"DM Sans", sans-serif', boxSizing: 'border-box' }}
                              >
                                <option value="">Select a size (optional)</option>
                                <option value="small">Small (up to palm-size)</option>
                                <option value="medium">Medium (palm to A5)</option>
                                <option value="large">Large (A5 to A4)</option>
                                <option value="extra_large">Extra large / sleeve</option>
                              </select>
                            </div>

                            {/* Preferred date */}
                            <div>
                              <label style={{ display: 'block', ...mono, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.4rem' }}>
                                Preferred date (optional)
                              </label>
                              <input
                                type="date"
                                value={bookingForm.preferred_date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBookingForm((p) => ({ ...p, preferred_date: e.target.value }))}
                                style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', fontFamily: '"DM Sans", sans-serif', boxSizing: 'border-box', colorScheme: 'dark' }}
                              />
                            </div>

                            {/* Notes */}
                            <div>
                              <label style={{ display: 'block', ...mono, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.4rem' }}>
                                Additional notes (optional)
                              </label>
                              <textarea
                                value={bookingForm.notes}
                                onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))}
                                placeholder="Anything else Robyn should know…"
                                rows={3}
                                style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'vertical', fontFamily: '"DM Sans", sans-serif', boxSizing: 'border-box' }}
                              />
                            </div>

                            {convertError && (
                              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--error-text)' }}>{convertError}</p>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <button
                                type="submit"
                                disabled={convertingBooking || !bookingForm.placement.trim()}
                                className="btn-primary"
                                style={{ opacity: (convertingBooking || !bookingForm.placement.trim()) ? 0.5 : 1 }}
                              >
                                {convertingBooking ? 'Creating booking…' : 'Create booking ↗'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShowBookingForm(null); setConvertError(''); }}
                                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.625rem 1.125rem', color: 'var(--text-mid)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
