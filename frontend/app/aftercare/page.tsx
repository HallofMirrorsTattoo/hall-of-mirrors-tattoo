import Link from 'next/link';
import AnimatedSection from '@/app/components/AnimatedSection';

export const metadata = {
  title: 'Tattoo Aftercare Guide | Hall of Mirrors Tattoo Studio Liverpool',
  description: 'How to care for your new tattoo. Step-by-step aftercare instructions from Hall of Mirrors Tattoo Studio, Liverpool. Protect your investment and ensure the best heal.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com/aftercare',
  },
  openGraph: {
    title: 'Tattoo Aftercare Guide | Hall of Mirrors Liverpool',
    description: 'Step-by-step tattoo aftercare instructions from Hall of Mirrors Tattoo Studio, Liverpool. How to care for your new tattoo through every phase of healing.',
    url: 'https://hallofmirrorstattoo.com/aftercare',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'article' as const,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Tattoo Aftercare Guide | Hall of Mirrors Liverpool',
    description: 'Step-by-step tattoo aftercare instructions from Hall of Mirrors Tattoo Studio, Liverpool.',
  },
};

const phases = [
  {
    number: '01',
    title: 'First 3 Hours',
    items: [
      'Keep bandage or protective film on — do not remove early',
      'No water exposure',
      'Avoid direct sunlight',
      'Do not touch or pick at the tattoo',
    ],
  },
  {
    number: '02',
    title: 'First 24 Hours',
    items: [
      'Remove bandage after 2–3 hours',
      'Gently wash with unscented soap and warm water',
      'Pat dry with a clean paper towel — never cloth',
      'Apply a thin layer of aftercare balm',
      'Let it air dry between applications',
    ],
  },
  {
    number: '03',
    title: 'Days 2–7',
    items: [
      'Wash 2–3 times daily with unscented soap',
      'Apply aftercare balm after each wash',
      'Avoid tight clothing over the tattoo',
      'No swimming, baths, or saunas',
      'Do not pick or scratch at peeling skin',
      'Stay out of direct sunlight',
    ],
  },
  {
    number: '04',
    title: 'Weeks 2–4',
    items: [
      'Continue moisturising with lotion or aftercare balm',
      'Apply SPF 30+ sunscreen if going outside',
      'Avoid strenuous exercise or heavy sweating',
      'Tattoo may still feel slightly tender — this is normal',
    ],
  },
];

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Care for Your New Tattoo',
  description: 'Step-by-step tattoo aftercare instructions from Hall of Mirrors Tattoo Studio, Liverpool.',
  totalTime: 'P4W',
  step: [
    {
      '@type': 'HowToStep',
      name: 'First 3 Hours',
      text: 'Keep bandage or protective film on. No water exposure. Avoid direct sunlight. Do not touch or pick at the tattoo.',
      position: 1,
    },
    {
      '@type': 'HowToStep',
      name: 'First 24 Hours',
      text: 'Remove bandage after 2–3 hours. Gently wash with unscented soap and warm water. Pat dry with a clean paper towel. Apply a thin layer of aftercare balm.',
      position: 2,
    },
    {
      '@type': 'HowToStep',
      name: 'Days 2–7',
      text: 'Wash 2–3 times daily with unscented soap. Apply aftercare balm after each wash. Avoid tight clothing over the tattoo. No swimming, baths, or saunas. Do not pick or scratch at peeling skin.',
      position: 3,
    },
    {
      '@type': 'HowToStep',
      name: 'Weeks 2–4',
      text: 'Continue moisturising with lotion or aftercare balm. Apply SPF 30+ sunscreen if going outside. Avoid strenuous exercise or heavy sweating.',
      position: 4,
    },
  ],
};

export default function Aftercare() {
  return (
    <main style={{ background: 'var(--bg)' }} className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <span className="eyebrow">Post-Session Care</span>
            <h1
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: 'var(--cream)',
                marginTop: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              Caring For Your Tattoo
            </h1>
            <p
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                color: 'var(--text-mid)',
                fontSize: '1.0625rem',
                lineHeight: 1.75,
                maxWidth: '55ch',
              }}
            >
              Following these steps protects your investment and ensures the best possible
              heal. If you have any questions at any point, Robyn is always happy to help.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider px-6"><span>HOM</span></div>

      {/* Phases */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {phases.map((phase, i) => (
            <AnimatedSection key={phase.number} delay={i * 80}>
              <div className="card-premium">
                <div
                  className="card-premium-inner"
                  style={{ display: 'flex', gap: '1.75rem', alignItems: 'flex-start' }}
                >
                  {/* Phase number */}
                  <span
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '2.25rem',
                      fontWeight: 400,
                      color: 'var(--gold)',
                      opacity: 0.45,
                      lineHeight: 1,
                      flexShrink: 0,
                      paddingTop: '0.125rem',
                      minWidth: '2.75rem',
                    }}
                  >
                    {phase.number}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <h2
                      style={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontStyle: 'italic',
                        fontWeight: 500,
                        fontSize: '1.375rem',
                        color: 'var(--cream)',
                        marginBottom: '0.875rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {phase.title}
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {phase.items.map((item) => (
                        <li
                          key={item}
                          style={{
                            display: 'flex',
                            gap: '0.625rem',
                            fontFamily: '"DM Sans", system-ui, sans-serif',
                            fontSize: '0.9375rem',
                            color: 'var(--text-mid)',
                            lineHeight: 1.6,
                          }}
                        >
                          <span style={{ color: 'var(--gold)', opacity: 0.5, flexShrink: 0, marginTop: '0.1em' }}>—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Warning */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection delay={100}>
            <div
              className="card-premium"
              style={{ borderColor: 'rgba(201,168,76,0.25)' }}
            >
              <div className="card-premium-inner" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Gold rule — full-height accent, not a border-left on the card */}
                <div
                  style={{
                    width: '2px',
                    alignSelf: 'stretch',
                    background: 'linear-gradient(to bottom, rgba(201,168,76,0.6), rgba(201,168,76,0.15))',
                    borderRadius: '1px',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <span className="eyebrow" style={{ marginBottom: '0.75rem' }}>Important</span>
                  <p
                    style={{
                      fontFamily: '"DM Sans", system-ui, sans-serif',
                      fontSize: '0.9375rem',
                      color: 'var(--text-mid)',
                      lineHeight: 1.75,
                      maxWidth: '60ch',
                    }}
                  >
                    If you experience excessive redness, swelling, warmth, or any discharge lasting
                    more than a few days — or any signs of infection — contact a healthcare
                    professional immediately. Do not wait.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="section-divider px-6"><span>HOM</span></div>

      {/* CTA */}
      <section className="py-24 px-6" style={{ textAlign: 'center' }}>
        <AnimatedSection>
          <span className="eyebrow">Ready For More?</span>
          <h2
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: 'var(--cream)',
              marginTop: '1rem',
              marginBottom: '1rem',
              lineHeight: 1.1,
            }}
          >
            Book Your Next Session
          </h2>
          <p
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              color: 'var(--text-mid)',
              fontSize: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            When you&apos;re healed and ready, Robyn would love to hear from you.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/booking" className="btn-primary">
              <span>Book a Session</span>
              <span className="btn-icon" aria-hidden="true">→</span>
            </Link>
            <Link href="/contact" className="btn-secondary">
              Get in Touch
            </Link>
          </div>
        </AnimatedSection>
      </section>

    </main>
  );
}
