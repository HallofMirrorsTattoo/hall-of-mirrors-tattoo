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
    <div>
      {/* Hero Section */}
      <section className="min-h-[60dvh] px-4 py-20 flex items-center justify-center relative overflow-hidden pattern-gold-accents bg-primary-dark">
        <div className="max-w-4xl mx-auto w-full text-center space-y-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-light">
            Free Consultation
          </h1>
          <p className="text-lg text-primary-light/75 max-w-2xl mx-auto">
            Let's discuss your tattoo vision. Book a free consultation with Robyn to explore ideas and understand your perfect design.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="px-4 py-20 bg-primary-dark pattern-gold-accents">
        <div className="max-w-2xl mx-auto">
          <div className="card-premium">
            <div className="card-premium-inner">
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">✓ Consultation request sent! We'll be in touch within 24 hours.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium">✗ {errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="clientName" className="block text-sm font-semibold text-primary-light uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      {...register('clientName')}
                      type="text"
                      id="clientName"
                      placeholder="Your name"
                      className={`w-full ${errors.clientName ? 'border-red-500' : ''}`}
                    />
                    {errors.clientName && (
                      <p className="text-red-600 text-sm mt-1">{errors.clientName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="clientEmail" className="block text-sm font-semibold text-primary-light uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <input
                      {...register('clientEmail')}
                      type="email"
                      id="clientEmail"
                      placeholder="your@email.com"
                      className={`w-full ${errors.clientEmail ? 'border-red-500' : ''}`}
                    />
                    {errors.clientEmail && (
                      <p className="text-red-600 text-sm mt-1">{errors.clientEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="clientPhone" className="block text-sm font-semibold text-primary-light uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      {...register('clientPhone')}
                      type="tel"
                      id="clientPhone"
                      placeholder="+44 (0) 151 2345 6789"
                      className={`w-full ${errors.clientPhone ? 'border-red-500' : ''}`}
                    />
                    {errors.clientPhone && (
                      <p className="text-red-600 text-sm mt-1">{errors.clientPhone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="consultationType" className="block text-sm font-semibold text-primary-light uppercase tracking-wider mb-2">
                      Consultation Type
                    </label>
                    <select
                      {...register('consultationType')}
                      id="consultationType"
                      className={`w-full ${errors.consultationType ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select type</option>
                      <option value="initial">Initial Consultation</option>
                      <option value="design_review">Design Review</option>
                      <option value="follow_up">Follow-up Consultation</option>
                    </select>
                    {errors.consultationType && (
                      <p className="text-red-600 text-sm mt-1">{errors.consultationType.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-semibold text-primary-light uppercase tracking-wider mb-2">
                    Preferred Date (Optional)
                  </label>
                  <input
                    {...register('preferredDate')}
                    type="datetime-local"
                    id="preferredDate"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="interestedIn" className="block text-sm font-semibold text-primary-light uppercase tracking-wider mb-2">
                    What are you interested in? (Optional)
                  </label>
                  <input
                    {...register('interestedIn')}
                    type="text"
                    id="interestedIn"
                    placeholder="e.g., Neo-traditional design, color work, custom piece..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-primary-light uppercase tracking-wider mb-2">
                    Tell us more
                  </label>
                  <textarea
                    {...register('message')}
                    id="message"
                    placeholder="Share your ideas, inspirations, and any questions you have. The more detail you provide, the better our consultation will be."
                    rows={5}
                    className={`w-full ${errors.message ? 'border-red-500' : ''}`}
                  />
                  {errors.message && (
                    <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary group w-full justify-center"
                >
                  <span>{isSubmitting ? 'Submitting...' : 'Request Consultation'}</span>
                  <div className="btn-primary-icon">↗</div>
                </button>

                <p className="text-center text-sm text-primary-light/60">
                  Ready to book? <Link href="/booking" className="text-accent-gold hover:text-primary-light font-medium">
                    Schedule an appointment
                  </Link> directly.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
