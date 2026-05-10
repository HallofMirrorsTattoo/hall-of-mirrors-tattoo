'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/lib/clientAuthContext';
import { ClientProtectedRoute } from '@/lib/clientProtectedRoute';
import BookingsTab from './bookings';
import DesignIdeasTab from './design-ideas';
import ConsultationsTab from './consultations';

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, logout } = useClientAuth();
  const [activeTab, setActiveTab] = useState('bookings');

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <ClientProtectedRoute>
      <div className="min-h-screen bg-primary-dark pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-dark mb-2">
                Welcome back, {user?.first_name}
              </h1>
              <p className="text-primary-dark/70">Manage your tattoo bookings and consultations</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-4 mb-8 border-b border-primary-dark/10">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-4 font-medium transition-colors ${
                activeTab === 'bookings'
                  ? 'text-accent-gold border-b-2 border-accent-gold'
                  : 'text-primary-dark/70 hover:text-primary-dark'
              }`}
            >
              Your Bookings
            </button>
            <button
              onClick={() => setActiveTab('design-ideas')}
              className={`pb-4 font-medium transition-colors ${
                activeTab === 'design-ideas'
                  ? 'text-accent-gold border-b-2 border-accent-gold'
                  : 'text-primary-dark/70 hover:text-primary-dark'
              }`}
            >
              Design Ideas
            </button>
            <button
              onClick={() => setActiveTab('consultations')}
              className={`pb-4 font-medium transition-colors ${
                activeTab === 'consultations'
                  ? 'text-accent-gold border-b-2 border-accent-gold'
                  : 'text-primary-dark/70 hover:text-primary-dark'
              }`}
            >
              Consultations
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === 'bookings' && <BookingsTab />}
            {activeTab === 'design-ideas' && <DesignIdeasTab />}
            {activeTab === 'consultations' && <ConsultationsTab />}
          </div>

          {/* Quick Actions */}
          <div className="mt-16 card-premium">
            <div className="card-premium-inner">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-serif font-bold text-primary-dark mb-3">Want to book a new appointment?</h3>
                  <p className="text-primary-dark/70 mb-4">
                    Start the booking process to schedule your next tattoo session with Robyn.
                  </p>
                  <Link href="/booking" className="btn-primary">
                    <span>Book Now</span>
                    <div className="btn-primary-icon">↗</div>
                  </Link>
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-primary-dark mb-3">Request a consultation?</h3>
                  <p className="text-primary-dark/70 mb-4">
                    Use the Consultations tab above to discuss your design ideas and get expert advice.
                  </p>
                  <button
                    onClick={() => setActiveTab('consultations')}
                    className="btn-secondary"
                  >
                    View Consultations
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientProtectedRoute>
  );
}
