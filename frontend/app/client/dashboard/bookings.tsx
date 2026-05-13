'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
}

export default function BookingsTab() {
  const { accessToken } = useClientAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch bookings');

        const data = await response.json();
        setBookings(data.bookings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchBookings();
    }
  }, [accessToken]);

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'confirmed':
        return { background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)' };
      case 'pending_consent':
        return { background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.7)', border: '1px solid rgba(201,168,76,0.18)' };
      case 'cancelled':
        return { background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' };
      default:
        return { background: 'rgba(154,144,130,0.12)', color: 'var(--text-mid)', border: '1px solid rgba(154,144,130,0.2)' };
    }
  };

  if (loading) return <p>Loading your bookings...</p>;
  if (error) return <p style={{ color: '#fca5a5', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem' }}>{error}</p>;

  const activeStatuses = ['pending_consent', 'confirmed', 'rescheduled'];
  const activeBookings = bookings.filter(b => activeStatuses.includes(b.appointment_status));
  const pastBookings   = bookings.filter(b => !activeStatuses.includes(b.appointment_status));
  const [showPast, setShowPast] = useState(false);

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Link
      key={booking.id}
      href={`/client/bookings/${booking.id}`}
      className="card-premium hover:shadow-lg transition-shadow"
    >
      <div className="card-premium-inner">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-serif font-bold" style={{ color: 'var(--cream)' }}>
              {booking.artist_name || 'Robyn'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-low)' }}>Ref: {booking.booking_reference}</p>
          </div>
          <span
            style={{ ...getStatusStyle(booking.appointment_status), padding: '0.25rem 0.75rem', borderRadius: '9999px', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            {booking.appointment_status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="space-y-2 mb-4">
          <p className="text-sm" style={{ color: 'var(--text-mid)' }}>
            {new Date(booking.appointment_date).toLocaleDateString()}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-mid)' }}>
            {booking.appointment_time}
          </p>
        </div>
        <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-low)' }}>
            Deposit: £{booking.deposit_price}
            {booking.final_price && ` • Final: £${booking.final_price}`}
          </p>
        </div>
      </div>
    </Link>
  );

  return (
    <div>
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="mb-6" style={{ color: 'var(--text-mid)' }}>You don&apos;t have any bookings yet.</p>
          <Link href="/booking" className="btn-primary">
            <span>Book Your First Appointment</span>
            <span className="btn-icon" aria-hidden="true">↗</span>
          </Link>
        </div>
      ) : (
        <div>
          {/* Active bookings */}
          {activeBookings.length === 0 && (
            <p style={{ color: 'var(--text-mid)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>No upcoming bookings.</p>
          )}
          {activeBookings.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2" style={{ marginBottom: '2rem' }}>
              {activeBookings.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}

          {/* Past bookings — collapsed by default */}
          {pastBookings.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowPast(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', padding: '0.75rem 0', cursor: 'pointer', marginBottom: showPast ? '1rem' : 0, borderTop: '1px solid var(--border)', width: '100%', textAlign: 'left' }}
              >
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                  Past Bookings ({pastBookings.length})
                </span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'var(--text-low)', marginLeft: 'auto' }}>
                  {showPast ? '↑ Hide' : '↓ Show'}
                </span>
              </button>
              {showPast && (
                <div className="grid gap-6 md:grid-cols-2" style={{ opacity: 0.7 }}>
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
