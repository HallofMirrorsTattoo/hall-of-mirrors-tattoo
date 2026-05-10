'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const BookingSchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  preferredDate: z.string().min(1, 'Please select a date'),
  tattooDesignDescription: z.string().min(10, 'Please describe your design in at least 10 characters'),
  estimatedSize: z.enum(['small', 'medium', 'large', 'xlarge']),
  estimatedPlacement: z.string().min(2, 'Please specify placement'),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof BookingSchema>;

export default function BookingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(BookingSchema),
  });

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          preferredDate: new Date(data.preferredDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit booking');
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
      <section className="min-h-[60dvh] px-4 py-20 flex items-center justify-center relative overflow-hidden pattern-gold-accents bg-primary-light">
        <div className="max-w-4xl mx-auto w-full text-center space-y-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-dark">
            Book Your Appointment
          </h1>
          <p className="text-lg text-primary-dark/75 max-w-2xl mx-auto">
            Limited availability ensures personalized attention. Complete this form and we'll confirm your booking within 24 hours.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="px-4 py-20 bg-primary-light pattern-gold-accents">
        <div className="max-w-2xl mx-auto">
          <div className="card-premium">
            <div className="card-premium-inner">
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">✓ Booking submitted successfully! We'll be in touch shortly.</p>
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
                    <label htmlFor="clientName" className="block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-2">
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
                    <label htmlFor="clientEmail" className="block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-2">
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
                    <label htmlFor="clientPhone" className="block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-2">
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
                    <label htmlFor="preferredDate" className="block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-2">
                      Preferred Date
                    </label>
                    <input
                      {...register('preferredDate')}
                      type="datetime-local"
                      id="preferredDate"
                      className={`w-full ${errors.preferredDate ? 'border-red-500' : ''}`}
                    />
                    {errors.preferredDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.preferredDate.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="tattooDesignDescription" className="block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-2">
                    Tattoo Design Description
                  </label>
                  <textarea
                    {...register('tattooDesignDescription')}
                    id="tattooDesignDescription"
                    placeholder="Describe your tattoo design idea, inspiration, and any specific elements you want included..."
                    rows={5}
                    className={`w-full ${errors.tattooDesignDescription ? 'border-red-500' : ''}`}
                  />
                  {errors.tattooDesignDescription && (
                    <p className="text-red-600 text-sm mt-1">{errors.tattooDesignDescription.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="estimatedSize" className="block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-2">
                      Estimated Size
                    </label>
                    <select
                      {...register('estimatedSize')}
                      id="estimatedSize"
                      className={`w-full ${errors.estimatedSize ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select size</option>
                      <option value="small">Small (2-3 inches)</option>
                      <option value="medium">Medium (3-6 inches)</option>
                      <option value="large">Large (6-12 inches)</option>
                      <option value="xlarge">Extra Large (12+ inches)</option>
                    </select>
                    {errors.estimatedSize && (
                      <p className="text-red-600 text-sm mt-1">{errors.estimatedSize.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="estimatedPlacement" className="block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-2">
                      Body Placement
                    </label>
                    <input
                      {...register('estimatedPlacement')}
                      type="text"
                      id="estimatedPlacement"
                      placeholder="e.g., Upper arm, chest, leg..."
                      className={`w-full ${errors.estimatedPlacement ? 'border-red-500' : ''}`}
                    />
                    {errors.estimatedPlacement && (
                      <p className="text-red-600 text-sm mt-1">{errors.estimatedPlacement.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="referralSource" className="block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-2">
                    How did you find us? (Optional)
                  </label>
                  <input
                    {...register('referralSource')}
                    type="text"
                    id="referralSource"
                    placeholder="Instagram, Google, Referral, etc."
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-semibold text-primary-dark uppercase tracking-wider mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    {...register('notes')}
                    id="notes"
                    placeholder="Any additional information we should know about..."
                    rows={3}
                    className="w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary group w-full justify-center"
                >
                  <span>{isSubmitting ? 'Submitting...' : 'Request Booking'}</span>
                  <div className="btn-primary-icon">↗</div>
                </button>

                <p className="text-center text-sm text-primary-dark/60">
                  Have questions? <Link href="/consultation" className="text-accent-gold hover:text-primary-dark font-medium">
                    Schedule a free consultation
                  </Link> first.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
