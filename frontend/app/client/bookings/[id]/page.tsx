'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';
import { ClientProtectedRoute } from '@/lib/clientProtectedRoute';

interface Artist {
  id: string;
  name: string;
  specialties: string;
  bio: string;
  instagram_handle: string;
}

interface DesignIdea {
  id: string;
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
  estimated_duration: string;
  created_at: string;
  updated_at: string;
  artist: Artist | null;
  design_ideas: DesignIdea[];
}

function statusStyle(status: string): React.CSSProperties {
  if (status === 'confirmed') return { background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)' };
  if (status === 'pending_consent') return { background: 'rgba(201,168,76,0.08)', color: 'rgba(201,168,76,0.7)', border: '1px solid rgba(201,168,76,0.18)' };
  if (status === 'cancelled') return { background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' };
  return { background: 'rgba(154,144,130,0.12)', color: 'var(--text-mid)', border: '1px solid rgba(154,144,130,0.2)' };
}

const labelText: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.625rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-low)',
  marginBottom: '0.25rem',
};

export default function BookingDetailPage() {
  const params = useParams();
  const { accessToken } = useClientAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);

  const bookingId = params.id as string;

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) throw new Error('Failed to fetch booking');
        const data = await response.json();
        setBooking(data.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && bookingId) fetchBooking();
  }, [accessToken, bookingId]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCanceling(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ appointment_status: 'cancelled' }),
        }
      );
      if (!response.ok) throw new Error('Failed to cancel booking');
      const data = await response.json();
      setBooking(data.booking);
      alert('Booking cancelled successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCanceling(false);
    }
  };

  const wrap = (children: React.ReactNode) => (
    <ClientProtectedRoute>
      <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '8rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1rem' }}>
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
    <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem' }}>
      <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.9rem' }}>{error}</p>
    </div>
  );
  if (!booking) return wrap(
    <p style={{ color: 'var(--text-mid)' }}>Booking not found.</p>
  );

  return (
    <ClientProtectedRoute>
      <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '8rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1rem' }}>

          {/* Back link */}
          <Link
            href="/client/dashboard"
            style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}
          >
            ← Back to Dashboard
          </Link>

          {/* Page title */}
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.0, marginBottom: '0.375rem' }}>
            Booking Details
          </h1>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '3rem' }}>
            Ref: {booking.booking_reference}
          </p>

          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: '1.5rem', alignItems: 'start' }}>

              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Status card */}
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 400, color: 'var(--cream)', margin: 0 }}>
                        Status
                      </h2>
                      <span style={{
                        ...statusStyle(booking.appointment_status),
                        padding: '0.375rem 1rem',
                        borderRadius: '9999px',
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '0.625rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}>
                        {booking.appointment_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {booking.appointment_status !== 'cancelled' && (
                      <button
                        onClick={handleCancel}
                        disabled={canceling}
                        className="btn-secondary"
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem', opacity: canceling ? 0.5 : 1 }}
                      >
                        {canceling ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Appointment card */}
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '1.5rem' }}>
                      Appointment
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <p style={labelText}>Date</p>
                        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '1rem', color: 'var(--cream)', fontWeight: 500, margin: 0 }}>
                          {new Date(booking.appointment_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p style={labelText}>Time</p>
                        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '1rem', color: 'var(--cream)', fontWeight: 500, margin: 0 }}>
                          {booking.appointment_time}
                        </p>
                      </div>
                      {booking.estimated_duration && (
                        <div>
                          <p style={labelText}>Duration</p>
                          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '1rem', color: 'var(--cream)', fontWeight: 500, margin: 0 }}>
                            {booking.estimated_duration}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Design details */}
                {(booking.tattoo_placement || booking.design_notes) && (
                  <div className="card-premium">
                    <div className="card-premium-inner">
                      <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '1.5rem' }}>
                        Design Details
                      </h2>
                      {booking.tattoo_placement && (
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={labelText}>Placement</p>
                          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text)', margin: 0 }}>{booking.tattoo_placement}</p>
                        </div>
                      )}
                      {booking.design_notes && (
                        <div>
                          <p style={labelText}>Notes</p>
                          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text)', margin: 0 }}>{booking.design_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Design references */}
                {booking.design_ideas && booking.design_ideas.length > 0 && (
                  <div className="card-premium">
                    <div className="card-premium-inner">
                      <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '1.5rem' }}>
                        Design References
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {booking.design_ideas.map((idea) => (
                          <div key={idea.id} style={{ borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'var(--surface-2)' }}>
                            <div style={{ width: '100%', height: '8rem', backgroundColor: 'var(--surface)', overflow: 'hidden' }}>
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

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '8rem' }}>

                {/* Artist card */}
                {booking.artist && (
                  <div className="card-premium">
                    <div className="card-premium-inner">
                      <p style={labelText}>Your Artist</p>
                      <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', margin: '0.25rem 0 0.25rem' }}>
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
                          style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--gold)', textDecoration: 'none' }}
                        >
                          @{booking.artist.instagram_handle}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment card */}
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <p style={{ ...labelText, marginBottom: '1.25rem' }}>Payment</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)' }}>Deposit</span>
                        <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--cream)' }}>£{booking.deposit_price}</span>
                      </div>
                      {booking.final_price && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)' }}>Final Payment</span>
                            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--cream)' }}>£{booking.final_price}</span>
                          </div>
                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--cream)' }}>Total</span>
                            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 400, color: 'var(--gold)' }}>
                              £{booking.deposit_price + booking.final_price}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </ClientProtectedRoute>
  );
}
