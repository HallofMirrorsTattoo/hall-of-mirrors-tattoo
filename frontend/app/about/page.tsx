import type { Metadata } from 'next';
import Link from 'next/link';
import AnimatedSection from '../components/AnimatedSection';
import { getStudioSettings } from '@/lib/studioSettings';

export const metadata: Metadata = {
  title: 'About | Hall of Mirrors Tattoo Studio | Liverpool City Centre',
  description:
    'Hall of Mirrors is a private bespoke tattoo studio on Castle Street, Liverpool city centre. Neo-traditional specialist. Every design custom made. Liverpool City Council licensed. Book online.',
  openGraph: {
    title: 'About Hall of Mirrors Tattoo Studio — Liverpool',
    description:
      'A private tattoo studio on Castle Street, Liverpool. Specialising in neo-traditional and bespoke custom design. No walk-ins. Every piece is created for you alone.',
    url: 'https://hallofmirrors.tattoo/about',
    siteName: 'Hall of Mirrors Tattoo',
    locale: 'en_GB',
    type: 'website',
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
    title: 'Craft first.',
    body: "Tattooing is a permanent art form. Every line, every shade, every colour choice is deliberate. We take the time to get it right — because you'll wear it for life.",
  },
  {
    n: '02',
    title: 'Nothing off the shelf.',
    body: 'There are no flash sheets here, no off-the-shelf designs, no compromise. Every piece begins as a blank page — drawn from your story, your references, your vision.',
  },
  {
    n: '03',
    title: 'The consultation is everything.',
    body: 'Before a single line is drawn, we talk. About placement. About style. About what the piece means. The conversation is where the work really begins.',
  },
];

export default async function About() {
  const studio = await getStudioSettings();
  const addressDetail = studio?.address
    ? [studio.address, studio.postcode].filter(Boolean).join(', ')
    : 'Suite 3, 34 Castle Street, L2 0NR';

  const studioInfoStrip = [
    { title: 'Liverpool',    detail: addressDetail },
    { title: 'Bespoke Only', detail: 'Every design is created for you alone' },
    { title: 'Consultation', detail: 'Free initial design consultations available' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: studio?.studio_name ?? 'Hall of Mirrors Tattoo Studio',
    description:
      'Private bespoke tattoo studio on Castle Street, Liverpool city centre. Specialising in neo-traditional tattooing and custom design.',
    url: 'https://hallofmirrors.tattoo',
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
                    Hall of Mirrors is a private tattoo studio at the heart of Liverpool
                    city centre — Suite 3, 34 Castle Street. Built on the belief that
                    tattooing deserves to be taken seriously: as craft, as art, as
                    something that lasts.
                  </p>
                  <p style={{ marginBottom: '1.25rem' }}>
                    Everything here is bespoke. There are no flash sheets, no off-the-shelf
                    designs, no rushing. Every piece begins with a conversation —
                    understanding what the client brings to the chair and translating that
                    into something permanent and deeply personal.
                  </p>
                  <p style={{ marginBottom: '1.25rem' }}>
                    The studio is home to two resident artists specialising in
                    neo-traditional tattooing, colour realism, and bespoke custom design —
                    work that draws from art history, natural forms, and the specific
                    story of each client.
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
