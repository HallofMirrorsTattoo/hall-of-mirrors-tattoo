'use client';

import { useEffect, useState } from 'react';
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
}

type Mode = 'view' | 'cancel-confirm' | 'reschedule';

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
    return { background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' };
  return { background: 'rgba(154,144,130,0.1)', color: 'var(--text-mid)', border: '1px solid rgba(154,144,130,0.2)' };
}

const label: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.575rem',
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

  const bookingId = params.id as string;

  useEffect(() => {
    if (!accessToken || !bookingId) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch booking');
        const data = await res.json();
        setBooking(data.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken, bookingId]);

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
    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
      Loading...
    </p>
  );
  if (error) return wrap(
    <div style={{ padding: '1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem' }}>
      <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.9rem', fontFamily: '"DM Sans", sans-serif' }}>{error}</p>
    </div>
  );
  if (!booking) return wrap(<p style={{ color: 'var(--text-mid)' }}>Booking not found.</p>);

  const canAct = booking.appointment_status !== 'cancelled' && booking.appointment_status !== 'completed' && !isPast;
  const canReschedule = canAct && booking.appointment_status !== 'rescheduled';

  return (
    <ClientProtectedRoute>
      <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '8rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1.25rem' }}>

          {/* Back */}
          <Link href="/client/dashboard" style={{
            fontFamily: '"DM Mono", monospace', fontSize: '0.625rem', letterSpacing: '0.12em',
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
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)', margin: 0 }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: canAct ? '1.5rem' : 0 }}>
                    <div>
                      <p style={{ ...label, marginBottom: '0.4rem' }}>Status</p>
                      <span style={{
                        ...statusStyle(booking.appointment_status),
                        display: 'inline-block',
                        padding: '0.3rem 0.875rem',
                        borderRadius: '9999px',
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '0.6rem',
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

                  {/* Action buttons */}
                  {canAct && mode === 'view' && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {canReschedule && (
                        <button
                          onClick={() => setMode('reschedule')}
                          className="btn-primary"
                          style={{ fontSize: '0.8125rem', padding: '0.6rem 1.25rem' }}
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
                          fontFamily: '"DM Mono", monospace', fontSize: '0.6rem',
                          letterSpacing: '0.12em', textTransform: 'uppercase',
                          color: '#fca5a5', margin: '0 0 0.5rem',
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
                            color: '#fca5a5',
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
                          {' '}<strong style={{ color: '#fca5a5' }}>forfeit your deposit</strong>. You're welcome to reschedule the date,
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
                        style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.625rem', letterSpacing: '0.1em', color: 'var(--gold)', textDecoration: 'none' }}
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
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fca5a5', marginLeft: '0.4rem' }}>
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
