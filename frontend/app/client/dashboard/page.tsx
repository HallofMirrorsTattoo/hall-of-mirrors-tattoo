'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/lib/clientAuthContext';
import { ClientProtectedRoute } from '@/lib/clientProtectedRoute';
import BookingsTab from './bookings';
import DesignIdeasTab from './design-ideas';
import ConsultationsTab from './consultations';
import AftercareTab from './aftercare';

const BASE_TABS = [
  { id: 'bookings',      label: 'Your Bookings' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'design-ideas',  label: 'Design Ideas' },
  { id: 'aftercare',     label: 'Aftercare' },
] as const;

type TabId = typeof BASE_TABS[number]['id'];

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, logout, accessToken } = useClientAuth();
  const [activeTab, setActiveTab] = useState<TabId>('bookings');
  const [badges, setBadges] = useState<Partial<Record<TabId, number>>>({});

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const updateBadge = useCallback((tab: TabId, count: number) => {
    setBadges(prev => ({ ...prev, [tab]: count }));
  }, []);

  const onBookingsBadge = useCallback((n: number) => setBadges(prev => ({ ...prev, bookings: n })), []);

  // Fetch consultation badge count (pending consults with artist messages)
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/consultations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const consultations = data.consultations || [];
        const badge = consultations.filter((c: { status: string; artist_message_count: number }) =>
          c.status !== 'declined' && c.artist_message_count > 0
        ).length;
        updateBadge('consultations', badge);
      } catch { /* non-critical */ }
    })();
  }, [accessToken, updateBadge]);

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
                Manage your bookings, messages, and consent forms
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0, marginTop: '0.5rem' }}>
              <Link href="/client/profile" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                Profile
              </Link>
              <button onClick={handleLogout} className="btn-secondary">
                Log out
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="scroll-no-bar" style={{ borderBottom: '1px solid var(--border)', marginBottom: '2.5rem', display: 'flex', gap: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {BASE_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const badge = badges[tab.id] ?? 0;
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--cream)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-mid)'; }}
                >
                  {tab.label}
                  {badge > 0 && (
                    <span style={{ padding: '0.1rem 0.4rem', background: 'var(--gold)', color: 'var(--bg)', borderRadius: '2rem', fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', fontWeight: 600 }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div style={{ minHeight: '24rem' }}>
            {activeTab === 'bookings'      && <BookingsTab onBadgeUpdate={onBookingsBadge} />}
            {activeTab === 'consultations' && <ConsultationsTab />}
            {activeTab === 'design-ideas'  && <DesignIdeasTab />}
            {activeTab === 'aftercare'     && <AftercareTab />}
          </div>

          {/* Quick Actions */}
          <div className="card-premium" style={{ marginTop: '4rem' }}>
            <div className="card-premium-inner">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.75rem' }}>
                    Ready for your next piece?
                  </h3>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Book your next session directly — choose a date and time that works for you.
                  </p>
                  <Link href="/booking" className="btn-primary">
                    <span>Book a session</span>
                    <span className="btn-icon" aria-hidden="true">↗</span>
                  </Link>
                </div>
                <div>
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.75rem' }}>
                    Have a question?
                  </h3>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Message Robyn from the Consultations tab — she&apos;ll reply as soon as possible.
                  </p>
                  <button onClick={() => setActiveTab('consultations')} className="btn-secondary">
                    Open Consultations
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
