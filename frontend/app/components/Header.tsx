'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useClientAuth } from '@/lib/clientAuthContext';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/',            label: 'Home' },
  { href: '/portfolio',   label: 'Artists' },
  { href: '/about',       label: 'Studio' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useClientAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Hide header on dashboard pages — dashboards have their own sidebar navigation
  if (pathname.startsWith('/client/dashboard') || pathname.startsWith('/artist/dashboard')) {
    return null;
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-40 pt-5 px-4">
      <nav
        className="max-w-5xl mx-auto rounded-full p-1.5 transition-all duration-500"
        style={{
          background: scrolled
            ? 'rgba(14,12,9,0.88)'
            : 'rgba(14,12,9,0.55)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          border: '1px solid rgba(201,168,76,0.14)',
          boxShadow: scrolled
            ? '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
            : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex justify-between items-center px-4 py-2">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center transition-opacity duration-300 hover:opacity-75"
            aria-label="Hall of Mirrors — Home"
          >
            <Image
              src="/assets/logos/White Logo.png"
              alt="Hall of Mirrors"
              width={48}
              height={48}
              priority
              style={{ width: '2.75rem', height: '2.75rem', objectFit: 'contain' }}
            />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex gap-8 flex-1 justify-center">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      fontFamily: '"DM Sans", system-ui, sans-serif',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: active ? 'var(--gold)' : 'rgba(242,237,224,0.75)',
                      letterSpacing: '0.01em',
                      transition: 'color 0.25s ease',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => { if (!active) (e.target as HTMLElement).style.color = 'var(--cream)'; }}
                    onMouseLeave={(e) => { if (!active) (e.target as HTMLElement).style.color = 'rgba(242,237,224,0.75)'; }}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex gap-4 items-center">
            {user ? (
              <>
                <Link
                  href="/client/dashboard"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.875rem',
                    color: 'rgba(242,237,224,0.7)',
                    transition: 'color 0.25s ease',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--gold)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(242,237,224,0.7)'; }}
                >
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/client/login"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.875rem',
                    color: 'rgba(242,237,224,0.7)',
                    transition: 'color 0.25s ease',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--gold)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(242,237,224,0.7)'; }}
                >
                  Login
                </Link>
                <Link href="/booking" className="btn-primary" style={{ padding: '0.5625rem 1.375rem', fontSize: '0.8125rem' }}>
                  <span>Book</span>
                  <span className="btn-icon" style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.7rem' }} aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden relative w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-300"
            style={{ color: 'rgba(242,237,224,0.8)' }}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            <svg
              className="absolute transition-all duration-400"
              style={{ opacity: isOpen ? 0 : 1, transform: isOpen ? 'rotate(90deg)' : 'none' }}
              width="20" height="20" viewBox="0 0 20 20" fill="none"
            >
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <svg
              className="absolute transition-all duration-400"
              style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? 'none' : 'rotate(-90deg)' }}
              width="20" height="20" viewBox="0 0 20 20" fill="none"
            >
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="fixed inset-0 top-20 md:hidden z-30"
          style={{ animation: 'fadeIn 0.18s ease both' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div
            className="m-4 rounded-2xl p-8 space-y-6"
            style={{
              background: 'rgba(14,12,9,0.96)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(201,168,76,0.14)',
              animation: 'tabFadeIn 0.22s cubic-bezier(0.22,1,0.36,1) both',
            }}
          >
            <ul className="space-y-5">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: '1.75rem',
                      fontWeight: 300,
                      fontStyle: 'italic',
                      color: pathname === href ? 'var(--gold)' : 'var(--cream)',
                      display: 'block',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div
              style={{
                height: '1px',
                background: 'rgba(201,168,76,0.12)',
              }}
            />

            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <Link href="/client/dashboard" onClick={() => setIsOpen(false)} className="btn-secondary" style={{ justifyContent: 'center' }}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="btn-primary" style={{ justifyContent: 'center' }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/client/login" onClick={() => setIsOpen(false)} className="btn-secondary" style={{ justifyContent: 'center' }}>
                    Login
                  </Link>
                  <Link href="/booking" onClick={() => setIsOpen(false)} className="btn-primary" style={{ justifyContent: 'center' }}>
                    <span>Book Appointment</span>
                    <span className="btn-icon" aria-hidden="true">↗</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
