'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';
import { ClientProtectedRoute } from '@/lib/clientProtectedRoute';
import AvailabilityCalendar, { AvailabilityData } from '@/app/components/AvailabilityCalendar';
import TimeSlotPicker, { TIME_SLOTS } from '@/app/components/TimeSlotPicker';

interface Artist {
  id: string;
  name: string;
  specialties: string;
  bio: string;
  instagram_handle: string;
}

interface DesignIdea {
  design_idea_id: string;
  image_url: string;
  description: string;
}

interface Booking {
  id: string;
  booking_reference: string;
  appointment_date: string;
  appointment_time: string;
  appointment_status: string;
  deposit_price: number;
  final_price: number;
  design_notes: string;
  tattoo_placement: string;
  estimated_duration: number | null;
  created_at: string;
  updated_at: string;
  artist: Artist | null;
  design_ideas: DesignIdea[];
  counter_offer_date: string | null;
  counter_offer_time: string | null;
  counter_offer_note: string | null;
  counter_offered_by: string | null;
  client_budget?: number | null;
  price_offer_status?: string;
  price_offer_note?: string | null;
  payment_method?: string;
  consent_form_signed?: boolean;
}

type Mode = 'view' | 'cancel-confirm' | 'reschedule' | 'counter-offer';

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

function statusStyle(status: string): React.CSSProperties {
  if (status === 'confirmed')
    return { background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)' };
  if (status === 'rescheduled')
    return { background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.65)', border: '1px solid rgba(201,168,76,0.2)' };
  if (status === 'pending_consent')
    return { background: 'rgba(154,144,130,0.1)', color: 'var(--text-mid)', border: '1px solid rgba(154,144,130,0.2)' };
  if (status === 'cancelled')
    return { background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.2)' };
  if (status === 'completed')
    return { background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.8)', border: '1px solid rgba(34,197,94,0.2)' };
  if (status === 'counter_offered')
    return { background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.4)' };
  return { background: 'rgba(154,144,130,0.1)', color: 'var(--text-mid)', border: '1px solid rgba(154,144,130,0.2)' };
}

const label: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.72rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.55)',
  margin: '0 0 0.3rem',
};

const value: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.9375rem',
  color: 'var(--cream)',
  margin: 0,
  lineHeight: 1.5,
};

