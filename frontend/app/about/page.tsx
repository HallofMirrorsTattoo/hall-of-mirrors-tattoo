import type { Metadata } from 'next';
import Link from 'next/link';
import AnimatedSection from '../components/AnimatedSection';
import { getStudioSettings } from '@/lib/studioSettings';

export const metadata: Metadata = {
  title: 'About | Hall of Mirrors Tattoo Studio | Liverpool City Centre',
  description:
    'Hall of Mirrors is a private bespoke tattoo studio on Castle Street, Liverpool city centre. Neo-traditional specialist. Every design custom made. Liverpool City Council licensed. Book online.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com/about',
  },
  openGraph: {
    title: 'About Hall of Mirrors Tattoo Studio — Liverpool',
    description:
      'A private tattoo studio on Castle Street, Liverpool. Specialising in neo-traditional and bespoke custom design. No walk-ins. Every piece is created for you alone.',
    url: 'https://hallofmirrorstattoo.com/about',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Hall of Mirrors Tattoo Studio — Liverpool',
    description: 'A private tattoo studio on Castle Street, Liverpool. Bespoke neo-traditional tattooing. No walk-ins. Every piece created for you alone.',
  },
};

const credentials = [
  { n: 'I',   label: 'Licensed',        title: 'Liverpool City Council',  detail: 'Ref: A11394900' },
  { n: 'II',  label: 'Health & Safety', title: 'Autoclave Certified',     detail: 'Hepatitis B Vaccinated' },
  { n: 'III', label: 'Specialist',      title: 'Neo-Traditional',         detail: 'Bespoke Designs Only' },
  { n: 'IV',  label: 'Compliant',       title: 'GDPR Compliant',          detail: 'Your data handled with care' },
];

const studioStats = [
  { num: '2',     label: 'Resident Artists' },
  { num: '100%',  label: 'Bespoke Design' },
  { num: 'Private', label: 'By Appointment' },
];

const pillars = [
  {
    n: '01',
    title: 'The work is permanent. So we take our time.',
    body: "Every line, every shade, every colour choice is deliberate. A tattoo lives on your skin for life — so we don't rush, don't guess, and don't compromise.",
  },
  {
    n: '02',
    title: 'No templates. No shortcuts. No off-the-shelf anything.',
    body: 'Every piece at Hall of Mirrors is drawn from scratch. Your story, your references, your vision — that\'s where it starts. That\'s where it always starts.',
  },
  {
    n: '03',
    title: 'We talk before we draw.',
    body: 'Before anything touches your skin, we have a conversation. About placement, style, meaning — what this piece is for and what it should say. The consultation is where the real work begins.',
  },
];

