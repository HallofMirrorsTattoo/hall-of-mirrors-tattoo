'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/lib/clientAuthContext';

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

interface Props {
  onBadgeUpdate?: (count: number) => void;
}

function daysUntil(isoDate: string): number {
  const appt = new Date(isoDate);
  appt.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((appt.getTime() - today.getTime()) / 86_400_000);
}

export default function BookingsTab({ onBadgeUpdate }: Props) {
  const { accessToken } = useClientAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        const list: Booking[] = data.bookings || [];
        setBookings(list);
        // badge = counter_offered bookings where artist sent the offer (client needs to respond)
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
    if (accessToken) fetchBookings();
  }, [accessToken, onBadgeUpdate]);

  const getStatusStyle = (status: string): React.CSSProperties => {
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
  };

  if (loading) return (
    <div style={{ padding: '3rem 0', textAlign: 'center' }}>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Loading</p>
    </div>
  );
  if (error) return <p style={{ color: 'var(--error-text)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem' }}>{error}</p>;

  const activeStatuses = ['pending_consent', 'confirmed', 'rescheduled', 'counter_offered'];
  const activeBookings = bookings.filter(b => activeStatuses.includes(b.appointment_status));
  const pastBookings = bookings.filter(b => !activeStatuses.includes(b.appointment_status));

  const CountdownStrip = ({ booking }: { booking: Booking }) => {
    const days = daysUntil(booking.appointment_date);
    const isActive = ['confirmed', 'pending_consent'].includes(booking.appointment_status);
    if (!isActive || days < 0) return null;

    let text = '';
    let urgency: 'today' | 'soon' | 'normal' = 'normal';
    if (days === 0) { text = 'Your session is today'; urgency = 'today'; }
    else if (days === 1) { text = 'Your session is tomorrow'; urgency = 'soon'; }
    else if (days <= 7) { text = `Your session is in ${days} days`; urgency = 'soon'; }
    else { text = `Your session is in ${days} days`; }

    const colors = {
      today: { bg: 'rgba(201,168,76,0.14)', border: 'rgba(201,168,76,0.45)', color: 'var(--gold)' },
      soon:  { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.25)', color: 'rgba(201,168,76,0.8)' },
      normal:{ bg: 'rgba(154,144,130,0.07)', border: 'var(--border)', color: 'var(--text-mid)' },
    }[urgency];

    return (
      <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.875rem', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.color }}>
          {urgency === 'today' ? '◆ ' : '◇ '}{text}
        </span>
      </div>
    );
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const router = useRouter();
    const needsResponse = booking.appointment_status === 'counter_offered' && booking.counter_offered_by === 'artist';
    const needsConsent = booking.appointment_status === 'pending_consent' && !booking.consent_form_signed;
    const isPast = ['completed', 'cancelled'].includes(booking.appointment_status);

    return (
      <div>
        <CountdownStrip booking={booking} />
        <div className="card-premium" style={{ cursor: 'pointer' }} onClick={() => router.push(`/client/bookings/${booking.id}`)}>
          <div className="card-premium-inner">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400, fontSize: '1.125rem', color: 'var(--cream)', margin: 0 }}>
                  {booking.artist_name || 'Robyn'}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-low)' }}>
                  {new Date(booking.appointment_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  {booking.appointment_time && ` · ${booking.appointment_time}`}
                </p>
              </div>
              <span style={{
                ...getStatusStyle(booking.appointment_status),
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontFamily: '"DM Mono", monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                {booking.appointment_status === 'pending_consent' ? 'Awaiting consent'
                  : booking.appointment_status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Consent form needed — navigates directly to consent form, not booking detail */}
            {needsConsent && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); router.push(`/client/consent/${booking.id}`); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', width: '100%', margin: '0 0 0.75rem', padding: '0.625rem 0.875rem', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.35)', borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.85)' }}>
                  Action required — sign your consent form
                </span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', color: 'rgba(201,168,76,0.85)', flexShrink: 0 }}>→</span>
              </button>
            )}

            {/* Counter-offer response needed */}
            {needsResponse && (
              <div style={{ margin: '0 0 0.75rem', padding: '0.625rem 0.875rem', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '0.5rem' }}>
                <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                  Robyn has proposed a new time — tap to respond
                </p>
              </div>
            )}

            {booking.appointment_status === 'counter_offered' && booking.counter_offered_by === 'client' && (
              <div style={{ margin: '0 0 0.75rem', padding: '0.625rem 0.875rem', background: 'rgba(154,144,130,0.08)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>
                  Awaiting Robyn&apos;s response
                </p>
              </div>
            )}

            {booking.consent_form_signed && !isPast && (
              <div style={{ margin: '0 0 0.75rem', padding: '0.375rem 0.75rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.375rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(34,197,94,0.75)' }}>
                  ✓ Consent form signed
                </span>
              </div>
            )}

            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="text-xs" style={{ color: 'var(--text-low)', margin: 0 }}>
                Ref: {booking.booking_reference}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-low)', margin: 0 }}>
                View full booking →
              </p>
            </div>
          </div>
        </div>

        {/* Rebook CTA for completed past sessions */}
        {booking.appointment_status === 'completed' && (
          <div style={{ marginTop: '0.625rem' }}>
            <Link
              href="/booking"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: '0.5rem',
                fontFamily: '"DM Mono", monospace',
                fontSize: '0.72rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.7)',
                textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s',
              }}
            >
              Book another session →
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {bookings.length === 0 ? (
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
      ) : (
        <div>
          {/* Active bookings */}
          {activeBookings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 0', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '1rem' }}>
                No upcoming bookings
              </p>
              <Link href="/booking" className="btn-primary" style={{ display: 'inline-flex' }}>
                <span>Book a session</span>
                <span className="btn-icon" aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
          {activeBookings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              {activeBookings.map(b => <BookingCard key={b.id} booking={b} />)}
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
                  background: 'none', border: 'none', padding: '0.75rem 0',
                  cursor: 'pointer', borderTop: '1px solid var(--border)',
                  width: '100%', textAlign: 'left',
                  marginBottom: showPast ? '1rem' : 0,
                }}
              >
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                  Past sessions ({pastBookings.length})
                </span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'var(--text-low)', marginLeft: 'auto' }}>
                  {showPast ? '↑ Hide' : '↓ Show'}
                </span>
              </button>
              {showPast && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: 0.75 }}>
                  {pastBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