export default function BookingDetailPage() {
  const params = useParams();
  const { accessToken } = useClientAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('view');
  const [acting, setActing] = useState(false);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<string | null>(null);
  const [availData, setAvailData] = useState<AvailabilityData | null>(null);
  const [counterDate, setCounterDate] = useState<string | null>(null);
  const [counterSlot, setCounterSlot] = useState<string | null>(null);
  const [counterNote, setCounterNote] = useState('');
  const [counterAvailData, setCounterAvailData] = useState<AvailabilityData | null>(null);
  const [acceptingPrice, setAcceptingPrice] = useState(false);
  const [priceAcceptError, setPriceAcceptError] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);

  interface BookingMsg { id: string; sender_type: 'client' | 'artist'; body: string; created_at: string; }
  const [messages, setMessages] = useState<BookingMsg[]>([]);
  const [msgDraft, setMsgDraft] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const msgAreaRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bookingId = params.id as string;

  useEffect(() => {
    if (!accessToken || !bookingId) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        setBooking(data.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken, bookingId]);

  const fetchMessages = useCallback(async () => {
    if (!accessToken || !bookingId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/messages/${bookingId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch { /* non-critical */ }
  }, [accessToken, bookingId]);

  useEffect(() => {
    if (!bookingId || !accessToken) return;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    const el = msgAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!msgDraft.trim() || msgSending) return;
    setMsgSending(true);
    setMsgError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/messages/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: msgDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setMessages(prev => [...prev, data.message]);
      setMsgDraft('');
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setMsgSending(false);
    }
  };

  const handleAcceptPrice = async () => {
    setAcceptingPrice(true);
    setPriceAcceptError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}/accept-price`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to accept price'); }
      setBooking(prev => prev ? { ...prev, price_offer_status: 'accepted' } : prev);
    } catch (err) {
      setPriceAcceptError(err instanceof Error ? err.message : 'Failed to accept price');
    } finally {
      setAcceptingPrice(false);
    }
  };

  const handleSetPaymentMethod = async (method: string) => {
    setUpdatingPayment(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ payment_method: method }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update'); }
      setBooking(prev => prev ? { ...prev, payment_method: method } : prev);
    } catch { /* non-critical */ } finally {
      setUpdatingPayment(false);
    }
  };

  const hoursUntil = booking
    ? (new Date(booking.appointment_date).getTime() - Date.now()) / 3_600_000
    : Infinity;
  const within48hrs = hoursUntil < 48;
  const isPast = hoursUntil < 0;

  const handleCancel = async () => {
    setActing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ appointment_status: 'cancelled' }),
        }
      );
      if (!res.ok) throw new Error('Failed to cancel booking');
      setBooking(prev => prev ? { ...prev, appointment_status: 'cancelled' } : prev);
      setMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setActing(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newSlot) return;
    setActing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            appointment_status: 'rescheduled',
            new_appointment_date: newDate,
            new_appointment_time: newSlot,
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to reschedule booking');
      const data = await res.json();
      setBooking(prev => prev ? {
        ...prev,
        appointment_status: 'rescheduled',
        appointment_date: data.booking.appointment_date_time ?? data.booking.appointment_date ?? prev.appointment_date,
        appointment_time: data.booking.appointment_time ?? newSlot,
      } : prev);
      setMode('view');
      setNewDate(null);
      setNewSlot(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reschedule failed');
    } finally {
      setActing(false);
    }
  };

  const handleAcceptOffer = async () => {
    setActing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}/accept-offer`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error('Failed to accept offer');
      setBooking(prev => prev ? {
        ...prev,
        appointment_status: 'pending_consent',
        appointment_date: prev.counter_offer_date ?? prev.appointment_date,
        appointment_time: prev.counter_offer_time ?? prev.appointment_time,
        counter_offer_date: null, counter_offer_time: null,
        counter_offer_note: null, counter_offered_by: null,
      } : prev);
      setMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setActing(false);
    }
  };

  const handleClientCounter = async () => {
    if (!counterDate || !counterSlot || !counterNote.trim()) return;
    setActing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}/counter-offer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ counter_offer_date: counterDate, counter_offer_time: counterSlot, counter_offer_note: counterNote.trim() }),
        }
      );
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to send counter-offer'); }
      setBooking(prev => prev ? {
        ...prev,
        counter_offer_date: counterDate, counter_offer_time: counterSlot,
        counter_offer_note: counterNote.trim(), counter_offered_by: 'client',
      } : prev);
      setMode('view');
      setCounterDate(null); setCounterSlot(null); setCounterNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send counter-offer');
    } finally {
      setActing(false);
    }
  };

  const wrap = (children: React.ReactNode) => (
    <ClientProtectedRoute>
      <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '8rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1.25rem' }}>
          {children}
        </div>
      </div>
    </ClientProtectedRoute>
  );

  if (loading) return wrap(
    <div>
      <div className="skeleton" style={{ height: '0.65rem', width: '6rem', marginBottom: '2.5rem', borderRadius: '0.25rem' }} />
      <div style={{ marginBottom: '3rem' }}>
        <div className="skeleton" style={{ height: '3rem', width: '50%', marginBottom: '0.75rem', borderRadius: '0.375rem' }} />
        <div className="skeleton" style={{ height: '0.6rem', width: '8rem', borderRadius: '0.25rem' }} />
      </div>
      <div className="skeleton" style={{ height: '5rem', borderRadius: '0.75rem', marginBottom: '2rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: '4.5rem', borderRadius: '0.5rem' }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: '8rem', borderRadius: '0.75rem' }} />
    </div>
  );
  if (error) return wrap(
    <div style={{ padding: '1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem' }}>
      <p style={{ margin: 0, color: 'var(--error-text)', fontSize: '0.9rem', fontFamily: '"DM Sans", sans-serif' }}>{error}</p>
    </div>
  );
  if (!booking) return wrap(<p style={{ color: 'var(--text-mid)' }}>Booking not found.</p>);

  const isCounterOffered = booking.appointment_status === 'counter_offered';
  const canAct = !isCounterOffered && booking.appointment_status !== 'cancelled' && booking.appointment_status !== 'completed' && !isPast;
  const canReschedule = canAct && booking.appointment_status !== 'rescheduled';

  return (
    <ClientProtectedRoute>
      <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '8rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1.25rem' }}>

          {/* Back */}
          <Link href="/client/dashboard" style={{
            fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none',
            display: 'inline-block', marginBottom: '2.5rem',
          }}>
            ← Dashboard
          </Link>

          {/* Heading */}
          <div style={{ marginBottom: '3rem' }}>
            <h1 style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', color: 'var(--cream)',
              letterSpacing: '-0.02em', lineHeight: 1.0, margin: '0 0 0.5rem',
            }}>
              Booking Details
            </h1>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)', margin: 0 }}>
              Ref: {booking.booking_reference}
            </p>
          </div>

          {/* Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: '1.5rem', alignItems: 'start' }}>

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Status + actions */}
              <div className="card-premium">
                <div className="card-premium-inner">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (canAct || isCounterOffered) ? '1.5rem' : 0 }}>
                    <div>
                      <p style={{ ...label, marginBottom: '0.4rem' }}>Status</p>
                      <span style={{
                        ...statusStyle(booking.appointment_status),
                        display: 'inline-block',
                        padding: '0.3rem 0.875rem',
                        borderRadius: '9999px',
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}>
                        {booking.appointment_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {booking.appointment_status === 'rescheduled' && (
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-mid)', margin: 0, maxWidth: '14rem', textAlign: 'right' }}>
                        Your reschedule request is with the studio.
                      </p>
                    )}
                  </div>

                  {/* Artist proposed a new time — action required */}
                  {isCounterOffered && booking.counter_offered_by === 'artist' && mode === 'view' && (
                    <div>
                      <div style={{ padding: '1rem 1.25rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.5rem', marginBottom: '1.25rem' }}>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', margin: '0 0 0.875rem' }}>
                          Your artist has proposed a new time
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.625rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div>
                            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0 0 0.25rem' }}>Original</p>
                            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', margin: 0, lineHeight: 1.4 }}>
                              {new Date(`${String(booking.appointment_date).substring(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                              {booking.appointment_time && ` at ${fmtTime(booking.appointment_time)}`}
                            </p>
                          </div>
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: 'var(--text-low)' }}>→</span>
                          <div>
                            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', margin: '0 0 0.25rem' }}>Proposed</p>
                            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--cream)', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                              {booking.counter_offer_date
                                ? new Date(`${String(booking.counter_offer_date).substring(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                                : '—'}
                              {booking.counter_offer_time && ` at ${fmtTime(booking.counter_offer_time)}`}
                            </p>
                          </div>
                        </div>
                        {booking.counter_offer_note && (
                          <blockquote style={{ margin: '0.75rem 0 0', padding: '0.625rem 0.875rem', borderLeft: '2px solid rgba(201,168,76,0.35)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.65 }}>
                            {booking.counter_offer_note}
                          </blockquote>
                        )}
                      </div>
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-mid)', lineHeight: 1.6, margin: '0 0 1rem' }}>
                        If you need a different date, send Robyn a message — she can update the booking from her side.
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={handleAcceptOffer}
                          disabled={acting}
                          className="btn-primary"
                          style={{ fontSize: '0.8125rem', padding: '0.6rem 1.25rem', opacity: acting ? 0.6 : 1 }}
                        >
                          <span>{acting ? 'Accepting…' : 'Accept this time'}</span>
                        </button>
                        <button
                          onClick={() => setMode('cancel-confirm')}
                          className="btn-secondary"
                          style={{ fontSize: '0.8125rem', padding: '0.6rem 1.25rem', color: 'var(--error-text)', borderColor: 'rgba(239,68,68,0.3)' }}
                        >
                          Cancel booking
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Client proposed — waiting for artist */}
                  {isCounterOffered && booking.counter_offered_by === 'client' && mode === 'view' && (
                    <div style={{ padding: '1rem 1.25rem', background: 'rgba(154,144,130,0.06)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)', margin: '0 0 0.875rem' }}>
                        Awaiting artist response
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.625rem', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0 0 0.25rem' }}>Original</p>
                          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', margin: 0, lineHeight: 1.4 }}>
                            {new Date(`${String(booking.appointment_date).substring(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {booking.appointment_time && ` at ${fmtTime(booking.appointment_time)}`}
                          </p>
                        </div>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: 'var(--text-low)' }}>→</span>
                        <div>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.55)', margin: '0 0 0.25rem' }}>Your proposal</p>
                          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--cream)', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                            {booking.counter_offer_date
                              ? new Date(`${String(booking.counter_offer_date).substring(0, 10)}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                              : '—'}
                            {booking.counter_offer_time && ` at ${fmtTime(booking.counter_offer_time)}`}
                          </p>
                        </div>
                      </div>
                      {booking.counter_offer_note && (
                        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', margin: '0.625rem 0 0', lineHeight: 1.65, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '0.625rem' }}>
                          &ldquo;{booking.counter_offer_note}&rdquo;
                        </p>
                      )}
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem', color: 'var(--text-low)', margin: '0.625rem 0 0', lineHeight: 1.5 }}>
                        Your artist will get back to you shortly.
                      </p>
                    </div>
                  )}

                  {/* Action buttons — normal statuses */}
                  {canAct && mode === 'view' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      {within48hrs && canReschedule && (
                        <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.375rem' }}>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(239,68,68,0.85)', margin: '0 0 0.2rem' }}>
                            Deposit at risk
                          </p>
                          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                            Your appointment is within 48 hours. Rescheduling now will <strong style={{ color: 'rgba(239,68,68,0.9)' }}>forfeit your deposit</strong>.
                          </p>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {canReschedule && (
                          <button
                            onClick={() => setMode('reschedule')}
                            className={within48hrs ? 'btn-secondary' : 'btn-primary'}
                            style={{ fontSize: '0.8125rem', padding: '0.6rem 1.25rem', ...(within48hrs ? { color: 'rgba(239,68,68,0.8)', borderColor: 'rgba(239,68,68,0.35)' } : {}) }}
                          >
                            <span>Reschedule</span>
                          </button>
                        )}
                        <button
                          onClick={() => setMode('cancel-confirm')}
                          className="btn-secondary"
                          style={{ fontSize: '0.8125rem', padding: '0.6rem 1.25rem' }}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cancel confirmation */}
                  {mode === 'cancel-confirm' && (
                    <div style={{ marginTop: '0' }}>
                      <div style={{
                        padding: '1rem 1.25rem',
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '0.5rem',
                        marginBottom: '1.25rem',
                      }}>
                        <p style={{
                          fontFamily: '"DM Mono", monospace', fontSize: '0.75rem',
                          letterSpacing: '0.12em', textTransform: 'uppercase',
                          color: 'var(--error-text)', margin: '0 0 0.5rem',
                        }}>
                          Before you cancel
                        </p>
                        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', margin: 0, lineHeight: 1.65 }}>
                          Cancelling your booking will <strong style={{ color: 'var(--cream)' }}>forfeit your deposit entirely</strong>. This cannot be undone.
                          If you need to change your date, use <em>Reschedule</em> instead — deposits are honoured when you reschedule at least 48 hours in advance.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={handleCancel}
                          disabled={acting}
                          style={{
                            padding: '0.6rem 1.25rem',
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.35)',
                            borderRadius: '0.375rem',
                            color: 'var(--error-text)',
                            fontFamily: '"DM Mono", monospace',
                            fontSize: '0.7rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            cursor: acting ? 'not-allowed' : 'pointer',
                            opacity: acting ? 0.6 : 1,
                          }}
                        >
                          {acting ? 'Cancelling...' : 'Yes, cancel & forfeit deposit'}
                        </button>
                        <button
                          onClick={() => setMode('view')}
                          className="btn-secondary"
                          style={{ fontSize: '0.8125rem', padding: '0.6rem 1.25rem' }}
                        >
                          Keep my booking
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Consent form card */}
              {['pending_consent', 'confirmed'].includes(booking.appointment_status) && (
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', margin: '0 0 1rem' }}>
                      Consent Form
                    </h2>
                    {booking.consent_form_signed ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.5rem' }}>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(34,197,94,0.8)' }}>
                          ✓ Consent form signed
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div style={{ padding: '0.875rem 1rem', background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
                            Your consent form needs to be signed before your appointment. This only takes a couple of minutes.
                          </p>
                        </div>
                        <Link
                          href={`/client/consent/${bookingId}`}
                          className="btn-primary"
                          style={{ display: 'inline-flex', fontSize: '0.8125rem', padding: '0.6rem 1.25rem' }}
                        >
                          <span>Sign consent form</span>
                          <span className="btn-icon" aria-hidden="true">→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Appointment */}
              <div className="card-premium">
                <div className="card-premium-inner">
                  <h2 style={{
                    fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
                    fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', margin: '0 0 1.25rem',
                  }}>
                    Appointment
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <p style={label}>Date</p>
                      <p style={value}>
                        {new Date(`${booking.appointment_date.substring(0, 10)}T12:00:00`).toLocaleDateString('en-GB', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                    {booking.appointment_time && (
                      <div>
                        <p style={label}>Start time</p>
                        <p style={value}>{fmtTime(booking.appointment_time)}</p>
                      </div>
                    )}
                    {booking.estimated_duration != null && booking.estimated_duration > 0 && booking.appointment_status === 'confirmed' && (
                      <div>
                        <p style={label}>Estimated duration</p>
                        <p style={value}>{fmtDuration(booking.estimated_duration)}</p>
                      </div>
                    )}
                    {booking.appointment_time && booking.appointment_status === 'confirmed' && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${booking.id}/ics`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginTop: '0.25rem', transition: 'color 0.2s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.7)')}
                      >
                        <span>Add to calendar</span>
                        <span aria-hidden="true">↓</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Reschedule panel */}
              {mode === 'reschedule' && (
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <h2 style={{
                      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
                      fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', margin: '0 0 1rem',
                    }}>
                      Choose a new date
                    </h2>

                    {/* 48hr policy notice */}
                    <div style={{
                      padding: '0.875rem 1.125rem',
                      background: within48hrs ? 'rgba(239,68,68,0.06)' : 'rgba(201,168,76,0.06)',
                      border: `1px solid ${within48hrs ? 'rgba(239,68,68,0.2)' : 'rgba(201,168,76,0.2)'}`,
                      borderRadius: '0.5rem',
                      marginBottom: '1.5rem',
                    }}>
                      {within48hrs ? (
                        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8375rem', color: 'var(--text)', margin: 0, lineHeight: 1.65 }}>
                          Your appointment is within 48 hours. Rescheduling at this stage will
                          {' '}<strong style={{ color: 'var(--error-text)' }}>forfeit your deposit</strong>. You're welcome to reschedule the date,
                          but a new deposit will be required to confirm the replacement slot.
                        </p>
                      ) : (
                        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8375rem', color: 'var(--text)', margin: 0, lineHeight: 1.65 }}>
                          Your appointment is more than 48 hours away —{' '}
                          <strong style={{ color: 'var(--gold)' }}>your deposit is honoured</strong> when you reschedule.
                          Choose a new date and start time below.
                        </p>
                      )}
                    </div>

                    {/* Calendar */}
                    {booking.artist ? (
                      <>
                        <AvailabilityCalendar
                          artistId={booking.artist.id}
                          selectedDate={newDate}
                          onDateSelect={(d) => { setNewDate(d); setNewSlot(null); }}
                          onAvailabilityLoad={setAvailData}
                        />
                        {newDate && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <TimeSlotPicker
                              date={newDate}
                              selectedSlot={newSlot}
                              onSlotSelect={setNewSlot}
                              slotData={availData?.slotData}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      /* No specific artist — simple date + time pick */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                          <p style={label}>New date</p>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={newDate ?? ''}
                            onChange={e => { setNewDate(e.target.value); setNewSlot(null); }}
                            style={{
                              width: '100%', padding: '0.625rem 0.875rem',
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              borderRadius: '0.375rem', color: 'var(--cream)',
                              fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem',
                            }}
                          />
                        </div>
                        {newDate && (
                          <div>
                            <p style={label}>Start time</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                              {TIME_SLOTS.map(slot => (
                                <button
                                  key={slot.id}
                                  onClick={() => setNewSlot(slot.id)}
                                  style={{
                                    padding: '0.625rem 0.25rem',
                                    border: newSlot === slot.id ? '1px solid var(--gold)' : '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    background: newSlot === slot.id ? 'rgba(201,168,76,0.13)' : 'transparent',
                                    cursor: 'pointer',
                                    fontFamily: '"DM Sans", sans-serif',
                                    fontSize: '0.8125rem',
                                    color: newSlot === slot.id ? 'var(--gold)' : 'var(--text)',
                                  }}
                                >
                                  {slot.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confirm reschedule */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleReschedule}
                        disabled={!newDate || !newSlot || acting}
                        className="btn-primary"
                        style={{
                          fontSize: '0.8125rem', padding: '0.6rem 1.25rem',
                          opacity: (!newDate || !newSlot || acting) ? 0.4 : 1,
                        }}
                      >
                        <span>{acting ? 'Rescheduling...' : 'Confirm reschedule'}</span>
                      </button>
                      <button
                        onClick={() => { setMode('view'); setNewDate(null); setNewSlot(null); }}
                        className="btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '0.6rem 1.25rem' }}
                      >
                        Go back
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Counter-offer form */}
              {mode === 'counter-offer' && (
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <h2 style={{
                      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
                      fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', margin: '0 0 1rem',
                    }}>
                      Suggest a different time
                    </h2>
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
                      Choose a date and time that works better for you and add a short note for your artist.
                    </p>

                    {booking.artist ? (
                      <>
                        <AvailabilityCalendar
                          artistId={booking.artist.id}
                          selectedDate={counterDate}
                          onDateSelect={(d) => { setCounterDate(d); setCounterSlot(null); }}
                          onAvailabilityLoad={setCounterAvailData}
                        />
                        {counterDate && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <TimeSlotPicker
                              date={counterDate}
                              selectedSlot={counterSlot}
                              onSlotSelect={setCounterSlot}
                              slotData={counterAvailData?.slotData}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                          <p style={label}>New date</p>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={counterDate ?? ''}
                            onChange={e => { setCounterDate(e.target.value); setCounterSlot(null); }}
                            style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.375rem', color: 'var(--cream)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem' }}
                          />
                        </div>
                        {counterDate && (
                          <div>
                            <p style={label}>Start time</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                              {TIME_SLOTS.map(slot => (
                                <button
                                  key={slot.id}
                                  onClick={() => setCounterSlot(slot.id)}
                                  style={{ padding: '0.625rem 0.25rem', border: counterSlot === slot.id ? '1px solid var(--gold)' : '1px solid var(--border)', borderRadius: '0.5rem', background: counterSlot === slot.id ? 'rgba(201,168,76,0.13)' : 'transparent', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: counterSlot === slot.id ? 'var(--gold)' : 'var(--text)' }}
                                >
                                  {slot.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: '1.5rem' }}>
                      <p style={label}>Note for your artist</p>
                      <textarea
                        value={counterNote}
                        onChange={e => setCounterNote(e.target.value)}
                        placeholder="Let your artist know why this time works better for you…"
                        rows={3}
                        style={{ width: '100%', resize: 'vertical', minHeight: '5rem', padding: '0.625rem 0.875rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.375rem', color: 'var(--cream)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', lineHeight: 1.6 }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleClientCounter}
                        disabled={!counterDate || !counterSlot || !counterNote.trim() || acting}
                        className="btn-primary"
                        style={{ fontSize: '0.8125rem', padding: '0.6rem 1.25rem', opacity: (!counterDate || !counterSlot || !counterNote.trim() || acting) ? 0.4 : 1 }}
                      >
                        <span>{acting ? 'Sending…' : 'Send proposal'}</span>
                      </button>
                      <button
                        onClick={() => { setMode('view'); setCounterDate(null); setCounterSlot(null); setCounterNote(''); }}
                        className="btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '0.6rem 1.25rem' }}
                      >
                        Go back
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Design details */}
              {(booking.tattoo_placement || booking.design_notes) && (
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <h2 style={{
                      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
                      fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', margin: '0 0 1.25rem',
                    }}>
                      Design Details
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {booking.tattoo_placement && (
                        <div>
                          <p style={label}>Placement</p>
                          <p style={value}>{booking.tattoo_placement}</p>
                        </div>
                      )}
                      {booking.design_notes && (
                        <div>
                          <p style={label}>Description</p>
                          <p style={{ ...value, color: 'var(--text)', lineHeight: 1.7 }}>{booking.design_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Design references */}
              {booking.design_ideas && booking.design_ideas.length > 0 && (
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <h2 style={{
                      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
                      fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', margin: '0 0 1.25rem',
                    }}>
                      Design References
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {booking.design_ideas.map((idea) => (
                        <div key={idea.design_idea_id} style={{ borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--surface)' }}>
                          <div style={{ width: '100%', height: '9rem', overflow: 'hidden' }}>
                            <img src={idea.image_url} alt="Design reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          {idea.description && (
                            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem', color: 'var(--text-mid)', padding: '0.5rem 0.75rem', margin: 0 }}>
                              {idea.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message thread */}
              {booking.appointment_status !== 'cancelled' && (
                <div className="card-premium">
                  <div className="card-premium-inner" id="messages">
                    <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', margin: '0 0 1.25rem' }}>
                      Messages
                    </h2>
                    <div
                      ref={msgAreaRef}
                      style={{ height: '16rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'rgba(14,12,9,0.4)', border: '1px solid var(--border)', borderRadius: '0.5rem', marginBottom: '0.875rem' }}
                    >
                      {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', paddingTop: '3.5rem' }}>
                          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-mid)', marginBottom: '0.25rem' }}>
                            Start the conversation
                          </p>
                          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', margin: 0 }}>
                            Send a message to {booking.artist?.name ?? 'your artist'} about this booking.
                          </p>
                        </div>
                      ) : (
                        messages.map((msg, i) => {
                          const isClient = msg.sender_type === 'client';
                          const prev = messages[i - 1];
                          const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <p style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.5rem 0' }}>
                                  {new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                              )}
                              <div style={{ display: 'flex', justifyContent: isClient ? 'flex-end' : 'flex-start' }}>
                                <div style={{ maxWidth: '75%', padding: '0.625rem 0.875rem', borderRadius: isClient ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', background: isClient ? 'rgba(201,168,76,0.13)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isClient ? 'rgba(201,168,76,0.3)' : 'var(--border)'}` }}>
                                  <p style={{ margin: 0, fontSize: '0.875rem', color: isClient ? 'var(--cream)' : 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>{msg.body}</p>
                                  <p style={{ margin: '0.2rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.06em', color: isClient ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', textAlign: isClient ? 'right' : 'left' }}>
                                    {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {msgError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--error-text)' }}>{msgError}</p>}
                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                      <textarea
                        value={msgDraft}
                        onChange={(e) => setMsgDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Write a message… (Enter to send)"
                        rows={2}
                        style={{ flex: 1, resize: 'none', padding: '0.625rem 0.875rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, fontFamily: '"DM Sans", sans-serif', outline: 'none' }}
                        onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!msgDraft.trim() || msgSending}
                        className="btn-primary"
                        style={{ padding: '0.625rem 1rem', flexShrink: 0, opacity: (!msgDraft.trim() || msgSending) ? 0.5 : 1, cursor: (!msgDraft.trim() || msgSending) ? 'default' : 'pointer' }}
                      >
                        {msgSending ? '…' : '→'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Aftercare — shown only for completed bookings */}
              {booking.appointment_status === 'completed' && (
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', margin: '0 0 1.25rem' }}>
                      Aftercare Guide
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {[
                        { step: '01', title: 'First 2–4 hours', body: 'Keep the wrap on. When you remove it, wash gently with clean hands using unscented antibacterial soap. Pat dry with a clean paper towel — never rub.' },
                        { step: '02', title: 'Days 1–14', body: 'Apply a thin layer of unscented moisturiser (Hustle Butter or plain Lubriderm) 2–3 times daily. Keep it moisturised but never soaked.' },
                        { step: '03', title: 'What to avoid', body: 'No sun exposure, swimming, soaking in baths or hot tubs. Do not pick, scratch, or peel the healing skin — let it flake off naturally.' },
                        { step: '04', title: 'Healing timeline', body: 'Surface skin heals in 2–4 weeks. Full dermal healing takes 3–6 months. Use SPF 50+ on the tattoo permanently once healed.' },
                      ].map(({ step, title, body }) => (
                        <div key={step} style={{ display: 'flex', gap: '1rem' }}>
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.45)', flexShrink: 0, paddingTop: '0.2rem' }}>{step}</span>
                          <div>
                            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--cream)', margin: '0 0 0.25rem' }}>{title}</p>
                            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>{body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '1.5rem', padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '0.5rem' }}>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--error-text)', margin: '0 0 0.375rem' }}>Seek advice if you notice</p>
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8375rem', color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
                        Excessive redness or swelling beyond day 3, hot to the touch, oozing pus, fever, or a raised rash spreading outward from the tattoo.
                      </p>
                    </div>
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8375rem', color: 'var(--text-mid)', lineHeight: 1.65, marginTop: '1.25rem', marginBottom: 0 }}>
                      Touch-ups are complimentary within 3 months of your session, provided aftercare guidelines were followed.
                      Message your artist to arrange a top-up appointment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '8rem' }}>

              {/* Artist */}
              {booking.artist && (
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <p style={label}>Your artist</p>
                    <h3 style={{
                      fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
                      fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)',
                      margin: '0.35rem 0 0.5rem',
                    }}>
                      {booking.artist.name}
                    </h3>
                    {booking.artist.specialties && (
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-mid)', marginBottom: '0.75rem' }}>
                        {booking.artist.specialties}
                      </p>
                    )}
                    {booking.artist.bio && (
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.65, marginBottom: '1rem' }}>
                        {booking.artist.bio}
                      </p>
                    )}
                    {booking.artist.instagram_handle && (
                      <a
                        href={`https://instagram.com/${booking.artist.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--gold)', textDecoration: 'none' }}
                      >
                        @{booking.artist.instagram_handle}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className="card-premium">
                <div className="card-premium-inner">
                  <p style={{ ...label, marginBottom: '1rem' }}>Payment</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)' }}>Deposit</span>
                      <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: 500, color: booking.appointment_status === 'cancelled' ? 'rgba(252,165,165,0.7)' : 'var(--cream)' }}>
                        {booking.deposit_price ? `£${booking.deposit_price}` : '—'}
                        {booking.appointment_status === 'cancelled' && (
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--error-text)', marginLeft: '0.4rem' }}>
                            forfeited
                          </span>
                        )}
                      </span>
                    </div>
                    {booking.final_price ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)' }}>Final payment</span>
                          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--cream)' }}>£{booking.final_price}</span>
                        </div>
                        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--cream)' }}>Total</span>
                          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 400, color: 'var(--gold)' }}>
                            £{Number(booking.deposit_price) + Number(booking.final_price)}
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>
                  {booking.deposit_price === 0 || !booking.deposit_price ? (
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', marginTop: '0.75rem' }}>
                      Deposit details will be confirmed by your artist.
                    </p>
                  ) : null}

                  {/* Payment method preference */}
                  {booking.appointment_status !== 'cancelled' && booking.appointment_status !== 'completed' && (
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <p style={{ ...label, marginBottom: '0.625rem' }}>How would you like to pay?</p>
                      {booking.payment_method === 'cash' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.375rem' }}>
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(34,197,94,0.8)' }}>
                              ✓ Cash on the day
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSetPaymentMethod('not_set')}
                            disabled={updatingPayment}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-low)', opacity: updatingPayment ? 0.5 : 1, textAlign: 'left' }}
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleSetPaymentMethod('cash')}
                            disabled={updatingPayment}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.375rem', cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--cream)', opacity: updatingPayment ? 0.5 : 1 }}
                          >
                            <span style={{ width: '0.875rem', height: '0.875rem', borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
                            Cash on the day
                          </button>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.375rem', opacity: 0.4 }}>
                            <span style={{ width: '0.875rem', height: '0.875rem', borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
                            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)' }}>Online by card</span>
                            <span style={{ marginLeft: 'auto', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-low)', padding: '0.1rem 0.4rem', border: '1px solid var(--border)', borderRadius: '0.25rem' }}>Soon</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price offer from artist */}
                  {booking.price_offer_status === 'offered' && (
                    <div style={{ marginTop: '1.25rem', padding: '1rem 1.125rem', background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.5rem' }}>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', margin: '0 0 0.375rem' }}>
                        Price offer from your artist
                      </p>
                      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 300, color: 'var(--cream)', margin: '0 0 0.5rem' }}>
                        £{booking.final_price || '—'}
                      </p>
                      {booking.price_offer_note && (
                        <blockquote style={{ margin: '0 0 1rem', padding: '0.5rem 0.875rem', borderLeft: '2px solid rgba(201,168,76,0.35)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.65 }}>
                          {booking.price_offer_note}
                        </blockquote>
                      )}
                      {priceAcceptError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--error-text)' }}>{priceAcceptError}</p>}
                      <button
                        onClick={handleAcceptPrice}
                        disabled={acceptingPrice}
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.7rem', opacity: acceptingPrice ? 0.6 : 1, cursor: acceptingPrice ? 'default' : 'pointer' }}
                      >
                        <span>{acceptingPrice ? 'Accepting…' : 'Accept price'}</span>
                      </button>
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem', color: 'var(--text-low)', marginTop: '0.625rem', lineHeight: 1.6 }}>
                        Have questions? Message your artist below.
                      </p>
                    </div>
                  )}
                  {booking.price_offer_status === 'accepted' && (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(34,197,94,0.7)' }}>Agreed price</span>
                      <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--cream)' }}>£{booking.final_price}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booked on */}
              <div style={{ padding: '0 0.25rem' }}>
                <p style={{ ...label, marginBottom: '0.25rem' }}>Booked on</p>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-mid)', margin: 0 }}>
                  {new Date(booking.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </ClientProtectedRoute>
  );
}
