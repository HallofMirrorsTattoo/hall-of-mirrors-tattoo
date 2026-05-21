'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';
import BookingActivityLog from '@/app/components/BookingActivityLog';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  booking_reference: string;
  appointment_date: string;
  appointment_time: string;
  appointment_status: string;
  deposit_price: number;
  final_price: number;
  artist_name: string;
  counter_offer_date: string | null;
  counter_offer_time: string | null;
  counter_offer_note: string | null;
  counter_offered_by: string | null;
  consent_form_signed: boolean;
}

interface BookingDetail {
  id: string;
  booking_reference: string;
  appointment_date: string;
  appointment_time: string;
  appointment_status: string;
  deposit_price: number;
  final_price: number;
  design_notes: string;
  tattoo_placement: string;
  estimated_size: string | null;
  estimated_duration: number | null;
  artist: { id: string; name: string; specialties: string; bio: string; instagram_handle: string } | null;
  design_ideas: { design_idea_id: string; image_url: string; description: string }[];
  counter_offer_date: string | null;
  counter_offer_time: string | null;
  counter_offer_note: string | null;
  counter_offered_by: string | null;
  consent_form_signed?: boolean;
  payment_method?: string;
  price_offer_status?: string;
  price_offer_note?: string | null;
  client_budget?: number | null;
}

interface Msg {
  id: string;
  sender_type: 'client' | 'artist';
  body: string | null;
  image_url: string | null;
  created_at: string;
}

