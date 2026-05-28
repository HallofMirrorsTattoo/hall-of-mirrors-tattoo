'use client';

import { useState } from 'react';
import Link from 'next/link';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  color: 'var(--cream)',
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box',
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

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.75rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: 'var(--text-low)',
  marginBottom: '1.25rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid var(--border)',
};

const initialMedical = {
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
  alcohol_or_drugs_last_24h: false,
  known_allergies: '',
  allergies_latex: false,
  allergies_ink: false,
  allergies_topical_anaesthetics: false,
  previous_tattoo_reaction: false,
  previous_reaction_details: '',
  chemotherapy_or_radiotherapy: false,
  current_medications: '',
};

const initialConsent = {
  age_confirmed: false,
  health_accuracy_confirmed: false,
  risks_understood_confirmed: false,
  sobriety_confirmed: false,
  suitability_confirmed: false,
  voluntary_consent_confirmed: false,
  design_approved_confirmed: false,
  aftercare_responsibility_confirmed: false,
  photography_permission: false,
  gdpr_consent_confirmed: false,
};

function YesNoRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--text)', flex: 1, paddingRight: '1rem' }}>{label}</span>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onChange(false)}
          style={{
            padding: '0.3rem 0.875rem',
            borderRadius: '0.25rem',
            border: '1px solid',
            fontSize: '0.75rem',
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
            padding: '0.3rem 0.875rem',
            borderRadius: '0.25rem',
            border: '1px solid',
            fontSize: '0.75rem',
            fontFamily: '"DM Mono", monospace',
            cursor: 'pointer',
            borderColor: value ? 'var(--gold)' : 'var(--border)',
            background: value ? 'var(--gold-muted)' : 'transparent',
            color: value ? 'var(--gold)' : 'var(--text-low)',
          }}
        >Yes</button>
      </div>
    </div>
  );
}

function ConsentCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '4px',
          border: `2px solid ${checked ? 'var(--gold)' : 'var(--border)'}`,
          background: checked ? 'var(--gold)' : 'transparent',
          flexShrink: 0,
          marginTop: '1px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        {checked && <span style={{ color: 'var(--bg)', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontSize: '0.9rem', color: checked ? 'var(--cream)' : 'var(--text-mid)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

