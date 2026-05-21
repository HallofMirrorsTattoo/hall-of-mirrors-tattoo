import type { Metadata } from 'next';
import Link from 'next/link';
import { getStudioSettings } from '@/lib/studioSettings';
import AccordionItem from '../components/AccordionItem';

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

export default async function About() {
  const studio = await getStudioSettings();

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
    hasMap: 'https://share.google/VD7dtKwuFYH5QnWvh',
    sameAs: [
      studio?.instagram_handle ? `https://instagram.com/${studio.instagram_handle}` : 'https://instagram.com/hallofmirrorstattoo',
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

      {/* Header */}
      <section style={{ padding: '5rem 1.5rem 3rem', maxWidth: '48rem', margin: '0 auto' }}>
        <p className="eyebrow" style={{ marginBottom: '1.5rem' }}>The Studio</p>
        <h1 style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 'clamp(3rem, 7vw, 5rem)',
          color: 'var(--cream)',
          letterSpacing: '-0.025em',
          lineHeight: 1.0,
          marginBottom: '2rem',
        }}>
          About Hall of Mirrors
        </h1>

        <p style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '1rem',
          color: 'var(--text-mid)',
          lineHeight: 1.85,
          marginBottom: '1.25rem',
        }}>
          Hall of Mirrors is a female-owned, private tattoo studio at Suite 3, 34 Castle Street,
          Liverpool, L2 0NR. We are a fully inclusive space — a safe and welcoming home for everyone,
          including the LGBTQ+ community. Fully licensed by Liverpool City Council.
          Appointment-only.
        </p>
        <p style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '1rem',
          color: 'var(--text-mid)',
          lineHeight: 1.85,
          marginBottom: '2.5rem',
        }}>
          Every piece here is drawn from scratch — bespoke work built entirely around your story,
          your references, and your vision. There are no off-the-shelf designs and no compromises.
          Just the time, the space, and the skill to make something that is entirely yours.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/booking" className="btn-primary">
            <span>Book Appointment</span>
            <span className="btn-icon" aria-hidden="true">↗</span>
          </Link>
          <Link href="/portfolio" className="btn-secondary">Meet Our Artists</Link>
        </div>
      </section>

      {/* Accordion sections */}
      <section style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem 7rem', borderTop: '1px solid var(--border)' }}>

        <AccordionItem title="How to find us">
          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.9375rem',
            color: 'var(--text-mid)',
            lineHeight: 1.8,
            marginBottom: '1.25rem',
          }}>
            We are at <strong style={{ color: 'var(--cream)', fontWeight: 500 }}>Hall of Mirrors Tattoo Studio, Suite 3, 34 Castle Street, Liverpool, L2 0NR</strong> — in the heart of the city centre, in the business district.
          </p>
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.7)',
            marginBottom: '0.875rem',
          }}>
            Nearest stations
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ['Liverpool Central', '~3 min walk'],
              ['Moorfields', '~5 min walk'],
              ['Liverpool Lime Street', '~10 min walk'],
            ].map(([station, time]) => (
              <li key={station} style={{ display: 'flex', gap: '0.75rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                <span style={{ color: 'rgba(201,168,76,0.5)', flexShrink: 0 }}>—</span>
                <span><strong style={{ color: 'var(--cream)', fontWeight: 500 }}>{station}</strong> — {time}</span>
              </li>
            ))}
          </ul>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.8, marginBottom: '1.25rem' }}>
            There is paid parking on Castle Street and Water Street if you are driving.
          </p>
          <a
            href="https://share.google/VD7dtKwuFYH5QnWvh"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.7rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.6)',
              textDecoration: 'none',
            }}
          >
            Find us on Google ↗
          </a>
        </AccordionItem>

        <AccordionItem title="Aftercare advice">
          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.9375rem',
            color: 'var(--text-mid)',
            lineHeight: 1.8,
            marginBottom: '1.5rem',
          }}>
            This is your new skin story now — look after it and it&apos;ll look after you.
          </p>

          {[
            {
              phase: 'First 2–3 hours',
              items: [
                'Keep the bandage or protective film on — do not remove early',
                'No water exposure',
                'Avoid direct sunlight',
                'Do not touch or pick at the tattoo',
              ],
            },
            {
              phase: 'First 24 hours',
              items: [
                'Remove bandage after 2–3 hours',
                'Gently wash with fragrance-free soap and warm water',
                'Pat dry with a clean paper towel — never a cloth towel',
                'Apply a thin layer of unscented aftercare balm',
                'Let it air dry between applications',
              ],
            },
            {
              phase: 'Days 2–7',
              items: [
                'Wash 2–3 times daily with fragrance-free soap',
                'Apply aftercare balm after each wash',
                'Avoid tight clothing over the tattoo',
                'No swimming, baths, or saunas',
                'Do not pick or scratch at peeling skin',
                'Stay out of direct sunlight',
              ],
            },
            {
              phase: 'Weeks 2–4',
              items: [
                'Continue moisturising 2–3 times daily',
                'Apply SPF 30+ sunscreen if going outside',
                'Avoid strenuous exercise or heavy sweating',
                'Some tenderness and itching is normal — do not scratch',
              ],
            },
          ].map(({ phase, items }) => (
            <div key={phase} style={{ marginBottom: '1.5rem' }}>
              <p style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.7)',
                marginBottom: '0.625rem',
              }}>
                {phase}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {items.map((item) => (
                  <li key={item} style={{ display: 'flex', gap: '0.625rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.65 }}>
                    <span style={{ color: 'rgba(201,168,76,0.5)', flexShrink: 0 }}>—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.875rem',
            color: 'var(--text-low)',
            lineHeight: 1.75,
            borderTop: '1px solid var(--border)',
            paddingTop: '1.25rem',
            marginTop: '0.5rem',
          }}>
            If you experience excessive redness, swelling, or any signs of infection lasting more than a few days — contact a healthcare professional immediately.
          </p>
        </AccordionItem>

        <AccordionItem title="FAQ">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {[
              {
                q: 'Do you take walk-ins?',
                a: 'No — Hall of Mirrors is appointment-only. Every session is booked in advance so your artist has time to prepare your design, and you get a private slot without any rush.',
              },
              {
                q: 'How much does a tattoo cost?',
                a: 'Pricing depends on size and complexity. Small tattoos (1–3") start from £150–£250. Medium work (3–6") typically runs £300–£500. Larger or complex pieces are quoted individually after your consultation. All prices include your bespoke design.',
              },
              {
                q: 'What is a consultation and is it really free?',
                a: 'Yes, completely free and no obligation. A consultation is a relaxed conversation where we talk through your idea, placement, size, and what the design process will look like. Most clients start here.',
              },
              {
                q: 'Can you cover up an old tattoo?',
                a: 'Yes — cover-up and rework is one of our specialities. Cover-ups always require a consultation first so we can assess the existing ink and recommend the best approach.',
              },
              {
                q: 'Do I need to pay a deposit?',
                a: 'Yes. A non-refundable deposit is required to secure your booking, which is deducted from your final session price on the day. Cancellations within 48 hours forfeit the deposit.',
              },
              {
                q: 'What styles do you specialise in?',
                a: 'Neo-traditional is the foundation — bold outlines, rich colour, classic subject matter with a modern edge, and occasionally a sprinkle of camp humour. We also work in colour realism, fine line, and cover-up work. If you\'re not sure whether your idea fits — just ask.',
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <p style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: '1.125rem',
                  color: 'var(--cream)',
                  lineHeight: 1.3,
                  marginBottom: '0.5rem',
                }}>
                  {q}
                </p>
                <p style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.9375rem',
                  color: 'var(--text-mid)',
                  lineHeight: 1.75,
                }}>
                  {a}
                </p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <Link
              href="/faq"
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.6)',
                textDecoration: 'none',
              }}
            >
              Read all FAQs ↗
            </Link>
          </div>
        </AccordionItem>

      </section>
    </div>
  );
}
