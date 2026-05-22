'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '1rem' }}>Client Account</p>
          <h1 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: 300,
            color: 'var(--cream)',
            lineHeight: 1.1,
            margin: 0,
          }}>
            Reset password
          </h1>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: '2rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text)', margin: 0 }}>
                If that email address is in our system, a reset link is on its way. Check your inbox.
              </p>
            </div>
            <Link
              href="/client/login"
              style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.7 }}
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div className="alert-error">{error}</div>
            )}

            <div>
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer' }}
            >
              <span>{loading ? 'Sending...' : 'Send reset link'}</span>
              {!loading && <span className="btn-icon" aria-hidden="true">→</span>}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-mid)', margin: 0 }}>
              <Link href="/client/login" style={{ color: 'var(--gold)', opacity: 0.75, textDecoration: 'none' }}>
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
