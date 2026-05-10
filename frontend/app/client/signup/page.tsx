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

    // Validation
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
      setSuccess('Signup successful! Redirecting to dashboard...');
      setTimeout(() => router.push('/client/dashboard'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark pt-40 pb-20">
      <div className="max-w-md mx-auto px-4">
        <div className="card-premium">
          <div className="card-premium-inner">
            <h1 className="text-3xl font-serif font-bold text-primary-dark mb-8 text-center">
              Create Account
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-primary-dark/80 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-white border border-primary-dark/10 rounded-lg px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
                    placeholder="First"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-dark/80 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-white border border-primary-dark/10 rounded-lg px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
                    placeholder="Last"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary-dark/80 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white border border-primary-dark/10 rounded-lg px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-primary-dark/80 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border border-primary-dark/10 rounded-lg px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
                  placeholder="+44 (0)..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-primary-dark/80 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white border border-primary-dark/10 rounded-lg px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
                  placeholder="••••••••"
                />
                <p className="text-xs text-primary-dark/60 mt-1">At least 8 characters</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary-dark/80 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-white border border-primary-dark/10 rounded-lg px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-primary-dark/70">
                Already have an account?{' '}
                <Link href="/client/login" className="text-accent-gold hover:text-primary-dark font-medium">
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
