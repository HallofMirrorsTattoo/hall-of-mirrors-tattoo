'use client';

const steps = [
  {
    number: '01',
    title: 'First 2–4 hours',
    body: 'Keep your tattoo covered with the wrap your artist applied. When you remove it, gently wash with lukewarm water and a fragrance-free soap — no scrubbing.',
  },
  {
    number: '02',
    title: 'Days 1–14',
    body: 'Apply a thin layer of unscented moisturiser (e.g. Hustle Butter, Bepanthen, or plain cocoa butter) 2–3 times a day. Avoid over-moisturising — a thin coat is all you need.',
  },
  {
    number: '03',
    title: 'What to avoid',
    body: 'No direct sunlight, sunbeds, swimming, saunas, or soaking in baths. Do not pick or scratch — peeling is normal and will resolve on its own.',
  },
  {
    number: '04',
    title: 'Healing timeline',
    body: 'The surface layer heals in 2–3 weeks. Full, deep healing takes 2–3 months. Keep SPF 50+ on healed tattoos in summer to protect the colour long-term.',
  },
];

export default function AftercareTab() {
  return (
    <div>
      {/* Intro */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          color: 'var(--cream)',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          marginBottom: '0.625rem',
        }}>
          Aftercare instructions
        </h2>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text)', lineHeight: 1.7, maxWidth: '42rem' }}>
          Taking care of your tattoo properly in the first few weeks protects your investment and ensures the best possible healed result. If you have any questions, message Robyn directly from the Consultations tab.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
        {steps.map((step) => (
          <div
            key={step.number}
            style={{
              padding: '1.375rem 1.5rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              display: 'grid',
              gridTemplateColumns: '2.5rem 1fr',
              gap: '1.25rem',
              alignItems: 'start',
            }}
          >
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              color: 'rgba(201,168,76,0.5)',
              paddingTop: '0.125rem',
            }}>
              {step.number}
            </span>
            <div>
              <p style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: '1.125rem',
                color: 'var(--cream)',
                margin: '0 0 0.375rem',
                lineHeight: 1.3,
              }}>
                {step.title}
              </p>
              <p style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.9375rem',
                color: 'var(--text)',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Warning signs */}
      <div style={{
        padding: '1.375rem 1.5rem',
        background: 'rgba(239,68,68,0.04)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '0.75rem',
        marginBottom: '2.5rem',
      }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(239,68,68,0.6)', margin: '0 0 0.75rem' }}>
          When to seek advice
        </p>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
          Some redness and swelling for the first 24–48 hours is normal. If you see significant swelling, hot skin, pus, or a rash spreading beyond the tattooed area after the first few days, consult a doctor. Allergic reactions are rare but can happen — if in doubt, reach out.
        </p>
      </div>

      {/* Touch-up note */}
      <div style={{
        padding: '1.375rem 1.5rem',
        background: 'rgba(201,168,76,0.04)',
        border: '1px solid rgba(201,168,76,0.15)',
        borderRadius: '0.75rem',
      }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', margin: '0 0 0.75rem' }}>
          Touch-ups
        </p>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
          Robyn offers a complimentary touch-up for all new tattoos once the piece is fully healed (minimum 3 months). Book this through the Bookings tab or by messaging Robyn from the Consultations tab.
        </p>
      </div>
    </div>
  );
}
