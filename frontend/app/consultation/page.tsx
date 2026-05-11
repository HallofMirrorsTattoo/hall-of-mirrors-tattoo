'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const ConsultationSchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  preferredDate: z.string().optional(),
  consultationType: z.enum(['initial', 'design_review', 'follow_up']),
  message: z.string().min(10, 'Please provide more details'),
  interestedIn: z.string().optional(),
});

type ConsultationFormData = z.infer<typeof ConsultationSchema>;

export default function ConsultationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(ConsultationSchema),
  });

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          preferredDate: data.preferredDate ? new Date(data.preferredDate).toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit consultation request');
      }

      setSubmitStatus('success');
      reset();
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ minHeight: '40dvh', padding: '2rem 1.5rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(201,168,76,0.06) 0%, transparent 65%)' }}
        />
        <div style={{ maxWidth: '40rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p className="eyebrow" style={{ marginBottom: '1.25rem' }}>Free Consultation</p>
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
            Let&apos;s talk about<br />your idea
          </h1>
          <p style={{ maxWidth: '38ch', margin: '0 auto', textAlign: 'center' }}>
            A relaxed conversation with Robyn to explore your vision and understand
            what your perfect piece looks like.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={{ padding: '0 1.5rem 5rem' }}>
        <div style={{ maxWidth: '38rem', margin: '0 auto' }}>
          <div className="card-premium">
            <div className="card-premium-inner">

              {submitStatus === 'success' && (
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem 1.25rem',
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  borderRadius: '0.5rem',
                }}>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--gold)', fontWeight: 500 }}>
                    Consultation request sent. We&apos;ll be in touch within 24 hours.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem 1.25rem',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '0.5rem',
                }}>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: '#fca5a5', fontWeight: 500 }}>
                    {errorMessage || 'Something went wrong. Please try again.'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="clientName">Full Name</label>
                    <input
                      {...register('clientName')}
                      type="text"
                      id="clientName"
                      placeholder="Your name"
                      style={errors.clientName ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    />
                    {errors.clientName && (
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.clientName.message}</p>
                    )}
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
                    {errors.clientEmail && (
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.clientEmail.message}</p>
                    )}
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
                    {errors.clientPhone && (
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.clientPhone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="consultationType">Consultation Type</label>
                    <select
                      {...register('consultationType')}
                      id="consultationType"
                      style={errors.consultationType ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                    >
                      <option value="">Select type</option>
                      <option value="initial">Initial Consultation</option>
                      <option value="design_review">Design Review</option>
                      <option value="follow_up">Follow-up Consultation</option>
                    </select>
                    {errors.consultationType && (
                      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.consultationType.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="preferredDate">Preferred Date (Optional)</label>
                  <input
                    {...register('preferredDate')}
                    type="datetime-local"
                    id="preferredDate"
                  />
                </div>

                <div>
                  <label htmlFor="interestedIn">What are you interested in? (Optional)</label>
                  <input
                    {...register('interestedIn')}
                    type="text"
                    id="interestedIn"
                    placeholder="e.g., Neo-traditional, colour work, custom piece..."
                  />
                </div>

                <div>
                  <label htmlFor="message">Tell us more</label>
                  <textarea
                    {...register('message')}
                    id="message"
                    placeholder="Share your ideas, inspirations, and any questions. The more detail you provide, the better our consultation will be."
                    rows={5}
                    style={errors.message ? { borderColor: 'rgba(239,68,68,0.5)' } : {}}
                  />
                  {errors.message && (
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginTop: '0.375rem' }}>{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center"
                  style={{ opacity: isSubmitting ? 0.7 : 1 }}
                >
                  <span>{isSubmitting ? 'Submitting...' : 'Request Consultation'}</span>
                  <span className="btn-icon" aria-hidden="true">↗</span>
                </button>

                <p style={{ textAlign: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)' }}>
                  Ready to book?{' '}
                  <Link
                    href="/booking"
                    style={{ color: 'var(--gold)', transition: 'color 0.25s ease' }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--gold-bright)'; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--gold)'; }}
                  >
                    Schedule an appointment
                  </Link>{' '}
                  directly.
                </p>
              </form>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
