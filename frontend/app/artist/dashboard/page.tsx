'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

// ── Availability types ────────────────────────────────────────────────────────

// Must match 1-hour slot format used by availabilityController.ts
const TIME_SLOTS = [
  { id: '09:00', label: '9am' },
  { id: '10:00', label: '10am' },
  { id: '11:00', label: '11am' },
  { id: '12:00', label: '12pm' },
  { id: '13:00', label: '1pm' },
  { id: '14:00', label: '2pm' },
  { id: '15:00', label: '3pm' },
  { id: '16:00', label: '4pm' },
  { id: '17:00', label: '5pm' },
  { id: '18:00', label: '6pm' },
  { id: '19:00', label: '7pm' },
  { id: '20:00', label: '8pm' },
];

// ── Calendar constants ─────────────────────────────────────────────────────────

const CAL_HOURS = Array.from({ length: 12 }, (_, i) => 9 + i); // 9 to 20
const HOUR_PX = 48;

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtH(h: number): string {
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}
function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

interface AvailabilityBlock {
  id: string;
  blocked_date: string;
  blocked_slot: string | null;
  reason: string | null;
}

interface AvailabilityResponse {
  blockedDays: string[];
  slotData: Record<string, { blocked: string[]; booked: string[] }>;
  blocks: AvailabilityBlock[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Booking {
  id: string;
  booking_reference: string;
  appointment_date_time: string;
  appointment_time?: string;
  estimated_duration_minutes?: number;
  notify_end_time?: boolean;
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
    confirmed:       { bg: 'rgba(34,197,94,0.12)',  color: '#16A34A', label: 'Confirmed' },
    completed:       { bg: 'rgba(201,168,76,0.12)', color: 'var(--gold)', label: 'Completed' },
    cancelled:       { bg: 'rgba(239,68,68,0.12)',  color: '#DC2626', label: 'Cancelled' },
    rescheduled:     { bg: 'rgba(99,102,241,0.12)', color: '#818CF8', label: 'Rescheduled' },
    pending:         { bg: 'rgba(234,179,8,0.12)',  color: '#CA8A04', label: 'Pending' },
    responded:       { bg: 'rgba(34,197,94,0.12)',  color: '#16A34A', label: 'Responded' },
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
  const [tab, setTab] = useState<'bookings' | 'calendar' | 'consultations' | 'availability' | 'messages'>('bookings');

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Confirm-booking form state (duration + notify)
  const [confirmDurationHours, setConfirmDurationHours] = useState(2);
  const [confirmNotifyEnd, setConfirmNotifyEnd] = useState(true);

  // Consultations state
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const [consultationError, setConsultationError] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  // Messages state
  interface MsgThread { id: string; booking_reference: string; appointment_date_time: string; appointment_status: string; first_name: string; last_name: string; client_email: string; total_messages: number; unread_count: number; last_message_body: string | null; last_message_sender: string | null; last_message_at: string | null; }
  interface Msg { id: string; booking_id: string; sender_type: 'client' | 'artist'; body: string; created_at: string; }
  const [msgThreads, setMsgThreads] = useState<MsgThread[]>([]);
  const [msgThreadsLoading, setMsgThreadsLoading] = useState(false);
  const [selectedMsgBooking, setSelectedMsgBooking] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [msgDraft, setMsgDraft] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');
  const msgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgAreaRef = useRef<HTMLDivElement>(null);
  const msgUnreadTotal = msgThreads.reduce((s, t) => s + (t.unread_count || 0), 0);

  // Calendar state
  const [calWeekStart, setCalWeekStart] = useState<Date>(() => getMonday(new Date()));
  const calPrevWeek = () => setCalWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const calNextWeek = () => setCalWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const calGoToday = () => setCalWeekStart(getMonday(new Date()));

  // Availability state
  const today = new Date();
  const [avYear, setAvYear]         = useState(today.getFullYear());
  const [avMonth, setAvMonth]       = useState(today.getMonth());
  const [avData, setAvData]         = useState<AvailabilityResponse | null>(null);
  const [avLoading, setAvLoading]   = useState(false);
  const [avError, setAvError]       = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isBlocking, setIsBlocking]   = useState(false);

  const avMonthKey = `${avYear}-${String(avMonth + 1).padStart(2, '0')}`;

  const fetchAvailability = useCallback(async () => {
    if (!artist?.id || !accessToken) return;
    setAvLoading(true);
    setAvError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/availability/${artist.id}?month=${avMonthKey}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error('Failed to load availability');
      const data = await res.json();
      setAvData(data);
    } catch (e) {
      setAvError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setAvLoading(false);
    }
  }, [artist?.id, accessToken, avMonthKey]);

