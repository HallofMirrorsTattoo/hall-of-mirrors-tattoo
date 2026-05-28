'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';
import { sortArtists } from '@/lib/artistOrder';
import AvailabilityCalendar, { AvailabilityData } from '@/app/components/AvailabilityCalendar';
import TimeSlotPicker from '@/app/components/TimeSlotPicker';
import type { StudioSettings } from '@/lib/studioSettings';

interface Artist {
  id: string;
  full_name: string;
}

const BookingSchema = z.object({
  clientName:              z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail:             z.string().email('Invalid email address'),
  clientPhone:             z.string().min(10, 'Phone number must be at least 10 digits'),
  tattooDesignDescription: z.string().min(10, 'Please describe your design in at least 10 characters'),
  estimatedSize:           z.enum(['small', 'medium', 'large', 'xlarge']),
  estimatedPlacement:      z.string().min(2, 'Please specify placement'),
  referralSource:          z.string().optional(),
  notes:                   z.string().optional(),
  artistId:                z.string().min(1, 'Please choose an artist'),
  clientBudget:            z.preprocess(v => v === '' || v === undefined || v === null ? undefined : Number(v), z.number().positive().optional()),
});

type BookingFormData = z.infer<typeof BookingSchema>;

const mono: React.CSSProperties = { fontFamily: '"DM Mono", monospace' };
const serif: React.CSSProperties = { fontFamily: '"Cormorant Garamond", serif' };

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--border)',
  margin: '1.75rem 0',
};

