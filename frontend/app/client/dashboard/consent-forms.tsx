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

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    pending_consent: { label: 'Needs signing', color: '#e8a020' },
    confirmed: { label: 'Confirmed', color: '#27ae60' },
    completed: { label: 'Completed', color: '#27ae60' },
    cancelled: { label: 'Cancelled', color: '#c0392b' },
  };
  const s = map[status] || { label: status, color: '#9A9082' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '0.25rem',
      fontSize: '0.7rem',
      fontFamily: '"DM Mono", monospace',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      background: `${s.color}18`,
      color: s.color,
      border: `1px solid ${s.color}40`,
    }}>
      {s.label}
    </span>
  );
}

export default function ConsentFormsTab() {
  const { accessToken } = useClientAuth();
  const [bookings, setBookings] = useState<BookingWithConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#f87171' }}>{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.75rem' }}>No bookings yet</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-mid)' }}>Your consent forms will appear here once you have a booking.</p>
      </div>
    );
  }

  const needsSigning = bookings.filter(b => !b.consent_form_id);
  const signed = bookings.filter(b => b.consent_form_id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {needsSigning.length > 0 && (
        <section>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            Action required
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {needsSigning.map((b) => (
              <div key={b.booking_id} style={{ padding: '1.25rem 1.5rem', background: 'var(--surface)', border: '1px solid rgba(232,160,32,0.3)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--gold)', opacity: 0.7 }}>{b.booking_reference}</p>
                    {statusBadge(b.appointment_status)}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--cream)', fontWeight: 500 }}>
                    {b.placement}{b.estimated_size ? ` — ${b.estimated_size}` : ''}
                  </p>
                  {b.appointment_date_time && (
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.8125rem', color: 'var(--text-mid)' }}>
                      {new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(b.appointment_date_time))}
                    </p>
                  )}
                </div>
                <Link href={`/client/consent/${b.booking_id}`} className="btn-primary" style={{ padding: '0.625rem 1.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' as const }}>
                  Sign consent form
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {signed.length > 0 && (
        <section>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            Signed forms
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {signed.map((b) => (
              <div key={b.booking_id} style={{ padding: '1.25rem 1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--gold)', opacity: 0.7 }}>{b.booking_reference}</p>
                    {statusBadge(b.appointment_status)}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--cream)', fontWeight: 500 }}>
                    {b.placement}{b.estimated_size ? ` — ${b.estimated_size}` : ''}
                  </p>
                  {b.date_signed && (
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.8125rem', color: 'var(--text-mid)' }}>
                      Signed {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(b.date_signed))}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>✓</span>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: '#27ae60' }}>SIGNED</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
