'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';
import { ClientProtectedRoute } from '@/lib/clientProtectedRoute';

interface Artist {
  id: string;
  name: string;
  specialties: string;
  bio: string;
  instagram_handle: string;
}

interface DesignIdea {
  id: string;
  image_url: string;
  description: string;
}

interface Booking {
  id: string;
  booking_reference: string;
  appointment_date: string;
  appointment_time: string;
  appointment_status: string;
  deposit_price: number;
  final_price: number;
  design_notes: string;
  tattoo_placement: string;
  estimated_duration: string;
  created_at: string;
  updated_at: string;
  artist: Artist | null;
  design_ideas: DesignIdea[];
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useClientAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);

  const bookingId = params.id as string;

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch booking');

        const data = await response.json();
        setBooking(data.booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && bookingId) {
      fetchBooking();
    }
  }, [accessToken, bookingId]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCanceling(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            appointment_status: 'cancelled',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to cancel booking');

      const data = await response.json();
      setBooking(data.booking);
      alert('Booking cancelled successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) return <ClientProtectedRoute><div className="min-h-screen pt-40">Loading...</div></ClientProtectedRoute>;
  if (error) return <ClientProtectedRoute><div className="min-h-screen pt-40 text-red-600">{error}</div></ClientProtectedRoute>;
  if (!booking) return <ClientProtectedRoute><div className="min-h-screen pt-40">Booking not found</div></ClientProtectedRoute>;

  return (
    <ClientProtectedRoute>
      <div className="min-h-screen bg-primary-light pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <Link href="/client/dashboard" className="text-accent-gold hover:text-primary-dark mb-6 inline-block">
            ← Back to Dashboard
          </Link>

          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-dark mb-2">
            Booking Details
          </h1>
          <p className="text-primary-dark/70 mb-12">Ref: {booking.booking_reference}</p>

          {/* Main Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column - Booking Info */}
            <div className="md:col-span-2 space-y-6">
              {/* Status Card */}
              <div className="card-premium">
                <div className="card-premium-inner">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif font-bold text-primary-dark">Status</h2>
                    <span className={`px-4 py-2 rounded-full font-medium ${
                      booking.appointment_status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : booking.appointment_status === 'pending_consent'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {booking.appointment_status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {booking.appointment_status !== 'cancelled' && (
                    <button
                      onClick={handleCancel}
                      disabled={canceling}
                      className="btn-secondary py-2 text-sm disabled:opacity-50"
                    >
                      {canceling ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>

              {/* Appointment Card */}
              <div className="card-premium">
                <div className="card-premium-inner">
                  <h2 className="text-2xl font-serif font-bold text-primary-dark mb-6">Appointment</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">📅</span>
                      <div>
                        <p className="text-primary-dark/60 text-sm">Date</p>
                        <p className="text-lg text-primary-dark font-medium">
                          {new Date(booking.appointment_date).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🕐</span>
                      <div>
                        <p className="text-primary-dark/60 text-sm">Time</p>
                        <p className="text-lg text-primary-dark font-medium">{booking.appointment_time}</p>
                      </div>
                    </div>

                    {booking.estimated_duration && (
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">⏱️</span>
                        <div>
                          <p className="text-primary-dark/60 text-sm">Duration</p>
                          <p className="text-lg text-primary-dark font-medium">{booking.estimated_duration}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Design Details */}
              {(booking.tattoo_placement || booking.design_notes) && (
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <h2 className="text-2xl font-serif font-bold text-primary-dark mb-6">Design Details</h2>
                    {booking.tattoo_placement && (
                      <div className="mb-4">
                        <p className="text-primary-dark/60 text-sm mb-1">Placement</p>
                        <p className="text-primary-dark">{booking.tattoo_placement}</p>
                      </div>
                    )}
                    {booking.design_notes && (
                      <div>
                        <p className="text-primary-dark/60 text-sm mb-1">Notes</p>
                        <p className="text-primary-dark">{booking.design_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Design Ideas */}
              {booking.design_ideas && booking.design_ideas.length > 0 && (
                <div className="card-premium">
                  <div className="card-premium-inner">
                    <h2 className="text-2xl font-serif font-bold text-primary-dark mb-6">Design References</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {booking.design_ideas.map((idea) => (
                        <div key={idea.id} className="rounded-lg overflow-hidden bg-primary-dark/5">
                          <div className="relative w-full h-32 bg-primary-dark/10">
                            <img
                              src={idea.image_url}
                              alt="Design reference"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {idea.description && (
                            <p className="text-xs text-primary-dark/70 p-2">{idea.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Artist & Payment */}
            <div className="space-y-6">
              {/* Artist Card */}
              {booking.artist && (
                <div className="card-premium sticky top-40">
                  <div className="card-premium-inner">
                    <h3 className="text-lg font-serif font-bold text-primary-dark mb-4">Your Artist</h3>
                    <h4 className="text-xl font-serif font-bold text-primary-dark mb-1">{booking.artist.name}</h4>
                    {booking.artist.specialties && (
                      <p className="text-sm text-primary-dark/70 mb-3">{booking.artist.specialties}</p>
                    )}
                    {booking.artist.bio && (
                      <p className="text-sm text-primary-dark/80 mb-4">{booking.artist.bio}</p>
                    )}
                    {booking.artist.instagram_handle && (
                      <a
                        href={`https://instagram.com/${booking.artist.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-gold hover:text-primary-dark text-sm font-medium"
                      >
                        @{booking.artist.instagram_handle}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Card */}
              <div className="card-premium">
                <div className="card-premium-inner">
                  <h3 className="text-lg font-serif font-bold text-primary-dark mb-6">Payment</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-primary-dark/70">Deposit</span>
                      <span className="font-medium text-primary-dark">£{booking.deposit_price}</span>
                    </div>
                    {booking.final_price && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-primary-dark/70">Final Payment</span>
                          <span className="font-medium text-primary-dark">£{booking.final_price}</span>
                        </div>
                        <div className="pt-3 border-t border-primary-dark/10">
                          <div className="flex justify-between">
                            <span className="font-medium text-primary-dark">Total</span>
                            <span className="font-bold text-accent-gold text-lg">
                              £{booking.deposit_price + booking.final_price}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientProtectedRoute>
  );
}