interface Props {
  onBadgeUpdate?: (count: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(t: string): string {
  if (!t) return '';
  const h = parseInt(t.substring(0, 2), 10);
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hour${h !== 1 ? 's' : ''}`;
}

function statusLabel(status: string) {
  if (status === 'pending_consent') return 'Awaiting consent';
  if (status === 'counter_offered') return 'Counter offered';
  return status.replace(/_/g, ' ');
}

function getStatusStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'confirmed':
      return { background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)' };
    case 'pending_consent':
      return { background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.7)', border: '1px solid rgba(201,168,76,0.18)' };
    case 'counter_offered':
      return { background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.4)' };
    case 'cancelled':
      return { background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.2)' };
    case 'completed':
      return { background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.8)', border: '1px solid rgba(34,197,94,0.2)' };
    default:
      return { background: 'rgba(154,144,130,0.12)', color: 'var(--text-mid)', border: '1px solid rgba(154,144,130,0.2)' };
  }
}

const lbl: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.68rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.55)',
  margin: '0 0 0.3rem',
};

const val: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.9rem',
  color: 'var(--cream)',
  margin: 0,
  lineHeight: 1.5,
};

// ── Main component ────────────────────────────────────────────────────────────

export default function BookingsTab({ onBadgeUpdate }: Props) {
  const { accessToken } = useClientAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPast, setShowPast] = useState(false);

  // Expanded detail state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Messaging state
  const [messages, setMessages] = useState<Msg[]>([]);
  const [msgDraft, setMsgDraft] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgAreaRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch booking list
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        const list: Booking[] = data.bookings || [];
        setBookings(list);
        const badge = list.filter(
          (b) => b.appointment_status === 'counter_offered' && b.counter_offered_by === 'artist'
        ).length;
        onBadgeUpdate?.(badge);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    if (accessToken) fetch_();
  }, [accessToken, onBadgeUpdate]);

  // Fetch full detail when a booking is selected
  useEffect(() => {
    if (!selectedId || !accessToken) { setDetail(null); return; }
    setDetailLoading(true);
    setMessages([]);
    setMsgDraft('');
    setImageFile(null);
    setImagePreview(null);
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${selectedId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (res.ok) setDetail(data.booking);
      } catch { /* non-critical */ }
      finally { setDetailLoading(false); }
    })();
  }, [selectedId, accessToken]);

  // Message polling
  const fetchMessages = useCallback(async () => {
    if (!accessToken || !selectedId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/messages/${selectedId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch { /* non-critical */ }
  }, [accessToken, selectedId]);

  useEffect(() => {
    if (!selectedId) { if (pollRef.current) clearInterval(pollRef.current); return; }
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages, selectedId]);

  // Scroll to bottom of message area
  useEffect(() => {
    const el = msgAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Send message (text and/or image)
  const sendMessage = async () => {
    if ((!msgDraft.trim() && !imageFile) || msgSending || !selectedId) return;
    setMsgSending(true);
    setMsgError('');
    try {
      let res: Response;
      if (imageFile) {
        const fd = new FormData();
        if (msgDraft.trim()) fd.append('body', msgDraft.trim());
        fd.append('image', imageFile);
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/messages/${selectedId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: fd,
        });
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/messages/${selectedId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ body: msgDraft.trim() }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setMessages(prev => [...prev, data.message]);
      setMsgDraft('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setMsgSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Skeleton ──
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.375rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="skeleton" style={{ height: '0.7rem', width: '7rem' }} />
            <div className="skeleton" style={{ height: '1.4rem', width: '5.5rem', borderRadius: '2rem' }} />
          </div>
          <div className="skeleton" style={{ height: '1.5rem', width: '60%' }} />
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div className="skeleton" style={{ height: '0.65rem', width: '5rem' }} />
            <div className="skeleton" style={{ height: '0.65rem', width: '4rem' }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (error) return <p style={{ color: 'var(--error-text)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem' }}>{error}</p>;

  const activeStatuses = ['pending_consent', 'confirmed', 'rescheduled', 'counter_offered', 'pending'];
  const activeBookings = bookings.filter(b => activeStatuses.includes(b.appointment_status));
  const pastBookings = bookings.filter(b => !activeStatuses.includes(b.appointment_status));

  // ── Empty state ──
  if (bookings.length === 0) return (
    <div className="text-center py-12">
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--text-mid)', marginBottom: '0.5rem' }}>
        No bookings yet
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-low)', marginBottom: '1.5rem' }}>
        Ready to book your first session with Robyn?
      </p>
      <Link href="/booking" className="btn-primary">
        <span>Book Your First Appointment</span>
        <span className="btn-icon" aria-hidden="true">↗</span>
      </Link>
    </div>
  );

  // ── Compact booking card (left list) ──
  const BookingRow = ({ booking }: { booking: Booking }) => {
    const isSelected = booking.id === selectedId;
    const needsAction =
      (booking.appointment_status === 'counter_offered' && booking.counter_offered_by === 'artist') ||
      (booking.appointment_status === 'pending_consent' && !booking.consent_form_signed);

    return (
      <button
        type="button"
        onClick={() => setSelectedId(isSelected ? null : booking.id)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '0.875rem 1rem',
          borderRadius: '0.625rem',
          background: isSelected ? 'rgba(201,168,76,0.08)' : 'var(--surface)',
          border: `1px solid ${isSelected ? 'rgba(201,168,76,0.4)' : 'var(--border)'}`,
          borderLeft: `3px solid ${isSelected ? 'var(--gold)' : 'transparent'}`,
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: 'var(--cream)' }}>
            {booking.artist_name || 'Robyn'}
          </span>
          <span style={{
            ...getStatusStyle(booking.appointment_status),
            padding: '0.1rem 0.5rem',
            borderRadius: '9999px',
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {statusLabel(booking.appointment_status)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', color: 'var(--text-low)' }}>
            {new Date(booking.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {booking.appointment_time ? ` · ${fmtTime(booking.appointment_time)}` : ''}
          </span>
          {needsAction && (
            <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
          )}
        </div>
      </button>
    );
  };

  // ── Detail panel ──
  const DetailPanel = () => {
    if (!selectedId) return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--text-mid)', marginBottom: '0.5rem' }}>
          Select a booking to view details
        </p>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)', margin: 0 }}>
          Tap any booking on the left to see full details and send messages.
        </p>
      </div>
    );

    if (detailLoading) return (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: '3.5rem', borderRadius: '0.5rem' }} />
        ))}
      </div>
    );

    if (!detail) return (
      <div style={{ padding: '1.5rem' }}>
        <p style={{ color: 'var(--text-mid)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem' }}>Could not load booking details.</p>
      </div>
    );

    const needsConsent = detail.appointment_status === 'pending_consent' && !detail.consent_form_signed;
    const needsResponse = detail.appointment_status === 'counter_offered' && detail.counter_offered_by === 'artist';
    const isPast = ['completed', 'cancelled'].includes(detail.appointment_status);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 0 1rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.5rem', color: 'var(--cream)', margin: '0 0 0.2rem' }}>
              {detail.artist?.name ?? 'Robyn'}
            </h2>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.45)', margin: 0 }}>
              {detail.booking_reference}
            </p>
          </div>
          <span style={{
            ...getStatusStyle(detail.appointment_status),
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.68rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {statusLabel(detail.appointment_status)}
          </span>
        </div>

        {/* Action banners */}
        {needsConsent && (
          <Link
            href={`/client/consent/${detail.id}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: '0.5rem', textDecoration: 'none' }}
          >
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.85)' }}>
              Action required — sign your consent form
            </span>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', color: 'rgba(201,168,76,0.85)', flexShrink: 0 }}>→</span>
          </Link>
        )}
        {detail.consent_form_signed && !isPast && (
          <div style={{ padding: '0.5rem 0.875rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.375rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(34,197,94,0.75)' }}>
              ✓ Consent form signed
            </span>
          </div>
        )}
        {needsResponse && (
          <div style={{ padding: '0.875rem 1rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.5rem' }}>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 0.625rem' }}>
              Robyn has proposed a new time
            </p>
            {/* Original date (strikethrough) → Proposed date (gold) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: 'var(--text-low)', textDecoration: 'line-through' }}>
                {new Date(`${detail.appointment_date.substring(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                {detail.appointment_time ? ` ${fmtTime(detail.appointment_time)}` : ''}
              </span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'var(--text-low)' }}>→</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>
                {detail.counter_offer_date
                  ? new Date(`${detail.counter_offer_date.substring(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                  : '—'}
                {detail.counter_offer_time ? ` ${fmtTime(detail.counter_offer_time)}` : ''}
              </span>
            </div>
            {detail.counter_offer_note && (
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', color: 'var(--text-mid)', margin: '0 0 0.625rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                &ldquo;{detail.counter_offer_note}&rdquo;
              </p>
            )}
            <Link
              href={`/client/bookings/${detail.id}`}
              style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none' }}
            >
              Respond to proposal →
            </Link>
          </div>
        )}
        {detail.appointment_status === 'counter_offered' && detail.counter_offered_by === 'client' && (
          <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(154,144,130,0.08)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>
              Awaiting Robyn&apos;s response
            </p>
          </div>
        )}

        {/* Key details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
            <p style={lbl}>Date</p>
            <p style={val}>
              {new Date(`${detail.appointment_date.substring(0, 10)}T12:00:00`).toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
            <p style={lbl}>Time</p>
            <p style={val}>{detail.appointment_time ? fmtTime(detail.appointment_time) : '—'}</p>
          </div>
          {(detail.deposit_price || detail.final_price) ? (
            <div style={{ padding: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
              <p style={lbl}>Deposit</p>
              <p style={val}>{detail.deposit_price ? `£${detail.deposit_price}` : '—'}</p>
            </div>
          ) : null}
          {detail.final_price ? (
            <div style={{ padding: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
              <p style={lbl}>Final payment</p>
              <p style={{ ...val, color: 'var(--gold)' }}>£{detail.final_price}</p>
            </div>
          ) : null}
          {detail.estimated_duration != null && detail.estimated_duration > 0 && (
            <div style={{ padding: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
              <p style={lbl}>Duration</p>
              <p style={val}>{fmtDuration(detail.estimated_duration)}</p>
            </div>
          )}
        </div>

        {/* Design info */}
        {(detail.tattoo_placement || detail.design_notes) && (
          <div style={{ padding: '0.875rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {detail.tattoo_placement && (
              <div>
                <p style={lbl}>Placement</p>
                <p style={val}>{detail.tattoo_placement}</p>
              </div>
            )}
            {detail.design_notes && (
              <div>
                <p style={lbl}>Description</p>
                <p style={{ ...val, color: 'var(--text)', lineHeight: 1.7, fontSize: '0.875rem' }}>{detail.design_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Design references */}
        {detail.design_ideas && detail.design_ideas.length > 0 && (
          <div>
            <p style={{ ...lbl, marginBottom: '0.5rem' }}>Reference images</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {detail.design_ideas.map((idea) => (
                <div
                  key={idea.design_idea_id}
                  style={{ borderRadius: '0.375rem', overflow: 'hidden', background: 'var(--surface)', aspectRatio: '1/1', cursor: 'pointer' }}
                  onClick={() => window.open(idea.image_url, '_blank')}
                >
                  <img src={idea.image_url} alt="Design reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reschedule / cancel link for active bookings */}
        {!isPast && detail.appointment_status !== 'counter_offered' && (
          <Link
            href={`/client/bookings/${detail.id}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', textDecoration: 'none', alignSelf: 'flex-start' }}
          >
            Reschedule or cancel →
          </Link>
        )}

        {/* Message thread */}
        {detail.appointment_status !== 'cancelled' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <p style={{ ...lbl, marginBottom: '0.625rem' }}>Messages</p>
            <div
              ref={msgAreaRef}
              style={{ height: '14rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'rgba(14,12,9,0.4)', border: '1px solid var(--border)', borderRadius: '0.5rem', marginBottom: '0.625rem' }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-mid)', marginBottom: '0.25rem' }}>
                    Start the conversation
                  </p>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', margin: 0 }}>
                    Send a message about this booking.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isClient = msg.sender_type === 'client';
                  const prev = messages[i - 1];
                  const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                  const hasImage = !!msg.image_url;
                  const hasBody = !!msg.body;
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <p style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.5rem 0' }}>
                          {new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: isClient ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '78%',
                          padding: hasImage && !hasBody ? '0.25rem' : '0.625rem 0.875rem',
                          borderRadius: isClient ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                          background: isClient ? 'rgba(201,168,76,0.13)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isClient ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                        }}>
                          {hasImage && (
                            <div style={{ marginBottom: hasBody ? '0.5rem' : 0 }}>
                              <img
                                src={msg.image_url!}
                                alt="Shared image"
                                style={{ maxWidth: '100%', borderRadius: hasBody ? '0.5rem' : '0.75rem', cursor: 'pointer', display: 'block' }}
                                onClick={() => window.open(msg.image_url!, '_blank')}
                              />
                            </div>
                          )}
                          {hasBody && (
                            <p style={{ margin: 0, fontSize: '0.875rem', color: isClient ? 'var(--cream)' : 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>
                              {msg.body}
                            </p>
                          )}
                          <p style={{ margin: hasBody || hasImage ? '0.2rem 0 0' : 0, fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.06em', color: isClient ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', textAlign: isClient ? 'right' : 'left' }}>
                            {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.5rem' }}>
                <img src={imagePreview} alt="Preview" style={{ height: '4rem', borderRadius: '0.375rem', border: '1px solid rgba(201,168,76,0.3)' }} />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  style={{ position: 'absolute', top: '-0.375rem', right: '-0.375rem', width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: 'rgba(14,12,9,0.9)', border: '1px solid rgba(201,168,76,0.4)', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', lineHeight: 1, padding: 0 }}
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            )}

            {msgError && <p style={{ margin: '0 0 0.375rem', fontSize: '0.75rem', color: 'var(--error-text)' }}>{msgError}</p>}

            {/* Input row */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image"
                style={{
                  flexShrink: 0,
                  width: '2.25rem',
                  height: '2.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: imageFile ? 'rgba(201,168,76,0.15)' : 'var(--surface)',
                  border: `1px solid ${imageFile ? 'rgba(201,168,76,0.5)' : 'var(--border)'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: imageFile ? 'var(--gold)' : 'var(--text-mid)',
                  fontSize: '0.9rem',
                  lineHeight: 1,
                }}
              >
                📎
              </button>
              <textarea
                value={msgDraft}
                onChange={(e) => setMsgDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Write a message… (Enter to send)"
                rows={2}
                style={{ flex: 1, resize: 'none', padding: '0.5rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, fontFamily: '"DM Sans", sans-serif', outline: 'none' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={sendMessage}
                disabled={(!msgDraft.trim() && !imageFile) || msgSending}
                className="btn-primary"
                style={{ padding: '0.5rem 0.875rem', flexShrink: 0, opacity: ((!msgDraft.trim() && !imageFile) || msgSending) ? 0.5 : 1, cursor: ((!msgDraft.trim() && !imageFile) || msgSending) ? 'default' : 'pointer', height: '2.25rem', alignSelf: 'flex-end' }}
              >
                {msgSending ? '…' : '→'}
              </button>
            </div>
          </div>
        )}

        {/* Activity history */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <p style={{ ...lbl, marginBottom: '0.875rem' }}>History</p>
          <BookingActivityLog
            bookingId={detail.id}
            accessToken={accessToken!}
            endpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${detail.id}/activity`}
          />
        </div>

        {/* Rebook CTA for completed */}
        {detail.appointment_status === 'completed' && (
          <Link
            href="/booking"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: 'transparent', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '0.5rem', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', textDecoration: 'none' }}
          >
            Book another session →
          </Link>
        )}
      </div>
    );
  };

  // ── Layout ──
  const hasSelected = !!selectedId;

  return (
    <div>
      {/* Two-panel layout when something is selected; list-only otherwise */}
      <div style={{ display: 'grid', gridTemplateColumns: hasSelected ? 'minmax(0,260px) minmax(0,1fr)' : '1fr', gap: '1rem', alignItems: 'start' }}>

        {/* Booking list */}
        <div>
          {/* Active bookings */}
          {activeBookings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: pastBookings.length > 0 ? '1rem' : 0 }}>
              {activeBookings.map(b => <BookingRow key={b.id} booking={b} />)}
            </div>
          )}

          {activeBookings.length === 0 && !hasSelected && (
            <div style={{ textAlign: 'center', padding: '2rem 0', marginBottom: '1rem' }}>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '1rem' }}>
                No upcoming bookings
              </p>
              <Link href="/booking" className="btn-primary" style={{ display: 'inline-flex' }}>
                <span>Book a session</span>
                <span className="btn-icon" aria-hidden="true">↗</span>
              </Link>
            </div>
          )}

          {/* Past bookings — collapsed by default */}
          {pastBookings.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowPast(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'none', border: 'none', padding: '0.625rem 0',
                  cursor: 'pointer', borderTop: '1px solid var(--border)',
                  width: '100%', textAlign: 'left',
                  marginBottom: showPast ? '0.5rem' : 0,
                }}
              >
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                  Past ({pastBookings.length})
                </span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: 'var(--text-low)', marginLeft: 'auto' }}>
                  {showPast ? '↑' : '↓'}
                </span>
              </button>
              {showPast && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.7 }}>
                  {pastBookings.map(b => <BookingRow key={b.id} booking={b} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {hasSelected && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            position: 'sticky',
            top: '1.5rem',
            maxHeight: 'calc(100vh - 8rem)',
            overflowY: 'auto',
          }}>
            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => { setSelectedId(null); setDetail(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.25rem 0' }}
              >
                Close ✕
              </button>
            </div>
            <DetailPanel />
          </div>
        )}
      </div>
    </div>
  );
}