export default function WalkInConsentPage() {
  const [profile, setProfile] = useState({
    first_name: '', last_name: '', email: '', phone: '', date_of_birth: '',
    address: '', city: '', postcode: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    tattoo_description: '', placement: '', estimated_size: 'small',
  });
  const [medical, setMedical] = useState({ ...initialMedical });
  const [consent, setConsent] = useState({ ...initialConsent });
  const [fullName, setFullName] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [website, setWebsite] = useState(''); // honeypot — must stay empty
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ bookingReference: string; formReference: string } | null>(null);

  const updateProfile = <K extends keyof typeof profile>(k: K, v: (typeof profile)[K]) =>
    setProfile(prev => ({ ...prev, [k]: v }));

  const requiredConsent = [
    'age_confirmed', 'health_accuracy_confirmed', 'risks_understood_confirmed',
    'sobriety_confirmed', 'suitability_confirmed', 'voluntary_consent_confirmed',
    'design_approved_confirmed', 'aftercare_responsibility_confirmed',
    'gdpr_consent_confirmed',
  ] as const;
  const allRequiredConsentChecked = requiredConsent.every(k => consent[k]);

  const personalComplete =
    profile.first_name.trim() && profile.last_name.trim() && profile.email.trim() &&
    profile.phone.trim() && profile.date_of_birth && profile.placement.trim();

  const canSubmit = Boolean(personalComplete) && allRequiredConsentChecked && fullName.trim().length >= 2 && !!idFile && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      // Personal
      Object.entries(profile).forEach(([k, v]) => fd.append(k, v));
      // Honeypot
      fd.append('website', website);
      // JSON blobs
      fd.append('medical', JSON.stringify(medical));
      fd.append('consent', JSON.stringify(consent));
      fd.append('fullNameSigned', fullName.trim());
      // File
      if (idFile) fd.append('id_proof', idFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consent/walk-in`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit');
        return;
      }
      setSuccess({ bookingReference: data.bookingReference, formReference: data.formReference });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Failed to submit consent form. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingTop: '7rem', paddingBottom: '6rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.5rem' }}>
            Consent received
          </p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: 'var(--cream)', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Thank you.
          </h1>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '1rem', color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Your consent form has been submitted and a copy has been emailed to you. Your artist will pick this up at the studio.
          </p>
          <div style={{ display: 'inline-block', textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}>
            <p style={{ ...labelStyle, marginBottom: '0.25rem', opacity: 0.7 }}>Booking reference</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.95rem', color: 'var(--cream)', margin: '0 0 0.875rem' }}>{success.bookingReference}</p>
            <p style={{ ...labelStyle, marginBottom: '0.25rem', opacity: 0.7 }}>Consent reference</p>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.95rem', color: 'var(--cream)', margin: 0 }}>{success.formReference}</p>
          </div>
          <div>
            <Link href="/" className="btn-primary" style={{ padding: '0.875rem 2rem' }}>
              <span>Return home</span>
              <span className="btn-icon" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem' }}>
          Walk-in consent
        </p>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', color: 'var(--cream)', lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          Tattoo consent form
        </h1>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem', color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '2.75rem', maxWidth: '52ch' }}>
          For walk-ins and anyone without a client account. Your details are stored securely and used only for your tattoo session and the studio&apos;s legal record-keeping. Fields marked * are required.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Honeypot — hidden from real users; bots tend to fill everything */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
            <label htmlFor="website">Website</label>
            <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off"
                   value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          {/* Personal details */}
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={sectionHeadingStyle}>Personal details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>First name *</label>
                <input style={inputStyle} type="text" value={profile.first_name} onChange={(e) => updateProfile('first_name', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Last name *</label>
                <input style={inputStyle} type="text" value={profile.last_name} onChange={(e) => updateProfile('last_name', e.target.value)} required />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" value={profile.email} onChange={(e) => updateProfile('email', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input style={inputStyle} type="tel" value={profile.phone} onChange={(e) => updateProfile('phone', e.target.value)} required />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>Date of birth *</label>
              <input style={{ ...inputStyle, maxWidth: '200px' }} type="date" value={profile.date_of_birth} onChange={(e) => updateProfile('date_of_birth', e.target.value)} required />
            </div>
          </section>

          {/* Address */}
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={sectionHeadingStyle}>Address</p>
            <div>
              <label style={labelStyle}>Street address</label>
              <input style={inputStyle} type="text" value={profile.address} onChange={(e) => updateProfile('address', e.target.value)} />
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} type="text" value={profile.city} onChange={(e) => updateProfile('city', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Postcode</label>
                <input style={inputStyle} type="text" value={profile.postcode} onChange={(e) => updateProfile('postcode', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Emergency contact */}
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={sectionHeadingStyle}>Emergency contact</p>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Someone we can contact in the unlikely event of an emergency.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} type="text" value={profile.emergency_contact_name} onChange={(e) => updateProfile('emergency_contact_name', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} type="tel" value={profile.emergency_contact_phone} onChange={(e) => updateProfile('emergency_contact_phone', e.target.value)} />
              </div>
            </div>
          </section>

          {/* The tattoo */}
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={sectionHeadingStyle}>About the tattoo</p>
            <div>
              <label style={labelStyle}>Placement *</label>
              <input style={inputStyle} type="text" value={profile.placement} onChange={(e) => updateProfile('placement', e.target.value)} placeholder="e.g. left forearm, behind right ear" required />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>Size</label>
              <select style={inputStyle} value={profile.estimated_size} onChange={(e) => updateProfile('estimated_size', e.target.value)}>
                <option value="small">Small (2–3 in)</option>
                <option value="medium">Medium (3–6 in)</option>
                <option value="large">Large (6–12 in)</option>
                <option value="xlarge">Extra large (12+ in)</option>
              </select>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>Brief design description</label>
              <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} value={profile.tattoo_description} onChange={(e) => updateProfile('tattoo_description', e.target.value)} placeholder="A few words about what you're getting today" />
            </div>
          </section>

          {/* Photo ID */}
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={sectionHeadingStyle}>Photo ID *</p>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              A photo of your passport, driving licence, or other government-issued photo ID. We keep this on file in line with Liverpool City Council licensing requirements.
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
              style={{ ...inputStyle, padding: '0.625rem 0.75rem', fontSize: '0.875rem' }}
            />
            {idFile && (
              <p style={{ marginTop: '0.5rem', fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--gold)' }}>
                ✓ {idFile.name} ({(idFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </section>

          {/* Medical history */}
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={sectionHeadingStyle}>Health information</p>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              All information is kept strictly confidential.
            </p>
            <YesNoRow label="Pregnant or breastfeeding" value={medical.pregnant_or_breastfeeding} onChange={(v) => setMedical(p => ({ ...p, pregnant_or_breastfeeding: v }))} />
            <YesNoRow label="Blood-borne conditions (HIV, Hepatitis B or C)" value={medical.blood_borne_conditions} onChange={(v) => setMedical(p => ({ ...p, blood_borne_conditions: v }))} />
            <YesNoRow label="Diabetes" value={medical.diabetes} onChange={(v) => setMedical(p => ({ ...p, diabetes: v }))} />
            <YesNoRow label="Heart condition or pacemaker" value={medical.heart_condition} onChange={(v) => setMedical(p => ({ ...p, heart_condition: v }))} />
            <YesNoRow label="Haemophilia or bleeding disorder" value={medical.haemophilia_or_bleeding_disorder} onChange={(v) => setMedical(p => ({ ...p, haemophilia_or_bleeding_disorder: v }))} />
            <YesNoRow label="Epilepsy or seizure disorder" value={medical.epilepsy_or_seizure} onChange={(v) => setMedical(p => ({ ...p, epilepsy_or_seizure: v }))} />
            <YesNoRow label="Autoimmune conditions" value={medical.autoimmune_conditions} onChange={(v) => setMedical(p => ({ ...p, autoimmune_conditions: v }))} />
            <YesNoRow label="Currently taking blood thinners (e.g. warfarin, aspirin)" value={medical.blood_thinners} onChange={(v) => setMedical(p => ({ ...p, blood_thinners: v }))} />
            <YesNoRow label="Steroids or immunosuppressants" value={medical.steroids_or_immunosuppressants} onChange={(v) => setMedical(p => ({ ...p, steroids_or_immunosuppressants: v }))} />
            <YesNoRow label="Currently undergoing chemotherapy or radiotherapy" value={medical.chemotherapy_or_radiotherapy} onChange={(v) => setMedical(p => ({ ...p, chemotherapy_or_radiotherapy: v }))} />
            <YesNoRow label="Consumed alcohol or drugs in the last 24 hours" value={medical.alcohol_or_drugs_last_24h} onChange={(v) => setMedical(p => ({ ...p, alcohol_or_drugs_last_24h: v }))} />
            <YesNoRow label="Previous reaction to a tattoo" value={medical.previous_tattoo_reaction} onChange={(v) => setMedical(p => ({ ...p, previous_tattoo_reaction: v }))} />

            <p style={{ ...sectionHeadingStyle, marginTop: '2rem' }}>Allergies</p>
            <YesNoRow label="Latex allergy" value={medical.allergies_latex} onChange={(v) => setMedical(p => ({ ...p, allergies_latex: v }))} />
            <YesNoRow label="Ink or pigment allergy" value={medical.allergies_ink} onChange={(v) => setMedical(p => ({ ...p, allergies_ink: v }))} />
            <YesNoRow label="Topical anaesthetic allergy" value={medical.allergies_topical_anaesthetics} onChange={(v) => setMedical(p => ({ ...p, allergies_topical_anaesthetics: v }))} />

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Skin conditions (eczema, psoriasis, etc.)</label>
                <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={medical.skin_conditions} onChange={(e) => setMedical(p => ({ ...p, skin_conditions: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Known allergies (any not listed above)</label>
                <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={medical.known_allergies} onChange={(e) => setMedical(p => ({ ...p, known_allergies: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Current medications</label>
                <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={medical.current_medications} onChange={(e) => setMedical(p => ({ ...p, current_medications: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Previous reaction details (if applicable)</label>
                <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={medical.previous_reaction_details} onChange={(e) => setMedical(p => ({ ...p, previous_reaction_details: e.target.value }))} />
              </div>
            </div>
          </section>

          {/* Consent declarations */}
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={sectionHeadingStyle}>Consent declarations</p>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Please read and confirm each statement.
            </p>
            <ConsentCheckbox label="I confirm I am 18 years of age or older and have provided valid photo ID." checked={consent.age_confirmed} onChange={(v) => setConsent(p => ({ ...p, age_confirmed: v }))} />
            <ConsentCheckbox label="I confirm that the medical history I have provided is true and complete to the best of my knowledge." checked={consent.health_accuracy_confirmed} onChange={(v) => setConsent(p => ({ ...p, health_accuracy_confirmed: v }))} />
            <ConsentCheckbox label="I understand that getting a tattoo carries risks (including infection, allergic reaction, scarring, and pain) and accept these risks." checked={consent.risks_understood_confirmed} onChange={(v) => setConsent(p => ({ ...p, risks_understood_confirmed: v }))} />
            <ConsentCheckbox label="I confirm I am not under the influence of alcohol or drugs and have not consumed either in the 24 hours prior." checked={consent.sobriety_confirmed} onChange={(v) => setConsent(p => ({ ...p, sobriety_confirmed: v }))} />
            <ConsentCheckbox label="I confirm there are no active skin conditions, open wounds, or sunburn on the intended placement area." checked={consent.suitability_confirmed} onChange={(v) => setConsent(p => ({ ...p, suitability_confirmed: v }))} />
            <ConsentCheckbox label="I am voluntarily consenting to be tattooed and have not been coerced." checked={consent.voluntary_consent_confirmed} onChange={(v) => setConsent(p => ({ ...p, voluntary_consent_confirmed: v }))} />
            <ConsentCheckbox label="I have approved the design, placement, and size with my artist before the session begins." checked={consent.design_approved_confirmed} onChange={(v) => setConsent(p => ({ ...p, design_approved_confirmed: v }))} />
            <ConsentCheckbox label="I take full responsibility for following the aftercare advice given by the studio." checked={consent.aftercare_responsibility_confirmed} onChange={(v) => setConsent(p => ({ ...p, aftercare_responsibility_confirmed: v }))} />
            <ConsentCheckbox label="(Optional) I give permission for the studio to photograph the tattoo and use those photos on its website and social media. Personal details will not be shared." checked={consent.photography_permission} onChange={(v) => setConsent(p => ({ ...p, photography_permission: v }))} />
            <ConsentCheckbox label="I consent to Hall of Mirrors Tattoo Studio storing the information on this form in line with UK GDPR and Liverpool City Council licensing requirements." checked={consent.gdpr_consent_confirmed} onChange={(v) => setConsent(p => ({ ...p, gdpr_consent_confirmed: v }))} />
          </section>

          {/* Signature */}
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={sectionHeadingStyle}>Signature</p>
            <label style={labelStyle}>Type your full legal name to sign *</label>
            <input style={inputStyle} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full legal name" required />
            <p style={{ marginTop: '0.625rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem', color: 'var(--text-low)' }}>
              Today&apos;s date: {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
            </p>
          </section>

          {error && (
            <div className="alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary"
            style={{ width: '100%', padding: '1rem 2.5rem', justifyContent: 'center', opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'default' }}
          >
            <span>{submitting ? 'Submitting…' : 'Submit consent form'}</span>
            {!submitting && <span className="btn-icon" aria-hidden="true">→</span>}
          </button>
          {!canSubmit && !submitting && (
            <p style={{ marginTop: '0.875rem', textAlign: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: '0.8125rem', color: 'var(--text-low)' }}>
              Please fill in the required fields, upload a photo ID, tick every consent statement, and type your full name to enable the submit button.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
