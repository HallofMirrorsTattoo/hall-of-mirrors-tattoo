import Link from 'next/link';
import AnimatedSection from '../components/AnimatedSection';

export const metadata = {
  title: 'Services & Pricing | Hall of Mirrors Tattoo Studio Liverpool',
  description: 'Custom tattoos, cover-ups, and free consultations at Hall of Mirrors Tattoo Studio, Castle Street Liverpool. Neo-traditional specialists. Transparent pricing guide — starting from £150.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com/about',
  },
  openGraph: {
    title: 'Services & Pricing | Hall of Mirrors Tattoo Studio Liverpool',
    description: 'Custom tattoos, cover-ups, and free consultations in Liverpool city centre. Bespoke neo-traditional tattooing from £150. No walk-ins — appointment only.',
    url: 'https://hallofmirrorstattoo.com/about',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website' as const,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Services & Pricing | Hall of Mirrors Tattoo Studio Liverpool',
    description: 'Custom tattoos, cover-ups, and free consultations in Liverpool city centre. Bespoke neo-traditional tattooing from £150.',
  },
};

const services = [
  {
    n: '01',
    title: 'Bespoke Custom Tattoo',
    desc: 'The foundation of what we do. Every custom tattoo at Hall of Mirrors is drawn from scratch — no flash, no clip art, no compromises. We work through your idea together, from rough concept to polished design, before anything touches your skin. Neo-traditional our speciality, though we work across styles.',
    price: '£150+',
    link: '/booking',
    cta: 'Book now',
  },
  {
    n: '02',
    title: 'Free Consultation',
    desc: "Not sure where to start? Book a free consultation at our Castle Street studio. We'll talk through your idea, suitable placement, approximate sizing, and what the design process involves. Most of our clients start here — there's no obligation and no pressure.",
    price: 'Free',
    link: '/booking',
    cta: 'Book consultation',
  },
  {
    n: '03',
    title: 'Cover-Up & Rework',
    desc: "Specialist cover-up tattoos for existing work you want transformed — whether it's a name, an old design that's lost its meaning, or simply a tattoo that was never quite right. Cover-up work requires a consultation first so we can assess the existing ink and recommend the best approach.",
    price: 'Custom quote',
    link: '/booking',
    cta: 'Book consultation',
  },
  {
    n: '04',
    title: 'Touch-Ups & Aftercare',
    desc: "We stand behind our work. If a healed tattoo needs a touch-up — colour refresh, line sharpening — get in touch. Touch-ups on Hall of Mirrors work are handled case-by-case. We also provide detailed aftercare guidance with every appointment.",
    price: 'Case-by-case',
    link: '/booking',
    cta: 'Get in touch',
  },
];

const pricing = [
  { label: 'Small  1–3"',   price: '£150 – £250', note: 'Simple designs, first tattoos' },
  { label: 'Medium  3–6"',  price: '£300 – £500', note: 'Detail work, standard placement' },
  { label: 'Large  6"+',    price: 'Custom quote', note: 'Complex work, multi-session' },
  { label: 'Cover-Up',      price: 'Custom quote', note: 'Quoted after in-person consultation' },
];

const servicesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Hall of Mirrors Tattoo Studio',
  url: 'https://hallofmirrorstattoo.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Suite 3, 34 Castle Street',
    addressLocality: 'Liverpool',
    postalCode: 'L2 0NR',
    addressCountry: 'GB',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Tattoo Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Bespoke Custom Tattoo',
          description: 'Custom tattoo designs drawn from scratch. Neo-traditional specialist. Every piece created in collaboration with you.',
        },
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'GBP',
          minPrice: 150,
          description: 'Starting from £150 depending on size and complexity',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Free Tattoo Consultation',
          description: 'Free consultation at our Castle Street Liverpool studio. Discuss your idea, placement, sizing and the design process.',
        },
        price: 0,
        priceCurrency: 'GBP',
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Cover-Up & Rework',
          description: 'Specialist cover-up tattoos and rework of existing tattoos. Consultation required to assess existing ink.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Touch-Ups & Aftercare',
          description: 'Touch-ups for healed Hall of Mirrors tattoos. Colour refresh, line sharpening. Handled case-by-case.',
        },
      },
    ],
  },
};

export default function Services() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />

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
              Custom tattoos, cover-ups &amp; consultations
            </h1>
            <p style={{ maxWidth: '52ch' }}>
              Hall of Mirrors is a private tattoo studio on Castle Street, Liverpool,
              specialising in bespoke neo-traditional tattooing, full-colour work, and
              skilled cover-ups. Every service is appointment-only — we don&apos;t do
              walk-ins, and we don&apos;t do off-the-shelf designs.
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

          {/* ── THE STUDIO EXPERIENCE ─────────────────────────────────────── */}
          <AnimatedSection delay={200} className="mt-20 md:mt-28">
            <p className="eyebrow" style={{ marginBottom: '2rem' }}>The Studio Experience</p>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ borderTop: '1px solid var(--border)' }}>
              {([
                { roman: 'I',   label: 'Appointment Only',  body: "We don't take walk-ins. Every session is booked in advance, giving your artist time to prepare your design and you a dedicated slot with no pressure." },
                { roman: 'II',  label: 'Private Studio',    body: 'Hall of Mirrors is a quiet, private space at Suite 3, 34 Castle Street, Liverpool. One client at a time.' },
                { roman: 'III', label: 'Fully Licensed',    body: 'Licensed by Liverpool City Council (Ref: A11394900). Autoclave sterilisation. Hepatitis B vaccinated. Your safety is non-negotiable.' },
              ] as const).map((item, i) => (
                <div
                  key={item.roman}
                  className={`py-10 px-8 relative overflow-hidden${i < 2 ? ' md:border-r' : ''}`}
                  style={{ borderColor: 'var(--border)', borderBottom: '1px solid var(--border)' }}
                >
                  <span
                    className="absolute top-0 right-4 pointer-events-none select-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontStyle: 'italic',
                      fontSize: '7rem',
                      fontWeight: 300,
                      color: 'var(--gold)',
                      opacity: 0.045,
                      lineHeight: 1,
                    }}
                    aria-hidden="true"
                  >
                    {item.roman}
                  </span>
                  <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>{item.label}</p>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.75, maxWidth: '34ch' }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedSection>

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
                A non-refundable deposit is required to secure your booking. This is deducted
                from the final session price on the day. Cancellations within 48 hours forfeit
                the deposit. We appreciate you respecting our time — we&apos;re a small studio
                and last-minute cancellations have a real impact.
              </p>
            </div>
          </AnimatedSection>

          {/* CTAs */}
          <AnimatedSection delay={500} className="mt-16 flex gap-3 flex-col sm:flex-row">
            <Link href="/booking" className="btn-primary">
              <span>Book Appointment</span>
              <span className="btn-icon" aria-hidden="true">↗</span>
            </Link>
            <Link href="/portfolio" className="btn-secondary">
              View Our Artists
            </Link>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