function fmtSlot(slot: string): string {
  const h = parseInt(slot.substring(0, 2), 10);
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

function StepIndicator({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2rem' }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                border: `1px solid ${active || done ? 'var(--gold)' : 'var(--border)'}`,
                background: done ? 'var(--gold)' : active ? 'rgba(201,168,76,0.12)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s ease',
              }}>
                {done ? (
                  <span style={{ ...mono, fontSize: '0.75rem', color: 'var(--bg)' }}>✓</span>
                ) : (
                  <span style={{ ...mono, fontSize: '0.72rem', color: active ? 'var(--gold)' : 'var(--text-low)' }}>{n}</span>
                )}
              </div>
              <span style={{ ...mono, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: active ? 'var(--gold)' : done ? 'rgba(201,168,76,0.5)' : 'var(--text-low)', whiteSpace: 'nowrap' }}>
                {labels[i]}
              </span>
            </div>
            {n < total && (
              <div style={{ width: '3.5rem', height: '1px', background: n < step ? 'var(--gold)' : 'var(--border)', margin: '0 0.375rem 1.25rem', opacity: 0.5, transition: 'background 0.25s ease' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid var(--border)', gap: '1rem' }}>
      <span style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: 'var(--text)', textAlign: 'right', lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

// Suspense wrapper required by Next.js 14 because BookingPageContent calls
// useSearchParams(), which forces the page out of static generation unless
// it sits inside a <Suspense>. Without this the production build fails at
// the "Generating static pages" step with a CSR bailout error.
export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingPageContent />
    </Suspense>
  );
}

function BookingPageContent() {
  const { user, accessToken, activate } = useClientAuth();
  const searchParams = useSearchParams();
  const initialMode = searchParams?.get('mode') === 'consultation' ? 'consultation' : 'booking';
  const prefilledArtistId = searchParams?.get('artist') || '';
  const [formMode, setFormMode] = useState<'booking' | 'consultation'>(initialMode);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitStatus, setSubmitStatus]   = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage]   = useState('');
  const [artists, setArtists]             = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  // Captured on successful submit for confirmation card
  const [confirmedRef, setConfirmedRef]           = useState('');
  const [confirmedDate, setConfirmedDate]         = useState<string | null>(null);
  const [confirmedSlot, setConfirmedSlot]         = useState<string | null>(null);
  const [confirmedArtist, setConfirmedArtist]     = useState('');

  // Post-booking account activation (only available when email is captured in-flow)
  const [capturedEmail, setCapturedEmail]           = useState('');
  const [activationPw, setActivationPw]             = useState('');
  const [activationState, setActivationState]       = useState<'idle' | 'submitting' | 'done' | 'dismissed'>('idle');
  const [activationError, setActivationError]       = useState('');
  // True when the booking's email already has an active account — we show a
  // "sign in" prompt rather than the "create account" activation card.
  const [existingAccount, setExistingAccount]       = useState(false);

  const [policyAccepted, setPolicyAccepted]        = useState(false);
  const [studioSettings, setStudioSettings]        = useState<StudioSettings | null>(null);

  // Availability state
  const [selectedArtistId, setSelectedArtistId]   = useState('');
  const [selectedDate, setSelectedDate]           = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot]           = useState<string | null>(null);
  const [availabilityData, setAvailabilityData]   = useState<AvailabilityData | null>(null);
  const [dateError, setDateError]                 = useState('');
  const [slotError, setSlotError]                 = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, trigger, getValues } = useForm<BookingFormData>({
    resolver: zodResolver(BookingSchema),
    defaultValues: { artistId: '' },
  });

  const watchedArtistId = watch('artistId');

  // Pre-fill from logged-in account
  useEffect(() => {
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
      if (fullName) setValue('clientName', fullName);
      if (user.email) setValue('clientEmail', user.email);
      if (user.phone) setValue('clientPhone', user.phone);
    }
  }, [user, setValue]);

  // Sync artist selector state
  useEffect(() => {
    setSelectedArtistId(watchedArtistId || '');
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailabilityData(null);
  }, [watchedArtistId]);

  // Reset wizard step when switching modes
  useEffect(() => {
    setStep(1);
    setDateError('');
    setSlotError('');
  }, [formMode]);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist`);
        if (res.ok) {
          const data = await res.json();
          const list: Artist[] = data.artists || [];
          setArtists(sortArtists(list));
          // Honour ?artist=<id> from deep links (e.g. artist profile page CTA)
          if (prefilledArtistId && list.some(a => a.id === prefilledArtistId)) {
            setValue('artistId', prefilledArtistId);
          }
        }
      } catch {
        // non-critical
      } finally {
        setLoadingArtists(false);
      }
    };
    fetchArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledArtistId]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/studio-settings`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setStudioSettings(d))
      .catch(() => {});
  }, []);


  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setDateError('');
    setSlotError('');
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setSlotError('');
  };

  const nextStep = async () => {
    if (step === 1) {
      const ok = await trigger(['clientName', 'clientEmail', 'clientPhone']);
      if (!ok) return;
    }
    if (step === 2 && formMode === 'booking') {
      const ok = await trigger(['tattooDesignDescription', 'estimatedSize', 'estimatedPlacement']);
      if (!ok) return;
      let valid = true;
      if (!selectedDate) { setDateError('Please select a date.'); valid = false; }
      if (selectedArtistId && selectedDate && !selectedSlot) { setSlotError('Please select a time slot.'); valid = false; }
      if (!valid) return;
    }
    if (step === 2 && formMode === 'consultation') {
      const ok = await trigger(['tattooDesignDescription']);
      if (!ok) return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: BookingFormData) => {
    // Final date validation guard (shouldn't normally fail — already checked in nextStep)
    if (formMode === 'booking') {
      let valid = true;
      if (!selectedDate) { setDateError('Please select a date.'); valid = false; }
      if (selectedArtistId && !selectedSlot) { setSlotError('Please select a time slot.'); valid = false; }
      if (!valid) { setStep(2); return; }
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      if (formMode === 'consultation') {
        if (!user) {
          throw new Error('Please log in or create an account to request a consultation, this enables direct messaging with your artist.');
        }
        // Zod requires artistId at this point, but be defensive in case the
        // artist list was empty for some reason at submit time.
        const artistId = data.artistId;
        if (!artistId) throw new Error('Please choose an artist before submitting.');
        const message = data.tattooDesignDescription + (data.notes ? `\n\nAdditional notes: ${data.notes}` : '');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/consultations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken || ''}` },
          body: JSON.stringify({ artist_id: artistId, message }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to submit consultation request');
        }
        setConfirmedRef('');
        setConfirmedDate(null);
        setConfirmedSlot(null);
        setConfirmedArtist(artists.find((a) => a.id === artistId)?.full_name ?? '');
        setSubmitStatus('success');
        reset();
        setSelectedDate(null);
        setSelectedSlot(null);
        setSelectedArtistId('');
        setStep(1);
      } else {
        const payload: Record<string, unknown> = {
          ...data,
          artistId: data.artistId, // required by the schema
          clientBudget: data.clientBudget || undefined,
          payment_method: 'not_set',
        };
        if (selectedDate) {
          payload.appointmentDate = selectedDate;
          if (selectedSlot) payload.appointmentTime = selectedSlot;
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || err.error || 'Failed to submit booking');
        }
        const json = await res.json();
        setConfirmedRef(json.booking?.booking_reference ?? '');
        setConfirmedDate(selectedDate);
        setConfirmedSlot(selectedSlot);
        setConfirmedArtist(artists.find((a) => a.id === data.artistId)?.full_name ?? '');
        // Only show the activation panel for guests — logged-in users already have an account
        if (!user) {
          setCapturedEmail(data.clientEmail);
          setExistingAccount(Boolean(json.existingAccount));
        }
        setSubmitStatus('success');
        reset();
        setSelectedDate(null);
        setSelectedSlot(null);
        setSelectedArtistId('');
        setStep(1);
        setPolicyAccepted(false);
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasArtist = Boolean(selectedArtistId);
  const vals = getValues();
  const selectedArtistName = artists.find((a) => a.id === selectedArtistId)?.full_name;

  const TOTAL_STEPS = formMode === 'booking' ? 3 : 2;
  const STEP_LABELS = formMode === 'booking'
    ? ['Your details', 'Design & date', 'Review']
    : ['Your details', 'Your idea'];

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{
        minHeight: '24dvh',
        padding: '2rem 1.5rem 2.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(201,168,76,0.055) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '40rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p className="eyebrow" style={{ marginBottom: '1.25rem' }}>Book Your Session</p>
          <h1 style={{
            ...serif,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(2.75rem, 7vw, 5rem)',
            color: 'var(--cream)',
            letterSpacing: '-0.025em',
            lineHeight: 1.0,
            marginBottom: '1.5rem',
          }}>
            Let&apos;s make something<br />together
          </h1>
          <p style={{ maxWidth: '40ch', margin: '0 auto', color: 'var(--text-mid)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            We keep bookings limited so every session gets the time it deserves.
            Your artist will confirm within 24 hours.
          </p>
          {user && (
            <p style={{ marginTop: '1rem', ...mono, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)' }}>
              Booking as {user.first_name} {user.last_name}
            </p>
          )}
        </div>
      </section>

      {/* Confirmation card */}
      {submitStatus === 'success' && (
        <section style={{ padding: '0 1.5rem 5rem' }}>
          <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div className="card-premium">
              <div className="card-premium-inner" style={{ textAlign: 'center', padding: '3rem 2.5rem' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', fontSize: '1.25rem' }}>
                  ✓
                </div>
                <h2 style={{ ...serif, fontStyle: 'italic', fontWeight: 300, fontSize: '2.25rem', color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 0.75rem' }}>
                  {formMode === 'consultation' ? 'Consultation requested.' : 'Request submitted.'}
                </h2>
                <p style={{ color: 'var(--text-mid)', fontSize: '0.9375rem', lineHeight: 1.7, maxWidth: '30ch', margin: '0 auto 2rem' }}>
                  {formMode === 'consultation'
                    ? `${confirmedArtist || 'Your artist'} will be in touch. You can message them directly from your dashboard once they respond.`
                    : 'We\'ll review and confirm within 24 hours. Check your email for a copy of this request.'}
                </p>

                <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.25rem 0', margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {confirmedRef && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Reference</span>
                      <span style={{ ...mono, fontSize: '0.8rem', color: 'var(--gold)', letterSpacing: '0.05em' }}>{confirmedRef}</span>
                    </div>
                  )}
                  {confirmedDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                      <span style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', flexShrink: 0 }}>Requested date</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text)', textAlign: 'right' }}>
                        {new Date(`${confirmedDate}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {confirmedSlot && ` · ${fmtSlot(confirmedSlot)}`}
                      </span>
                    </div>
                  )}
                  {confirmedArtist && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Artist</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{confirmedArtist}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link href="/client/dashboard" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <span>View your dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSubmitStatus('idle')}
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Book another session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Existing-account panel — when the email is already registered, send them to sign in rather than asking them to create another account */}
      {submitStatus === 'success' && !user && formMode === 'booking' && capturedEmail && existingAccount && activationState !== 'dismissed' && (
        <section style={{ padding: '0 1.5rem 5rem' }}>
          <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '0.75rem', padding: '2rem 2rem 1.75rem' }}>
              <p style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', margin: '0 0 0.75rem' }}>
                Welcome back
              </p>
              <h3 style={{ ...serif, fontStyle: 'italic', fontWeight: 300, fontSize: '1.75rem', color: 'var(--cream)', lineHeight: 1.1, margin: '0 0 0.75rem' }}>
                You already have an account
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.7, margin: '0 0 1.5rem', maxWidth: '46ch' }}>
                We&apos;ve linked this booking to your existing client account ({capturedEmail}). Sign in to track it, message your artist, and sign your consent form online.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link
                  href={`/client/login?email=${encodeURIComponent(capturedEmail)}`}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--gold)',
                    color: 'var(--bg)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    ...mono,
                    fontSize: '0.72rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.25s ease',
                  }}
                >
                  Sign in →
                </Link>
                <Link
                  href="/client/forgot-password"
                  style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mid)', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setActivationState('dismissed')}
                style={{ marginTop: '1rem', background: 'none', border: 'none', padding: 0, ...mono, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', cursor: 'pointer', display: 'block' }}
              >
                Not now
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Account activation panel — for guests whose email is NOT yet registered. Only shown when capturedEmail is set (not in Stripe redirect flow) */}
      {submitStatus === 'success' && !user && formMode === 'booking' && capturedEmail && !existingAccount && activationState !== 'done' && activationState !== 'dismissed' && (
        <section style={{ padding: '0 1.5rem 5rem' }}>
          <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '0.75rem', padding: '2rem 2rem 1.75rem' }}>
              <p style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', margin: '0 0 0.75rem' }}>
                Optional — but recommended
              </p>
              <h3 style={{ ...serif, fontStyle: 'italic', fontWeight: 300, fontSize: '1.75rem', color: 'var(--cream)', lineHeight: 1.1, margin: '0 0 0.75rem' }}>
                Message your artist directly
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.7, margin: '0 0 1.5rem', maxWidth: '44ch' }}>
                Create your client account to track this booking, message your artist, and sign your consent form online. Takes 10 seconds.
              </p>

              {activationError && (
                <div className="alert-error" style={{ marginBottom: '1rem' }}>{activationError}</div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <input
                  type="password"
                  placeholder="Choose a password (min 8 chars)"
                  value={activationPw}
                  onChange={(e) => setActivationPw(e.target.value)}
                  minLength={8}
                  style={{ flex: 1, minWidth: '200px', padding: '0.75rem 1rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--cream)', fontSize: '0.9375rem', outline: 'none' }}
                />
                <button
                  type="button"
                  disabled={activationState === 'submitting' || activationPw.length < 8}
                  onClick={async () => {
                    if (activationPw.length < 8) return;
                    setActivationState('submitting');
                    setActivationError('');
                    try {
                      await activate(capturedEmail, activationPw);
                      setActivationState('done');
                    } catch (err) {
                      setActivationError(err instanceof Error ? err.message : 'Failed to create account');
                      setActivationState('idle');
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: activationPw.length >= 8 ? 'var(--gold)' : 'var(--surface)',
                    color: activationPw.length >= 8 ? 'var(--bg)' : 'var(--text-low)',
                    border: activationPw.length >= 8 ? 'none' : '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    ...mono,
                    fontSize: '0.72rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: activationPw.length >= 8 ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.25s ease',
                    flexShrink: 0,
                  }}
                >
                  {activationState === 'submitting' ? 'Creating…' : 'Create Account →'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActivationState('dismissed')}
                style={{ marginTop: '1rem', background: 'none', border: 'none', padding: 0, ...mono, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', cursor: 'pointer', display: 'block' }}
              >
                I&apos;ll do this later
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Account created success banner */}
      {submitStatus === 'success' && activationState === 'done' && (
        <section style={{ padding: '0 1.5rem 5rem' }}>
          <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: 'var(--gold)', fontSize: '1.25rem' }}>✓</span>
              <div>
                <p style={{ margin: 0, ...mono, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Account created</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-mid)' }}>You&apos;re now logged in. Head to your dashboard to track this booking.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Wizard Form ── */}
      {submitStatus !== 'success' && (
        <section style={{ padding: '0 1.5rem 3rem' }}>
          <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div className="card-premium">
              <div className="card-premium-inner">

                {/* Mode toggle */}
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem', padding: '0.3rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '2rem' }}>
                  {(['booking', 'consultation'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormMode(m)}
                      style={{ flex: 1, padding: '0.625rem 1rem', background: formMode === m ? 'var(--gold)' : 'transparent', color: formMode === m ? 'var(--bg)' : 'var(--text-mid)', border: 'none', borderRadius: '2rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: formMode === m ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      {m === 'booking' ? 'Book a session' : 'Request a consultation'}
                    </button>
                  ))}
                </div>

                {formMode === 'consultation' && (
                  <div style={{ padding: '0.875rem 1rem', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                    <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                      No date needed, just describe your idea. Your artist will get back to you and you&apos;ll be able to message directly from your dashboard.
                      {!user && <><br /><span style={{ color: 'rgba(201,168,76,0.8)' }}> Please <a href="/client/login" style={{ color: 'var(--gold)' }}>log in</a> first to enable messaging.</span></>}
                    </p>
                  </div>
                )}

                {/* Step indicator */}
                <StepIndicator step={step} total={TOTAL_STEPS} labels={STEP_LABELS} />

                {submitStatus === 'error' && (
                  <div className="alert-error" style={{ marginBottom: '1.5rem' }}>{errorMessage}</div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                  {/* ── Step 1: Your details ── */}
                  {step === 1 && (
                    <div key="step-1" className="tab-content">
                      <p style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.85)', marginBottom: '1.5rem' }}>01 — Your details</p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                        <div>
                          <label htmlFor="clientName">Full Name</label>
                          <input {...register('clientName')} type="text" id="clientName" placeholder="Your name"
                            style={errors.clientName ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                          {errors.clientName && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.375rem' }}>{errors.clientName.message}</p>}
                        </div>

                        <div>
                          <label htmlFor="clientEmail">Email</label>
                          <input {...register('clientEmail')} type="email" id="clientEmail" placeholder="your@email.com"
                            style={errors.clientEmail ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                          {errors.clientEmail && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.375rem' }}>{errors.clientEmail.message}</p>}
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                          <label htmlFor="clientPhone">Phone Number</label>
                          <input {...register('clientPhone')} type="tel" id="clientPhone" placeholder="+44 7911 123456"
                            style={errors.clientPhone ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                          {errors.clientPhone && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.375rem' }}>{errors.clientPhone.message}</p>}
                        </div>
                      </div>

                      <button type="button" onClick={nextStep} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <span>Continue</span>
                        <span className="btn-icon" aria-hidden="true">→</span>
                      </button>
                    </div>
                  )}

                  {/* ── Step 2: Design + date (booking) or message (consultation) ── */}
                  {step === 2 && (
                    <div key="step-2" className="tab-content">
                      {formMode === 'booking' ? (
                        <>
                          <p style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.85)', marginBottom: '1.5rem' }}>02 — Design &amp; date</p>

                          {/* Artist */}
                          <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="artistId">Artist</label>
                            <select
                              {...register('artistId')}
                              id="artistId"
                              disabled={loadingArtists}
                              style={errors.artistId ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                            >
                              <option value="" disabled>Choose your artist…</option>
                              {artists.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.full_name}
                                </option>
                              ))}
                            </select>
                            {loadingArtists && (
                              <p style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text-low)', marginTop: '0.375rem' }}>Loading artists…</p>
                            )}
                            {errors.artistId && (
                              <p style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--error-text)', marginTop: '0.375rem' }}>
                                {errors.artistId.message}
                              </p>
                            )}
                            {hasArtist && !errors.artistId && (
                              <p style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.55)', marginTop: '0.5rem' }}>
                                Showing live availability for this artist
                              </p>
                            )}
                          </div>

                          <hr style={divider} />

                          {/* Date picker */}
                          <p style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '0.875rem' }}>Select a date</p>

                          {hasArtist ? (
                            <>
                              <div style={{ padding: '1.5rem', background: 'rgba(14,12,9,0.5)', border: `1px solid ${dateError ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`, borderRadius: '0.625rem', marginBottom: selectedDate ? '1.25rem' : '0' }}>
                                <AvailabilityCalendar
                                  artistId={selectedArtistId}
                                  selectedDate={selectedDate}
                                  onDateSelect={handleDateSelect}
                                  onAvailabilityLoad={setAvailabilityData}
                                />
                              </div>
                              {dateError && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.375rem', marginBottom: '1rem' }}>{dateError}</p>}
                              {selectedDate && (
                                <div style={{ padding: '1.5rem', background: 'rgba(14,12,9,0.5)', border: `1px solid ${slotError ? 'rgba(239,68,68,0.4)' : 'rgba(201,168,76,0.14)'}`, borderRadius: '0.625rem', marginBottom: '0', animation: 'fadeUp 0.3s ease forwards' }}>
                                  <TimeSlotPicker
                                    date={selectedDate}
                                    selectedSlot={selectedSlot}
                                    onSlotSelect={handleSlotSelect}
                                    slotData={availabilityData?.slotData}
                                  />
                                  {slotError && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.75rem' }}>{slotError}</p>}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div style={{ marginBottom: dateError ? '0.375rem' : '0' }}>
                                <label htmlFor="fallbackDate">Preferred Date</label>
                                <input
                                  id="fallbackDate"
                                  type="date"
                                  min={new Date().toISOString().split('T')[0]}
                                  value={selectedDate ?? ''}
                                  onChange={(e) => { setSelectedDate(e.target.value || null); setDateError(''); }}
                                  style={dateError ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                                />
                              </div>
                              {dateError && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.375rem' }}>{dateError}</p>}
                              <p style={{ ...mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: 'var(--text-low)', marginTop: '0.5rem' }}>
                                Select an artist above to choose from available time slots.
                              </p>
                            </>
                          )}

                          <hr style={divider} />

                          {/* Design fields */}
                          <p style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', marginBottom: '0.875rem' }}>Your tattoo</p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.25rem' }}>
                            <div>
                              <label htmlFor="tattooDesignDescription">Design Description</label>
                              <textarea {...register('tattooDesignDescription')} id="tattooDesignDescription"
                                placeholder="Describe your tattoo idea, inspiration, specific elements you want included…"
                                rows={4}
                                style={errors.tattooDesignDescription ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                              {errors.tattooDesignDescription && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.375rem' }}>{errors.tattooDesignDescription.message}</p>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                              <div>
                                <label htmlFor="estimatedSize">Estimated Size</label>
                                <select {...register('estimatedSize')} id="estimatedSize" style={errors.estimatedSize ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}>
                                  <option value="">Select size</option>
                                  <option value="small">Small (2–3 in)</option>
                                  <option value="medium">Medium (3–6 in)</option>
                                  <option value="large">Large (6–12 in)</option>
                                  <option value="xlarge">Extra Large (12+ in)</option>
                                </select>
                                {errors.estimatedSize && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.375rem' }}>{errors.estimatedSize.message}</p>}
                              </div>
                              <div>
                                <label htmlFor="estimatedPlacement">Body Placement</label>
                                <input {...register('estimatedPlacement')} type="text" id="estimatedPlacement"
                                  placeholder="e.g., upper arm, chest…"
                                  style={errors.estimatedPlacement ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                                {errors.estimatedPlacement && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.375rem' }}>{errors.estimatedPlacement.message}</p>}
                              </div>
                            </div>

                            <div>
                              <label htmlFor="referralSource">How did you find us? <span style={{ color: 'var(--text-low)', fontWeight: 400 }}>(Optional)</span></label>
                              <input {...register('referralSource')} type="text" id="referralSource" placeholder="Instagram, Google, referral…" />
                            </div>

                            <div>
                              <label htmlFor="notes">Additional Notes <span style={{ color: 'var(--text-low)', fontWeight: 400 }}>(Optional)</span></label>
                              <textarea {...register('notes')} id="notes" placeholder="Anything else we should know…" rows={3} />
                            </div>

                            <div>
                              <label htmlFor="clientBudget">Approximate budget <span style={{ color: 'var(--text-low)', fontWeight: 400 }}>(Optional)</span></label>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', ...mono, fontSize: '0.875rem', color: 'var(--text-low)', pointerEvents: 'none' }}>£</span>
                                <input {...register('clientBudget')} type="number" id="clientBudget" min="0" step="1" placeholder="e.g. 200" style={{ paddingLeft: '1.75rem' }} />
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Consultation step 2 */
                        <>
                          <p style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.85)', marginBottom: '1.5rem' }}>02 — Your idea</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.25rem' }}>
                            <div>
                              <label htmlFor="artistId">Artist</label>
                              <select
                                {...register('artistId')}
                                id="artistId"
                                disabled={loadingArtists}
                                style={errors.artistId ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                              >
                                <option value="" disabled>Choose your artist…</option>
                                {artists.map((a) => (
                                  <option key={a.id} value={a.id}>{a.full_name}</option>
                                ))}
                              </select>
                              {errors.artistId && (
                                <p style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--error-text)', marginTop: '0.375rem' }}>
                                  {errors.artistId.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label htmlFor="tattooDesignDescription">Describe your idea</label>
                              <textarea {...register('tattooDesignDescription')} id="tattooDesignDescription"
                                placeholder="Style, size, placement, references, inspiration — the more detail the better…"
                                rows={6}
                                style={errors.tattooDesignDescription ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                              {errors.tattooDesignDescription && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '0.375rem' }}>{errors.tattooDesignDescription.message}</p>}
                            </div>
                            <div>
                              <label htmlFor="notes">Anything else? <span style={{ color: 'var(--text-low)', fontWeight: 400 }}>(Optional)</span></label>
                              <textarea {...register('notes')} id="notes" placeholder="Questions, budget, availability…" rows={2} />
                            </div>
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" onClick={prevStep} className="btn-secondary" style={{ flexShrink: 0, padding: '0.75rem 1.25rem' }}>
                          ← Back
                        </button>
                        {formMode === 'consultation' ? (
                          <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: isSubmitting ? 0.7 : 1 }}>
                            <span>{isSubmitting ? 'Sending…' : 'Send consultation request'}</span>
                            {!isSubmitting && <span className="btn-icon" aria-hidden="true">↗</span>}
                          </button>
                        ) : (
                          <button type="button" onClick={nextStep} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                            <span>Review booking</span>
                            <span className="btn-icon" aria-hidden="true">→</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Step 3: Review & confirm (booking only) ── */}
                  {step === 3 && formMode === 'booking' && (
                    <div key="step-3" className="tab-content">
                      <p style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.85)', marginBottom: '1.5rem' }}>03 — Review &amp; confirm</p>

                      {/* Summary card */}
                      <div style={{ background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
                        <p style={{ ...mono, fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)', margin: '0 0 0.75rem' }}>Your booking summary</p>
                        <SummaryRow label="Name" value={vals.clientName || '—'} />
                        <SummaryRow label="Email" value={vals.clientEmail || '—'} />
                        <SummaryRow label="Phone" value={vals.clientPhone || '—'} />
                        {selectedArtistName && <SummaryRow label="Artist" value={selectedArtistName} />}
                        {selectedDate && (
                          <SummaryRow
                            label="Date"
                            value={`${new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${selectedSlot ? ` · ${fmtSlot(selectedSlot)}` : ''}`}
                          />
                        )}
                        <SummaryRow label="Placement" value={vals.estimatedPlacement || '—'} />
                        <SummaryRow label="Size" value={vals.estimatedSize ? ({ small: 'Small (2–3 in)', medium: 'Medium (3–6 in)', large: 'Large (6–12 in)', xlarge: 'Extra Large (12+ in)' })[vals.estimatedSize] || vals.estimatedSize : '—'} />
                        {vals.tattooDesignDescription && (
                          <SummaryRow label="Design" value={vals.tattooDesignDescription.length > 80 ? vals.tattooDesignDescription.substring(0, 80) + '…' : vals.tattooDesignDescription} />
                        )}
                      </div>

                      {/* Deposit note */}
                      <div style={{ padding: '0.875rem 1rem', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '0.5rem', marginBottom: '1.75rem' }}>
                        <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-mid)', lineHeight: 1.65 }}>
                          Once your booking is reviewed and accepted, your artist will confirm the session details and send you a deposit request to secure your appointment.
                        </p>
                      </div>

                      {/* Cancellation policy acknowledgment */}
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.75rem', padding: '1rem', background: 'rgba(201,168,76,0.04)', border: `1px solid ${policyAccepted ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`, borderRadius: '0.5rem', transition: 'border-color 0.2s' }}>
                        <input
                          type="checkbox"
                          checked={policyAccepted}
                          onChange={(e) => setPolicyAccepted(e.target.checked)}
                          style={{ marginTop: '0.1rem', accentColor: 'var(--gold)', width: '1rem', height: '1rem', flexShrink: 0 }}
                        />
                        <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                          I understand that cancellations made within {studioSettings?.cancellation_policy_hours ?? 48} hours of my appointment will result in the forfeiture of my deposit.
                        </span>
                      </label>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" onClick={prevStep} className="btn-secondary" style={{ flexShrink: 0, padding: '0.75rem 1.25rem' }}>
                          ← Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !policyAccepted}
                          className="btn-primary"
                          style={{ flex: 1, justifyContent: 'center', opacity: (isSubmitting || !policyAccepted) ? 0.55 : 1 }}
                        >
                          <span>{isSubmitting ? 'Submitting…' : 'Confirm booking request'}</span>
                          {!isSubmitting && <span className="btn-icon" aria-hidden="true">↗</span>}
                        </button>
                      </div>

                      <p style={{ textAlign: 'center', ...mono, fontSize: '0.65rem', letterSpacing: '0.06em', color: 'var(--text-low)', marginTop: '1rem', lineHeight: 1.6 }}>
                        We&apos;ll review and confirm within 24 hours
                      </p>
                    </div>
                  )}

                </form>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
