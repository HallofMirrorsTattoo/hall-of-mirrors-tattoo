'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSuccess(true);
      setTimeout(() => router.push('/client/login'), 2500);
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
            New password
          </h1>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              padding: '2rem',
              background: 'var(--surface)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text)', margin: 0 }}>
                Password updated. Redirecting you to login.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{ padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--error-text)' }}>{error}</p>
              </div>
            )}

            {[
              { label: 'New password', value: password, onChange: setPassword, placeholder: 'Min. 8 characters' },
              { label: 'Confirm password', value: confirm, onChange: setConfirm, placeholder: 'Repeat password' },
            ].map(({ label, value, onChange, placeholder }) => (
              <div key={label}>
                <label style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.55, marginBottom: '0.5rem' }}>
                  {label}
                </label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  required
                  placeholder={placeholder}
                  disabled={!token || !email}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--cream)',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading || !token || !email}
              className="btn-primary"
              style={{ width: '100%', padding: '0.875rem', opacity: (loading || !token || !email) ? 0.6 : 1, cursor: (loading || !token || !email) ? 'default' : 'pointer' }}
            >
              {loading ? 'Updating...' : 'Set new password'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-mid)', margin: 0 }}>
              <Link href="/client/forgot-password" style={{ color: 'var(--gold)', opacity: 0.75, textDecoration: 'none' }}>
                Request a new link
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
