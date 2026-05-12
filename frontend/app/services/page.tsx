import Link from 'next/link';
import AnimatedSection from '../components/AnimatedSection';

const services = [
  {
    n: '01',
    title: 'Bespoke Tattoo',
    desc: 'Custom designs drawn entirely from scratch. Developed through consultation, sketch review, and refinement before a single mark is made. Every piece is created for one person.',
    price: '£150+',
    link: '/booking',
    cta: 'Book now',
  },
  {
    n: '02',
    title: 'Free Consultation',
    desc: 'A relaxed conversation about your idea, placement, sizing, and the design process. No fee, no pressure. Most clients start here before committing to a session.',
    price: 'Free',
    link: '/consultation',
    cta: 'Book consultation',
  },
  {
    n: '03',
    title: 'Cover-Up & Rework',
    desc: "Skilled transformation of existing work — full cover or a rework to sharpen and refresh a faded piece. Every case is assessed individually. Consultation required first.",
    price: 'Custom quote',
    link: '/consultation',
    cta: 'Book consultation',
  },
];

const pricing = [
  { label: 'Small  1–3"',   price: '£150 – £250', note: 'Simple designs, first tattoos' },
  { label: 'Medium  3–6"',  price: '£300 – £500', note: 'Detail work, standard placement' },
  { label: 'Large  6"+',    price: 'Custom quote', note: 'Complex work, multi-session' },
  { label: 'Cover-Up',      price: 'Custom quote', note: 'Quoted after in-person consultation' },
];

export default function Services() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* Page header */}
      <section className="px-6 pt-8 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <p className="eyebrow">Services &amp; Pricing</p>
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
              What we offer
            </h1>
            <p style={{ maxWidth: '46ch' }}>
              Every piece begins with a conversation. Prices below are starting points —
              final quotes depend on design complexity, size, and placement.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Editorial service rows */}
      <section className="px-6 pb-20 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {services.map((s, i) => (
              <AnimatedSection key={s.n} delay={i * 80} style={{ borderBottom: '1px solid var(--border)' }}>
                <Link href={s.link} className="service-row group">
                  <span className="service-num">{s.n}</span>
                  <span className="service-divider" aria-hidden="true" />
                  <div style={{ paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontStyle: 'italic',
                          fontSize: 'clamp(1.5rem, 3vw, 2.125rem)',
                          fontWeight: 300,
                          color: 'var(--cream)',
                          marginBottom: '0.625rem',
                          lineHeight: 1.2,
                          transition: 'color 0.4s ease',
                        }}>
                          {s.title}
                        </h2>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.75, maxWidth: '55ch', marginBottom: '1.25rem' }}>
                          {s.desc}
                        </p>
                        <span
                          className="group-hover:opacity-100"
                          style={{
                            fontFamily: '"DM Mono", monospace',
                            fontSize: '0.6875rem',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--gold)',
                            opacity: 0.55,
                            transition: 'opacity 0.4s ease',
                            display: 'inline-block',
                          }}
                        >
                          {s.cta} ↗
                        </span>
                      </div>
                      <div style={{ flexShrink: 0, paddingTop: '0.375rem' }}>
                        <p style={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontStyle: 'italic',
                          fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                          fontWeight: 400,
                          color: 'var(--gold)',
                          lineHeight: 1,
                          whiteSpace: 'nowrap',
                        }}>
                          {s.price}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>

          {/* Pricing breakdown */}
          <AnimatedSection delay={300} className="mt-20 md:mt-28">
            <p className="eyebrow" style={{ marginBottom: '2rem' }}>Pricing Guide</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
            }}>
              {pricing.map((p, i) => (
                <div
                  key={p.label}
                  style={{
                    padding: '1.75rem',
                    backgroundColor: 'var(--surface)',
                    borderRight: i < pricing.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <p style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '0.75rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--text-low)',
                    marginBottom: '0.875rem',
                  }}>
                    {p.label}
                  </p>
                  <p style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: '1.375rem',
                    fontWeight: 400,
                    color: 'var(--gold)',
                    lineHeight: 1.2,
                    marginBottom: '0.5rem',
                  }}>
                    {p.price}
                  </p>
                  <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.8125rem',
                    color: 'var(--text-mid)',
                    lineHeight: 1.6,
                    maxWidth: 'none',
                  }}>
                    {p.note}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Deposit note */}
          <AnimatedSection delay={400} className="mt-8">
            <div style={{
              padding: '1.5rem 2rem',
              border: '1px solid rgba(201,168,76,0.15)',
              borderRadius: '0.75rem',
              background: 'rgba(201,168,76,0.04)',
            }}>
              <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Deposits</p>
              <p style={{ fontSize: '0.9rem', maxWidth: '62ch' }}>
                A deposit secures your booking and is deducted from the final session price.
                Deposits are non-refundable for cancellations within 48 hours of your appointment.
              </p>
            </div>
          </AnimatedSection>

          {/* CTAs */}
          <AnimatedSection delay={500} className="mt-16 flex gap-3 flex-col sm:flex-row">
            <Link href="/consultation" className="btn-primary">
              <span>Free Consultation</span>
              <span className="btn-icon" aria-hidden="true">↗</span>
            </Link>
            <Link href="/booking" className="btn-secondary">
              Book Directly
            </Link>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