  const avPrevMonth = () => {
    const now = new Date();
    const canGo = avYear > now.getFullYear() || (avYear === now.getFullYear() && avMonth > now.getMonth());
    if (!canGo) return;
    if (avMonth === 0) { setAvMonth(11); setAvYear((y) => y - 1); }
    else setAvMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const avNextMonth = () => {
    if (avMonth === 11) { setAvMonth(0); setAvYear((y) => y + 1); }
    else setAvMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const blockSlot = async (date: string, slot: string | null) => {
    if (!accessToken) return;
    setIsBlocking(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/availability/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ date, slot }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to block');
      }
      await fetchAvailability();
    } catch (e) {
      setAvError(e instanceof Error ? e.message : 'Failed to block');
    } finally {
      setIsBlocking(false);
    }
  };

  const unblockSlot = async (blockId: string) => {
    if (!accessToken) return;
    setIsBlocking(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/availability/block/${blockId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to unblock');
      await fetchAvailability();
    } catch (e) {
      setAvError(e instanceof Error ? e.message : 'Failed to unblock');
    } finally {
      setIsBlocking(false);
    }
  };

  useEffect(() => {
    if (tab === 'availability' && artist?.id && accessToken) {
      fetchAvailability();
    }
  }, [tab, fetchAvailability]);

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

  const fetchMsgThreads = useCallback(async () => {
    if (!accessToken) return;
    setMsgThreadsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setMsgThreads(data.threads || []);
    } catch { /* non-critical */ }
    finally { setMsgThreadsLoading(false); }
  }, [accessToken]);

