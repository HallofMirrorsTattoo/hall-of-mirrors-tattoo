'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const inputStyle: React.CSSProperties = {
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
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.75rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  opacity: 0.55,
  marginBottom: '0.5rem',
};

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  readOnly = false,
}: {
  label: string;
  name: keyof ProfileData;
  value: string;
  onChange: (name: keyof ProfileData, value: string) => void;
  type?: string;
  readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(name, e.target.value)}
        style={{
          ...inputStyle,
          borderColor: focused ? 'var(--gold)' : 'var(--border)',
          opacity: readOnly ? 0.55 : 1,
          cursor: readOnly ? 'default' : 'text',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function ClientProfilePage() {
  const router = useRouter();
  const { accessToken, isLoading: authLoading, logout } = useClientAuth();
  const [form, setForm] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!authLoading && !accessToken) {
      router.push('/client/login');
    }
  }, [authLoading, accessToken, router]);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (res.ok && data.user) {
          const u = data.user;
          setForm({
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            phone: u.phone || '',
            address: u.address || '',
            city: u.city || '',
            postcode: u.postcode || '',
            emergency_contact_name: u.emergency_contact_name || '',
            emergency_contact_phone: u.emergency_contact_phone || '',
          });
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const handleChange = (name: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete account');
      }
      logout();
      router.push('/');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSuccess('Profile updated.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Loading</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--bg)', paddingTop: '7rem', paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <Link href="/client/dashboard" style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.5, textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
            ← Dashboard
          </Link>
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Your account</p>
          <h1 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
            fontWeight: 300,
            color: 'var(--cream)',
            lineHeight: 1.1,
            margin: 0,
          }}>
            Edit profile
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#f87171' }}>{error}</p>
            </div>
          )}
          {success && (
            <div style={{ padding: '0.875rem 1rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gold)' }}>{success}</p>
            </div>
          )}

          <section style={{ marginBottom: '3rem' }}>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              Personal details
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="First name" name="first_name" value={form.first_name} onChange={handleChange} />
              <Field label="Last name" name="last_name" value={form.last_name} onChange={handleChange} />
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Email" name="email" value={form.email} onChange={handleChange} type="email" readOnly />
              <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} type="tel" />
            </div>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              Address
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Street address" name="address" value={form.address} onChange={handleChange} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="City" name="city" value={form.city} onChange={handleChange} />
                <Field label="Postcode" name="postcode" value={form.postcode} onChange={handleChange} />
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              Emergency contact
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Required before your appointment. A person we can contact in the unlikely event of an emergency.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} />
              <Field label="Phone" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} type="tel" />
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '0.875rem 2.5rem', opacity: saving ? 0.6 : 1, cursor: saving ? 'default' : 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>

        {/* Danger zone */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.5)', marginBottom: '1.5rem' }}>
            Danger zone
          </p>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '0.5rem' }}>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', marginBottom: '0.5rem', fontWeight: 500 }}>
              Delete account
            </p>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
              This permanently removes your personal details from our records. Your booking history is retained for studio administration — we are legally required to keep this.
            </p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              style={{ padding: '0.625rem 1.5rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '0.375rem', color: '#f87171', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.7)'; (e.target as HTMLButtonElement).style.color = '#fca5a5'; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)'; (e.target as HTMLButtonElement).style.color = '#f87171'; }}
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(14,12,9,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteOpen(false); }}
        >
          <div style={{ width: '100%', maxWidth: '24rem', background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.75rem', padding: '2rem' }}>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f87171', marginBottom: '1rem' }}>
              Confirm deletion
            </p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 300, color: 'var(--cream)', marginBottom: '1rem', lineHeight: 1.2 }}>
              Are you sure?
            </p>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-low)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your personal details will be permanently removed. This cannot be undone. Your booking records will remain for studio accounting purposes.
            </p>

            {deleteError && (
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: '#fca5a5', marginBottom: '1rem' }}>{deleteError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => { setDeleteOpen(false); setDeleteError(''); }}
                disabled={deleting}
                style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.375rem', color: 'var(--text-mid)', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '0.75rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '0.375rem', color: '#fca5a5', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
