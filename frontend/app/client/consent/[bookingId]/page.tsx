'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClientAuth } from '@/lib/clientAuthContext';

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

interface ConsentBooking {
  id: string;
  booking_reference: string;
  appointment_date_time: string;
  appointment_time?: string;
  appointment_status: string;
  placement?: string;
  artist_name?: string;
  consent_form_signed?: boolean;
}

interface ConsentProfile {
  first_name: string;
  last_name: string;
  email?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
}

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

function YesNoToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
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
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {checked && <span style={{ color: 'var(--bg)', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ fontSize: '0.9rem', color: checked ? 'var(--cream)' : 'var(--text-mid)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

export default function ConsentFormPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useClientAuth();

  const [pageLoading, setPageLoading] = useState(true);
  const [booking, setBooking] = useState<ConsentBooking | null>(null);
  const [profile, setProfile] = useState<ConsentProfile | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [error, setError] = useState('');

  const [medical, setMedical] = useState({ ...initialMedical });
  const [consent, setConsent] = useState({ ...initialConsent });
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) { router.push('/client/login'); return; }

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/consent/${bookingId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Failed to load'); return; }
        setBooking(data.booking);
        setProfile(data.profile);
        if (data.consentForm) setAlreadySigned(true);
        if (data.medicalHistory) {
          const mh = data.medicalHistory;
          setMedical({
            pregnant_or_breastfeeding: !!mh.pregnant_or_breastfeeding,
            blood_borne_conditions: !!mh.blood_borne_conditions,
            diabetes: !!mh.diabetes,
            heart_condition: !!mh.heart_condition,
            haemophilia_or_bleeding_disorder: !!mh.haemophilia_or_bleeding_disorder,
            epilepsy_or_seizure: !!mh.epilepsy_or_seizure,
            skin_conditions: mh.skin_conditions || '',
            autoimmune_conditions: !!mh.autoimmune_conditions,
            blood_thinners: !!mh.blood_thinners,
            steroids_or_immunosuppressants: !!mh.steroids_or_immunosuppressants,
            alcohol_or_drugs_last_24h: !!mh.alcohol_or_drugs_last_24h,
            known_allergies: mh.known_allergies || '',
            allergies_latex: !!mh.allergies_latex,
            allergies_ink: !!mh.allergies_ink,
            allergies_topical_anaesthetics: !!mh.allergies_topical_anaesthetics,
            previous_tattoo_reaction: !!mh.previous_tattoo_reaction,
            previous_reaction_details: mh.previous_reaction_details || '',
            chemotherapy_or_radiotherapy: !!mh.chemotherapy_or_radiotherapy,
            current_medications: mh.current_medications || '',
          });
        }
      } catch {
        setError('Failed to load consent form');
      } finally {
        setPageLoading(false);
      }
    })();
  }, [accessToken, authLoading, bookingId, router]);

  const allConsentChecked = Object.values(consent).every(Boolean);
  const canSubmit = allConsentChecked && fullName.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/consent/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ medical, consent, fullNameSigned: fullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit'); return; }
      setSuccess(true);
    } catch {
      setError('Failed to submit consent form');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingTop: '7rem', paddingBottom: '6rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="skeleton" style={{ height: '0.65rem', width: '5.5rem', marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: '0.6rem', width: '9rem', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ height: '3.25rem', width: '55%', marginBottom: '3rem', borderRadius: '0.5rem' }} />
          <div className="skeleton" style={{ height: '8rem', borderRadius: '0.75rem', marginBottom: '3rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: '2.75rem', borderRadius: '0.375rem' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'var(--bg)', padding: '2rem' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(39,174,96,0.12)', border: '2px solid rgba(39,174,96,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem' }}>✓</div>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '2.5rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '1rem' }}>
            Form submitted.
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Your consent form has been signed and your booking is now confirmed. A copy has been sent to your email.
          </p>
          <Link href="/client/dashboard" className="btn-primary" style={{ padding: '0.875rem 2.5rem' }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (alreadySigned) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'var(--bg)', padding: '2rem' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.5rem' }}>Already signed</p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '2.5rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '1rem' }}>
            Consent form on file.
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-mid)', marginBottom: '2rem' }}>
            You have already submitted your consent form for this booking.
          </p>
          <Link href="/client/dashboard" className="btn-primary" style={{ padding: '0.875rem 2.5rem' }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--bg)', paddingTop: '7rem', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Back link + heading */}
        <div style={{ marginBottom: '3rem' }}>
          <Link href="/client/dashboard" style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.7, textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem', transition: 'opacity 0.2s ease' }}>
            ← Dashboard
          </Link>
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Before your appointment</p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1, margin: 0 }}>
            Consent form
          </h1>
        </div>

        {/* Booking summary */}
        {booking && (
          <div style={{ padding: '1.25rem 1.5rem', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '0.75rem', marginBottom: '3rem' }}>
            <p style={{ ...sectionHeadingStyle, marginBottom: '1rem' }}>Your appointment</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <p style={{ ...labelStyle }}>Reference</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--cream)' }}>{booking.booking_reference}</p>
              </div>
              <div>
                <p style={{ ...labelStyle }}>Date</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--cream)' }}>
                  {booking.appointment_date_time
                    ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(booking.appointment_date_time))
                    : 'TBC'}
                </p>
              </div>
              <div>
                <p style={{ ...labelStyle }}>Placement</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--cream)' }}>{booking.placement || '—'}</p>
              </div>
              <div>
                <p style={{ ...labelStyle }}>Artist</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--cream)' }}>{booking.artist_name || 'Hall of Mirrors'}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--error-text)' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Personal details (read-only) */}
          <section style={{ marginBottom: '3rem' }}>
            <p style={sectionHeadingStyle}>Personal details</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-low)', marginBottom: '1.25rem' }}>
              Pre-filled from your profile. To update these, visit{' '}
              <Link href="/client/profile" style={{ color: 'var(--gold)', textDecoration: 'none' }}>your profile</Link>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={labelStyle}>Full name</p>
                <p style={{ margin: 0, padding: '0.75rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9375rem', color: 'var(--cream)', opacity: 0.7 }}>
                  {profile ? `${profile.first_name} ${profile.last_name}` : '—'}
                </p>
              </div>
              <div>
                <p style={labelStyle}>Email</p>
                <p style={{ margin: 0, padding: '0.75rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9375rem', color: 'var(--cream)', opacity: 0.7 }}>
                  {profile?.email || '—'}
                </p>
              </div>
              <div>
                <p style={labelStyle}>Phone</p>
                <p style={{ margin: 0, padding: '0.75rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9375rem', color: 'var(--cream)', opacity: 0.7 }}>
                  {profile?.phone || '—'}
                </p>
              </div>
              <div>
                <p style={labelStyle}>Address</p>
                <p style={{ margin: 0, padding: '0.75rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9375rem', color: 'var(--cream)', opacity: 0.7 }}>
                  {[profile?.address, profile?.city, profile?.postcode].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
            </div>
          </section>

          {/* Medical history */}
          <section style={{ marginBottom: '3rem' }}>
            <p style={sectionHeadingStyle}>Medical history</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-low)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Please answer honestly. This information is kept strictly confidential and helps ensure your safety during the tattoo process.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <YesNoToggle label="Pregnant or breastfeeding" value={medical.pregnant_or_breastfeeding} onChange={(v) => setMedical(p => ({ ...p, pregnant_or_breastfeeding: v }))} />
              <YesNoToggle label="Blood-borne conditions (HIV, Hepatitis B or C)" value={medical.blood_borne_conditions} onChange={(v) => setMedical(p => ({ ...p, blood_borne_conditions: v }))} />
              <YesNoToggle label="Diabetes" value={medical.diabetes} onChange={(v) => setMedical(p => ({ ...p, diabetes: v }))} />
              <YesNoToggle label="Heart condition or pacemaker" value={medical.heart_condition} onChange={(v) => setMedical(p => ({ ...p, heart_condition: v }))} />
              <YesNoToggle label="Haemophilia or bleeding disorder" value={medical.haemophilia_or_bleeding_disorder} onChange={(v) => setMedical(p => ({ ...p, haemophilia_or_bleeding_disorder: v }))} />
              <YesNoToggle label="Epilepsy or seizure disorder" value={medical.epilepsy_or_seizure} onChange={(v) => setMedical(p => ({ ...p, epilepsy_or_seizure: v }))} />
              <YesNoToggle label="Autoimmune conditions" value={medical.autoimmune_conditions} onChange={(v) => setMedical(p => ({ ...p, autoimmune_conditions: v }))} />
              <YesNoToggle label="Currently taking blood thinners (e.g. warfarin, aspirin)" value={medical.blood_thinners} onChange={(v) => setMedical(p => ({ ...p, blood_thinners: v }))} />
              <YesNoToggle label="Steroids or immunosuppressants" value={medical.steroids_or_immunosuppressants} onChange={(v) => setMedical(p => ({ ...p, steroids_or_immunosuppressants: v }))} />
              <YesNoToggle label="Alcohol or drugs in the last 24 hours" value={medical.alcohol_or_drugs_last_24h} onChange={(v) => setMedical(p => ({ ...p, alcohol_or_drugs_last_24h: v }))} />
              <YesNoToggle label="Currently undergoing chemotherapy or radiotherapy" value={medical.chemotherapy_or_radiotherapy} onChange={(v) => setMedical(p => ({ ...p, chemotherapy_or_radiotherapy: v }))} />
              <YesNoToggle label="Previous reaction to a tattoo" value={medical.previous_tattoo_reaction} onChange={(v) => setMedical(p => ({ ...p, previous_tattoo_reaction: v }))} />
            </div>

            <p style={{ ...sectionHeadingStyle, marginTop: '2rem' }}>Allergies</p>
            <YesNoToggle label="Latex allergy" value={medical.allergies_latex} onChange={(v) => setMedical(p => ({ ...p, allergies_latex: v }))} />
            <YesNoToggle label="Ink or pigment allergy" value={medical.allergies_ink} onChange={(v) => setMedical(p => ({ ...p, allergies_ink: v }))} />
            <YesNoToggle label="Topical anaesthetic allergy" value={medical.allergies_topical_anaesthetics} onChange={(v) => setMedical(p => ({ ...p, allergies_topical_anaesthetics: v }))} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              {[
                { label: 'Skin conditions (eczema, psoriasis, etc.)', key: 'skin_conditions' },
                { label: 'Known allergies (detail any above or others)', key: 'known_allergies' },
                { label: 'Current medications', key: 'current_medications' },
                { label: 'Previous reaction details (if applicable)', key: 'previous_reaction_details' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type="text"
                    placeholder="Leave blank if none"
                    value={(medical as any)[key]}
                    onChange={(e) => setMedical(p => ({ ...p, [key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Consent declarations */}
          <section style={{ marginBottom: '3rem' }}>
            <p style={sectionHeadingStyle}>Consent declarations</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-low)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Please read and confirm each of the following statements.
            </p>
            <ConsentCheckbox label="I confirm I am 18 years of age or older." checked={consent.age_confirmed} onChange={(v) => setConsent(p => ({ ...p, age_confirmed: v }))} />
            <ConsentCheckbox label="The medical information provided above is accurate and complete to the best of my knowledge." checked={consent.health_accuracy_confirmed} onChange={(v) => setConsent(p => ({ ...p, health_accuracy_confirmed: v }))} />
            <ConsentCheckbox label="I understand the risks associated with tattooing, including scarring, infection, and fading over time." checked={consent.risks_understood_confirmed} onChange={(v) => setConsent(p => ({ ...p, risks_understood_confirmed: v }))} />
            <ConsentCheckbox label="I have not consumed alcohol or drugs in the 24 hours prior to my appointment." checked={consent.sobriety_confirmed} onChange={(v) => setConsent(p => ({ ...p, sobriety_confirmed: v }))} />
            <ConsentCheckbox label="I confirm there are no active skin conditions, open wounds, or sunburn on the intended placement area." checked={consent.suitability_confirmed} onChange={(v) => setConsent(p => ({ ...p, suitability_confirmed: v }))} />
            <ConsentCheckbox label="I am giving my voluntary and informed consent to be tattooed." checked={consent.voluntary_consent_confirmed} onChange={(v) => setConsent(p => ({ ...p, voluntary_consent_confirmed: v }))} />
            <ConsentCheckbox label="I have seen and approved the design to be tattooed on my body." checked={consent.design_approved_confirmed} onChange={(v) => setConsent(p => ({ ...p, design_approved_confirmed: v }))} />
            <ConsentCheckbox label="I accept responsibility for following the aftercare instructions provided by my artist." checked={consent.aftercare_responsibility_confirmed} onChange={(v) => setConsent(p => ({ ...p, aftercare_responsibility_confirmed: v }))} />
            <ConsentCheckbox label="I give permission for photographs of the completed tattoo to be used for portfolio purposes." checked={consent.photography_permission} onChange={(v) => setConsent(p => ({ ...p, photography_permission: v }))} />
            <ConsentCheckbox label="I consent to my personal data being stored securely by Hall of Mirrors Tattoo in accordance with GDPR." checked={consent.gdpr_consent_confirmed} onChange={(v) => setConsent(p => ({ ...p, gdpr_consent_confirmed: v }))} />
          </section>

          {/* Signature */}
          <section style={{ marginBottom: '3rem' }}>
            <p style={sectionHeadingStyle}>Electronic signature</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-low)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              By typing your full legal name below and clicking Submit, you are signing this consent form electronically. This signature is legally binding.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Full legal name</label>
              <input
                type="text"
                placeholder="Type your full legal name exactly"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ ...inputStyle, fontStyle: 'italic', fontSize: '1.0625rem' }}
              />
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)', marginBottom: '0' }}>
              Date: {new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
            </p>
          </section>

          {!canSubmit && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-low)', marginBottom: '1.5rem' }}>
              {!allConsentChecked ? 'Please confirm all declarations above.' : 'Please enter your full legal name to sign.'}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="btn-primary"
            style={{ padding: '0.875rem 3rem', opacity: (!canSubmit || submitting) ? 0.5 : 1, cursor: (!canSubmit || submitting) ? 'default' : 'pointer' }}
          >
            {submitting ? 'Submitting...' : 'Submit consent form'}
          </button>
        </form>
      </div>
    </div>
  );
}
