'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';
import AvailabilityCalendar, { AvailabilityData } from '@/app/components/AvailabilityCalendar';
import TimeSlotPicker from '@/app/components/TimeSlotPicker';

interface Artist {
  id: string;
  full_name: string;
  specialties?: string;
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
  artistId:                z.string().optional(),
  clientBudget:            z.preprocess(v => v === '' || v === undefined || v === null ? undefined : Number(v), z.number().positive().optional()),
});

type BookingFormData = z.infer<typeof BookingSchema>;

const eyebrow: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.75rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.85)',
  display: 'block',
  marginBottom: '1.25rem',
};

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--border)',
  margin: '1.5rem 0',
};

export default function BookingPage() {
  const { user, accessToken, activate } = useClientAuth();
  const [formMode, setFormMode] = useState<'booking' | 'consultation'>('booking');
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

  // Captured form data for post-booking account activation
  const [capturedEmail, setCapturedEmail]           = useState('');
  // firstName/lastName/phone captured for future use (e.g. pre-filling profile)
  const [, setCapturedFirstName] = useState('');
  const [, setCapturedLastName]  = useState('');
  const [, setCapturedPhone]     = useState('');
  const [activationPw, setActivationPw]             = useState('');
  const [activationState, setActivationState]       = useState<'idle' | 'submitting' | 'done' | 'dismissed'>('idle');
  const [activationError, setActivationError]       = useState('');

  const [paymentMethod, setPaymentMethod]          = useState<'cash' | 'card'>('cash');

  // Availability state
  const [selectedArtistId, setSelectedArtistId]   = useState('');
  const [selectedDate, setSelectedDate]           = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot]           = useState<string | null>(null);
  const [availabilityData, setAvailabilityData]   = useState<AvailabilityData | null>(null);
  const [dateError, setDateError]                 = useState('');
  const [slotError, setSlotError]                 = useState('');

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<BookingFormData>({
    resolver: zodResolver(BookingSchema),
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

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist`);
        if (res.ok) {
          const data = await res.json();
          setArtists(data.artists || []);
        }
      } catch {
        // non-critical
      } finally {
        setLoadingArtists(false);
      }
    };
    fetchArtists();
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

  const onSubmit = async (data: BookingFormData) => {
    // Date validation only required for booking mode
    if (formMode === 'booking') {
      let valid = true;
      if (!selectedDate) { setDateError('Please select a date.'); valid = false; }
      if (selectedArtistId && !selectedSlot) { setSlotError('Please select a time slot.'); valid = false; }
      if (!valid) return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      if (formMode === 'consultation') {
        // Consultation mode: requires login for messaging capability
        if (!user) {
          throw new Error('Please log in or create an account to request a consultation — this enables direct messaging with Robyn.');
        }
        const artistId = data.artistId || artists[0]?.id;
        if (!artistId) throw new Error('No artist found — please try again.');
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
      } else {
        const payload: Record<string, unknown> = {
          ...data,
          artistId: data.artistId || undefined,
          clientBudget: data.clientBudget || undefined,
          payment_method: paymentMethod,
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

        // Capture form data before reset() clears it
        setCapturedEmail(data.clientEmail);
        const [fn, ...ln] = data.clientName.split(' ');
        setCapturedFirstName(fn || '');
        setCapturedLastName(ln.join(' ') || 'Guest');
        setCapturedPhone(data.clientPhone || '');
        setActivationPw('');
        setActivationState('idle');
        setActivationError('');
      }
      setSubmitStatus('success');
      reset();
      setSelectedDate(null);
      setSelectedSlot(null);
      setSelectedArtistId('');
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasArtist = Boolean(selectedArtistId);

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
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(2.75rem, 7vw, 5rem)',
            color: 'var(--cream)',
            letterSpacing: '-0.025em',
            lineHeight: 1.0,
            marginBottom: '1.5rem',
          }}>
            Begin your<br />appointment
          </h1>
          <p style={{ maxWidth: '40ch', margin: '0 auto', color: 'var(--text-mid)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            Limited availability ensures every client receives full attention.
            We&apos;ll confirm your booking within 24 hours.
          </p>
          {user && (
            <p style={{ marginTop: '1rem', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)' }}>
              Booking as {user.first_name} {user.last_name}
            </p>
          )}
        </div>
      </section>

      {/* Confirmation card — shown after successful submit */}
      {submitStatus === 'success' && (
        <section style={{ padding: '0 1.5rem 5rem' }}>
          <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div className="card-premium">
              <div className="card-premium-inner" style={{ textAlign: 'center', padding: '3rem 2.5rem' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', fontSize: '1.25rem' }}>
                  ✓
                </div>
                <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '2.25rem', color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 0.75rem' }}>
                  {formMode === 'consultation' ? 'Consultation requested.' : 'Request submitted.'}
                </h2>
                <p style={{ color: 'var(--text-mid)', fontSize: '0.9375rem', lineHeight: 1.7, maxWidth: '30ch', margin: '0 auto 2rem' }}>
                  {formMode === 'consultation'
                    ? 'Robyn will be in touch. You can message her directly from your dashboard once she responds.'
                    : 'We\'ll review and confirm within 24 hours. Check your email for a copy of this request.'}
                </p>

                {/* Detail summary */}
                <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.25rem 0', margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {confirmedRef && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Reference</span>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', color: 'var(--gold)', letterSpacing: '0.05em' }}>{confirmedRef}</span>
                    </div>
                  )}
                  {confirmedDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', flexShrink: 0 }}>Requested date</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text)', textAlign: 'right' }}>
                        {new Date(`${confirmedDate}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {confirmedSlot && (() => {
                          const h = parseInt(confirmedSlot.substring(0, 2), 10);
                          return ` · ${h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}`;
                        })()}
                      </span>
                    </div>
                  )}
                  {confirmedArtist && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Artist</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{confirmedArtist}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link href="/client/dashboard" style={{ display: 'block', padding: '0.875rem', background: 'var(--gold)', color: 'var(--bg)', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '0.375rem', textAlign: 'center', fontWeight: 600 }}>
                    View your dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSubmitStatus('idle')}
                    style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-low)', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.875rem', borderRadius: '0.375rem', cursor: 'pointer', width: '100%' }}
                  >
                    Book another session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Account activation panel — shown after guest booking if not logged in */}
      {submitStatus === 'success' && !user && formMode === 'booking' && activationState !== 'done' && activationState !== 'dismissed' && (
        <section style={{ padding: '0 1.5rem 5rem' }}>
          <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '0.75rem', padding: '2rem 2rem 1.75rem' }}>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', margin: '0 0 0.75rem' }}>
                Optional — but recommended
              </p>
              <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.75rem', color: 'var(--cream)', lineHeight: 1.1, margin: '0 0 0.75rem' }}>
                Message your artist directly
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.7, margin: '0 0 1.5rem', maxWidth: '44ch' }}>
                Create your client account to track this booking, message your artist, and sign your consent form online. Takes 10 seconds.
              </p>

              {activationError && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#f87171' }}>{activationError}</p>
                </div>
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
                    fontFamily: '"DM Mono", monospace',
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
                style={{ marginTop: '1rem', background: 'none', border: 'none', padding: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', cursor: 'pointer', display: 'block' }}
              >
                I'll do this later
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Success message when activation done */}
      {submitStatus === 'success' && activationState === 'done' && (
        <section style={{ padding: '0 1.5rem 5rem' }}>
          <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: 'var(--gold)', fontSize: '1.25rem' }}>✓</span>
              <div>
                <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Account created</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-mid)' }}>You're now logged in. Head to your dashboard to track this booking.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Form */}
      {submitStatus !== 'success' && (
      <section style={{ padding: '0 1.5rem 3rem' }}>
        <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
          <div className="card-premium">
            <div className="card-premium-inner">

              {submitStatus === 'error' && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem' }}>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: '#fca5a5', fontWeight: 500, margin: 0 }}>
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* ── Mode toggle ── */}
              <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem', padding: '0.3rem', background: 'rgba(14,12,9,0.5)', border: '1px solid var(--border)', borderRadius: '2rem' }}>
                {(['booking', 'consultation'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormMode(m)}
                    style={{ flex: 1, padding: '0.625rem 1rem', background: formMode === m ? 'var(--gold)' : 'transparent', color: formMode === m ? '#0E0C09' : 'var(--text-mid)', border: 'none', borderRadius: '2rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', fontWeight: formMode === m ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    {m === 'booking' ? 'Book a session' : 'Request a consultation'}
                  </button>
                ))}
              </div>
              {formMode === 'consultation' && (
                <div style={{ padding: '0.875rem 1rem', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                    No date needed — just describe your idea. Robyn will get back to you and you&apos;ll be able to message directly from your dashboard.
                    {!user && <><br /><span style={{ color: 'rgba(201,168,76,0.8)' }}> Please <a href="/client/login" style={{ color: 'var(--gold)' }}>log in</a> first to enable messaging.</span></>}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

                {/* ── Section 1: Personal info ── */}
                <span style={eyebrow}>01 — Your details</span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label htmlFor="clientName">Full Name</label>
                    <input {...register('clientName')} type="text" id="clientName" placeholder="Your name"
                      style={errors.clientName ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                    {errors.clientName && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.clientName.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="clientEmail">Email</label>
                    <input {...register('clientEmail')} type="email" id="clientEmail" placeholder="your@email.com"
                      style={errors.clientEmail ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                    {errors.clientEmail && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.clientEmail.message}</p>}
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="clientPhone">Phone Number</label>
                    <input {...register('clientPhone')} type="tel" id="clientPhone" placeholder="+44 7911 123456"
                      style={errors.clientPhone ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                    {errors.clientPhone && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.clientPhone.message}</p>}
                  </div>
                </div>

                <hr style={divider} />

                {/* ── Section 2: Artist ── */}
                <span style={eyebrow}>02 — Choose your artist</span>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="artistId">Preferred Artist</label>
                  <select {...register('artistId')} id="artistId" disabled={loadingArtists}>
                    <option value="">No preference — studio assigns</option>
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name}{a.specialties ? ` — ${a.specialties}` : ''}
                      </option>
                    ))}
                  </select>
                  {loadingArtists && (
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text-low)', marginTop: '0.375rem' }}>Loading artists…</p>
                  )}
                  {hasArtist && (
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.55)', marginTop: '0.5rem' }}>
                      Showing live availability for this artist
                    </p>
                  )}
                </div>

                <hr style={divider} />

                {/* ── Section 3: Date (booking mode only) ── */}
                {formMode === 'booking' && <><span style={eyebrow}>03 — Select a date</span>

                {hasArtist ? (
                  <>
                    <div style={{
                      padding: '1.5rem',
                      background: 'rgba(14,12,9,0.5)',
                      border: `1px solid ${dateError ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                      borderRadius: '0.625rem',
                      marginBottom: selectedDate ? '1.25rem' : '0',
                    }}>
                      <AvailabilityCalendar
                        artistId={selectedArtistId}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        onAvailabilityLoad={setAvailabilityData}
                      />
                    </div>
                    {dateError && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem', marginBottom: '1rem' }}>{dateError}</p>}

                    {/* ── Slot picker appears after date selection ── */}
                    {selectedDate && (
                      <div style={{
                        padding: '1.5rem',
                        background: 'rgba(14,12,9,0.5)',
                        border: `1px solid ${slotError ? 'rgba(239,68,68,0.4)' : 'rgba(201,168,76,0.14)'}`,
                        borderRadius: '0.625rem',
                        marginBottom: '0',
                        animation: 'fadeUp 0.3s ease forwards',
                      }}>
                        <TimeSlotPicker
                          date={selectedDate}
                          selectedSlot={selectedSlot}
                          onSlotSelect={handleSlotSelect}
                          slotData={availabilityData?.slotData}
                        />
                        {slotError && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.75rem' }}>{slotError}</p>}
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
                        onChange={(e) => {
                          setSelectedDate(e.target.value || null);
                          setDateError('');
                        }}
                        style={dateError ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                      />
                    </div>
                    {dateError && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{dateError}</p>}
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.08em', color: 'var(--text-low)', marginTop: '0.5rem' }}>
                      Select an artist above to choose from available time slots.
                    </p>
                  </>
                )}

                <hr style={divider} /></>}

                {/* ── Section 4: Design info ── */}
                <span style={eyebrow}>04 — Your tattoo</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '0' }}>
                  <div>
                    <label htmlFor="tattooDesignDescription">Design Description</label>
                    <textarea {...register('tattooDesignDescription')} id="tattooDesignDescription"
                      placeholder="Describe your tattoo idea, inspiration, specific elements you want included…"
                      rows={5}
                      style={errors.tattooDesignDescription ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                    {errors.tattooDesignDescription && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.tattooDesignDescription.message}</p>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label htmlFor="estimatedSize">Estimated Size</label>
                      <select {...register('estimatedSize')} id="estimatedSize"
                        style={errors.estimatedSize ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}>
                        <option value="">Select size</option>
                        <option value="small">Small (2–3 in)</option>
                        <option value="medium">Medium (3–6 in)</option>
                        <option value="large">Large (6–12 in)</option>
                        <option value="xlarge">Extra Large (12+ in)</option>
                      </select>
                      {errors.estimatedSize && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.estimatedSize.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="estimatedPlacement">Body Placement</label>
                      <input {...register('estimatedPlacement')} type="text" id="estimatedPlacement"
                        placeholder="e.g., upper arm, chest…"
                        style={errors.estimatedPlacement ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
                      {errors.estimatedPlacement && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.estimatedPlacement.message}</p>}
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
                      <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontFamily: '"DM Mono", monospace', fontSize: '0.875rem', color: 'var(--text-low)', pointerEvents: 'none' }}>£</span>
                      <input {...register('clientBudget')} type="number" id="clientBudget" min="0" step="1" placeholder="e.g. 200" style={{ paddingLeft: '1.75rem' }} />
                    </div>
                  </div>
                </div>

                <hr style={divider} />

                {/* Selected summary — booking mode only */}
                {formMode === 'booking' && (selectedDate || selectedSlot) && (
                  <div style={{
                    padding: '0.875rem 1rem',
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.18)',
                    borderRadius: '0.5rem',
                    marginBottom: '1.25rem',
                  }}>
                    <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.65)' }}>
                      Your selected appointment
                    </p>
                    {selectedDate && (
                      <p style={{ margin: '0.375rem 0 0', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', fontWeight: 300, color: 'var(--cream)' }}>
                        {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {selectedSlot && (
                          <span style={{ color: 'var(--gold)', marginLeft: '0.5rem' }}>
                            {(() => {
                              const h = parseInt(selectedSlot.substring(0, 2), 10);
                              const lbl = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
                              return `· starting ${lbl}`;
                            })()}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {/* Payment preference — only shown for booking mode */}
                {formMode === 'booking' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.625rem' }}>How would you like to pay your deposit?</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: paymentMethod === 'cash' ? 'rgba(201,168,76,0.1)' : 'transparent', border: `1px solid ${paymentMethod === 'cash' ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s, background 0.2s' }}
                      >
                        <span style={{ width: '1rem', height: '1rem', borderRadius: '50%', border: `2px solid ${paymentMethod === 'cash' ? 'var(--gold)' : 'var(--border)'}`, background: paymentMethod === 'cash' ? 'var(--gold)' : 'transparent', flexShrink: 0, position: 'relative' }}>
                          {paymentMethod === 'cash' && <span style={{ position: 'absolute', inset: '2px', background: 'var(--bg)', borderRadius: '50%' }} />}
                        </span>
                        <div>
                          <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: paymentMethod === 'cash' ? 'var(--cream)' : 'var(--text)', fontWeight: paymentMethod === 'cash' ? 500 : 400 }}>Cash on the day</p>
                          <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.775rem', color: 'var(--text-low)', lineHeight: 1.4 }}>Pay your deposit in cash when you arrive</p>
                        </div>
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.5rem', opacity: 0.45, cursor: 'default' }}>
                        <span style={{ width: '1rem', height: '1rem', borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
                        <div>
                          <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--text)' }}>Online by card</p>
                          <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontSize: '0.775rem', color: 'var(--text-low)', lineHeight: 1.4 }}>Coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  <span>{isSubmitting ? 'Submitting…' : formMode === 'consultation' ? 'Request Consultation' : 'Request Booking'}</span>
                  <span className="btn-icon" aria-hidden="true">↗</span>
                </button>

                <p style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.06em', color: 'var(--text-low)', marginTop: '0.875rem', lineHeight: 1.6 }}>
                  Cancellations within 48 hours of your appointment may be subject to a cancellation fee.
                </p>

                <p style={{ textAlign: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)', marginTop: '0.75rem' }}>
                  Have questions?{' '}
                  <Link href="/consultation" style={{ color: 'var(--gold)', transition: 'color 0.25s ease' }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--gold-bright)'; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--gold)'; }}
                  >
                    Schedule a free consultation
                  </Link>{' '}
                  first.
                </p>

              </form>
            </div>
          </div>
        </div>
      </section>
      )}

    </div>
  );
}
