'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useClientAuth } from '@/lib/clientAuthContext';

export default function ClientSignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useClientAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setError('Email, password, first name, and last name are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await signup(formData.email, formData.password, formData.first_name, formData.last_name, formData.phone);
      setSuccess('Account created. Redirecting to your dashboard...');
      setTimeout(() => router.push('/client/dashboard'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
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
            Create account
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name">First Name *</label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="First"
                  />
                </div>
                <div>
                  <label htmlFor="last_name">Last Name *</label>
                  <input
                    id="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Last"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email">Email *</label>
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
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+44 (0)..."
                />
              </div>

              <div>
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.625rem', letterSpacing: '0.1em', color: 'var(--text-low)', marginTop: '0.375rem' }}>
                  At least 8 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center"
                style={{ opacity: isLoading ? 0.7 : 1, marginTop: '0.5rem' }}
              >
                <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)' }}>
                Already have an account?{' '}
                <Link href="/client/login" className="footer-link" style={{ color: 'var(--gold)', opacity: 1 }}>
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
