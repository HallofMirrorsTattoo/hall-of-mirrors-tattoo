'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';

interface Booking {
  id: string;
  booking_reference: string;
  appointment_date: string;
  appointment_time: string;
  appointment_status: string;
  deposit_price: number;
  final_price: number;
  artist_name: string;
}

export default function BookingsTab() {
  const { accessToken } = useClientAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/client/bookings`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch bookings');

        const data = await response.json();
        setBookings(data.bookings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchBookings();
    }
  }, [accessToken]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending_consent':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <p>Loading your bookings...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-primary-dark/70 mb-6">You don't have any bookings yet.</p>
          <Link href="/booking" className="btn-primary">
            <span>Book Your First Appointment</span>
            <div className="btn-primary-icon">↗</div>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/client/bookings/${booking.id}`}
              className="card-premium hover:shadow-lg transition-shadow"
            >
              <div className="card-premium-inner">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-primary-dark">
                      {booking.artist_name || 'Robyn'}
                    </h3>
                    <p className="text-sm text-primary-dark/60">Ref: {booking.booking_reference}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.appointment_status)}`}>
                    {booking.appointment_status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-primary-dark/70">
                    📅 {new Date(booking.appointment_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-primary-dark/70">
                    🕐 {booking.appointment_time}
                  </p>
                </div>

                <div className="pt-4 border-t border-primary-dark/10">
                  <p className="text-xs text-primary-dark/60">
                    Deposit: £{booking.deposit_price}
                    {booking.final_price && ` • Final: £${booking.final_price}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
