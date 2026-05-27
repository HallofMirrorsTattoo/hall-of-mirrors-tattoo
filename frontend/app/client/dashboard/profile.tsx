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

interface HealthData {
  pregnant_or_breastfeeding: boolean;
  blood_borne_conditions: boolean;
  diabetes: boolean;
  heart_condition: boolean;
  haemophilia_or_bleeding_disorder: boolean;
  epilepsy_or_seizure: boolean;
  skin_conditions: string;
  autoimmune_conditions: boolean;
  blood_thinners: boolean;
  steroids_or_immunosuppressants: boolean;
  known_allergies: string;
  allergies_latex: boolean;
  allergies_ink: boolean;
  allergies_topical_anaesthetics: boolean;
  previous_tattoo_reaction: boolean;
  previous_reaction_details: string;
  chemotherapy_or_radiotherapy: boolean;
  current_medications: string;
}

const emptyHealth: HealthData = {
  pregnant_or_breastfeeding: false,
  blood_borne_conditions: false,
  diabetes: false,
  heart_condition: false,
  haemophilia_or_bleeding_disorder: false,
  epilepsy_or_seizure: false,
  skin_conditions: '',
  autoimmune_conditions: false,
  blood_thinners: false,
  steroids_or_immunosuppressants: false,
  known_allergies: '',
  allergies_latex: false,
  allergies_ink: false,
  allergies_topical_anaesthetics: false,
  previous_tattoo_reaction: false,
  previous_reaction_details: '',
  chemotherapy_or_radiotherapy: false,
  current_medications: '',
};

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
  label, name, value, onChange, type = 'text', readOnly = false,
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

function YesNoToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', flex: 1, paddingRight: '1rem', lineHeight: 1.4 }}>{label}</span>
      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onChange(false)}
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid',
            fontSize: '0.7rem',
            fontFamily: '"DM Mono", monospace',
            cursor: 'pointer',
            borderColor: !value ? 'var(--gold)' : 'var(--border)',
            background: !value ? 'rgba(201,168,76,0.12)' : 'transparent',
            color: !value ? 'var(--gold)' : 'var(--text-low)',
          }}
        >No</button>
        <button
          type="button"
          onClick={() => onChange(true)}
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid',
            fontSize: '0.7rem',
            fontFamily: '"DM Mono", monospace',
            cursor: 'pointer',
            borderColor: value ? 'var(--gold)' : 'var(--border)',
            background: value ? 'rgba(201,168,76,0.12)' : 'transparent',
            color: value ? 'var(--gold)' : 'var(--text-low)',
          }}
        >Yes</button>
      </div>
    </div>
  );
}

function HealthTextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder="Leave blank if none"
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          borderColor: focused ? 'rgba(201,168,76,0.5)' : 'var(--border)',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export default function ProfileTab() {
  const { accessToken, logout } = useClientAuth();
  const [form, setForm] = useState<ProfileData>({
    first_name: '', last_name: '', email: '', phone: '',
    address: '', city: '', postcode: '',
    emergency_contact_name: '', emergency_contact_phone: '',
  });
  const [health, setHealth] = useState<HealthData>({ ...emptyHealth });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Security: change password
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Delete account flow
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteAck, setDeleteAck] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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
          if (data.health) {
            const h = data.health;
            setHealth({
              pregnant_or_breastfeeding:        !!h.pregnant_or_breastfeeding,
              blood_borne_conditions:           !!h.blood_borne_conditions,
              diabetes:                         !!h.diabetes,
              heart_condition:                  !!h.heart_condition,
              haemophilia_or_bleeding_disorder: !!h.haemophilia_or_bleeding_disorder,
              epilepsy_or_seizure:              !!h.epilepsy_or_seizure,
              skin_conditions:                  h.skin_conditions || '',
              autoimmune_conditions:            !!h.autoimmune_conditions,
              blood_thinners:                   !!h.blood_thinners,
              steroids_or_immunosuppressants:   !!h.steroids_or_immunosuppressants,
              known_allergies:                  h.known_allergies || '',
              allergies_latex:                  !!h.allergies_latex,
              allergies_ink:                    !!h.allergies_ink,
              allergies_topical_anaesthetics:   !!h.allergies_topical_anaesthetics,
              previous_tattoo_reaction:         !!h.previous_tattoo_reaction,
              previous_reaction_details:        h.previous_reaction_details || '',
              chemotherapy_or_radiotherapy:     !!h.chemotherapy_or_radiotherapy,
              current_medications:              h.current_medications || '',
            });
          }
        }
      } catch {
        setError('We couldn’t load your profile. Refresh to try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const handleChange = (name: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwNew.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setPwSuccess('Password updated.');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }
    if (!deleteAck) {
      setDeleteError('Please acknowledge the data retention notice.');
      return;
    }
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to close account');
      logout();
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to close account.');
      setDeleteSubmitting(false);
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ...form, health }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSuccess('Profile updated.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn’t save your changes. Please try again.');
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
          <div className="alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>
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

        {/* Health information */}
        <section style={{ marginBottom: '2.5rem' }}>
          <p style={sectionHeadStyle}>Health information</p>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Saved here so your consent form is pre-filled at each appointment. All information is kept strictly confidential. You can update these at any time.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <YesNoToggle label="Pregnant or breastfeeding" value={health.pregnant_or_breastfeeding} onChange={v => setHealth(p => ({ ...p, pregnant_or_breastfeeding: v }))} />
            <YesNoToggle label="Blood-borne conditions (HIV, Hepatitis B or C)" value={health.blood_borne_conditions} onChange={v => setHealth(p => ({ ...p, blood_borne_conditions: v }))} />
            <YesNoToggle label="Diabetes" value={health.diabetes} onChange={v => setHealth(p => ({ ...p, diabetes: v }))} />
            <YesNoToggle label="Heart condition or pacemaker" value={health.heart_condition} onChange={v => setHealth(p => ({ ...p, heart_condition: v }))} />
            <YesNoToggle label="Haemophilia or bleeding disorder" value={health.haemophilia_or_bleeding_disorder} onChange={v => setHealth(p => ({ ...p, haemophilia_or_bleeding_disorder: v }))} />
            <YesNoToggle label="Epilepsy or seizure disorder" value={health.epilepsy_or_seizure} onChange={v => setHealth(p => ({ ...p, epilepsy_or_seizure: v }))} />
            <YesNoToggle label="Autoimmune conditions" value={health.autoimmune_conditions} onChange={v => setHealth(p => ({ ...p, autoimmune_conditions: v }))} />
            <YesNoToggle label="Currently taking blood thinners (e.g. warfarin, aspirin)" value={health.blood_thinners} onChange={v => setHealth(p => ({ ...p, blood_thinners: v }))} />
            <YesNoToggle label="Steroids or immunosuppressants" value={health.steroids_or_immunosuppressants} onChange={v => setHealth(p => ({ ...p, steroids_or_immunosuppressants: v }))} />
            <YesNoToggle label="Currently undergoing chemotherapy or radiotherapy" value={health.chemotherapy_or_radiotherapy} onChange={v => setHealth(p => ({ ...p, chemotherapy_or_radiotherapy: v }))} />
            <YesNoToggle label="Previous reaction to a tattoo" value={health.previous_tattoo_reaction} onChange={v => setHealth(p => ({ ...p, previous_tattoo_reaction: v }))} />
          </div>

          <p style={{ ...sectionHeadStyle, marginTop: '1.5rem' }}>Allergies</p>
          <YesNoToggle label="Latex allergy" value={health.allergies_latex} onChange={v => setHealth(p => ({ ...p, allergies_latex: v }))} />
          <YesNoToggle label="Ink or pigment allergy" value={health.allergies_ink} onChange={v => setHealth(p => ({ ...p, allergies_ink: v }))} />
          <YesNoToggle label="Topical anaesthetic allergy" value={health.allergies_topical_anaesthetics} onChange={v => setHealth(p => ({ ...p, allergies_topical_anaesthetics: v }))} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '1.5rem' }}>
            <HealthTextField label="Skin conditions (eczema, psoriasis, etc.)" value={health.skin_conditions} onChange={v => setHealth(p => ({ ...p, skin_conditions: v }))} />
            <HealthTextField label="Known allergies (any not listed above)" value={health.known_allergies} onChange={v => setHealth(p => ({ ...p, known_allergies: v }))} />
            <HealthTextField label="Current medications" value={health.current_medications} onChange={v => setHealth(p => ({ ...p, current_medications: v }))} />
            <HealthTextField label="Previous reaction details (if applicable)" value={health.previous_reaction_details} onChange={v => setHealth(p => ({ ...p, previous_reaction_details: v }))} />
          </div>

          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem', color: 'var(--text-low)', lineHeight: 1.5, marginTop: '1.25rem', opacity: 0.7 }}>
            Note: you will still be asked whether you have consumed alcohol or drugs in the 24 hours before each appointment — this cannot be pre-saved.
          </p>
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

      {/* ── Security: change password ────────────────────────────────────── */}
      <section style={{ marginTop: '3.5rem' }}>
        <p style={sectionHeadStyle}>Security</p>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Change the password for your account.
        </p>
        <form onSubmit={handleChangePassword}>
          {pwError && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>{pwError}</div>
          )}
          {pwSuccess && (
            <div style={{ padding: '0.875rem 1rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gold)', fontFamily: '"DM Sans", sans-serif' }}>{pwSuccess}</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={labelStyle}>Current password</label>
              <input
                type="password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                autoComplete="current-password"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>New password</label>
              <input
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                autoComplete="new-password"
                style={inputStyle}
              />
              <p style={{ margin: '0.4rem 0 0', fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem', color: 'var(--text-low)' }}>At least 8 characters.</p>
            </div>
            <div>
              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
            className="btn-primary"
            style={{ marginTop: '1.25rem', padding: '0.875rem 2.5rem', opacity: (pwSaving || !pwCurrent || !pwNew || !pwConfirm) ? 0.6 : 1, cursor: pwSaving ? 'default' : 'pointer' }}
          >
            <span>{pwSaving ? 'Updating…' : 'Update password'}</span>
            {!pwSaving && <span className="btn-icon" aria-hidden="true">→</span>}
          </button>
        </form>
      </section>

      {/* ── Danger zone: close account ───────────────────────────────────── */}
      <section style={{ marginTop: '3.5rem' }}>
        <p style={{ ...sectionHeadStyle, color: '#f87171', borderBottomColor: 'rgba(239,68,68,0.25)' }}>Close account</p>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.65, marginBottom: '0.75rem' }}>
          Closing your account will end your access to the client portal, stop all future emails from us, and revoke your ability to book through this site.
        </p>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
          For your safety and ours, your booking history, signed consent forms, messages, deposits paid or forfeited, and any cancellation records are retained in accordance with Liverpool City Council tattoo studio licensing requirements. They are kept securely and used only if needed for aftercare follow-up or a regulatory enquiry.
        </p>
        <button
          type="button"
          onClick={() => { setDeleteOpen(true); setDeleteError(''); setDeletePassword(''); setDeleteAck(false); }}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            background: 'transparent',
            border: '1px solid rgba(239,68,68,0.45)',
            color: '#f87171',
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.7)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.45)'; }}
        >
          Close my account
        </button>
      </section>

      {/* Close-account confirmation modal */}
      {deleteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm account closure"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease both',
          }}
          onClick={() => !deleteSubmitting && setDeleteOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '440px',
              background: 'var(--surface)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '1rem',
              padding: '1.75rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
            }}
          >
            <p style={{ ...sectionHeadStyle, color: '#f87171', borderBottom: 'none', marginBottom: '0.75rem', paddingBottom: 0 }}>This is permanent</p>
            <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: '1.5rem', color: 'var(--cream)', margin: '0 0 0.75rem', lineHeight: 1.2 }}>
              Close your Hall of Mirrors account?
            </h3>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: '0.625rem' }}>
              You will be logged out immediately. You will no longer be able to log in, message your artist, sign new consent forms, or receive any emails from us.
            </p>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Your existing booking history, signed consent forms, messages, deposits paid or forfeited, and cancellation records will be retained securely in line with Liverpool City Council tattoo studio licensing requirements.
            </p>

            {deleteError && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>{deleteError}</div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Confirm with your password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
                style={inputStyle}
                disabled={deleteSubmitting}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={deleteAck}
                onChange={(e) => setDeleteAck(e.target.checked)}
                disabled={deleteSubmitting}
                style={{ width: '1rem', height: '1rem', marginTop: '0.15rem', flexShrink: 0, accentColor: 'rgba(239,68,68,0.85)' }}
              />
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-mid)', lineHeight: 1.55 }}>
                I understand my booking, consent, message, and payment records will be retained in accordance with Liverpool City Council regulations.
              </span>
            </label>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleteSubmitting}
                style={{
                  padding: '0.7rem 1.25rem',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-mid)',
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.72rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: deleteSubmitting ? 'default' : 'pointer',
                  opacity: deleteSubmitting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteSubmitting || !deletePassword || !deleteAck}
                style={{
                  padding: '0.7rem 1.25rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.55)',
                  color: '#f87171',
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.72rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: (deleteSubmitting || !deletePassword || !deleteAck) ? 'default' : 'pointer',
                  opacity: (deleteSubmitting || !deletePassword || !deleteAck) ? 0.5 : 1,
                }}
              >
                {deleteSubmitting ? 'Closing…' : 'Permanently close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
