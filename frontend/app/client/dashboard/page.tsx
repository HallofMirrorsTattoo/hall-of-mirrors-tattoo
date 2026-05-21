'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/lib/clientAuthContext';
import { ClientProtectedRoute } from '@/lib/clientProtectedRoute';
import BookingsTab from './bookings';
import DesignIdeasTab from './design-ideas';
import ConsultationsTab from './consultations';
import ConsentFormsTab from './consent-forms';
import ProfileTab from './profile';

// ── Types ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'bookings',      label: 'Bookings',      icon: '◈' },
  { id: 'consultations', label: 'Consultations',  icon: '◇' },
  { id: 'design-ideas',  label: 'Design Ideas',   icon: '◻' },
  { id: 'consent-forms', label: 'Consent Forms',  icon: '◉' },
  { id: 'profile',       label: 'My Profile',     icon: '○' },
] as const;

type TabId = typeof TABS[number]['id'];

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, logout, accessToken } = useClientAuth();
  const [activeTab, setActiveTab] = useState<TabId>('bookings');
  const [badges, setBadges] = useState<Partial<Record<TabId, number>>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const updateBadge = useCallback((tab: TabId, count: number) => {
    setBadges(prev => ({ ...prev, [tab]: count }));
  }, []);

  const onBookingsBadge = useCallback((n: number) => {
    setBadges(prev => ({ ...prev, bookings: n }));
  }, []);

  // Consultation badge — unread artist messages
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/consultations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const badge = (data.consultations || []).reduce(
          (sum: number, c: { status: string; unread_artist_count: number }) =>
            sum + (c.status !== 'declined' ? (c.unread_artist_count ?? 0) : 0),
          0
        );
        updateBadge('consultations', badge);
      } catch { /* non-critical */ }
    })();
  }, [accessToken, updateBadge]);

  // Consent forms badge — unsigned forms
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/consent`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const unsigned = (data.bookings || []).filter(
          (b: { consent_form_id: string | null; appointment_status: string }) =>
            !b.consent_form_id && b.appointment_status === 'pending_consent'
        ).length;
        updateBadge('consent-forms', unsigned);
      } catch { /* non-critical */ }
    })();
  }, [accessToken, updateBadge]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  // ── Sidebar content ──────────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      {/* Logo + identity */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem', textDecoration: 'none' }}>
          <Image
            src="/assets/logos/White Logo.png"
            alt="Hall of Mirrors"
            width={32}
            height={32}
            style={{ width: '2rem', height: 'auto', opacity: 0.85 }}
          />
          <span style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.55)',
          }}>
            Client Portal
          </span>
        </Link>
        <p style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1.1rem',
          color: 'var(--cream)',
          lineHeight: 1.2,
          margin: 0,
        }}>
          {user?.first_name ? `Welcome back, ${user.first_name}` : 'Welcome back'}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(201,168,76,0.1)', marginBottom: '1.25rem' }} />

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {TABS.map(({ id, label, icon }) => {
            const isActive = activeTab === id;
            const badge = badges[id] ?? 0;
            return (
              <li key={id}>
                <button
                  onClick={() => handleTabChange(id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    backgroundColor: isActive ? 'rgba(201,168,76,0.09)' : 'transparent',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                    color: isActive ? 'var(--gold)' : 'var(--text-mid)',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 500 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'color 0.2s ease, background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--cream)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-mid)'; }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '0.7rem', opacity: isActive ? 1 : 0.5 }}>{icon}</span>
                    {label}
                  </span>
                  {badge > 0 && (
                    <span style={{
                      padding: '0.1rem 0.45rem',
                      background: 'var(--gold)',
                      color: 'var(--bg)',
                      borderRadius: '2rem',
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      lineHeight: 1.5,
                      flexShrink: 0,
                    }}>
                      {badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer actions */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(201,168,76,0.1)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <Link
          href="/booking"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '0.5rem',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.8125rem',
            color: 'var(--text-mid)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cream)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-mid)')}
        >
          <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>↗</span>
          Book a session
        </Link>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '0.5rem',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.8125rem',
            color: 'var(--text-low)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cream)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-low)')}
        >
          <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>←</span>
          Sign out
        </button>
      </div>
    </>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ClientProtectedRoute>
      <div className="-mt-24 md:-mt-32" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>

        {/* ── Desktop sidebar ── */}
        <aside
          className="hidden md:flex"
          style={{
            position: 'fixed',
            top: '1.5rem',
            left: '1.5rem',
            width: '220px',
            maxHeight: 'calc(100vh - 3rem)',
            backgroundColor: 'rgba(14,12,9,0.88)',
            backdropFilter: 'blur(24px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
            border: '1px solid rgba(201,168,76,0.14)',
            borderRadius: '1.25rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
            flexDirection: 'column',
            padding: '1.75rem 1rem',
            zIndex: 50,
            overflowY: 'auto',
          }}
        >
          <SidebarContent />
        </aside>

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div
            className="md:hidden"
            style={{ position: 'fixed', inset: 0, zIndex: 60 }}
            onClick={() => setSidebarOpen(false)}
          >
            {/* Backdrop */}
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)' }} />
            {/* Sidebar */}
            <aside
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '280px',
                height: '100%',
                backgroundColor: 'rgba(14,12,9,0.98)',
                borderRight: '1px solid rgba(201,168,76,0.12)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.75rem 1.125rem',
                overflowY: 'auto',
                animation: 'fadeIn 0.18s ease both',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* ── Main content ── */}
        <main
          className="md:ml-[264px]"
          style={{
            flex: 1,
            backgroundColor: 'var(--bg)',
            padding: '2.5rem 1.5rem',
          }}
        >
          {/* Mobile header bar */}
          <div
            className="flex md:hidden"
            style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                color: 'var(--cream)',
                cursor: 'pointer',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '1rem',
                lineHeight: 1,
              }}
              aria-label="Open menu"
            >
              ≡
            </button>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.5)' }}>
              {TABS.find(t => t.id === activeTab)?.label}
            </span>
            <div style={{ width: '2.75rem' }} /> {/* spacer */}
          </div>

          {/* Tab content */}
          <div
            style={{ maxWidth: '860px', margin: '0 auto' }}
            key={activeTab}
            className="tab-content"
          >
            {activeTab === 'bookings'      && <BookingsTab onBadgeUpdate={onBookingsBadge} />}
            {activeTab === 'consultations' && <ConsultationsTab />}
            {activeTab === 'design-ideas'  && <DesignIdeasTab />}
            {activeTab === 'consent-forms' && <ConsentFormsTab />}
            {activeTab === 'profile'       && <ProfileTab />}
          </div>

          {/* Mini-footer */}
          <div style={{ borderTop: '1px solid rgba(201,168,76,0.08)', paddingTop: '2rem', marginTop: '5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--text-low)', opacity: 0.5, margin: 0 }}>
              © {new Date().getFullYear()} Hall of Mirrors Tattoo. All rights reserved.
            </p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--text-low)', opacity: 0.4, margin: 0 }}>
              Liverpool City Council Reg. · A11394900
            </p>
          </div>
        </main>

      </div>
    </ClientProtectedRoute>
  );
}
