import Link from 'next/link';
import AnimatedSection from '../components/AnimatedSection';
import { getStudioSettings } from '@/lib/studioSettings';

const credentials = [
  { n: 'I',   label: 'Licensed',        title: 'Liverpool City Council', detail: 'Ref: A11394900' },
  { n: 'II',  label: 'Health & Safety', title: 'Autoclave Certified',    detail: 'Hepatitis B Vaccinated' },
  { n: 'III', label: 'Specialist',      title: 'Neo-Traditional',        detail: 'Bespoke Designs Only' },
  { n: 'IV',  label: 'Compliant',       title: 'GDPR Compliant',         detail: 'Your data handled with care' },
];

const stats = [
  { num: '8+',   label: 'Years Experience' },
  { num: '100%', label: 'Custom Designs' },
  { num: '1:1',  label: 'Consultation' },
];

export default async function About() {
  const studio = await getStudioSettings();
  const addressDetail = studio?.address
    ? [studio.address, studio.postcode].filter(Boolean).join(', ')
    : 'Suite 3, 34 Castle Street, L2 0NR';

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* Page header — 2-col split */}
      <section className="px-6 pt-8 pb-20 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">

            <AnimatedSection>
              <p className="eyebrow">The Artist</p>
              <h1 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                color: 'var(--cream)',
                letterSpacing: '-0.025em',
                lineHeight: 1.0,
                marginBottom: '1.75rem',
              }}>
                Meet Robyn
              </h1>
              {studio?.about_section ? (
                <p style={{ marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                  {studio.about_section}
                </p>
              ) : (
                <>
                  <p style={{ marginBottom: '1.25rem' }}>
                    Based in the heart of Liverpool&apos;s Castle Street, Hall of Mirrors is a
                    private studio specialising in neo-traditional tattooing — bold lines,
                    rich colour palettes, and timeless imagery drawn from art history,
                    natural forms, and personal narrative.
                  </p>
                  <p style={{ marginBottom: '1.25rem' }}>
                    Every piece is drawn from what the client brings to the chair — their
                    stories, references, and vision — translated into something that will
                    last a lifetime. Robyn&apos;s full biography is coming soon.
                  </p>
                </>
              )}

              {/* Stats */}
              <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2.5rem', marginBottom: '2.5rem' }}>
                {stats.map((s) => (
                  <div key={s.label}>
                    <p style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: '1.75rem',
                      fontWeight: 400,
                      color: 'var(--gold)',
                      lineHeight: 1,
                      marginBottom: '0.25rem',
                    }}>
                      {s.num}
                    </p>
                    <p style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '0.75rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--text-low)',
                      maxWidth: 'none',
                    }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link href="/portfolio" className="btn-secondary">View Portfolio</Link>
                <Link href="/booking" className="btn-primary">
                  <span>Book Appointment</span>
                  <span className="btn-icon" aria-hidden="true">↗</span>
                </Link>
              </div>
            </AnimatedSection>

            {/* Credentials */}
            <AnimatedSection delay={150}>
              <p className="eyebrow" style={{ marginBottom: '2rem' }}>Studio Credentials</p>
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {credentials.map((c) => (
                  <div
                    key={c.n}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5rem 1fr',
                      gap: '1.25rem',
                      padding: '1.5rem 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <span style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      fontSize: '1.25rem',
                      color: 'var(--gold)',
                      opacity: 0.55,
                      lineHeight: 1.3,
                    }}>
                      {c.n}
                    </span>
                    <div>
                      <p className="eyebrow" style={{ marginBottom: '0.375rem' }}>{c.label}</p>
                      <p style={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: '1.0625rem',
                        fontWeight: 400,
                        color: 'var(--cream)',
                        lineHeight: 1.3,
                        marginBottom: '0.25rem',
                        maxWidth: 'none',
                      }}>
                        {c.title}
                      </p>
                      <p style={{
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '0.75rem',
                        letterSpacing: '0.12em',
                        color: 'var(--text-low)',
                        maxWidth: 'none',
                      }}>
                        {c.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* HOM Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="section-divider">
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
        </div>
      </div>

      {/* Studio info strip */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <p className="eyebrow" style={{ marginBottom: '2.5rem' }}>The Studio</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
              {[
                { title: 'Liverpool',     detail: addressDetail },
                { title: 'Bespoke Only',  detail: 'Every design is created for you alone' },
                { title: 'Consultation',  detail: 'Free initial design consultations available' },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    padding: '2rem',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <p style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                    fontWeight: 300,
                    color: 'var(--gold)',
                    lineHeight: 1.1,
                    marginBottom: '0.625rem',
                  }}>
                    {item.title}
                  </p>
                  <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.875rem',
                    color: 'var(--text-mid)',
                    lineHeight: 1.6,
                    maxWidth: 'none',
                  }}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
