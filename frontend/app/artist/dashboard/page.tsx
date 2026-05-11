'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

interface Booking {
  id: string;
  booking_reference: string;
  appointment_date_time: string;
  tattoo_description: string;
  placement: string;
  estimated_size: string;
  appointment_status: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface Consultation {
  consultation_id: string;
  message: string;
  preferred_dates: string | null;
  status: string;
  artist_response: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
}

const labelStyle: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: 'rgba(201,168,76,0.5)',
  display: 'block',
  marginBottom: '0.25rem',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending_consent: { bg: 'rgba(234,179,8,0.12)', color: '#CA8A04', label: 'Pending consent' },
    confirmed: { bg: 'rgba(34,197,94,0.12)', color: '#16A34A', label: 'Confirmed' },
    completed: { bg: 'rgba(201,168,76,0.12)', color: 'var(--gold)', label: 'Completed' },
    cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#DC2626', label: 'Cancelled' },
    pending: { bg: 'rgba(234,179,8,0.12)', color: '#CA8A04', label: 'Pending' },
    responded: { bg: 'rgba(34,197,94,0.12)', color: '#16A34A', label: 'Responded' },
  };
  const s = map[status] || { bg: 'rgba(155,155,155,0.12)', color: 'var(--text-mid)', label: status };
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '2rem', background: s.bg, color: s.color, fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export default function ArtistDashboard() {
  const router = useRouter();
  const { artist, accessToken, logout, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<'bookings' | 'consultations'>('bookings');

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Consultations state
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const [consultationError, setConsultationError] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // wait for localStorage token to load
    if (!accessToken) {
      router.push('/artist/login');
      return;
    }
    fetchBookings();
    fetchConsultations();
  }, [accessToken, authLoading, router]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');
      setBookings(data.bookings || []);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/consultations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setConsultations(data.consultations || []);
    } catch {
      // non-critical
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string, notes: string) => {
    try {
      setIsUpdating(true);
      setBookingError('');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error('Failed to update booking');
      await fetchBookings();
      setSelectedBooking(null);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedConsultation || !responseText.trim()) return;
    setIsSendingResponse(true);
    setConsultationError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/consultations/${selectedConsultation.consultation_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ response_message: responseText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send response');
      setConsultations((prev) =>
        prev.map((c) =>
          c.consultation_id === selectedConsultation.consultation_id
            ? { ...c, status: 'responded', artist_response: responseText }
            : c
        )
      );
      setSelectedConsultation({ ...selectedConsultation, status: 'responded', artist_response: responseText });
      setResponseText('');
    } catch (err) {
      setConsultationError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setIsSendingResponse(false);
    }
  };

  const filteredBookings = bookings.filter((b) => statusFilter === 'all' || b.appointment_status === statusFilter);
  const pendingConsultations = consultations.filter((c) => c.status === 'pending').length;

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Loading</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(14,12,9,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 300, color: 'var(--cream)' }}>
            Hall of Mirrors
          </p>
          <p style={{ margin: '2px 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
            {artist?.full_name}
          </p>
        </div>
        <button
          onClick={() => { logout(); router.push('/artist/login'); }}
          style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)', background: 'none', border: '1px solid var(--border)', padding: '0.5rem 0.875rem', borderRadius: '2rem', cursor: 'pointer', transition: 'border-color 0.3s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          Sign out
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: '2.5rem' }}>
          {([
            { key: 'bookings', label: 'Bookings', badge: 0 },
            { key: 'consultations', label: 'Consultations', badge: pendingConsultations },
          ] as const).map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '0.875rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: tab === key ? '2px solid var(--gold)' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: '"DM Mono", monospace',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: tab === key ? 'var(--gold)' : 'var(--text-mid)',
                transition: 'color 0.3s ease',
                position: 'relative',
                marginBottom: '-1px',
              }}
            >
              {label}
              {badge > 0 && (
                <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', background: 'var(--gold)', color: 'var(--bg)', borderRadius: '2rem', fontSize: '0.55rem' }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings tab */}
        {tab === 'bookings' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedBooking ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
            <div>
              {/* Status filter */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['all', 'pending_consent', 'confirmed', 'completed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: '0.3rem 0.875rem',
                      borderRadius: '2rem',
                      border: `1px solid ${statusFilter === s ? 'var(--gold)' : 'var(--border)'}`,
                      background: statusFilter === s ? 'rgba(201,168,76,0.1)' : 'none',
                      color: statusFilter === s ? 'var(--gold)' : 'var(--text-mid)',
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '0.6rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {s === 'all' ? 'All' : s.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {bookingError && (
                <div style={{ padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#f87171' }}>{bookingError}</p>
                </div>
              )}

              {isLoading ? (
                <p style={{ ...labelStyle, opacity: 0.4, padding: '2rem 0' }}>Loading...</p>
              ) : filteredBookings.length === 0 ? (
                <p style={{ color: 'var(--text-low)', fontSize: '0.9rem', padding: '2rem 0' }}>No bookings found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredBookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        gap: '1rem',
                        width: '100%',
                        padding: '1.25rem 1.5rem',
                        background: selectedBooking?.id === booking.id ? 'rgba(201,168,76,0.06)' : 'var(--surface)',
                        border: `1px solid ${selectedBooking?.id === booking.id ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div>
                        <p style={{ margin: '0 0 0.25rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 300, color: 'var(--cream)' }}>
                          {booking.first_name} {booking.last_name}
                        </p>
                        <p style={{ margin: '0 0 0.375rem', fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--text-low)' }}>
                          {booking.booking_reference}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-mid)' }}>
                          {new Date(booking.appointment_date_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{booking.placement}
                        </p>
                      </div>
                      <StatusBadge status={booking.appointment_status} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Booking detail panel */}
            {selectedBooking && (
              <div style={{ position: 'sticky', top: '5rem', alignSelf: 'start', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 300, color: 'var(--cream)' }}>
                    Booking details
                  </h3>
                  <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
                  {[
                    { label: 'Client', value: `${selectedBooking.first_name} ${selectedBooking.last_name}` },
                    { label: 'Email', value: selectedBooking.email || '—' },
                    { label: 'Phone', value: selectedBooking.phone || '—' },
                    { label: 'Date', value: new Date(selectedBooking.appointment_date_time).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                    { label: 'Placement', value: selectedBooking.placement },
                    { label: 'Size', value: selectedBooking.estimated_size },
                    { label: 'Description', value: selectedBooking.tattoo_description },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span style={labelStyle}>{label}</span>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>{value}</p>
                    </div>
                  ))}
                </div>

                {selectedBooking.appointment_status !== 'confirmed' && selectedBooking.appointment_status !== 'completed' && selectedBooking.appointment_status !== 'cancelled' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed', '')}
                      disabled={isUpdating}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.75rem', opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'default' : 'pointer' }}
                    >
                      {isUpdating ? 'Updating...' : 'Accept booking'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled', '')}
                      disabled={isUpdating}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '0.75rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'default' : 'pointer' }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Consultations tab */}
        {tab === 'consultations' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedConsultation ? '1fr 400px' : '1fr', gap: '1.5rem' }}>
            <div>
              {consultationError && (
                <div style={{ padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#f87171' }}>{consultationError}</p>
                </div>
              )}

              {consultations.length === 0 ? (
                <p style={{ color: 'var(--text-low)', fontSize: '0.9rem', padding: '2rem 0' }}>No consultation requests yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {consultations.map((c) => (
                    <button
                      key={c.consultation_id}
                      onClick={() => {
                        setSelectedConsultation(selectedConsultation?.consultation_id === c.consultation_id ? null : c);
                        setResponseText('');
                        setConsultationError('');
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        gap: '1rem',
                        width: '100%',
                        padding: '1.25rem 1.5rem',
                        background: selectedConsultation?.consultation_id === c.consultation_id ? 'rgba(201,168,76,0.06)' : 'var(--surface)',
                        border: `1px solid ${selectedConsultation?.consultation_id === c.consultation_id ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div>
                        <p style={{ margin: '0 0 0.25rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 300, color: 'var(--cream)' }}>
                          {c.first_name} {c.last_name}
                        </p>
                        <p style={{ margin: '0 0 0.375rem', fontSize: '0.8125rem', color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                          {c.message}
                        </p>
                        <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--text-low)' }}>
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Consultation detail + response panel */}
            {selectedConsultation && (
              <div style={{ position: 'sticky', top: '5rem', alignSelf: 'start', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 300, color: 'var(--cream)' }}>
                    Consultation
                  </h3>
                  <button onClick={() => setSelectedConsultation(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
                  <div>
                    <span style={labelStyle}>Client</span>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)' }}>{selectedConsultation.first_name} {selectedConsultation.last_name}</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-mid)' }}>{selectedConsultation.email}</p>
                  </div>
                  <div>
                    <span style={labelStyle}>Message</span>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.7 }}>{selectedConsultation.message}</p>
                  </div>
                  {selectedConsultation.preferred_dates && (
                    <div>
                      <span style={labelStyle}>Preferred dates</span>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)' }}>{selectedConsultation.preferred_dates}</p>
                    </div>
                  )}
                  {selectedConsultation.artist_response && (
                    <div style={{ padding: '1rem', background: 'rgba(201,168,76,0.05)', borderLeft: '2px solid rgba(201,168,76,0.3)', borderRadius: '0 0.5rem 0.5rem 0' }}>
                      <span style={{ ...labelStyle, opacity: 0.8 }}>Your response</span>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.7 }}>{selectedConsultation.artist_response}</p>
                    </div>
                  )}
                </div>

                {selectedConsultation.status !== 'responded' && (
                  <div>
                    <span style={labelStyle}>Reply to {selectedConsultation.first_name}</span>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write your response..."
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        background: 'rgba(14,12,9,0.5)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        color: 'var(--cream)',
                        fontSize: '0.875rem',
                        lineHeight: 1.7,
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        marginBottom: '0.875rem',
                        fontFamily: '"DM Sans", sans-serif',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    />
                    {consultationError && (
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: '#f87171' }}>{consultationError}</p>
                    )}
                    <button
                      onClick={handleSendResponse}
                      disabled={isSendingResponse || !responseText.trim()}
                      className="btn-primary"
                      style={{ width: '100%', padding: '0.75rem', opacity: (isSendingResponse || !responseText.trim()) ? 0.5 : 1, cursor: (isSendingResponse || !responseText.trim()) ? 'default' : 'pointer' }}
                    >
                      {isSendingResponse ? 'Sending...' : 'Send response'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
