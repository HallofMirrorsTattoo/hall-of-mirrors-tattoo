'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';

interface Artist {
  id: string;
  full_name: string;
  specialties?: string;
}

const BookingSchema = z.object({
  clientName:               z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail:              z.string().email('Invalid email address'),
  clientPhone:              z.string().min(10, 'Phone number must be at least 10 digits'),
  preferredDate:            z.string().min(1, 'Please select a date'),
  tattooDesignDescription:  z.string().min(10, 'Please describe your design in at least 10 characters'),
  estimatedSize:            z.enum(['small', 'medium', 'large', 'xlarge']),
  estimatedPlacement:       z.string().min(2, 'Please specify placement'),
  referralSource:           z.string().optional(),
  notes:                    z.string().optional(),
  artistId:                 z.string().optional(),
});

type BookingFormData = z.infer<typeof BookingSchema>;

export default function BookingPage() {
  const { user } = useClientAuth();
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitStatus, setSubmitStatus]   = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage]   = useState('');
  const [artists, setArtists]             = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<BookingFormData>({
    resolver: zodResolver(BookingSchema),
  });

  // Pre-fill from logged-in account
  useEffect(() => {
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
      if (fullName) setValue('clientName', fullName);
      if (user.email) setValue('clientEmail', user.email);
      if (user.phone) setValue('clientPhone', user.phone);
    }
  }, [user, setValue]);

  // Fetch artists — route is /api/artist (singular)
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist`);
        if (response.ok) {
          const data = await response.json();
          setArtists(data.artists || []);
        }
      } catch {
        // non-critical — select still shows "No preference"
      } finally {
        setLoadingArtists(false);
      }
    };
    fetchArtists();
  }, []);

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          preferredDate: new Date(data.preferredDate).toISOString(),
          artistId: data.artistId || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        // Show the actual DB error if available, otherwise the generic message
        throw new Error(err.message || err.error || 'Failed to submit booking');
      }

      setSubmitStatus('success');
      reset();
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ minHeight: '40dvh', padding: '2rem 1.5rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(201,168,76,0.06) 0%, transparent 65%)', pointerEvents: 'none' }}
        />
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
          <p style={{ maxWidth: '40ch', margin: '0 auto', textAlign: 'center' }}>
            Limited availability ensures every client receives Robyn&apos;s full attention.
            We&apos;ll confirm your booking within 24 hours.
          </p>
          {user && (
            <p style={{ marginTop: '1rem', fontFamily: '"DM Mono", monospace', fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)' }}>
              Booking as {user.first_name} {user.last_name}
            </p>
          )}
        </div>
      </section>

      {/* Form */}
      <section style={{ padding: '0 1.5rem 5rem' }}>
        <div style={{ maxWidth: '38rem', margin: '0 auto' }}>
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

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label htmlFor="clientName">Full Name</label>
                    <input
                      {...register('clientName')}
                      type="text"
                      id="clientName"
                      placeholder="Your name"
                      style={errors.clientName ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    />
                    {errors.clientName && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.clientName.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="clientEmail">Email</label>
                    <input
                      {...register('clientEmail')}
                      type="email"
                      id="clientEmail"
                      placeholder="your@email.com"
                      style={errors.clientEmail ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    />
                    {errors.clientEmail && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.clientEmail.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="clientPhone">Phone Number</label>
                    <input
                      {...register('clientPhone')}
                      type="tel"
                      id="clientPhone"
                      placeholder="+44 (0) 151 234 5678"
                      style={errors.clientPhone ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    />
                    {errors.clientPhone && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.clientPhone.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="preferredDate">Preferred Date &amp; Time</label>
                    <input
                      {...register('preferredDate')}
                      type="datetime-local"
                      id="preferredDate"
                      style={errors.preferredDate ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    />
                    {errors.preferredDate && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.preferredDate.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="tattooDesignDescription">Tattoo Design Description</label>
                  <textarea
                    {...register('tattooDesignDescription')}
                    id="tattooDesignDescription"
                    placeholder="Describe your tattoo design idea, inspiration, and any specific elements you want included..."
                    rows={5}
                    style={errors.tattooDesignDescription ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                  />
                  {errors.tattooDesignDescription && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.tattooDesignDescription.message}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label htmlFor="estimatedSize">Estimated Size</label>
                    <select
                      {...register('estimatedSize')}
                      id="estimatedSize"
                      style={errors.estimatedSize ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    >
                      <option value="">Select size</option>
                      <option value="small">Small (2–3 inches)</option>
                      <option value="medium">Medium (3–6 inches)</option>
                      <option value="large">Large (6–12 inches)</option>
                      <option value="xlarge">Extra Large (12+ inches)</option>
                    </select>
                    {errors.estimatedSize && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.estimatedSize.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="estimatedPlacement">Body Placement</label>
                    <input
                      {...register('estimatedPlacement')}
                      type="text"
                      id="estimatedPlacement"
                      placeholder="e.g., Upper arm, chest, leg..."
                      style={errors.estimatedPlacement ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    />
                    {errors.estimatedPlacement && <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.estimatedPlacement.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="artistId">Preferred Artist</label>
                  <select {...register('artistId')} id="artistId" disabled={loadingArtists}>
                    <option value="">No preference</option>
                    {artists.map((artist) => (
                      <option key={artist.id} value={artist.id}>
                        {artist.full_name}{artist.specialties ? ` — ${artist.specialties}` : ''}
                      </option>
                    ))}
                  </select>
                  {loadingArtists && (
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.625rem', letterSpacing: '0.1em', color: 'var(--text-low)', marginTop: '0.375rem' }}>Loading...</p>
                  )}
                </div>

                <div>
                  <label htmlFor="referralSource">How did you find us? (Optional)</label>
                  <input {...register('referralSource')} type="text" id="referralSource" placeholder="Instagram, Google, referral..." />
                </div>

                <div>
                  <label htmlFor="notes">Additional Notes (Optional)</label>
                  <textarea {...register('notes')} id="notes" placeholder="Anything else we should know..." rows={3} />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  <span>{isSubmitting ? 'Submitting...' : 'Request Booking'}</span>
                  <span className="btn-icon" aria-hidden="true">↗</span>
                </button>

                <p style={{ textAlign: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)' }}>
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
