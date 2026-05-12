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
});

type BookingFormData = z.infer<typeof BookingSchema>;

const eyebrow: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.575rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.65)',
  display: 'block',
  marginBottom: '1.25rem',
};

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--border)',
  margin: '1.5rem 0',
};

export default function BookingPage() {
  const { user } = useClientAuth();
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitStatus, setSubmitStatus]   = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage]   = useState('');
  const [artists, setArtists]             = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

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
    // Validate date + slot selection
    let valid = true;
    if (!selectedDate) {
      setDateError('Please select a date.');
      valid = false;
    }
    if (selectedArtistId && !selectedSlot) {
      setSlotError('Please select a time slot.');
      valid = false;
    }
    if (!valid) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const payload: Record<string, unknown> = {
        ...data,
        artistId: data.artistId || undefined,
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
            <p style={{ marginTop: '1rem', fontFamily: '"DM Mono", monospace', fontSize: '0.575rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)' }}>
              Booking as {user.first_name} {user.last_name}
            </p>
          )}
        </div>
      </section>

      {/* Form */}
      <section style={{ padding: '0 1.5rem 3rem' }}>
        <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
          <div className="card-premium">
            <div className="card-premium-inner">

              {submitStatus === 'success' && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '0.5rem' }}>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--gold)', fontWeight: 500, margin: 0 }}>
                    Booking submitted. We&apos;ll be in touch within 24 hours to confirm.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.5rem' }}>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: '#fca5a5', fontWeight: 500, margin: 0 }}>
                    {errorMessage}
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
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--text-low)', marginTop: '0.375rem' }}>Loading artists…</p>
                  )}
                  {hasArtist && (
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.55)', marginTop: '0.5rem' }}>
                      Showing live availability for this artist
                    </p>
                  )}
                </div>

                <hr style={divider} />

                {/* ── Section 3: Date ── */}
                <span style={eyebrow}>03 — Select a date</span>

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
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.55rem', letterSpacing: '0.08em', color: 'var(--text-low)', marginTop: '0.5rem' }}>
                      Select an artist above to choose from available time slots.
                    </p>
                  </>
                )}

                <hr style={divider} />

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
                </div>

                <hr style={divider} />

                {/* Selected summary */}
                {(selectedDate || selectedSlot) && (
                  <div style={{
                    padding: '0.875rem 1rem',
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px solid rgba(201,168,76,0.18)',
                    borderRadius: '0.5rem',
                    marginBottom: '1.25rem',
                  }}>
                    <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: '0.575rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.65)' }}>
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  <span>{isSubmitting ? 'Submitting…' : 'Request Booking'}</span>
                  <span className="btn-icon" aria-hidden="true">↗</span>
                </button>

                <p style={{ textAlign: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)', marginTop: '1rem' }}>
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

    </div>
  );
}
