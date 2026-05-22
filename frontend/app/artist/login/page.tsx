'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

export default function ArtistLogin() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/artist/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6875rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>
          Hall of Mirrors
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '22rem' }}>

        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Studio Access</p>
          <h1 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            color: 'var(--cream)',
            letterSpacing: '-0.02em',
            lineHeight: 1.0,
          }}>
            Artist Login
          </h1>
        </div>

        <div className="card-premium">
          <div className="card-premium-inner">

            {error && (
              <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="artist-email">Email</label>
                <input
                  id="artist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="artist-password">Password</label>
                <input
                  id="artist-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center"
                style={{ opacity: isSubmitting ? 0.7 : 1, marginTop: '0.5rem' }}
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
                {!isSubmitting && <span className="btn-icon" aria-hidden="true">→</span>}
              </button>
            </form>

            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
              For artist access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
