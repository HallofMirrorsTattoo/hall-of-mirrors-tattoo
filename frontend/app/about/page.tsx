import type { Metadata } from 'next';
import Link from 'next/link';
import { getStudioSettings } from '@/lib/studioSettings';
import AccordionItem from '../components/AccordionItem';

export const metadata: Metadata = {
  title: 'About | Hall of Mirrors Tattoo Studio | Liverpool City Centre',
  description:
    'Hall of Mirrors is a female-owned, fully inclusive private tattoo studio at Suite 3, 34 Castle Street, Liverpool. Licensed by Liverpool City Council. Walk-ins welcome.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com/about',
  },
  openGraph: {
    title: 'About Hall of Mirrors Tattoo Studio — Liverpool',
    description:
      'A female-owned, fully inclusive tattoo studio on Castle Street, Liverpool. Bespoke neo-traditional work. Every design drawn from scratch.',
    url: 'https://hallofmirrorstattoo.com/about',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Hall of Mirrors Tattoo Studio — Liverpool',
    description: 'A female-owned, fully inclusive tattoo studio on Castle Street, Liverpool. Bespoke neo-traditional tattooing. Walk-ins welcome.',
  },
};

export default async function About() {
  const studio = await getStudioSettings();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: studio?.studio_name ?? 'Hall of Mirrors Tattoo Studio',
    description:
      'Female-owned private tattoo studio on Castle Street, Liverpool city centre. Fully inclusive LGBTQ+ safe space. Neo-traditional specialists. Every design bespoke.',
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
          Hall of Mirrors is a female-owned, private tattoo studio located at Suite 3, 34 Castle
          Street, Liverpool, L2 0NR. We are a fully inclusive space — a safe and welcoming home
          for everyone and we reserve the right to refuse services to those who do not align with
          our principles.
        </p>

        <p style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '1rem',
          color: 'var(--text-mid)',
          lineHeight: 1.85,
          marginBottom: '1.25rem',
        }}>
          Fully licensed by Liverpool City Council. We will happily accept Walk-ins if we have
          time on the day.
        </p>

        <p style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '1rem',
          color: 'var(--text-mid)',
          lineHeight: 1.85,
          marginBottom: '1.25rem',
        }}>
          Every piece here is drawn from scratch — custom work built entirely around your story,
          your references, and your vision. There are no off-the-shelf designs and no compromises.
          Just the time, the space, and the skill to make something that is entirely yours.
        </p>

        <p style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '1rem',
          color: 'var(--text-mid)',
          lineHeight: 1.85,
          marginBottom: '2.5rem',
        }}>
          We understand that tattooing is a luxury service and your needs are the priority. We
          pride ourselves on our ability to listen and cater to your vision. We will always give
          our honest opinion artistically and practically, and we will make suggestions in your
          best interests so that you will have the best possible tattoo.
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

        {/* ── HOW TO FIND US ──────────────────────────────────────────── */}
        <AccordionItem title="How to Find Us">
          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.9375rem',
            color: 'var(--text-mid)',
            lineHeight: 1.8,
            marginBottom: '1.25rem',
          }}>
            We are at{' '}
            <strong style={{ color: 'var(--cream)', fontWeight: 500 }}>
              Hall of Mirrors Tattoo Studio, Suite 3, 34 Castle Street, Liverpool, L2 0NR
            </strong>{' '}
            — in the heart of the city centre, in the business district.
          </p>

          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.7)',
            marginBottom: '0.75rem',
          }}>
            Nearest stations
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ['Liverpool Central', '~8 min walk'],
              ['Moorfields', '~6 min walk'],
              ['Liverpool Lime Street', '~12 min walk'],
            ].map(([station, time]) => (
              <li key={station} style={{ display: 'flex', gap: '0.75rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                <span style={{ color: 'rgba(201,168,76,0.5)', flexShrink: 0 }}>—</span>
                <span>
                  <strong style={{ color: 'var(--cream)', fontWeight: 500 }}>{station}</strong>
                  {' '}— {time}
                </span>
              </li>
            ))}
          </ul>

          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.8, marginBottom: '1.25rem' }}>
            Paid parking is available on Castle Street and Water Street if you are driving.
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

        {/* ── PRE-APPOINTMENT PREP ─────────────────────────────────────── */}
        <AccordionItem title="Pre-Appointment Prep">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              'Be well rested before getting tattooed — the experience may be more difficult if you are tired.',
              'Avoid drugs and alcohol the night before your appointment. Alcohol thins the blood and can cause issues during the process.',
              'Make sure you eat before your appointment so your body has the energy it needs. Bring snacks on the day — chocolate or fruit helps keep your energy levels up.',
              'Bring water and make sure you are well hydrated.',
              'Avoid sunbeds for a few weeks prior to your appointment and moisturise regularly. Well-hydrated skin tattoos better and heals better.',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.75rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.7 }}>
                <span style={{ color: 'rgba(201,168,76,0.5)', flexShrink: 0, marginTop: '0.15em' }}>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </AccordionItem>

        {/* ── DAY OF THE APPOINTMENT ───────────────────────────────────── */}
        <AccordionItem title="Day of the Appointment">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              'Take a shower before your appointment. Please do not shave the area — your artist will do this for you, which reduces the chance of post-shave irritation. If you have long body hair, you may trim the area, but please leave the shaving to your artist.',
              'Wear comfortable clothes that allow easy access to the area being tattooed. You may get changed at the studio. Avoid wearing anything you aren\'t prepared to get ink on — accidents can happen.',
              'If you need to take a break or stop for food and drink during your appointment, that is completely fine. If you feel unwell at any point, please communicate with your artist. They are there for you.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                <span style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontSize: '1.25rem',
                  fontWeight: 300,
                  color: 'rgba(201,168,76,0.5)',
                  flexShrink: 0,
                  lineHeight: 1.3,
                  minWidth: '1.25rem',
                }}>
                  {i + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* ── AFTERCARE ADVICE ─────────────────────────────────────────── */}
        <AccordionItem title="Aftercare Advice">

          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.7)',
            marginBottom: '1rem',
          }}>
            If your artist used Secondskin adhesive
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
            {[
              'Your artist will cover your tattoo and leave you with a second piece of Secondskin to apply at home. They will show you how.',
              'In the first 12 hours, the area will be swollen and expelling excess blood and plasma. Some fluid under the Secondskin is perfectly normal — leave it be and wear loose clothing.',
              'Avoid showering immediately after your appointment as this may cause the adhesive to soften and the Secondskin to come off early.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 300, color: 'rgba(201,168,76,0.5)', flexShrink: 0, lineHeight: 1.3, minWidth: '1.25rem' }}>
                  {i + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: '1rem' }}>
            If the Secondskin comes off prematurely
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
            {[
              'Wash the area and pat dry with a clean paper towel.',
              'Apply the second piece to the dry area within 5–10 minutes, leaving a generous border.',
              'Do not apply Secondskin if the tattoo has been exposed to open air for longer than 20 minutes — this changes the wet healing process.',
              'If you cannot apply it within 20 minutes, discard the Secondskin and allow the tattoo to dry out completely. Clean and moisturise as your artist instructed.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 300, color: 'rgba(201,168,76,0.5)', flexShrink: 0, lineHeight: 1.3, minWidth: '1.25rem' }}>
                  {i + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: '1rem' }}>
            Removing the Secondskin
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
            {[
              'Shower the following morning and very gently peel the adhesive off as lukewarm water trickles over the area.',
              'Gently wash the tattoo with antibacterial soap and pat dry with a clean paper towel.',
              'Apply the second piece to the dry area within 5–10 minutes, leaving a generous border. Leave it on for 2–4 days — the longer the better.',
              'If it begins to peel and there is an entry point to the tattoo, remove the whole thing. We would not want bacteria to get in and not get out.',
              'After a few days, remove the Secondskin and wash, dry, and moisturise as normal. Your tattoo will look more muted while the new skin heals over it — allow 2–3 weeks to see the full finished result.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 300, color: 'rgba(201,168,76,0.5)', flexShrink: 0, lineHeight: 1.3, minWidth: '1.25rem' }}>
                  {i + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)', marginBottom: '1rem' }}>
            What to avoid during healing (2–3 weeks)
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              'No swimming for at least three weeks — chlorinated water will react badly with your tattoo. Avoid hot tubs, saunas, and steam rooms.',
              'No sunbathing or tanning beds for at least three weeks. After that, use sunscreen to keep your tattoo in good condition.',
              'Avoid the gym or any activity that causes heavy sweating while the tattoo is still healing.',
              'Do not allow your pet to have direct contact with your tattoo — tattoos are open wounds and pet hair can contaminate the area and risk infection.',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.75rem', fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.7 }}>
                <span style={{ color: 'rgba(201,168,76,0.5)', flexShrink: 0, marginTop: '0.15em' }}>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.875rem',
            color: 'var(--text-low)',
            lineHeight: 1.75,
            borderTop: '1px solid var(--border)',
            paddingTop: '1.25rem',
          }}>
            Please follow this advice as closely as you can and contact us immediately if
            something doesn&apos;t seem right. Don&apos;t take advice from friends or internet
            forums — each artist follows their own procedures. We are always here to help.
          </p>
        </AccordionItem>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <AccordionItem title="FAQ">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {[
              {
                q: 'Do you take walk-ins?',
                a: 'Yes — we will happily take walk-ins if we have time on the day. To guarantee your slot and give your artist time to prepare your design, we recommend booking in advance.',
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
                a: 'Neo-traditional is the foundation — bold outlines, rich colour, classic subject matter with a modern edge, and occasionally a sprinkle of camp humour. We also work in colour realism, fine line, and cover-up work. Not sure if your idea fits? Just ask.',
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
