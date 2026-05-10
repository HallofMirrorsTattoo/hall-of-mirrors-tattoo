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
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => router.push('/client/dashboard'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-primary-light pt-40 pb-20">
      <div className="max-w-md mx-auto px-4">
        <div className="card-premium">
          <div className="card-premium-inner">
            <h1 className="text-3xl font-serif font-bold text-primary-dark mb-8 text-center">
              Client Login
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary-dark/80 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white border border-primary-dark/10 rounded-lg px-4 py-3 text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-dark/80 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white border border-primary-dark/10 rounded-lg px-4 py-3 text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-8 space-y-4 text-center">
              <p className="text-sm text-primary-dark/70">
                Don't have an account?{' '}
                <Link href="/client/signup" className="text-accent-gold hover:text-primary-dark font-medium">
                  Sign up
                </Link>
              </p>
              <p className="text-sm text-primary-dark/70">
                Already have an account from a previous booking?{' '}
                <Link href="/client/activate" className="text-accent-gold hover:text-primary-dark font-medium">
                  Activate it
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
