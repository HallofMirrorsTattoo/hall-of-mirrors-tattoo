'use client';

import { useState, useEffect } from 'react';
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
  padding: '0.75rem 1rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  color: 'var(--cream)',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.25s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.68rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.55)',
  marginBottom: '0.4rem',
};

const sectionHeadStyle: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.72rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: 'var(--text-low)',
  marginBottom: '1.25rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid var(--border)',
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
          borderColor: focused ? 'rgba(201,168,76,0.5)' : 'var(--border)',
          opacity: readOnly ? 0.5 : 1,
          cursor: readOnly ? 'default' : 'text',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function ProfileTab() {
  const { accessToken } = useClientAuth();
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
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const handleChange = (name: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton" style={{ height: '3rem', borderRadius: '0.5rem' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '580px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Your account</p>
        <h2 style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          color: 'var(--cream)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          margin: 0,
        }}>
          My Profile
        </h2>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6, marginTop: '0.5rem' }}>
          Your details here auto-fill your consent form for each new session.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--error-text)', fontFamily: '"DM Sans", sans-serif' }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ padding: '0.875rem 1rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gold)', fontFamily: '"DM Sans", sans-serif' }}>{success}</p>
          </div>
        )}

        {/* Personal details */}
        <section style={{ marginBottom: '2.5rem' }}>
          <p style={sectionHeadStyle}>Personal details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <Field label="First name" name="first_name" value={form.first_name} onChange={handleChange} />
            <Field label="Last name" name="last_name" value={form.last_name} onChange={handleChange} />
          </div>
          <div style={{ marginTop: '0.875rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <Field label="Email" name="email" value={form.email} onChange={handleChange} type="email" readOnly />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} type="tel" />
          </div>
        </section>

        {/* Address */}
        <section style={{ marginBottom: '2.5rem' }}>
          <p style={sectionHeadStyle}>Address</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <Field label="Street address" name="address" value={form.address} onChange={handleChange} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <Field label="City" name="city" value={form.city} onChange={handleChange} />
              <Field label="Postcode" name="postcode" value={form.postcode} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* Emergency contact */}
        <section style={{ marginBottom: '2.5rem' }}>
          <p style={sectionHeadStyle}>Emergency contact</p>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Required before your appointment. Someone we can contact in the unlikely event of an emergency.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
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
          <span>{saving ? 'Saving…' : 'Save changes'}</span>
          {!saving && <span className="btn-icon" aria-hidden="true">→</span>}
        </button>
      </form>
    </div>
  );
}
