'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/lib/clientAuthContext';
import { ClientProtectedRoute } from '@/lib/clientProtectedRoute';
import BookingsTab from './bookings';
import DesignIdeasTab from './design-ideas';
import ConsultationsTab from './consultations';
import ConsentFormsTab from './consent-forms';

const TABS = [
  { id: 'bookings',      label: 'Your Bookings' },
  { id: 'design-ideas',  label: 'Design Ideas' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'consent-forms', label: 'Consent Forms' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, logout } = useClientAuth();
  const [activeTab, setActiveTab] = useState<TabId>('bookings');

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <ClientProtectedRoute>
      <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '8rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Client Portal</p>
              <h1 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                color: 'var(--cream)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: '0.5rem',
              }}>
                Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
              </h1>
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                Manage your bookings, design ideas, and consultations
              </p>
            </div>
            <button onClick={handleLogout} className="btn-secondary" style={{ flexShrink: 0, marginTop: '0.5rem' }}>
              Logout
            </button>
          </div>

          {/* Tab Navigation */}
          <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '2.5rem', display: 'flex', gap: '0' }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    paddingBottom: '1rem',
                    paddingRight: '1.5rem',
                    paddingLeft: '0',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--gold)' : 'var(--text-mid)',
                    background: 'none',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                    marginBottom: '-1px',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--cream)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-mid)';
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div style={{ minHeight: '24rem' }}>
            {activeTab === 'bookings'      && <BookingsTab />}
            {activeTab === 'design-ideas'  && <DesignIdeasTab />}
            {activeTab === 'consultations' && <ConsultationsTab />}
            {activeTab === 'consent-forms' && <ConsentFormsTab />}
          </div>

          {/* Quick Actions */}
          <div className="card-premium" style={{ marginTop: '4rem' }}>
            <div className="card-premium-inner">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.75rem' }}>
                    Want to book a new appointment?
                  </h3>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Start the booking process to schedule your next tattoo session with Robyn.
                  </p>
                  <Link href="/booking" className="btn-primary">
                    <span>Book Now</span>
                    <span className="btn-icon" aria-hidden="true">↗</span>
                  </Link>
                </div>
                <div>
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.75rem' }}>
                    Want a consultation first?
                  </h3>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Use the Consultations tab above to discuss your design ideas and get expert advice.
                  </p>
                  <button onClick={() => setActiveTab('consultations')} className="btn-secondary">
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
