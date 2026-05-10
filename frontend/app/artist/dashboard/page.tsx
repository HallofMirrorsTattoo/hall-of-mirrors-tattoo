'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

interface Booking {
  id: string;
  booking_reference: string;
  appointment_date_time: string;
  tattoo_description: string;
  placement: string;
  estimated_size: string;
  appointment_status: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export default function ArtistDashboard() {
  const router = useRouter();
  const { artist, accessToken, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.push('/artist/login');
      return;
    }

    fetchBookings();
  }, [accessToken, router]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string, notes: string) => {
    try {
      setIsUpdating(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/artist/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status, notes }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update booking');
      }

      // Refresh bookings
      await fetchBookings();
      setSelectedBooking(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredBookings = bookings.filter((b) => statusFilter === 'all' || b.appointment_status === statusFilter);

  return (
    <div className="min-h-[100dvh] bg-primary-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif text-primary-dark">Artist Dashboard</h1>
            <p className="text-sm text-gray-600">{artist?.full_name}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/artist/login');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bookings List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-serif text-primary-dark mb-4">Your Bookings</h2>
                <div className="flex gap-2">
                  {['all', 'pending_consent', 'confirmed', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        statusFilter === status
                          ? 'bg-primary-dark text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <p className="text-gray-600 text-center py-8">Loading bookings...</p>
              ) : filteredBookings.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No bookings found</p>
              ) : (
                <div className="space-y-2">
                  {filteredBookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedBooking?.id === booking.id
                          ? 'border-accent-gold bg-yellow-50'
                          : 'border-gray-200 hover:border-accent-gold'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-primary-dark">
                            {booking.user?.first_name} {booking.user?.last_name}
                          </p>
                          <p className="text-xs text-gray-600">{booking.booking_reference}</p>
                          <p className="text-sm text-gray-700 mt-1">{booking.placement}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            booking.appointment_status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {booking.appointment_status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          {selectedBooking && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm sticky top-24">
                <h3 className="font-serif text-lg text-primary-dark mb-4">Booking Details</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Client</p>
                    <p className="font-medium text-primary-dark">
                      {selectedBooking.user?.first_name} {selectedBooking.user?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{selectedBooking.user?.email}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.user?.phone}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase">Date & Time</p>
                    <p className="font-medium text-primary-dark">
                      {new Date(selectedBooking.appointment_date_time).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase">Design</p>
                    <p className="text-sm text-gray-700">{selectedBooking.tattoo_description}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase">Placement</p>
                    <p className="text-sm text-gray-700">{selectedBooking.placement}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase">Size</p>
                    <p className="text-sm text-gray-700">{selectedBooking.estimated_size}</p>
                  </div>
                </div>

                {selectedBooking.appointment_status !== 'confirmed' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed', '')}
                      disabled={isUpdating}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Accept Booking'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled', '')}
                      disabled={isUpdating}
                      className="w-full border border-red-600 text-red-600 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Reject Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
