import Link from 'next/link';
import AnimatedSection from '../components/AnimatedSection';

export const metadata = {
  title: 'Our Artists | Hall of Mirrors Tattoo Studio Liverpool',
  description: 'Meet the artists at Hall of Mirrors — a private tattoo studio on Castle Street, Liverpool. Robyn specialises in neo-traditional tattooing and bespoke custom designs. Book a consultation.',
};

const styles = [
  {
    n: '01',
    name: 'Neo-Traditional',
    desc: 'Bold outlines, rich colour, classic subject matter reinterpreted with a modern edge. The cornerstone of our practice — rooted in art history, driven by personal narrative.',
  },
  {
    n: '02',
    name: 'Colour Realism',
    desc: 'Detailed, lifelike colour work with depth, shading, and vibrant palettes. Every layer considered, every reference studied.',
  },
  {
    n: '03',
    name: 'Fine Line',
    desc: 'Delicate, precise linework for minimalist and detailed illustrative pieces. Technically demanding, quietly striking.',
  },
  {
    n: '04',
    name: 'Cover-Up & Rework',
    desc: 'Skilled transformation of existing tattoos — whether a full cover or a rework to refresh faded work. Every cover-up case is assessed individually in consultation first.',
  },
];

const robynGallery = [
  { roman: 'I',   label: 'Neo-Traditional' },
  { roman: 'II',  label: 'Cover-Up' },
  { roman: 'III', label: 'Colour Work' },
  { roman: 'IV',  label: 'Fine Detail' },
];