  const fetchMsgs = useCallback(async (bookingId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/messages/${bookingId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) { setMsgs(data.messages || []); fetchMsgThreads(); }
    } catch { /* non-critical */ }
  }, [accessToken, fetchMsgThreads]);

  useEffect(() => {
    if (tab === 'messages' && accessToken) fetchMsgThreads();
  }, [tab, fetchMsgThreads, accessToken]);

  useEffect(() => {
    if (msgPollRef.current) clearInterval(msgPollRef.current);
    if (!selectedMsgBooking) return;
    fetchMsgs(selectedMsgBooking);
    msgPollRef.current = setInterval(() => fetchMsgs(selectedMsgBooking), 30_000);
    return () => { if (msgPollRef.current) clearInterval(msgPollRef.current); };
  }, [selectedMsgBooking, fetchMsgs]);

  useEffect(() => {
    const el = msgAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const sendArtistMsg = async () => {
    if (!msgDraft.trim() || !selectedMsgBooking || msgSending) return;
    setMsgSending(true);
    setMsgError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/messages/${selectedMsgBooking}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: msgDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setMsgs((prev) => [...prev, data.message]);
      setMsgDraft('');
      fetchMsgThreads();
    } catch (e) {
      setMsgError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setMsgSending(false);
    }
  };

  const handleStatusUpdate = async (
    bookingId: string,
    status: string,
    notes: string,
    opts?: { duration_hours?: number; notify_end_time?: boolean }
  ) => {
    try {
      setIsUpdating(true);
      setBookingError('');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status, notes, ...opts }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update booking');
      }
      await fetchBookings();
      setSelectedBooking(null);
      setConfirmDurationHours(2);
      setConfirmNotifyEnd(true);
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

  // ── Calendar derived data ───────────────────────────────────────────────────
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(calWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekDayStrs = weekDays.map(toDateStr);
  const weekBookings = bookings.filter((b) => {
    const ds = b.appointment_date_time.substring(0, 10);
    return weekDayStrs.includes(ds) && b.appointment_status !== 'cancelled';
  });

  const CAL_STATUS: Record<string, { bg: string; border: string; color: string }> = {
    pending_consent: { bg: 'rgba(234,179,8,0.18)', border: 'rgba(234,179,8,0.45)', color: '#EAB308' },
    confirmed:       { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#16A34A' },
    completed:       { bg: 'rgba(201,168,76,0.15)', border: 'rgba(201,168,76,0.4)', color: 'var(--gold)' },
    rescheduled:     { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', color: '#818CF8' },
  };

  // ── Booking detail panel (shared between Bookings + Calendar tabs) ──────────
  const renderBookingDetailPanel = (extraStyle?: React.CSSProperties) => {
    if (!selectedBooking) return null;
    return (
      <div style={{ position: 'sticky', top: '5rem', alignSelf: 'start', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.75rem', ...extraStyle }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 300, color: 'var(--cream)' }}>
            Booking details
          </h3>
          <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div>
            <span style={labelStyle}>Requested date</span>
            <p style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.0625rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.4 }}>
              {new Date(selectedBooking.appointment_date_time).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {selectedBooking.appointment_time && (() => {
              const h = parseInt(selectedBooking.appointment_time.substring(0, 2), 10);
              return (
                <p style={{ margin: '0.25rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--gold)' }}>
                  Starting {fmtH(h)}
                </p>
              );
            })()}
            {selectedBooking.appointment_status === 'confirmed' && selectedBooking.appointment_time && selectedBooking.estimated_duration_minutes && (() => {
              const startH = parseInt(selectedBooking.appointment_time.substring(0, 2), 10);
              const endH = startH + Math.round(selectedBooking.estimated_duration_minutes / 60);
              return (
                <p style={{ margin: '0.25rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.575rem', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.5)' }}>
                  Confirmed session: {fmtH(startH)} → {fmtH(endH)} ({Math.round(selectedBooking.estimated_duration_minutes / 60)}h)
                  {selectedBooking.notify_end_time === false && ' · finish time hidden from client'}
                </p>
              );
            })()}
          </div>

          {[
            { label: 'Client', value: `${selectedBooking.first_name} ${selectedBooking.last_name}` },
            { label: 'Email', value: selectedBooking.email || '—' },
            { label: 'Phone', value: selectedBooking.phone || '—' },
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.575rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', display: 'block', marginBottom: '0.5rem' }}>
                Session duration
              </span>
              <select
                value={confirmDurationHours}
                onChange={(e) => setConfirmDurationHours(Number(e.target.value))}
                style={{ width: '100%' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                ))}
              </select>
              {selectedBooking.appointment_time && (
                (() => {
                  const startH = parseInt(selectedBooking.appointment_time.substring(0, 2), 10);
                  const endH = startH + confirmDurationHours;
                  return (
                    <p style={{ margin: '0.5rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.55)' }}>
                      Session: {fmtH(startH)} → {fmtH(endH)}
                    </p>
                  );
                })()
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={confirmNotifyEnd}
                onChange={(e) => setConfirmNotifyEnd(e.target.checked)}
                style={{ accentColor: 'var(--gold)', width: '0.875rem', height: '0.875rem', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-mid)' }}>
                Tell client the finish time
              </span>
            </label>
            {!confirmNotifyEnd && (
              <p style={{ margin: '-0.375rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.08em', color: 'var(--text-low)' }}>
                Client sees start time only. Calendar still blocks the full session.
              </p>
            )}

            {bookingError && (
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#f87171' }}>{bookingError}</p>
            )}

            <button
              onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed', '', {
                duration_hours: confirmDurationHours,
                notify_end_time: confirmNotifyEnd,
              })}
              disabled={isUpdating}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'default' : 'pointer' }}
            >
              {isUpdating ? 'Confirming…' : 'Confirm & Schedule'}
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
    );
  };

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

        {/* ── Upcoming appointment hub ───────────────────────────────────────── */}
        {(() => {
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const upcoming = bookings
            .filter((b) => b.appointment_status === 'confirmed' && b.appointment_date_time >= todayStr)
            .sort((a, b) => a.appointment_date_time.localeCompare(b.appointment_date_time));
          if (upcoming.length === 0) return null;
          const next = upcoming[0];
          const nextDate = next.appointment_date_time.substring(0, 10);
          const isToday = nextDate === todayStr;
          const startHour = next.appointment_time ? parseInt(next.appointment_time.substring(0, 2), 10) : null;
          const endHour = startHour !== null && next.estimated_duration_minutes
            ? startHour + Math.round(next.estimated_duration_minutes / 60)
            : null;
          const fmtHour = (h: number) => h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
          const todayCount = upcoming.filter((b) => b.appointment_date_time.substring(0, 10) === todayStr).length;
          return (
            <div style={{
              marginBottom: '2rem',
              padding: '1rem 1.5rem',
              background: isToday ? 'rgba(201,168,76,0.07)' : 'var(--surface)',
              border: `1px solid ${isToday ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: isToday ? 'var(--gold)' : 'rgba(201,168,76,0.5)' }}>
                  {isToday ? `Today · ${todayCount} session${todayCount > 1 ? 's' : ''}` : 'Next session'}
                </span>
                <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.25rem', color: 'var(--cream)', lineHeight: 1.2 }}>
                  {next.first_name} {next.last_name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', flex: 1 }}>
                <div>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', display: 'block' }}>Date</span>
                  <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', fontWeight: isToday ? 500 : 400 }}>
                    {isToday ? 'Today' : new Date(nextDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {startHour !== null && (
                  <div>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', display: 'block' }}>Time</span>
                    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)' }}>
                      {fmtHour(startHour)}{endHour ? ` → ${fmtHour(endHour)}` : ''}
                    </span>
                  </div>
                )}
                {next.placement && (
                  <div>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', display: 'block' }}>Placement</span>
                    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)' }}>{next.placement}</span>
                  </div>
                )}
                {next.estimated_duration_minutes && (
                  <div>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', display: 'block' }}>Duration</span>
                    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)' }}>
                      {Math.round(next.estimated_duration_minutes / 60)}h
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setTab('bookings'); setSelectedBooking(next); }}
                style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', background: 'none', border: '1px solid rgba(201,168,76,0.3)', padding: '0.5rem 0.875rem', borderRadius: '2rem', cursor: 'pointer', transition: 'border-color 0.25s ease', flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
              >
                View →
              </button>
            </div>
          );
        })()}

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: '2.5rem' }}>
          {([
            { key: 'bookings', label: 'Bookings', badge: 0 },
            { key: 'calendar', label: 'Calendar', badge: 0 },
            { key: 'messages', label: 'Messages', badge: msgUnreadTotal },
            { key: 'consultations', label: 'Consultations', badge: pendingConsultations },
            { key: 'availability', label: 'Availability', badge: 0 },
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
                {['all', 'pending_consent', 'confirmed', 'rescheduled', 'completed', 'cancelled'].map((s) => (
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
                    {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
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
                  {filteredBookings.map((booking) => {
                    const isCancelled = booking.appointment_status === 'cancelled';
                    const isSelected = selectedBooking?.id === booking.id;
                    return (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBooking(isSelected ? null : booking)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          alignItems: 'center',
                          gap: '1rem',
                          width: '100%',
                          padding: '1.25rem 1.5rem',
                          background: isSelected ? 'rgba(201,168,76,0.06)' : 'var(--surface)',
                          border: `1px solid ${isSelected ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                          borderRadius: '0.75rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.3s ease',
                          opacity: isCancelled ? 0.5 : 1,
                        }}
                      >
                        <div>
                          <p style={{ margin: '0 0 0.25rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 300, color: isCancelled ? 'var(--text-mid)' : 'var(--cream)', textDecoration: isCancelled ? 'line-through' : 'none' }}>
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
                    );
                  })}
                </div>
              )}
            </div>

            {/* Booking detail panel */}
            {renderBookingDetailPanel()}
          </div>
        )}

        {/* ── Calendar tab ─────────────────────────────────────────────────── */}
        {tab === 'calendar' && (
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            {/* Calendar column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Week navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {[{ fn: calPrevWeek, icon: '←' }, { fn: calNextWeek, icon: '→' }].map(({ fn, icon }) => (
                    <button
                      type="button"
                      key={icon}
                      onClick={fn}
                      style={{ width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-mid)', fontSize: '0.875rem', transition: 'border-color 0.25s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >{icon}</button>
                  ))}
                </div>
                <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.125rem', color: 'var(--cream)', flex: 1 }}>
                  {(() => {
                    const end = new Date(calWeekStart);
                    end.setDate(end.getDate() + 6);
                    return `${calWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
                  })()}
                </span>
                <button
                  type="button"
                  onClick={calGoToday}
                  style={{ padding: '0.3rem 0.875rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'none', color: 'var(--text-mid)', fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mid)'; }}
                >Today</button>
              </div>

              {/* Calendar grid */}
              <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `52px repeat(7, minmax(80px, 1fr))`,
                  gridTemplateRows: `48px repeat(${CAL_HOURS.length}, ${HOUR_PX}px)`,
                  background: 'var(--surface)',
                  minWidth: '560px',
                  position: 'relative',
                }}>
                  {/* Top-left corner */}
                  <div style={{ gridColumn: 1, gridRow: 1, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />

                  {/* Day headers */}
                  {weekDays.map((day, di) => {
                    const ds = toDateStr(day);
                    const isToday = ds === toDateStr(new Date());
                    return (
                      <div key={ds} style={{
                        gridColumn: di + 2, gridRow: 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        borderBottom: '1px solid var(--border)',
                        borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                        padding: '0.5rem',
                        background: isToday ? 'rgba(201,168,76,0.04)' : 'transparent',
                      }}>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: isToday ? 'var(--gold)' : 'var(--text-low)' }}>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][di]}
                        </span>
                        <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--gold)' : 'var(--text)', marginTop: '0.125rem' }}>
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}

                  {/* Hour labels + background cells */}
                  {CAL_HOURS.map((hour, hi) => [
                    <div key={`lbl-${hour}`} style={{
                      gridColumn: 1, gridRow: hi + 2,
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                      paddingTop: '0.3rem', paddingRight: '0.5rem',
                      borderRight: '1px solid var(--border)',
                      borderBottom: hi < CAL_HOURS.length - 1 ? '1px solid rgba(42,37,32,0.6)' : 'none',
                    }}>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.06em', color: 'var(--text-low)', whiteSpace: 'nowrap' }}>
                        {fmtH(hour)}
                      </span>
                    </div>,
                    ...weekDays.map((day, di) => (
                      <div key={`cell-${hour}-${di}`} style={{
                        gridColumn: di + 2, gridRow: hi + 2,
                        borderRight: di < 6 ? '1px solid var(--border)' : 'none',
                        borderBottom: hi < CAL_HOURS.length - 1 ? '1px solid rgba(42,37,32,0.6)' : 'none',
                        background: toDateStr(day) === toDateStr(new Date()) ? 'rgba(201,168,76,0.018)' : 'transparent',
                      }} />
                    )),
                  ])}

                  {/* Booking blocks */}
                  {weekBookings.map((booking) => {
                    const dateStr = booking.appointment_date_time.substring(0, 10);
                    const di = weekDayStrs.indexOf(dateStr);
                    if (di === -1) return null;
                    const startHour = booking.appointment_time ? parseInt(booking.appointment_time.substring(0, 2), 10) : null;
                    if (startHour === null || startHour < 9 || startHour > 20) return null;
                    const durationH = booking.estimated_duration_minutes
                      ? Math.min(Math.max(1, Math.round(booking.estimated_duration_minutes / 60)), 21 - startHour)
                      : 1;
                    const st = CAL_STATUS[booking.appointment_status] ?? { bg: 'rgba(155,155,155,0.1)', border: 'rgba(155,155,155,0.25)', color: 'var(--text-mid)' };
                    const rowStart = startHour - 7; // row 2 = 9am → 9 - 7 = 2 ✓
                    const isSelected = selectedBooking?.id === booking.id;

                    return (
                      <button
                        type="button"
                        key={booking.id}
                        onClick={() => setSelectedBooking(isSelected ? null : booking)}
                        style={{
                          gridColumn: di + 2,
                          gridRow: `${rowStart} / span ${durationH}`,
                          zIndex: 2,
                          margin: '2px',
                          background: isSelected ? st.bg.replace(/[\d.]+\)$/, '0.35)') : st.bg,
                          border: `1px solid ${isSelected ? st.color : st.border}`,
                          borderRadius: '0.375rem',
                          padding: '0.375rem 0.5rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          overflow: 'hidden',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = st.color; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = st.border; }}
                      >
                        <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem', fontWeight: 500, color: st.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                          {booking.first_name} {booking.last_name}
                        </p>
                        <p style={{ margin: '0.1rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.05em', color: st.color, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fmtH(startHour)}{booking.estimated_duration_minutes ? ` → ${fmtH(startHour + Math.round(booking.estimated_duration_minutes / 60))}` : ''}
                        </p>
                        {durationH >= 2 && booking.placement && (
                          <p style={{ margin: '0.125rem 0 0', fontFamily: '"DM Sans", sans-serif', fontSize: '0.5625rem', color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {booking.placement}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {weekBookings.length === 0 && !isLoading && (
                <p style={{ marginTop: '1.5rem', color: 'var(--text-low)', fontSize: '0.875rem', fontFamily: '"DM Sans", sans-serif', textAlign: 'center' }}>
                  No bookings this week.
                </p>
              )}
            </div>

            {/* Detail panel */}
            {renderBookingDetailPanel({ width: '380px', flexShrink: 0 })}
          </div>
        )}

        {/* ── Messages tab ─────────────────────────────────────────────────── */}
        {tab === 'messages' && (() => {
          const selectedThread = msgThreads.find((t) => t.id === selectedMsgBooking) ?? null;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: selectedMsgBooking ? '280px 1fr' : '1fr', gap: '1.5rem', alignItems: 'start', minHeight: '28rem' }}>
              {/* Thread list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {msgThreadsLoading && msgThreads.length === 0 ? (
                  <p style={{ ...labelStyle, opacity: 0.4, padding: '2rem 0' }}>Loading...</p>
                ) : msgThreads.length === 0 ? (
                  <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', padding: '2rem 0' }}>No active booking conversations yet.</p>
                ) : (
                  msgThreads.map((t) => {
                    const isSelected = selectedMsgBooking === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedMsgBooking(isSelected ? null : t.id); setMsgs([]); setMsgError(''); }}
                        style={{
                          padding: '1rem 1.125rem',
                          background: isSelected ? 'rgba(201,168,76,0.08)' : 'var(--surface)',
                          border: `1px solid ${isSelected ? 'rgba(201,168,76,0.35)' : 'var(--border)'}`,
                          borderRadius: '0.625rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                          <p style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1rem', color: isSelected ? 'var(--gold)' : 'var(--cream)' }}>
                            {t.first_name} {t.last_name}
                          </p>
                          {t.unread_count > 0 && (
                            <span style={{ padding: '0.1rem 0.45rem', background: 'var(--gold)', color: 'var(--bg)', borderRadius: '2rem', fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', fontWeight: 600, flexShrink: 0, marginLeft: '0.5rem' }}>
                              {t.unread_count}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '0 0 0.3rem', fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                          {t.booking_reference}
                        </p>
                        {t.last_message_body ? (
                          <p style={{ margin: 0, fontSize: '0.75rem', color: t.unread_count > 0 ? 'var(--text)' : 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: t.unread_count > 0 ? 500 : 400 }}>
                            {t.last_message_sender === 'artist' ? 'You: ' : `${t.first_name}: `}{t.last_message_body}
                          </p>
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-low)', fontStyle: 'italic' }}>No messages yet</p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Thread panel */}
              {selectedMsgBooking && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', height: '24rem' }}>
                  {/* Header */}
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div>
                      <p style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.125rem', color: 'var(--cream)' }}>
                        {selectedThread?.first_name} {selectedThread?.last_name}
                      </p>
                      <p style={{ margin: '0.1rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                        {selectedThread?.booking_reference}
                        {selectedThread?.appointment_date_time && ` · ${new Date(selectedThread.appointment_date_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </p>
                    </div>
                    <button onClick={() => { setSelectedMsgBooking(null); setMsgs([]); }} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
                  </div>

                  {/* Messages */}
                  <div ref={msgAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {msgs.length === 0 ? (
                      <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
                        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.125rem', color: 'var(--text-mid)', marginBottom: '0.5rem' }}>Start the conversation</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>Send a message to {selectedThread?.first_name} about their booking.</p>
                      </div>
                    ) : (
                      <>
                        {msgs.map((msg, i) => {
                          const isArtist = msg.sender_type === 'artist';
                          const prev = msgs[i - 1];
                          const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <p style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.44rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.75rem 0 0.5rem' }}>
                                  {new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                              )}
                              <div style={{ display: 'flex', justifyContent: isArtist ? 'flex-end' : 'flex-start' }}>
                                <div style={{ maxWidth: '72%', padding: '0.625rem 0.875rem', borderRadius: isArtist ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', background: isArtist ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isArtist ? 'rgba(201,168,76,0.3)' : 'var(--border)'}` }}>
                                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>{msg.body}</p>
                                  <p style={{ margin: '0.25rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.4rem', letterSpacing: '0.06em', color: isArtist ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', textAlign: isArtist ? 'right' : 'left' }}>
                                    {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                    {msgError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#f87171' }}>{msgError}</p>}
                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                      <textarea
                        value={msgDraft}
                        onChange={(e) => setMsgDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendArtistMsg(); } }}
                        placeholder="Write a message… (Enter to send)"
                        rows={2}
                        style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'none', outline: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'border-color 0.2s ease' }}
                        onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                      />
                      <button
                        onClick={sendArtistMsg}
                        disabled={!msgDraft.trim() || msgSending}
                        className="btn-primary"
                        style={{ padding: '0.625rem 1.125rem', flexShrink: 0, opacity: (!msgDraft.trim() || msgSending) ? 0.5 : 1, cursor: (!msgDraft.trim() || msgSending) ? 'default' : 'pointer' }}
                      >
                        {msgSending ? '…' : '→'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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

        {/* ── Availability tab ─────────────────────────────────────────────── */}
        {tab === 'availability' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 320px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

            {/* Calendar panel */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <button
                  onClick={avPrevMonth}
                  style={{ width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-mid)', fontSize: '0.875rem', transition: 'border-color 0.25s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  aria-label="Previous month"
                >←</button>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.25rem', color: 'var(--cream)', lineHeight: 1.1 }}>
                    {MONTHS[avMonth]}
                  </p>
                  <p style={{ margin: '0.1rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                    {avYear}
                  </p>
                </div>

                <button
                  onClick={avNextMonth}
                  style={{ width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-mid)', fontSize: '0.875rem', transition: 'border-color 0.25s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  aria-label="Next month"
                >→</button>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.125rem', marginBottom: '0.375rem' }}>
                {DAYS_SHORT.map((d) => (
                  <div key={d} style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', padding: '0.25rem 0' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid — management mode */}
              {(() => {
                const todayStr = (() => {
                  const n = new Date();
                  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
                })();
                const firstDay = new Date(avYear, avMonth, 1);
                const lastDay = new Date(avYear, avMonth + 1, 0);
                let startDow = firstDay.getDay();
                startDow = startDow === 0 ? 6 : startDow - 1;

                type MgmtCell = { dateStr: string; inMonth: boolean };
                const cells: MgmtCell[] = [];
                for (let i = 0; i < startDow; i++) {
                  const d = new Date(avYear, avMonth, 1 - (startDow - i));
                  cells.push({ dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, inMonth: false });
                }
                for (let d = 1; d <= lastDay.getDate(); d++) {
                  cells.push({ dateStr: `${avYear}-${String(avMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, inMonth: true });
                }
                const rem = 42 - cells.length;
                for (let i = 1; i <= rem; i++) {
                  const d = new Date(avYear, avMonth + 1, i);
                  cells.push({ dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, inMonth: false });
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', opacity: avLoading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
                    {cells.map(({ dateStr, inMonth }) => {
                      const isPast = dateStr < todayStr;
                      const isToday = dateStr === todayStr;
                      const isSelected = selectedDay === dateStr;
                      const isFullBlocked = avData?.blockedDays.includes(dateStr) ?? false;
                      const daySlots = avData?.slotData[dateStr];
                      const hasPartialBlock = !isFullBlocked && daySlots && (daySlots.blocked.length > 0 || daySlots.booked.length > 0);
                      const dayNum = parseInt(dateStr.split('-')[2], 10);

                      let border = '1px solid transparent';
                      let bg = 'transparent';
                      let color = 'var(--text)';
                      let opacity = inMonth ? 1 : 0;

                      if (inMonth) {
                        if (isSelected) {
                          border = '1px solid var(--gold)';
                          bg = 'rgba(201,168,76,0.13)';
                          color = 'var(--gold)';
                        } else if (isFullBlocked) {
                          bg = 'rgba(239,68,68,0.06)';
                          border = '1px solid rgba(239,68,68,0.2)';
                          color = '#f87171';
                          opacity = isPast ? 0.25 : 0.65;
                        } else if (hasPartialBlock) {
                          border = '1px solid rgba(234,179,8,0.25)';
                          bg = 'rgba(234,179,8,0.04)';
                          color = 'var(--cream)';
                        } else if (isToday) {
                          border = '1px solid rgba(201,168,76,0.35)';
                          color = 'var(--cream)';
                        } else if (isPast) {
                          color = 'var(--text-low)';
                          opacity = 0.3;
                        }
                      }

                      return (
                        <button
                          key={dateStr}
                          onClick={() => inMonth && !isPast && setSelectedDay(isSelected ? null : dateStr)}
                          style={{
                            aspectRatio: '1',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '0.1rem',
                            background: bg, border, borderRadius: '0.375rem',
                            cursor: inMonth && !isPast ? 'pointer' : 'default',
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: '0.775rem',
                            fontWeight: isToday ? 500 : 400,
                            color, opacity,
                            transition: 'background 0.18s ease, border-color 0.18s ease',
                          }}
                          onMouseEnter={(e) => { if (inMonth && !isPast && !isSelected && !isFullBlocked) { e.currentTarget.style.background = 'rgba(201,168,76,0.06)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'; } }}
                          onMouseLeave={(e) => { if (inMonth && !isPast && !isSelected && !isFullBlocked) { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = isFullBlocked ? 'rgba(239,68,68,0.2)' : hasPartialBlock ? 'rgba(234,179,8,0.25)' : isToday ? 'rgba(201,168,76,0.35)' : 'transparent'; } }}
                        >
                          {inMonth ? dayNum : ''}
                          {inMonth && isFullBlocked && <span style={{ fontSize: '0.45rem', lineHeight: 1 }}>✕</span>}
                          {inMonth && hasPartialBlock && !isFullBlocked && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#EAB308', display: 'block' }} />}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {avError && (
                <p style={{ marginTop: '1rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#f87171' }}>{avError}</p>
              )}

              {/* Legend */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {[
                  { dot: { background: 'transparent', border: '1px solid var(--border)' }, label: 'Open' },
                  { dot: { background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.35)' }, label: 'Partial' },
                  { dot: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }, label: 'Blocked' },
                ].map(({ dot, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.2rem', display: 'block', ...dot }} />
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slot management panel */}
            {selectedDay && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem', position: 'sticky', top: '5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <p style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.125rem', color: 'var(--cream)' }}>
                      {new Date(`${selectedDay}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p style={{ margin: '0.2rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                      Manage availability
                    </p>
                  </div>
                  <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
                </div>

                {/* Block whole day toggle */}
                {(() => {
                  const dayBlocks = avData?.blocks ?? [];
                  const fullDayBlock = dayBlocks.find((b) => b.blocked_date === selectedDay && b.blocked_slot === null);
                  const isFullBlocked = Boolean(fullDayBlock);

                  return (
                    <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', background: isFullBlocked ? 'rgba(239,68,68,0.06)' : 'rgba(14,12,9,0.4)', border: `1px solid ${isFullBlocked ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`, borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: isFullBlocked ? '#f87171' : 'var(--text)' }}>
                          {isFullBlocked ? 'Day blocked' : 'Block entire day'}
                        </p>
                        <p style={{ margin: '0.15rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                          {isFullBlocked ? 'Clients cannot book this day' : 'Closes all time slots'}
                        </p>
                      </div>
                      <button
                        onClick={() => isFullBlocked ? unblockSlot(fullDayBlock!.id) : blockSlot(selectedDay, null)}
                        disabled={isBlocking}
                        style={{
                          padding: '0.4rem 0.875rem',
                          borderRadius: '2rem',
                          border: `1px solid ${isFullBlocked ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
                          background: 'none',
                          color: isFullBlocked ? '#f87171' : 'var(--text-mid)',
                          fontFamily: '"DM Mono", monospace',
                          fontSize: '0.55rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          cursor: isBlocking ? 'default' : 'pointer',
                          opacity: isBlocking ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isFullBlocked ? 'Unblock' : 'Block all'}
                      </button>
                    </div>
                  );
                })()}

                {/* Individual slot management */}
                {(() => {
                  const dayBlocks = avData?.blocks ?? [];
                  const fullDayBlock = dayBlocks.find((b) => b.blocked_date === selectedDay && b.blocked_slot === null);
                  if (fullDayBlock) return null; // day fully blocked, no individual slot UI

                  const daySlots = avData?.slotData[selectedDay];

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p style={{ margin: '0 0 0.625rem', fontFamily: '"DM Mono", monospace', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                        Individual slots
                      </p>
                      {TIME_SLOTS.map((slot) => {
                        const isSlotBlocked = daySlots?.blocked.includes(slot.id) ?? false;
                        const isSlotBooked = daySlots?.booked.includes(slot.id) ?? false;
                        const blockRecord = dayBlocks.find((b) => b.blocked_date === selectedDay && b.blocked_slot === slot.id);

                        let statusColor = 'var(--text)';
                        let statusLabel = 'Available';
                        let statusBg = 'rgba(14,12,9,0.4)';
                        let statusBorder = 'var(--border)';

                        if (isSlotBooked) {
                          statusColor = 'var(--gold)';
                          statusLabel = 'Booked';
                          statusBg = 'rgba(201,168,76,0.06)';
                          statusBorder = 'rgba(201,168,76,0.2)';
                        } else if (isSlotBlocked) {
                          statusColor = '#f87171';
                          statusLabel = 'Blocked';
                          statusBg = 'rgba(239,68,68,0.06)';
                          statusBorder = 'rgba(239,68,68,0.2)';
                        }

                        return (
                          <div
                            key={slot.id}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: '0.5rem' }}
                          >
                            <div>
                              <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: statusColor }}>{slot.label}</p>
                              <p style={{ margin: '0.1rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.48rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)' }}>{statusLabel}</p>
                            </div>
                            {!isSlotBooked && (
                              <button
                                onClick={() => isSlotBlocked ? unblockSlot(blockRecord!.id) : blockSlot(selectedDay, slot.id)}
                                disabled={isBlocking}
                                style={{
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '2rem',
                                  border: `1px solid ${isSlotBlocked ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
                                  background: 'none',
                                  color: isSlotBlocked ? '#f87171' : 'var(--text-mid)',
                                  fontFamily: '"DM Mono", monospace',
                                  fontSize: '0.5rem',
                                  letterSpacing: '0.1em',
                                  textTransform: 'uppercase',
                                  cursor: isBlocking ? 'default' : 'pointer',
                                  opacity: isBlocking ? 0.5 : 1,
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                {isSlotBlocked ? 'Unblock' : 'Block'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
