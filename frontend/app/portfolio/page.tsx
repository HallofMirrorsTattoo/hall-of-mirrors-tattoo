import Link from 'next/link';
import AnimatedSection from '../components/AnimatedSection';

const styles = [
  {
    n: '01',
    name: 'Neo-Traditional',
    desc: 'Bold outlines, rich colour, classic subject matter reinterpreted with a modern edge. The cornerstone of Robyn\'s practice.',
  },
  {
    n: '02',
    name: 'Colour Realism',
    desc: 'Detailed, lifelike colour work with depth, shading, and vibrant palettes. Every layer considered.',
  },
  {
    n: '03',
    name: 'Fine Line',
    desc: 'Delicate, precise linework for minimalist and detailed illustrative pieces. Technically demanding, quietly striking.',
  },
];

export default function Portfolio() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* Page header */}
      <section className="px-6 pt-8 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <p className="eyebrow">The Work</p>
            <h1 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(3.5rem, 8vw, 6rem)',
              color: 'var(--cream)',
              letterSpacing: '-0.025em',
              lineHeight: 1.0,
              marginBottom: '1.5rem',
            }}>
              Portfolio
            </h1>
            <p style={{ maxWidth: '44ch' }}>
              A curated selection of Robyn&apos;s work across neo-traditional, colour, and
              fine line styles.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Coming soon — intentional placeholder */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: '0.75rem',
                border: '1px solid rgba(201,168,76,0.12)',
                backgroundColor: 'var(--surface)',
                padding: '5rem 2rem',
                textAlign: 'center',
                minHeight: '380px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
              }}
            >
              {/* Atmospheric watermark */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                aria-hidden="true"
              >
                <span style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(5rem, 18vw, 14rem)',
                  fontWeight: 300,
                  color: 'rgba(201,168,76,0.04)',
                  letterSpacing: '-0.03em',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                }}>
                  Coming Soon
                </span>
              </div>

              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
                style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 70%)' }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <p className="eyebrow" style={{ marginBottom: '1rem' }}>Photography incoming</p>
                <p style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                  color: 'var(--cream)',
                  lineHeight: 1.2,
                  marginBottom: '1rem',
                  maxWidth: '38ch',
                  margin: '0 auto 1.25rem',
                }}>
                  Robyn&apos;s portfolio images will be<br />photographed and added shortly.
                </p>
                <p style={{ maxWidth: '38ch', textAlign: 'center', margin: '0 auto 2.5rem' }}>
                  In the meantime, follow on Instagram to see recent work,
                  or reach out to discuss your idea directly.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/booking" className="btn-primary">
                    <span>Book Appointment</span>
                    <span className="btn-icon" aria-hidden="true">↗</span>
                  </Link>
                  <Link href="/consultation" className="btn-secondary">
                    Free Consultation
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* HOM Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="section-divider">
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
        </div>
      </div>

      {/* Style categories — editorial rows, not card grid */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="mb-12">
            <p className="eyebrow">Specialisms</p>
          </AnimatedSection>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {styles.map((s, i) => (
              <AnimatedSection
                key={s.n}
                delay={i * 80}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '5.5rem 1px 1fr',
                  alignItems: 'center',
                  gap: '0 2.5rem',
                  padding: '2.5rem 0',
                }}>
                  <span style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
                    fontWeight: 300,
                    color: 'var(--gold)',
                    opacity: 0.35,
                    lineHeight: 1,
                    textAlign: 'right',
                  }}>
                    {s.n}
                  </span>
                  <span style={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'var(--border)' }} aria-hidden="true" />
                  <div>
                    <h2 style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontStyle: 'italic',
                      fontSize: 'clamp(1.375rem, 3vw, 2rem)',
                      fontWeight: 300,
                      color: 'var(--cream)',
                      lineHeight: 1.2,
                      marginBottom: '0.625rem',
                    }}>
                      {s.name}
                    </h2>
                    <p style={{ fontSize: '0.9rem', maxWidth: '52ch' }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
