'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import AvailabilityCalendar, { AvailabilityData } from '@/app/components/AvailabilityCalendar';
import TimeSlotPicker from '@/app/components/TimeSlotPicker';

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
  artist_id?: string;
  artist_notes?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  counter_offer_date?: string | null;
  counter_offer_time?: string | null;
  counter_offer_note?: string | null;
  counter_offered_by?: string | null;
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
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  color: 'rgba(201,168,76,0.75)',
  display: 'block',
  marginBottom: '0.375rem',
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
    counter_offered: { bg: 'rgba(201,168,76,0.15)', color: 'var(--gold)', label: 'Counter offer' },
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
  const [tab, setTab] = useState<'bookings' | 'calendar' | 'consultations' | 'availability' | 'stats'>('bookings');

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Confirm-booking form state (duration + notify)
  const [confirmDurationHours, setConfirmDurationHours] = useState(2);
  const [confirmNotifyEnd, setConfirmNotifyEnd] = useState(true);

  // Private artist notes state
  const [notesText, setNotesText] = useState('');
  const [notesSaving, setNotesSaving] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Post-session actions
  const [aftercareSent, setAftercareSent] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [rebookSent, setRebookSent] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Artist cancel / reschedule / counter-offer
  const [artistActionMode, setArtistActionMode] = useState<'none' | 'cancel-confirm' | 'reschedule' | 'counter-offer'>('none');
  const [rescheduleDate, setRescheduleDate] = useState<string | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState<string | null>(null);
  const [rescheduleAvailData, setRescheduleAvailData] = useState<AvailabilityData | null>(null);
  const [counterOfferDate, setCounterOfferDate] = useState<string | null>(null);
  const [counterOfferSlot, setCounterOfferSlot] = useState<string | null>(null);
  const [counterOfferNote, setCounterOfferNote] = useState('');
  const [counterOfferAvailData, setCounterOfferAvailData] = useState<AvailabilityData | null>(null);
  const [counterOfferActing, setCounterOfferActing] = useState(false);

  // Consultations state
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultationError, setConsultationError] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [showDeclinedConsults, setShowDeclinedConsults] = useState(false);
  const [showCompletedChats, setShowCompletedChats] = useState(false);

  // Consultation chat state
  interface ConsultMsg { id: string; consultation_id: string; sender_type: 'client' | 'artist'; body: string; created_at: string; }
  const [openConsultChatId, setOpenConsultChatId] = useState<string | null>(null);
  const [consultMsgs, setConsultMsgs] = useState<ConsultMsg[]>([]);
  const [consultMsgDraft, setConsultMsgDraft] = useState('');
  const [consultMsgSending, setConsultMsgSending] = useState(false);
  const [consultMsgError, setConsultMsgError] = useState('');
  const [consultActionId, setConsultActionId] = useState<string | null>(null);
  const [consultResponseText, setConsultResponseText] = useState('');
  const [consultActioning, setConsultActioning] = useState(false);
  const consultMsgPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consultMsgAreaRef = useRef<HTMLDivElement>(null);

  // Booking chat state (in Consultations tab — for confirmed booking threads)
  interface BookingMsg { id: string; booking_id: string; sender_type: 'client' | 'artist'; body: string; created_at: string; }
  const [openBookingChatId, setOpenBookingChatId] = useState<string | null>(null);
  const [bookingChatMsgs, setBookingChatMsgs] = useState<BookingMsg[]>([]);
  const [bookingChatDraft, setBookingChatDraft] = useState('');
  const [bookingChatSending, setBookingChatSending] = useState(false);
  const [bookingChatError, setBookingChatError] = useState('');
  const bookingChatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bookingChatAreaRef = useRef<HTMLDivElement>(null);

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

  const fetchBookings = async (): Promise<Booking[]> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');
      const list: Booking[] = data.bookings || [];
      setBookings(list);
      return list;
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to load bookings');
      return [];
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

  const fetchConsultMsgs = useCallback(async (consultationId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/consultation-messages/${consultationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setConsultMsgs(data.messages || []);
    } catch { /* non-critical */ }
  }, [accessToken]);

  useEffect(() => {
    if (consultMsgPollRef.current) clearInterval(consultMsgPollRef.current);
    if (!openConsultChatId) { setConsultMsgs([]); return; }
    fetchConsultMsgs(openConsultChatId);
    consultMsgPollRef.current = setInterval(() => fetchConsultMsgs(openConsultChatId), 30_000);
    return () => { if (consultMsgPollRef.current) clearInterval(consultMsgPollRef.current); };
  }, [openConsultChatId, fetchConsultMsgs]);

  useEffect(() => {
    const el = consultMsgAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [consultMsgs]);

  // Sync notes + action state when selected booking changes
  useEffect(() => {
    setNotesText(selectedBooking?.artist_notes ?? '');
    setNotesSaving('idle');
    setAftercareSent('idle');
    setRebookSent('idle');
    setArtistActionMode('none');
    setRescheduleDate(null);
    setRescheduleSlot(null);
    setRescheduleAvailData(null);
  }, [selectedBooking?.id]);

  const saveNotes = async () => {
    if (!selectedBooking) return;
    setNotesSaving('saving');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status: selectedBooking.appointment_status, notes: notesText }),
      });
      if (res.ok) {
        setNotesSaving('saved');
        setBookings((prev) => prev.map((b) => b.id === selectedBooking.id ? { ...b, artist_notes: notesText } : b));
        setSelectedBooking((prev) => prev ? { ...prev, artist_notes: notesText } : null);
        setTimeout(() => setNotesSaving('idle'), 2000);
      } else {
        setNotesSaving('idle');
      }
    } catch {
      setNotesSaving('idle');
    }
  };

  const AFTERCARE_TEXT = `Thanks so much for coming in! Here's a quick reminder of aftercare:\n\n• Keep your tattoo wrapped for 2–4 hours after your session\n• Gently wash with fragrance-free soap and pat dry\n• Apply a thin layer of unscented moisturiser 2–3x daily\n• Avoid direct sunlight, swimming, saunas, and scratching for at least 2 weeks\n• The surface heals in 2–3 weeks; full healing takes 2–3 months\n\nFeel free to message me if you have any questions — happy healing! ✨`;

  const sendAftercareMessage = async () => {
    if (!selectedBooking || aftercareSent !== 'idle') return;
    setAftercareSent('sending');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/messages/${selectedBooking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: AFTERCARE_TEXT }),
      });
      if (res.ok) setAftercareSent('sent');
      else setAftercareSent('idle');
    } catch {
      setAftercareSent('idle');
    }
  };

  const sendRebookInvite = async () => {
    if (!selectedBooking || rebookSent !== 'idle') return;
    setRebookSent('sending');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings/${selectedBooking.id}/rebook-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setRebookSent('sent');
      else setRebookSent('idle');
    } catch {
      setRebookSent('idle');
    }
  };

  const fetchBookingChatMsgs = useCallback(async (bookingId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/messages/${bookingId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setBookingChatMsgs(data.messages || []);
    } catch { /* non-critical */ }
  }, [accessToken]);

  useEffect(() => {
    if (bookingChatPollRef.current) clearInterval(bookingChatPollRef.current);
    if (!openBookingChatId) { setBookingChatMsgs([]); return; }
    fetchBookingChatMsgs(openBookingChatId);
    bookingChatPollRef.current = setInterval(() => fetchBookingChatMsgs(openBookingChatId), 30_000);
    return () => { if (bookingChatPollRef.current) clearInterval(bookingChatPollRef.current); };
  }, [openBookingChatId, fetchBookingChatMsgs]);

  useEffect(() => {
    const el = bookingChatAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bookingChatMsgs]);

  const sendBookingChatMsg = async () => {
    if (!bookingChatDraft.trim() || !openBookingChatId || bookingChatSending) return;
    setBookingChatSending(true);
    setBookingChatError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/messages/${openBookingChatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: bookingChatDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setBookingChatMsgs((prev) => [...prev, data.message]);
      setBookingChatDraft('');
    } catch (e) {
      setBookingChatError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setBookingChatSending(false);
    }
  };

  const sendConsultMsg = async () => {
    if (!consultMsgDraft.trim() || !openConsultChatId || consultMsgSending) return;
    setConsultMsgSending(true);
    setConsultMsgError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/consultation-messages/${openConsultChatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: consultMsgDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setConsultMsgs((prev) => [...prev, data.message]);
      setConsultMsgDraft('');
    } catch (e) {
      setConsultMsgError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setConsultMsgSending(false);
    }
  };

  const handleStatusUpdate = async (
    bookingId: string,
    status: string,
    notes: string,
    opts?: { duration_hours?: number; notify_end_time?: boolean; new_appointment_date?: string; new_appointment_time?: string }
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
      setStatusFilter('all');
      const refreshed = await fetchBookings();
      setSelectedBooking(refreshed.find((b) => b.id === bookingId) ?? null);
      setConfirmDurationHours(2);
      setConfirmNotifyEnd(true);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArtistReschedule = () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleSlot) return;
    handleStatusUpdate(selectedBooking.id, selectedBooking.appointment_status, selectedBooking.artist_notes ?? '', {
      new_appointment_date: rescheduleDate,
      new_appointment_time: rescheduleSlot,
    });
  };

  const handleArtistCounterOffer = async () => {
    if (!selectedBooking || !counterOfferDate || !counterOfferSlot || !counterOfferNote.trim()) return;
    setCounterOfferActing(true);
    setBookingError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings/${selectedBooking.id}/counter-offer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ counter_offer_date: counterOfferDate, counter_offer_time: counterOfferSlot, counter_offer_note: counterOfferNote.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send counter-offer');
      setBookings(prev => prev.map(b => b.id === selectedBooking.id
        ? { ...b, appointment_status: 'counter_offered', counter_offer_date: counterOfferDate, counter_offer_time: counterOfferSlot, counter_offer_note: counterOfferNote.trim(), counter_offered_by: 'artist' }
        : b
      ));
      setSelectedBooking(prev => prev ? { ...prev, appointment_status: 'counter_offered', counter_offer_date: counterOfferDate, counter_offer_time: counterOfferSlot, counter_offer_note: counterOfferNote.trim(), counter_offered_by: 'artist' } : prev);
      setArtistActionMode('none');
      setCounterOfferDate(null); setCounterOfferSlot(null); setCounterOfferNote('');
    } catch (e) {
      setBookingError(e instanceof Error ? e.message : 'Failed to send counter-offer');
    } finally {
      setCounterOfferActing(false);
    }
  };

  const handleArtistAcceptClientOffer = async () => {
    if (!selectedBooking) return;
    setCounterOfferActing(true);
    setBookingError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings/${selectedBooking.id}/accept-offer`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept offer');
      const newDateTime = selectedBooking.counter_offer_date && selectedBooking.counter_offer_time
        ? `${selectedBooking.counter_offer_date}T${selectedBooking.counter_offer_time}:00`
        : selectedBooking.appointment_date_time;
      setBookings(prev => prev.map(b => b.id === selectedBooking.id
        ? { ...b, appointment_status: 'pending_consent', appointment_date_time: newDateTime, appointment_time: selectedBooking.counter_offer_time ?? b.appointment_time, counter_offer_date: null, counter_offer_time: null, counter_offer_note: null, counter_offered_by: null }
        : b
      ));
      setSelectedBooking(prev => prev ? { ...prev, appointment_status: 'pending_consent', appointment_date_time: newDateTime, appointment_time: selectedBooking.counter_offer_time ?? prev.appointment_time, counter_offer_date: null, counter_offer_time: null, counter_offer_note: null, counter_offered_by: null } : prev);
      setArtistActionMode('none');
    } catch (e) {
      setBookingError(e instanceof Error ? e.message : 'Failed to accept offer');
    } finally {
      setCounterOfferActing(false);
    }
  };

  const handleConsultAction = async () => {
    if (!consultActionId) return;
    const colonIdx = consultActionId.lastIndexOf(':');
    const consultationId = consultActionId.substring(0, colonIdx);
    const action = consultActionId.substring(colonIdx + 1) as 'approve' | 'decline';
    setConsultActioning(true);
    setConsultationError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/consultations/${consultationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ action, ...(consultResponseText.trim() ? { response_message: consultResponseText.trim() } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update consultation');
      const newStatus = action === 'approve' ? 'approved' : 'declined';
      setConsultations((prev) =>
        prev.map((c) =>
          c.consultation_id === consultationId
            ? { ...c, status: newStatus, artist_response: consultResponseText.trim() || c.artist_response }
            : c
        )
      );
      setConsultActionId(null);
      setConsultResponseText('');
    } catch (e) {
      setConsultationError(e instanceof Error ? e.message : 'Failed to update consultation');
    } finally {
      setConsultActioning(false);
    }
  };

  const activeStatuses = ['pending_consent', 'confirmed', 'rescheduled', 'counter_offered'];
  const filteredBookings = bookings.filter((b) => statusFilter === 'all' || b.appointment_status === statusFilter);
  const pastBookingsAll = bookings.filter((b) => !activeStatuses.includes(b.appointment_status));

  const renderBookingRow = (booking: Booking) => {
    const isCancelled = booking.appointment_status === 'cancelled';
    const isSelected = selectedBooking?.id === booking.id;
    return (
      <button
        key={booking.id}
        type="button"
        onClick={() => { setSelectedBooking(isSelected ? null : booking); setArtistActionMode('none'); setCounterOfferDate(null); setCounterOfferSlot(null); setCounterOfferNote(''); }}
        style={{
          display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
          gap: '1rem', width: '100%', padding: '1.25rem 1.5rem',
          background: isSelected ? 'rgba(201,168,76,0.06)' : 'var(--surface)',
          border: `1px solid ${isSelected ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
          borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'left',
          transition: 'all 0.3s ease', opacity: isCancelled ? 0.5 : 1,
        }}
      >
        <div>
          <p style={{ margin: '0 0 0.25rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 300, color: isCancelled ? 'var(--text-mid)' : 'var(--cream)', textDecoration: isCancelled ? 'line-through' : 'none' }}>
            {booking.first_name} {booking.last_name}
          </p>
          <p style={{ margin: '0 0 0.375rem', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-low)' }}>
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
  };

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
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.75rem', ...extraStyle }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 300, color: 'var(--cream)' }}>
            Booking details
          </h3>
          <button onClick={() => { setSelectedBooking(null); setArtistActionMode('none'); setCounterOfferDate(null); setCounterOfferSlot(null); setCounterOfferNote(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
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
                <p style={{ margin: '0.25rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.5)' }}>
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

        {/* Private notes — not visible to client */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
          <span style={{ ...labelStyle, marginBottom: '0.25rem' }}>Private notes</span>
          <p style={{ margin: '0 0 0.625rem', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.06em', color: 'var(--text-low)' }}>
            Not visible to the client
          </p>
          <textarea
            value={notesText}
            onChange={(e) => { setNotesText(e.target.value); setNotesSaving('idle'); }}
            placeholder="Session notes, price agreed, allergies, anything relevant…"
            rows={3}
            style={{ width: '100%', resize: 'vertical', minHeight: '5rem' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={saveNotes}
              disabled={notesSaving === 'saving'}
              style={{ padding: '0.4rem 0.875rem', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--gold)', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '0.25rem', cursor: notesSaving === 'saving' ? 'default' : 'pointer', opacity: notesSaving === 'saving' ? 0.6 : 1 }}
            >
              {notesSaving === 'saving' ? 'Saving…' : 'Save notes'}
            </button>
            {notesSaving === 'saved' && (
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'rgba(34,197,94,0.8)' }}>Saved ✓</span>
            )}
          </div>
        </div>

        {/* Cancel / reschedule — confirmed bookings */}
        {selectedBooking.appointment_status === 'confirmed' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>

            {artistActionMode === 'none' && (
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  type="button"
                  onClick={() => setArtistActionMode('reschedule')}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.72rem' }}
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setArtistActionMode('cancel-confirm')}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.72rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                >
                  Cancel booking
                </button>
              </div>
            )}

            {artistActionMode === 'cancel-confirm' && (
              <div>
                <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.375rem', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f87171' }}>
                    Cancel this booking?
                  </p>
                  <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.65 }}>
                    The client will be notified by email. This cannot be undone.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled', selectedBooking.artist_notes ?? '')}
                    disabled={isUpdating}
                    style={{ flex: 1, padding: '0.65rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '0.375rem', cursor: isUpdating ? 'default' : 'pointer', opacity: isUpdating ? 0.6 : 1 }}
                  >
                    {isUpdating ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setArtistActionMode('none')}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.72rem' }}
                  >
                    Keep booking
                  </button>
                </div>
              </div>
            )}

            {artistActionMode === 'reschedule' && (
              <div>
                <p style={{ ...labelStyle, marginBottom: '1rem' }}>Choose a new date</p>
                <div style={{ padding: '1rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', marginBottom: rescheduleDate ? '0.875rem' : '0' }}>
                  <AvailabilityCalendar
                    artistId={selectedBooking.artist_id ?? artist?.id ?? ''}
                    selectedDate={rescheduleDate}
                    onDateSelect={(d) => { setRescheduleDate(d); setRescheduleSlot(null); }}
                    onAvailabilityLoad={setRescheduleAvailData}
                  />
                </div>
                {rescheduleDate && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <TimeSlotPicker
                      date={rescheduleDate}
                      selectedSlot={rescheduleSlot}
                      onSlotSelect={setRescheduleSlot}
                      slotData={rescheduleAvailData?.slotData}
                    />
                  </div>
                )}
                {bookingError && (
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: '#f87171' }}>{bookingError}</p>
                )}
                <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.875rem' }}>
                  <button
                    type="button"
                    onClick={handleArtistReschedule}
                    disabled={!rescheduleDate || !rescheduleSlot || isUpdating}
                    className="btn-primary"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.72rem', opacity: (!rescheduleDate || !rescheduleSlot || isUpdating) ? 0.4 : 1 }}
                  >
                    {isUpdating ? 'Saving…' : 'Confirm reschedule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setArtistActionMode('none'); setRescheduleDate(null); setRescheduleSlot(null); }}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.72rem' }}
                  >
                    Go back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post-session actions — completed bookings only */}
        {selectedBooking.appointment_status === 'completed' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <span style={{ ...labelStyle, marginBottom: '0.5rem' }}>Post-session</span>
            <button
              type="button"
              onClick={sendAftercareMessage}
              disabled={aftercareSent !== 'idle'}
              style={{ width: '100%', padding: '0.7rem', background: aftercareSent === 'sent' ? 'rgba(34,197,94,0.1)' : 'rgba(201,168,76,0.08)', border: `1px solid ${aftercareSent === 'sent' ? 'rgba(34,197,94,0.4)' : 'rgba(201,168,76,0.25)'}`, color: aftercareSent === 'sent' ? 'rgba(34,197,94,0.9)' : 'var(--gold)', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '0.375rem', cursor: aftercareSent === 'idle' ? 'pointer' : 'default', opacity: aftercareSent === 'sending' ? 0.6 : 1 }}
            >
              {aftercareSent === 'sent' ? 'Aftercare sent ✓' : aftercareSent === 'sending' ? 'Sending…' : 'Send aftercare instructions'}
            </button>
            <button
              type="button"
              onClick={sendRebookInvite}
              disabled={rebookSent !== 'idle'}
              style={{ width: '100%', padding: '0.7rem', background: rebookSent === 'sent' ? 'rgba(34,197,94,0.1)' : 'transparent', border: `1px solid ${rebookSent === 'sent' ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`, color: rebookSent === 'sent' ? 'rgba(34,197,94,0.9)' : 'var(--text-mid)', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '0.375rem', cursor: rebookSent === 'idle' ? 'pointer' : 'default', opacity: rebookSent === 'sending' ? 0.6 : 1 }}
            >
              {rebookSent === 'sent' ? 'Invite sent ✓' : rebookSent === 'sending' ? 'Sending…' : 'Invite to rebook'}
            </button>
          </div>
        )}

        {/* Client has responded with a counter-offer */}
        {selectedBooking.appointment_status === 'counter_offered' && selectedBooking.counter_offered_by === 'client' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            {artistActionMode === 'none' && (
              <div>
                <div style={{ padding: '1rem 1.125rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', margin: '0 0 0.5rem' }}>
                    Client proposed a new time
                  </p>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--cream)', margin: '0 0 0.25rem', fontWeight: 500 }}>
                    {selectedBooking.counter_offer_date
                      ? new Date(`${selectedBooking.counter_offer_date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'}
                    {selectedBooking.counter_offer_time && ` at ${fmtH(parseInt(selectedBooking.counter_offer_time.substring(0, 2), 10))}`}
                  </p>
                  {selectedBooking.counter_offer_note && (
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', margin: '0.5rem 0 0', lineHeight: 1.65, fontStyle: 'italic' }}>
                      &ldquo;{selectedBooking.counter_offer_note}&rdquo;
                    </p>
                  )}
                </div>
                {bookingError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: '#f87171' }}>{bookingError}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleArtistAcceptClientOffer}
                    disabled={counterOfferActing}
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.7rem', opacity: counterOfferActing ? 0.6 : 1 }}
                  >
                    {counterOfferActing ? 'Accepting…' : 'Accept this time'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setArtistActionMode('counter-offer'); setCounterOfferDate(null); setCounterOfferSlot(null); setCounterOfferNote(''); }}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '0.7rem', fontSize: '0.72rem' }}
                  >
                    Propose a different time
                  </button>
                </div>
              </div>
            )}
            {artistActionMode === 'counter-offer' && (
              <div>
                <p style={{ ...labelStyle, marginBottom: '1rem' }}>Propose a different time</p>
                <div style={{ padding: '1rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', marginBottom: counterOfferDate ? '0.875rem' : '0' }}>
                  <AvailabilityCalendar
                    artistId={selectedBooking.artist_id ?? artist?.id ?? ''}
                    selectedDate={counterOfferDate}
                    onDateSelect={(d) => { setCounterOfferDate(d); setCounterOfferSlot(null); }}
                    onAvailabilityLoad={setCounterOfferAvailData}
                  />
                </div>
                {counterOfferDate && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <TimeSlotPicker
                      date={counterOfferDate}
                      selectedSlot={counterOfferSlot}
                      onSlotSelect={setCounterOfferSlot}
                      slotData={counterOfferAvailData?.slotData}
                    />
                  </div>
                )}
                <div style={{ marginBottom: '0.875rem' }}>
                  <span style={{ ...labelStyle, marginBottom: '0.375rem' }}>Note for client</span>
                  <textarea
                    value={counterOfferNote}
                    onChange={e => setCounterOfferNote(e.target.value)}
                    placeholder="Explain why this time works better…"
                    rows={3}
                    style={{ width: '100%', resize: 'vertical', minHeight: '4rem' }}
                  />
                </div>
                {bookingError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: '#f87171' }}>{bookingError}</p>}
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button
                    type="button"
                    onClick={handleArtistCounterOffer}
                    disabled={!counterOfferDate || !counterOfferSlot || !counterOfferNote.trim() || counterOfferActing}
                    className="btn-primary"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.72rem', opacity: (!counterOfferDate || !counterOfferSlot || !counterOfferNote.trim() || counterOfferActing) ? 0.4 : 1 }}
                  >
                    {counterOfferActing ? 'Sending…' : 'Send proposal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setArtistActionMode('none'); setCounterOfferDate(null); setCounterOfferSlot(null); setCounterOfferNote(''); }}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.72rem' }}
                  >
                    Go back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Artist proposed — awaiting client */}
        {selectedBooking.appointment_status === 'counter_offered' && selectedBooking.counter_offered_by === 'artist' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ padding: '1rem 1.125rem', background: 'rgba(154,144,130,0.06)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)', margin: '0 0 0.375rem' }}>
                Awaiting client response
              </p>
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', margin: 0, lineHeight: 1.65 }}>
                You proposed{' '}
                <strong style={{ color: 'var(--cream)' }}>
                  {selectedBooking.counter_offer_date
                    ? new Date(`${selectedBooking.counter_offer_date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                    : '—'}
                  {selectedBooking.counter_offer_time && ` at ${fmtH(parseInt(selectedBooking.counter_offer_time.substring(0, 2), 10))}`}
                </strong>
                . Waiting for the client to accept or respond.
              </p>
            </div>
          </div>
        )}

        {/* Pending consent — confirm/decline + optional propose time */}
        {(selectedBooking.appointment_status === 'pending_consent' || selectedBooking.appointment_status === 'rescheduled') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {artistActionMode === 'none' && (
              <>
                <div>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', display: 'block', marginBottom: '0.5rem' }}>
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
                      const startH = parseInt(selectedBooking.appointment_time!.substring(0, 2), 10);
                      const endH = startH + confirmDurationHours;
                      return (
                        <p style={{ margin: '0.5rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.55)' }}>
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
                  <p style={{ margin: '-0.375rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--text-low)' }}>
                    Client sees start time only. Calendar still blocks the full session.
                  </p>
                )}

                {bookingError && (
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#f87171' }}>{bookingError}</p>
                )}

                <button
                  type="button"
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
                  type="button"
                  onClick={() => { setArtistActionMode('counter-offer'); setCounterOfferDate(null); setCounterOfferSlot(null); setCounterOfferNote(''); }}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.72rem' }}
                >
                  Propose a different time
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled', '')}
                  disabled={isUpdating}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '0.75rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', opacity: isUpdating ? 0.6 : 1, cursor: isUpdating ? 'default' : 'pointer' }}
                >
                  Decline request
                </button>
              </>
            )}
            {artistActionMode === 'counter-offer' && (
              <div>
                <p style={{ ...labelStyle, marginBottom: '1rem' }}>Propose a different time</p>
                <div style={{ padding: '1rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', marginBottom: counterOfferDate ? '0.875rem' : '0' }}>
                  <AvailabilityCalendar
                    artistId={selectedBooking.artist_id ?? artist?.id ?? ''}
                    selectedDate={counterOfferDate}
                    onDateSelect={(d) => { setCounterOfferDate(d); setCounterOfferSlot(null); }}
                    onAvailabilityLoad={setCounterOfferAvailData}
                  />
                </div>
                {counterOfferDate && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <TimeSlotPicker
                      date={counterOfferDate}
                      selectedSlot={counterOfferSlot}
                      onSlotSelect={setCounterOfferSlot}
                      slotData={counterOfferAvailData?.slotData}
                    />
                  </div>
                )}
                <div style={{ marginBottom: '0.875rem' }}>
                  <span style={{ ...labelStyle, marginBottom: '0.375rem' }}>Note for client</span>
                  <textarea
                    value={counterOfferNote}
                    onChange={e => setCounterOfferNote(e.target.value)}
                    placeholder="Explain why this time works better…"
                    rows={3}
                    style={{ width: '100%', resize: 'vertical', minHeight: '4rem' }}
                  />
                </div>
                {bookingError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: '#f87171' }}>{bookingError}</p>}
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button
                    type="button"
                    onClick={handleArtistCounterOffer}
                    disabled={!counterOfferDate || !counterOfferSlot || !counterOfferNote.trim() || counterOfferActing}
                    className="btn-primary"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.72rem', opacity: (!counterOfferDate || !counterOfferSlot || !counterOfferNote.trim() || counterOfferActing) ? 0.4 : 1 }}
                  >
                    {counterOfferActing ? 'Sending…' : 'Send proposal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setArtistActionMode('none'); setCounterOfferDate(null); setCounterOfferSlot(null); setCounterOfferNote(''); }}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.72rem' }}
                  >
                    Go back
                  </button>
                </div>
              </div>
            )}
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
          <p style={{ margin: '2px 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
            {artist?.full_name}
          </p>
        </div>
        <button
          onClick={() => { logout(); router.push('/artist/login'); }}
          style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)', background: 'none', border: '1px solid var(--border)', padding: '0.5rem 0.875rem', borderRadius: '2rem', cursor: 'pointer', transition: 'border-color 0.3s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          Sign out
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Welcome greeting */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Artist Studio</p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 0.5rem' }}>
            Welcome back{artist?.full_name ? `, ${artist.full_name.split(' ')[0]}` : ''}
          </h1>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.6, margin: 0 }}>
            Manage your bookings, availability, and client conversations
          </p>
        </div>

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
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: isToday ? 'var(--gold)' : 'rgba(201,168,76,0.5)' }}>
                  {isToday ? `Today · ${todayCount} session${todayCount > 1 ? 's' : ''}` : 'Next session'}
                </span>
                <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.25rem', color: 'var(--cream)', lineHeight: 1.2 }}>
                  {next.first_name} {next.last_name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', flex: 1 }}>
                <div>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', display: 'block' }}>Date</span>
                  <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', fontWeight: isToday ? 500 : 400 }}>
                    {isToday ? 'Today' : new Date(nextDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {startHour !== null && (
                  <div>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', display: 'block' }}>Time</span>
                    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)' }}>
                      {fmtHour(startHour)}{endHour ? ` → ${fmtHour(endHour)}` : ''}
                    </span>
                  </div>
                )}
                {next.placement && (
                  <div>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', display: 'block' }}>Placement</span>
                    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)' }}>{next.placement}</span>
                  </div>
                )}
                {next.estimated_duration_minutes && (
                  <div>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', display: 'block' }}>Duration</span>
                    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)' }}>
                      {Math.round(next.estimated_duration_minutes / 60)}h
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setTab('bookings'); setSelectedBooking(next); }}
                style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', background: 'none', border: '1px solid rgba(201,168,76,0.3)', padding: '0.5rem 0.875rem', borderRadius: '2rem', cursor: 'pointer', transition: 'border-color 0.25s ease', flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
              >
                View →
              </button>
            </div>
          );
        })()}

        {/* Tab bar */}
        <div className="scroll-no-bar" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderBottom: '1px solid var(--border)', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: 0, minWidth: 'max-content' }}>
          {([
            { key: 'bookings', label: 'Bookings', badge: 0 },
            { key: 'calendar', label: 'Calendar', badge: 0 },
            { key: 'consultations', label: 'Consultations', badge: pendingConsultations },
            { key: 'availability', label: 'Availability', badge: 0 },
            { key: 'stats',        label: 'Stats',        badge: 0 },
          ] as const).map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                paddingBottom: '1rem',
                paddingRight: '1.5rem',
                paddingLeft: '0',
                background: 'none',
                border: 'none',
                borderBottom: tab === key ? '2px solid var(--gold)' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.875rem',
                fontWeight: tab === key ? 500 : 400,
                color: tab === key ? 'var(--gold)' : 'var(--text-mid)',
                transition: 'color 0.2s ease',
                marginBottom: '-1px',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
              {badge > 0 && (
                <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', background: 'var(--gold)', color: 'var(--bg)', borderRadius: '2rem', fontSize: '0.72rem' }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
          </div>
        </div>

        {/* Bookings tab */}
        {tab === 'bookings' && (
          <div>
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
                      fontSize: '0.75rem',
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
              ) : filteredBookings.length === 0 && pastBookingsAll.length === 0 ? (
                <p style={{ color: 'var(--text-low)', fontSize: '0.9rem', padding: '2rem 0' }}>No bookings found.</p>
              ) : (
                <>
                  {statusFilter === 'all' && filteredBookings.filter(b => activeStatuses.includes(b.appointment_status)).length === 0 && (
                    <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', marginBottom: '1rem' }}>No upcoming bookings.</p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(statusFilter === 'all'
                      ? filteredBookings.filter(b => activeStatuses.includes(b.appointment_status))
                      : filteredBookings
                    ).map(renderBookingRow)}
                  </div>
                  {statusFilter === 'all' && pastBookingsAll.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowPastBookings(p => !p)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', padding: '0.75rem 0', cursor: 'pointer', borderTop: '1px solid var(--border)', width: '100%', textAlign: 'left', marginTop: '0.5rem' }}
                      >
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                          Past Bookings ({pastBookingsAll.length})
                        </span>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'var(--text-low)', marginLeft: 'auto' }}>
                          {showPastBookings ? '↑ Hide' : '↓ Show'}
                        </span>
                      </button>
                      {showPastBookings && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.7 }}>
                          {pastBookingsAll.map(renderBookingRow)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Booking detail panel — drops below, centred */}
            {selectedBooking && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                {renderBookingDetailPanel({ width: '100%', maxWidth: '640px' })}
              </div>
            )}
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
                  style={{ padding: '0.3rem 0.875rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'none', color: 'var(--text-mid)', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s ease' }}
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
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: isToday ? 'var(--gold)' : 'var(--text-low)' }}>
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
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.06em', color: 'var(--text-low)', whiteSpace: 'nowrap' }}>
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
                        onClick={() => { setSelectedBooking(isSelected ? null : booking); setArtistActionMode('none'); setCounterOfferDate(null); setCounterOfferSlot(null); setCounterOfferNote(''); }}
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
                        <p style={{ margin: '0.1rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.05em', color: st.color, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fmtH(startHour)}{booking.estimated_duration_minutes ? ` → ${fmtH(startHour + Math.round(booking.estimated_duration_minutes / 60))}` : ''}
                        </p>
                        {durationH >= 2 && booking.placement && (
                          <p style={{ margin: '0.125rem 0 0', fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem', color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

        {/* ── Consultations tab ────────────────────────────────────────────── */}
        {tab === 'consultations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {consultationError && (
              <div style={{ padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#f87171' }}>{consultationError}</p>
              </div>
            )}

            {consultations.filter(c => c.status !== 'declined').length === 0 && consultations.filter(c => c.status === 'declined').length === 0 ? (
              <p style={{ color: 'var(--text-low)', fontSize: '0.9rem', padding: '2rem 0' }}>No consultation requests yet.</p>
            ) : (
              consultations.filter(c => c.status !== 'declined').map((c) => {
                const actionKey = consultActionId?.startsWith(c.consultation_id) ? consultActionId : null;
                const isChatOpen = openConsultChatId === c.consultation_id;
                return (
                  <div
                    key={c.consultation_id}
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${isChatOpen ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {/* Summary row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                      <div>
                        <p style={{ margin: '0 0 0.25rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 300, color: 'var(--cream)' }}>
                          {c.first_name} {c.last_name}
                        </p>
                        <p style={{ margin: '0 0 0.375rem', fontSize: '0.8125rem', color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '560px' }}>
                          {c.message}
                        </p>
                        <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--text-low)' }}>
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {c.preferred_dates ? ` · preferred: ${c.preferred_dates}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    {/* Pending — approve / decline actions */}
                    {c.status === 'pending' && (
                      <div style={{ padding: '0 1.5rem 1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        {!actionKey ? (
                          <div style={{ display: 'flex', gap: '0.625rem' }}>
                            <button
                              type="button"
                              onClick={() => { setConsultActionId(`${c.consultation_id}:approve`); setConsultResponseText(''); setConsultationError(''); }}
                              style={{ padding: '0.5rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#16A34A', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '0.375rem', cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => { setConsultActionId(`${c.consultation_id}:decline`); setConsultResponseText(''); setConsultationError(''); }}
                              style={{ padding: '0.5rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '0.375rem', cursor: 'pointer' }}
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p style={{ margin: '0 0 0.625rem', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: actionKey.endsWith(':approve') ? '#16A34A' : '#f87171' }}>
                              {actionKey.endsWith(':approve') ? `Approve ${c.first_name}'s consultation` : `Decline ${c.first_name}'s request`}
                            </p>
                            <textarea
                              value={consultResponseText}
                              onChange={(e) => setConsultResponseText(e.target.value)}
                              placeholder={actionKey.endsWith(':approve') ? 'Optional: add a note for the client…' : 'Optional: let them know why…'}
                              rows={3}
                              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem', fontFamily: '"DM Sans", sans-serif' }}
                              onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
                              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                            />
                            <div style={{ display: 'flex', gap: '0.625rem' }}>
                              <button
                                type="button"
                                onClick={handleConsultAction}
                                disabled={consultActioning}
                                style={{
                                  padding: '0.5rem 1.125rem',
                                  background: actionKey.endsWith(':approve') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                                  border: `1px solid ${actionKey.endsWith(':approve') ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.3)'}`,
                                  color: actionKey.endsWith(':approve') ? '#16A34A' : '#f87171',
                                  fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '0.375rem',
                                  cursor: consultActioning ? 'default' : 'pointer', opacity: consultActioning ? 0.6 : 1,
                                }}
                              >
                                {consultActioning ? '…' : actionKey.endsWith(':approve') ? 'Confirm approve' : 'Confirm decline'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setConsultActionId(null); setConsultResponseText(''); setConsultationError(''); }}
                                className="btn-secondary"
                                style={{ padding: '0.5rem 0.875rem', fontSize: '0.72rem' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chat toggle — available for any non-declined consultation (pending = open dialogue) */}
                    {c.status !== 'declined' && (
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenConsultChatId(isChatOpen ? null : c.consultation_id);
                            setConsultMsgDraft('');
                            setConsultMsgError('');
                          }}
                          style={{ width: '100%', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: isChatOpen ? 'var(--gold)' : 'var(--text-mid)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', transition: 'color 0.2s ease' }}
                        >
                          <span>{isChatOpen ? 'Close chat' : c.status === 'pending' ? 'Ask client for more info' : 'Open chat with client'}</span>
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', opacity: 0.7 }}>{isChatOpen ? '↑' : '↓'}</span>
                        </button>

                        {isChatOpen && (
                          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '22rem' }}>
                            {/* Messages */}
                            <div ref={consultMsgAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {consultMsgs.length === 0 ? (
                                <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
                                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.0625rem', color: 'var(--text-mid)', marginBottom: '0.375rem' }}>Consultation approved</p>
                                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>Start the conversation with {c.first_name}.</p>
                                </div>
                              ) : (
                                consultMsgs.map((msg, i) => {
                                  const isArtist = msg.sender_type === 'artist';
                                  const prev = consultMsgs[i - 1];
                                  const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                                  return (
                                    <div key={msg.id}>
                                      {showDate && (
                                        <p style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.75rem 0 0.5rem' }}>
                                          {new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                      )}
                                      <div style={{ display: 'flex', justifyContent: isArtist ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ maxWidth: '72%', padding: '0.625rem 0.875rem', borderRadius: isArtist ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', background: isArtist ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isArtist ? 'rgba(201,168,76,0.3)' : 'var(--border)'}` }}>
                                          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>{msg.body}</p>
                                          <p style={{ margin: '0.25rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.06em', color: isArtist ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', textAlign: isArtist ? 'right' : 'left' }}>
                                            {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Input */}
                            <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                              {consultMsgError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#f87171' }}>{consultMsgError}</p>}
                              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                                <textarea
                                  value={consultMsgDraft}
                                  onChange={(e) => setConsultMsgDraft(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendConsultMsg(); } }}
                                  placeholder="Write a message… (Enter to send)"
                                  rows={2}
                                  style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'none', outline: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'border-color 0.2s ease' }}
                                  onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                                />
                                <button
                                  type="button"
                                  onClick={sendConsultMsg}
                                  disabled={!consultMsgDraft.trim() || consultMsgSending}
                                  className="btn-primary"
                                  style={{ padding: '0.625rem 1.125rem', flexShrink: 0, opacity: (!consultMsgDraft.trim() || consultMsgSending) ? 0.5 : 1, cursor: (!consultMsgDraft.trim() || consultMsgSending) ? 'default' : 'pointer' }}
                                >
                                  {consultMsgSending ? '…' : '→'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Declined — show artist response if any */}
                    {c.status === 'declined' && c.artist_response && (
                      <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', background: 'rgba(239,68,68,0.04)' }}>
                        <span style={{ ...labelStyle, fontSize: '0.65rem', opacity: 0.75 }}>Your response</span>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>{c.artist_response}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {/* Declined consultations — collapsed */}
            {consultations.filter(c => c.status === 'declined').length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowDeclinedConsults(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', padding: '0.75rem 0', cursor: 'pointer', borderTop: '1px solid var(--border)', width: '100%', textAlign: 'left' }}
                >
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                    Declined ({consultations.filter(c => c.status === 'declined').length})
                  </span>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'var(--text-low)', marginLeft: 'auto' }}>
                    {showDeclinedConsults ? '↑ Hide' : '↓ Show'}
                  </span>
                </button>
                {showDeclinedConsults && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', opacity: 0.7 }}>
                    {consultations.filter(c => c.status === 'declined').map((c) => {
                      return (
                        <div
                          key={c.consultation_id}
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden' }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                            <div>
                              <p style={{ margin: '0 0 0.25rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 300, color: 'var(--text-mid)' }}>
                                {c.first_name} {c.last_name}
                              </p>
                              <p style={{ margin: '0 0 0.375rem', fontSize: '0.8125rem', color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '560px' }}>
                                {c.message}
                              </p>
                              <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--text-low)' }}>
                                {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <StatusBadge status={c.status} />
                          </div>
                          {c.artist_response && (
                            <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', background: 'rgba(239,68,68,0.04)' }}>
                              <span style={{ ...labelStyle, fontSize: '0.65rem', opacity: 0.75 }}>Your response</span>
                              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>{c.artist_response}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Confirmed booking conversations (within Consultations tab) ───── */}
        {/* ── Confirmed booking conversations (within Consultations tab) ───── */}
        {tab === 'consultations' && (() => {
          const confirmedBookings = bookings.filter(b => b.appointment_status === 'confirmed');
          const completedBookings = bookings.filter(b => b.appointment_status === 'completed');
          if (confirmedBookings.length === 0 && completedBookings.length === 0) return null;
          return (
            <div style={{ marginTop: '1.5rem' }}>
              <span style={{ ...labelStyle, display: 'block', marginBottom: '0.875rem' }}>Booking conversations</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {confirmedBookings.map((b) => {
                  const isOpen = openBookingChatId === b.id;
                  const dateStr = new Date(b.appointment_date_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                  return (
                    <div key={b.id} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`, borderRadius: '0.75rem', overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '1rem', padding: '1.125rem 1.5rem' }}>
                        <div>
                          <p style={{ margin: '0 0 0.2rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.0625rem', color: 'var(--cream)' }}>
                            {b.first_name} {b.last_name} · {dateStr}
                          </p>
                          <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--text-low)' }}>
                            {b.booking_reference}
                          </p>
                        </div>
                        <StatusBadge status={b.appointment_status} />
                      </div>
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                          type="button"
                          onClick={() => { setOpenBookingChatId(isOpen ? null : b.id); setBookingChatDraft(''); setBookingChatError(''); }}
                          style={{ width: '100%', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: isOpen ? 'var(--gold)' : 'var(--text-mid)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', transition: 'color 0.2s ease' }}
                        >
                          <span>{isOpen ? 'Close chat' : 'Message client'}</span>
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', opacity: 0.7 }}>{isOpen ? '↑' : '↓'}</span>
                        </button>
                        {isOpen && (
                          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '22rem' }}>
                            <div ref={bookingChatAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {bookingChatMsgs.length === 0 ? (
                                <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
                                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.0625rem', color: 'var(--text-mid)', marginBottom: '0.375rem' }}>Start the conversation</p>
                                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>Send {b.first_name} a message about their booking.</p>
                                </div>
                              ) : (
                                bookingChatMsgs.map((msg, i) => {
                                  const isArtist = msg.sender_type === 'artist';
                                  const prev = bookingChatMsgs[i - 1];
                                  const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                                  return (
                                    <div key={msg.id}>
                                      {showDate && (
                                        <p style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.75rem 0 0.5rem' }}>
                                          {new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                      )}
                                      <div style={{ display: 'flex', justifyContent: isArtist ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ maxWidth: '72%', padding: '0.625rem 0.875rem', borderRadius: isArtist ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', background: isArtist ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isArtist ? 'rgba(201,168,76,0.3)' : 'var(--border)'}` }}>
                                          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>{msg.body}</p>
                                          <p style={{ margin: '0.25rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.06em', color: isArtist ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', textAlign: isArtist ? 'right' : 'left' }}>
                                            {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                            <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                              {bookingChatError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#f87171' }}>{bookingChatError}</p>}
                              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                                <textarea
                                  value={bookingChatDraft}
                                  onChange={(e) => setBookingChatDraft(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBookingChatMsg(); } }}
                                  placeholder="Write a message… (Enter to send)"
                                  rows={2}
                                  style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'none', outline: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'border-color 0.2s ease' }}
                                  onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                                />
                                <button
                                  type="button"
                                  onClick={sendBookingChatMsg}
                                  disabled={!bookingChatDraft.trim() || bookingChatSending}
                                  className="btn-primary"
                                  style={{ padding: '0.625rem 1.125rem', flexShrink: 0, opacity: (!bookingChatDraft.trim() || bookingChatSending) ? 0.5 : 1, cursor: (!bookingChatDraft.trim() || bookingChatSending) ? 'default' : 'pointer' }}
                                >
                                  {bookingChatSending ? '…' : '→'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {completedBookings.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowCompletedChats(p => !p)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', padding: '0.75rem 0', cursor: 'pointer', borderTop: '1px solid var(--border)', width: '100%', textAlign: 'left' }}
                  >
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                      Past Sessions ({completedBookings.length})
                    </span>
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'var(--text-low)', marginLeft: 'auto' }}>
                      {showCompletedChats ? '↑ Hide' : '↓ Show'}
                    </span>
                  </button>
                  {showCompletedChats && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', opacity: 0.7 }}>
                      {completedBookings.map((b) => {
                        const isOpen = openBookingChatId === b.id;
                        const dateStr = new Date(b.appointment_date_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                        return (
                          <div key={b.id} style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`, borderRadius: '0.75rem', overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '1rem', padding: '1.125rem 1.5rem' }}>
                              <div>
                                <p style={{ margin: '0 0 0.2rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.0625rem', color: 'var(--cream)' }}>
                                  {b.first_name} {b.last_name} · {dateStr}
                                </p>
                                <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--text-low)' }}>
                                  {b.booking_reference}
                                </p>
                              </div>
                              <StatusBadge status={b.appointment_status} />
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)' }}>
                              <button
                                type="button"
                                onClick={() => { setOpenBookingChatId(isOpen ? null : b.id); setBookingChatDraft(''); setBookingChatError(''); }}
                                style={{ width: '100%', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: isOpen ? 'var(--gold)' : 'var(--text-mid)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', transition: 'color 0.2s ease' }}
                              >
                                <span>{isOpen ? 'Close chat' : 'Message client'}</span>
                                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', opacity: 0.7 }}>{isOpen ? '↑' : '↓'}</span>
                              </button>
                              {isOpen && (
                                <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '22rem' }}>
                                  <div ref={bookingChatAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {bookingChatMsgs.length === 0 ? (
                                      <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
                                        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.0625rem', color: 'var(--text-mid)', marginBottom: '0.375rem' }}>Start the conversation</p>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>Send {b.first_name} a message about their booking.</p>
                                      </div>
                                    ) : (
                                      bookingChatMsgs.map((msg, i) => {
                                        const isArtist = msg.sender_type === 'artist';
                                        const prev = bookingChatMsgs[i - 1];
                                        const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                                        return (
                                          <div key={msg.id}>
                                            {showDate && (
                                              <p style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.75rem 0 0.5rem' }}>
                                                {new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                              </p>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: isArtist ? 'flex-end' : 'flex-start' }}>
                                              <div style={{ maxWidth: '72%', padding: '0.625rem 0.875rem', borderRadius: isArtist ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', background: isArtist ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isArtist ? 'rgba(201,168,76,0.3)' : 'var(--border)'}` }}>
                                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, wordBreak: 'break-word' }}>{msg.body}</p>
                                                <p style={{ margin: '0.25rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.06em', color: isArtist ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', textAlign: isArtist ? 'right' : 'left' }}>
                                                  {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                  <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                                    {bookingChatError && <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#f87171' }}>{bookingChatError}</p>}
                                    <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                                      <textarea
                                        value={bookingChatDraft}
                                        onChange={(e) => setBookingChatDraft(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBookingChatMsg(); } }}
                                        placeholder="Write a message… (Enter to send)"
                                        rows={2}
                                        style={{ flex: 1, padding: '0.625rem 0.875rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5, resize: 'none', outline: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'border-color 0.2s ease' }}
                                        onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                                        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                                      />
                                      <button
                                        type="button"
                                        onClick={sendBookingChatMsg}
                                        disabled={!bookingChatDraft.trim() || bookingChatSending}
                                        className="btn-primary"
                                        style={{ padding: '0.625rem 1.125rem', flexShrink: 0, opacity: (!bookingChatDraft.trim() || bookingChatSending) ? 0.5 : 1, cursor: (!bookingChatDraft.trim() || bookingChatSending) ? 'default' : 'pointer' }}
                                      >
                                        {bookingChatSending ? '…' : '→'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Availability tab ─────────────────────────────────────────────── */}
        {tab === 'availability' && (
          <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? 'minmax(0,480px) 320px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

            {/* Calendar panel */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem', maxWidth: '480px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <button
                  type="button"
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
                  <p style={{ margin: '0.1rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
                    {avYear}
                  </p>
                </div>

                <button
                  type="button"
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
                  <div key={d} style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', padding: '0.25rem 0' }}>
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
                          {inMonth && isFullBlocked && <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>✕</span>}
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
                    <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)' }}>{label}</span>
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
                    <p style={{ margin: '0.2rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
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
                        <p style={{ margin: '0.15rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
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
                          fontSize: '0.72rem',
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
                      <p style={{ margin: '0 0 0.625rem', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
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
                              <p style={{ margin: '0.1rem 0 0', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)' }}>{statusLabel}</p>
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
                                  fontSize: '0.7rem',
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
        {/* ── Stats tab ────────────────────────────────────────────────────── */}
        {tab === 'stats' && (() => {
          const now = new Date();
          const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

          const getMonthKey = (b: Booking) => (b.appointment_date_time || '').slice(0, 7);

          const completed  = bookings.filter(b => b.appointment_status === 'completed');
          const confirmed  = bookings.filter(b => b.appointment_status === 'confirmed');
          const pending    = bookings.filter(b => ['pending', 'pending_consent', 'rescheduled'].includes(b.appointment_status));
          const cancelled  = bookings.filter(b => b.appointment_status === 'cancelled');

          const thisMonthAll       = bookings.filter(b => getMonthKey(b) === thisMonthKey);
          const thisMonthCompleted = completed.filter(b => getMonthKey(b) === thisMonthKey);
          const thisMonthConfirmed = confirmed.filter(b => getMonthKey(b) === thisMonthKey);
          const lastMonthCompleted = completed.filter(b => getMonthKey(b) === lastMonthKey);

          const estimateRevenue = (list: Booking[]) =>
            list.reduce((sum, b) => sum + Math.round((b.estimated_duration_minutes ?? 60) / 60 * 150), 0);

          const allTimeRevenue    = estimateRevenue(completed);
          const thisMonthRevenue  = estimateRevenue([...thisMonthCompleted, ...thisMonthConfirmed]);
          const lastMonthRevenue  = estimateRevenue(lastMonthCompleted);

          const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const monthLabel     = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
          const lastMonthLabel = `${MONTH_NAMES[lastMonthDate.getMonth()]} ${lastMonthDate.getFullYear()}`;

          const total = bookings.length || 1;

          return (
            <div style={{ maxWidth: '720px' }}>

              {/* Headline stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Total Bookings', value: bookings.length, sub: 'All time' },
                  { label: 'Completed',       value: completed.length, sub: 'Sessions done' },
                  { label: 'Upcoming',        value: confirmed.length,  sub: 'Confirmed' },
                  { label: monthLabel,        value: thisMonthAll.length, sub: 'This month' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.375rem 1.25rem' }}>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', margin: '0 0 0.625rem' }}>{s.label}</p>
                    <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '2.5rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1, margin: '0 0 0.25rem' }}>{s.value}</p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--text-low)', margin: 0 }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Revenue estimate */}
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem' }}>
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', margin: '0 0 0.25rem' }}>Revenue Estimate</p>
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'var(--text-low)', margin: '0 0 1.5rem' }}>
                  Calculated at £150/hr from session duration. Actual totals depend on your invoicing.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
                  {[
                    { label: 'All-time (completed)', value: `£${allTimeRevenue.toLocaleString()}` },
                    { label: monthLabel,              value: `£${thisMonthRevenue.toLocaleString()}`,  sub: 'completed + confirmed' },
                    { label: lastMonthLabel,          value: `£${lastMonthRevenue.toLocaleString()}`,  sub: 'completed' },
                  ].map(r => (
                    <div key={r.label}>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0 0 0.375rem' }}>{r.label}</p>
                      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.875rem', fontWeight: 300, color: 'var(--gold)', lineHeight: 1, margin: 0 }}>{r.value}</p>
                      {r.sub && <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: 'var(--text-low)', margin: '0.25rem 0 0' }}>{r.sub}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status breakdown with bar */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1.125rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', margin: 0 }}>Bookings by Status</p>
                </div>
                {([
                  { label: 'Completed',                count: completed.length, color: 'var(--gold)' },
                  { label: 'Confirmed (upcoming)',      count: confirmed.length,  color: '#16A34A' },
                  { label: 'Pending / Awaiting consent', count: pending.length,  color: '#CA8A04' },
                  { label: 'Cancelled',                count: cancelled.length,  color: '#DC2626' },
                ] as const).map((row, i, arr) => (
                  <div key={row.label} style={{ padding: '0.875rem 1.5rem', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text)' }}>{row.label}</span>
                      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.125rem', color: row.color }}>{row.count}</span>
                    </div>
                    <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(row.count / total * 100)}%`, background: row.color, borderRadius: '1px', opacity: 0.5, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--text-low)', textAlign: 'center' }}>
                Revenue figures are estimates only · Data reflects all bookings in your records
              </p>
            </div>
          );
        })()}

      </main>
    </div>
  );
}
