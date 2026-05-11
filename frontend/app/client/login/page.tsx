'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useClientAuth } from '@/lib/clientAuthContext';

export default function ClientLoginPage() {
  const router = useRouter();
  const { login, isLoading } = useClientAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await login(formData.email, formData.password);
      setSuccess('Login successful. Redirecting...');
      setTimeout(() => router.push('/client/dashboard'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '26rem', margin: '0 auto', padding: '2rem 1.5rem 0' }}>

        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Client Portal</p>
          <h1 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--cream)',
            letterSpacing: '-0.02em',
            lineHeight: 1.0,
          }}>
            Welcome back
          </h1>
        </div>

        <div className="card-premium">
          <div className="card-premium-inner">

            {error && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem 1.25rem',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '0.5rem',
              }}>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: '#fca5a5' }}>
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem 1.25rem',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: '0.5rem',
              }}>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--gold)' }}>
                  {success}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center"
                style={{ opacity: isLoading ? 0.7 : 1, marginTop: '0.5rem' }}
              >
                <span>{isLoading ? 'Logging in...' : 'Login'}</span>
              </button>
            </form>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'center' }}>
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)' }}>
                <Link href="/client/forgot-password" className="footer-link" style={{ color: 'var(--gold)', opacity: 1 }}>
                  Forgot your password?
                </Link>
              </p>
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)' }}>
                No account?{' '}
                <Link href="/client/signup" className="footer-link" style={{ color: 'var(--gold)', opacity: 1 }}>
                  Sign up
                </Link>
              </p>
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)' }}>
                Previous booking?{' '}
                <Link href="/client/activate" className="footer-link" style={{ color: 'var(--gold)', opacity: 1 }}>
                  Activate your account
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