export default function Portfolio() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <section className="px-6 pt-8 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <p className="eyebrow">Our Artists</p>
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
              The people behind the ink
            </h1>
            <p style={{ maxWidth: '52ch' }}>
              Hall of Mirrors is home to two resident tattoo artists working from our private
              studio on Castle Street in Liverpool city centre. Every client is seen by
              appointment — no walk-ins, no rushing.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── ROBYN ─────────────────────────────────────────────────────────── */}
      <section className="px-6 pb-28 md:pb-40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">

            {/* Left — Bio */}
            <AnimatedSection>
              <p className="eyebrow">Resident Artist</p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(4rem, 9vw, 7rem)',
                color: 'var(--gold)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                marginBottom: '1.75rem',
              }}>
                Robyn
              </h2>

              {/* Specialty pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                {['Neo-Traditional', 'Cover-Ups', 'Colour Realism', 'Bespoke Design'].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--gold)',
                      border: '1px solid rgba(201,168,76,0.25)',
                      borderRadius: '0.25rem',
                      padding: '0.3rem 0.7rem',
                      backgroundColor: 'rgba(201,168,76,0.05)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p style={{ marginBottom: '1.25rem' }}>
                Robyn has been tattooing for over eight years, building a practice rooted in
                neo-traditional technique — bold outlines, rich colour palettes, and imagery
                drawn from art history, natural forms, and personal narrative. Based at Hall
                of Mirrors on Castle Street, Liverpool, she works exclusively on custom,
                bespoke designs. No flash, no off-the-shelf pieces.
              </p>
              <p style={{ marginBottom: '2.5rem' }}>
                Every project starts with a detailed consultation. Robyn works closely with
                each client to understand placement, style, and the story behind the piece
                before anything is sketched.
              </p>

              {/* Stats */}
              <div className="flex gap-10 mb-10">
                {([
                  { num: '8+',    label: 'Years' },
                  { num: '100%',  label: 'Custom Designs' },
                  { num: '1:1',   label: 'Every Client' },
                ] as const).map((s) => (
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

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link href="/booking" className="btn-primary">
                  <span>Book with Robyn</span>
                  <span className="btn-icon" aria-hidden="true">↗</span>
                </Link>
                <Link href="/booking" className="btn-secondary">Request Consultation</Link>
              </div>
            </AnimatedSection>

            {/* Right — Gallery 2×2 */}
            <AnimatedSection delay={180}>
              <div className="grid grid-cols-2 gap-3">
                {robynGallery.map((item) => (
                  <div
                    key={item.roman}
                    className="card-premium relative overflow-hidden"
                    style={{ minHeight: '240px', aspectRatio: '3/4' }}
                  >
                    <div className="card-premium-inner h-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(160deg, rgba(29,26,21,0.8) 0%, rgba(14,12,9,0.6) 100%)' }}>
                      <span
                        style={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontStyle: 'italic',
                          fontSize: '4rem',
                          fontWeight: 300,
                          color: 'var(--gold)',
                          opacity: 0.06,
                          lineHeight: 1,
                          userSelect: 'none',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                        aria-hidden="true"
                      >
                        {item.roman}
                      </span>
                      <p className="eyebrow" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        {item.label}
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

      {/* ── CHRISTINA ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-28 md:py-40">
        <div className="max-w-6xl mx-auto">

          {/* Coming Soon badge */}
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.6875rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: '0.25rem',
              padding: '0.3rem 0.75rem',
              backgroundColor: 'rgba(201,168,76,0.05)',
            }}>
              Coming Soon
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">

            {/* Left — Placeholder bio */}
            <AnimatedSection>
              <p className="eyebrow">Resident Artist</p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(4rem, 9vw, 7rem)',
                color: 'var(--gold)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                marginBottom: '1.75rem',
              }}>
                Christina
              </h2>

              {/* Placeholder pill */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                <span style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-low)',
                  border: '1px solid rgba(201,168,76,0.1)',
                  borderRadius: '0.25rem',
                  padding: '0.3rem 0.7rem',
                  backgroundColor: 'rgba(201,168,76,0.03)',
                }}>
                  Placeholder — Coming Soon
                </span>
              </div>

              <p style={{ marginBottom: '2.5rem' }}>
                Christina joins the Hall of Mirrors studio bringing her own distinct approach
                to tattooing. Full artist profile and booking availability coming soon —
                follow us on Instagram for updates.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link href="/booking" className="btn-secondary">Get Notified</Link>
              </div>
            </AnimatedSection>

            {/* Right — single large placeholder */}
            <AnimatedSection delay={180}>
              <div
                className="card-premium relative overflow-hidden"
                style={{ minHeight: '480px' }}
              >
                <div
                  className="card-premium-inner h-full flex flex-col items-center justify-center"
                  style={{
                    background: 'linear-gradient(160deg, rgba(29,26,21,0.6) 0%, rgba(14,12,9,0.5) 100%)',
                    minHeight: '480px',
                  }}
                >
                  <p style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: '0.9375rem',
                    color: 'rgba(201,168,76,0.3)',
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    Artist profile coming soon
                  </p>
                </div>
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

      {/* ── SPECIALISMS ───────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="mb-12">
            <p className="eyebrow">Specialisms</p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              color: 'var(--cream)',
              letterSpacing: '-0.025em',
              lineHeight: 1.0,
              marginTop: '0.75rem',
            }}>
              What we do best
            </h2>
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
                    <h3 style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontStyle: 'italic',
                      fontSize: 'clamp(1.375rem, 3vw, 2rem)',
                      fontWeight: 300,
                      color: 'var(--cream)',
                      lineHeight: 1.2,
                      marginBottom: '0.625rem',
                    }}>
                      {s.name}
                    </h3>
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

      {/* HOM Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="section-divider">
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
        </div>
      </div>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section className="px-6 py-28 md:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <p style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              opacity: 0.4,
              marginBottom: '2rem',
            }}>
              Suite 3 · Castle Street · Liverpool
            </p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(3rem, 7vw, 5rem)',
              color: 'var(--cream)',
              letterSpacing: '-0.025em',
              lineHeight: 1.0,
              marginBottom: '1.5rem',
            }}>
              Start with a conversation
            </h2>
            <p style={{ margin: '0 auto 2.5rem', maxWidth: '44ch', textAlign: 'center' }}>
              Every tattoo at Hall of Mirrors begins with a consultation — a chance to talk
              through your idea, explore placement, and see if we&apos;re the right fit for
              your vision.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/booking" className="btn-primary">
                <span>Book Appointment</span>
                <span className="btn-icon" aria-hidden="true">↗</span>
              </Link>
              <Link href="/services" className="btn-secondary">Learn More</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
