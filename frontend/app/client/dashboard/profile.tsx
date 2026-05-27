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
  const { accessToken } = useClientAuth();
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
    </div>
  );
}
