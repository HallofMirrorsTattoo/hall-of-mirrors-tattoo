'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';

interface BookingWithConsent {
  booking_id: string;
  booking_reference: string;
  appointment_date_time: string;
  placement: string;
  appointment_status: string;
  estimated_size: string;
  artist_name: string;
  consent_form_id: string | null;
  form_reference_no: string | null;
  form_status: string | null;
  date_signed: string | null;
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}

function fmtShortDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}

const eyebrow: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.72rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: 'var(--text-low)',
  marginBottom: '1rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid var(--border)',
};

export default function ConsentFormsTab() {
  const { accessToken } = useClientAuth();
  const [bookings, setBookings] = useState<BookingWithConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/consent`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (res.ok) setBookings(data.bookings || []);
        else setError(data.error || 'Failed to load');
      } catch {
        setError('Failed to load consent forms');
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  if (loading) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Loading</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--error-text)' }}>{error}</p>
      </div>
    );
  }

  const now = new Date();

  // "Action required": awaiting signature on an active (non-cancelled) booking
  const needsSigning = bookings.filter(
    b => !b.consent_form_id && b.appointment_status === 'pending_consent'
  );

  // Signed forms — split upcoming vs past sessions
  const signedBookings = bookings.filter(b => !!b.consent_form_id);
  const upcomingSigned = signedBookings.filter(
    b => b.appointment_date_time && new Date(b.appointment_date_time) >= now
  );
  const pastSigned = signedBookings.filter(
    b => b.appointment_date_time && new Date(b.appointment_date_time) < now
  );

  const hasAnything = needsSigning.length > 0 || signedBookings.length > 0;

  if (!hasAnything) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Documents</p>
          <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
            Consent Forms
          </h2>
        </div>
        <div style={{ padding: '3rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', textAlign: 'center' }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.75rem' }}>Nothing here yet</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', margin: 0 }}>
            Your consent forms will appear here once a booking is confirmed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Documents</p>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0 }}>
          Consent Forms
        </h2>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6, marginTop: '0.5rem' }}>
          Required before each session. Your details are kept securely on file.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* ── Action required ─────────────────────────────────────────────── */}
        {needsSigning.length > 0 && (
          <section>
            <p style={eyebrow}>Action required</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {needsSigning.map((b) => (
                <div
                  key={b.booking_id}
                  style={{
                    padding: '1.25rem 1.5rem',
                    background: 'rgba(232,160,32,0.04)',
                    border: '1px solid rgba(232,160,32,0.3)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap' as const,
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 0.35rem', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'rgba(232,160,32,0.7)' }}>
                      {b.booking_reference}
                    </p>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', color: 'var(--cream)', fontWeight: 500 }}>
                      {b.placement}{b.estimated_size ? ` · ${b.estimated_size}` : ''}
                    </p>
                    {b.appointment_date_time && (
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-mid)' }}>
                        {fmtDate(b.appointment_date_time)}
                        {b.artist_name ? ` · ${b.artist_name}` : ''}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/client/consent/${b.booking_id}`}
                    className="btn-primary"
                    style={{ padding: '0.625rem 1.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' as const }}
                  >
                    Sign form →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming signed ─────────────────────────────────────────────── */}
        {upcomingSigned.length > 0 && (
          <section>
            <p style={eyebrow}>Upcoming appointments</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingSigned.map((b) => (
                <ConsentCard key={b.booking_id} b={b} />
              ))}
            </div>
          </section>
        )}

        {/* ── Past sessions (collapsible) ─────────────────────────────────── */}
        {pastSigned.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setShowPast(p => !p)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                padding: '0 0 0.75rem',
                marginBottom: '1rem',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: 'var(--text-low)' }}>
                Past sessions ({pastSigned.length})
              </span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: 'var(--text-low)', opacity: 0.6 }}>
                {showPast ? '↑ Hide' : '↓ Show'}
              </span>
            </button>
            {showPast && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.75 }}>
                {pastSigned.map((b) => (
                  <ConsentCard key={b.booking_id} b={b} />
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

function ConsentCard({ b }: { b: BookingWithConsent }) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap' as const,
      }}
    >
      <div>
        <p style={{ margin: '0 0 0.35rem', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.5)' }}>
          {b.booking_reference}
        </p>
        <p style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', color: 'var(--cream)', fontWeight: 500 }}>
          {b.placement}{b.estimated_size ? ` · ${b.estimated_size}` : ''}
        </p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-mid)' }}>
          {b.appointment_date_time ? (
            <>
              {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(b.appointment_date_time))}
              {b.artist_name ? ` · ${b.artist_name}` : ''}
            </>
          ) : null}
          {b.date_signed && (
            <span style={{ display: 'block', marginTop: '0.15rem', fontSize: '0.75rem', color: 'var(--text-low)' }}>
              Signed {fmtShortDate(b.date_signed)}
            </span>
          )}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
        <span style={{ color: '#27ae60', fontSize: '1rem' }}>✓</span>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', color: '#27ae60' }}>
          SIGNED
        </span>
      </div>
    </div>
  );
}