export default async function About() {
  const studio = await getStudioSettings();
  const addressDetail = studio?.address
    ? [studio.address, studio.postcode].filter(Boolean).join(', ')
    : 'Suite 3, 34 Castle Street, L2 0NR';

  const studioInfoStrip = [
    { title: 'Castle Street', detail: `${addressDetail} · Minutes from Liverpool Central, Moorfields & Lime Street stations` },
    { title: 'Bespoke Only',  detail: 'Every design drawn from scratch — no flash sheets, no off-the-shelf work' },
    { title: 'Consultation',  detail: 'Free initial consultations available — talk through your idea, no obligation' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: studio?.studio_name ?? 'Hall of Mirrors Tattoo Studio',
    description:
      'Private bespoke tattoo studio on Castle Street, Liverpool city centre. Specialising in neo-traditional tattooing and custom design.',
    url: 'https://hallofmirrorstattoo.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: studio?.address ?? 'Suite 3, 34 Castle Street',
      addressLocality: 'Liverpool',
      postalCode: studio?.postcode ?? 'L2 0NR',
      addressCountry: 'GB',
    },
    telephone: studio?.phone ?? undefined,
    email: studio?.email ?? undefined,
    priceRange: '££',
    hasMap: 'https://maps.google.com/?q=34+Castle+Street+Liverpool',
    sameAs: [
      studio?.instagram_handle ? `https://instagram.com/${studio.instagram_handle}` : null,
      studio?.tiktok_handle ? `https://tiktok.com/@${studio.tiktok_handle}` : null,
      studio?.facebook_url ?? null,
    ].filter(Boolean),
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO — 2-col split ──────────────────────────────────────────── */}
      <section className="px-6 pt-8 pb-20 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">

            <AnimatedSection>
              <p className="eyebrow">The Studio</p>
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
                Where craft becomes permanent
              </h1>

              {studio?.about_section ? (
                <p style={{ marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                  {studio.about_section}
                </p>
              ) : (
                <>
                  <p style={{ marginBottom: '1.25rem' }}>
                    Hall of Mirrors is a private tattoo studio on Castle Street,
                    Liverpool city centre — Suite 3, 34 Castle Street. We believe in
                    the telling of your story.
                  </p>
                  <p style={{ marginBottom: '1.25rem' }}>
                    The name is a metaphor for self-discovery. Walk through a hall of
                    mirrors and you see a hundred versions of yourself — different shapes,
                    different angles. Which is the truest? Only you can decide. It is you
                    who gets to choose which reflection is your reality, and to alter it as
                    you wish — without anyone&apos;s permission.
                  </p>
                  <p style={{ marginBottom: '1.25rem' }}>
                    Tattoos are one of the ways we record that journey: armour, expression,
                    a permanent and beautifully playful way to bring who you are to the
                    surface. Every piece here begins as a blank page — drawn from your
                    story, your references, your vision. The studio is home to two resident
                    neo-traditional specialists working from our private space in Liverpool
                    city centre. One client at a time. Every appointment by design.
                  </p>
                </>
              )}

              {/* Studio stats */}
              <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2.5rem', marginBottom: '2.5rem' }}>
                {studioStats.map((s) => (
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
                <Link href="/portfolio" className="btn-secondary">Meet Our Artists</Link>
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

      {/* ── THE PILLARS ────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection style={{ marginBottom: '3rem' }}>
            <p className="eyebrow">What we stand for</p>
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
              The Hall of Mirrors approach
            </h2>
          </AnimatedSection>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {pillars.map((p, i) => (
              <AnimatedSection
                key={p.n}
                delay={i * 80}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '5.5rem 1px 1fr',
                  alignItems: 'start',
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
                    {p.n}
                  </span>
                  <span style={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'var(--border)' }} aria-hidden="true" />
                  <div style={{ paddingTop: '0.25rem' }}>
                    <h3 style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontStyle: 'italic',
                      fontSize: 'clamp(1.375rem, 3vw, 2rem)',
                      fontWeight: 300,
                      color: 'var(--cream)',
                      lineHeight: 1.2,
                      marginBottom: '0.75rem',
                    }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', maxWidth: '52ch', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                      {p.body}
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

      {/* ── WHAT WE OFFER ──────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection style={{ marginBottom: '3rem' }}>
            <p className="eyebrow">What we offer</p>
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
              Every appointment, by design
            </h2>
          </AnimatedSection>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {([
              {
                n: '01',
                title: 'Bespoke Custom Tattoo',
                body: 'The foundation of what we do. Every custom tattoo at Hall of Mirrors is drawn from scratch — no flash, no clip art, no compromises. We work through your idea together, from rough concept to polished design, before anything touches your skin. Neo-traditional our speciality, though we work across styles.',
              },
              {
                n: '02',
                title: 'Free Consultation',
                body: "Not sure where to start? Book a free consultation at our Castle Street studio. We'll talk through your idea, suitable placement, approximate sizing, and what the design process involves. Most of our clients start here — there's no obligation and no pressure.",
              },
              {
                n: '03',
                title: 'Cover-Up & Rework',
                body: "Specialist cover-up tattoos for existing work you want transformed — whether it's a name, an old design that's lost its meaning, or simply a tattoo that was never quite right. Cover-up work requires a consultation first so we can assess the existing ink and recommend the best approach.",
              },
              {
                n: '04',
                title: 'Touch-Ups & Aftercare',
                body: 'We stand behind our work. If a healed tattoo needs a touch-up — colour refresh, line sharpening — get in touch. Touch-ups on Hall of Mirrors work are handled case-by-case. We also provide detailed aftercare guidance with every appointment.',
              },
            ]).map((item, i) => (
              <AnimatedSection
                key={item.n}
                delay={i * 80}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '5.5rem 1px 1fr',
                  alignItems: 'start',
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
                    {item.n}
                  </span>
                  <span style={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'var(--border)' }} aria-hidden="true" />
                  <div style={{ paddingTop: '0.25rem' }}>
                    <h3 style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontStyle: 'italic',
                      fontSize: 'clamp(1.375rem, 3vw, 2rem)',
                      fontWeight: 300,
                      color: 'var(--cream)',
                      lineHeight: 1.2,
                      marginBottom: '0.75rem',
                    }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', maxWidth: '55ch', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection delay={350} style={{ marginTop: '3rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/booking" className="btn-primary">
              <span>Book Appointment</span>
              <span className="btn-icon" aria-hidden="true">↗</span>
            </Link>
            <Link href="/booking?mode=consultation" className="btn-secondary">Request a Consultation</Link>
          </AnimatedSection>
        </div>
      </section>

      {/* HOM Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="section-divider">
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
        </div>
      </div>

      {/* ── STUDIO INFO STRIP ──────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <p className="eyebrow" style={{ marginBottom: '2.5rem' }}>Find us</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
              {studioInfoStrip.map((item) => (
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
