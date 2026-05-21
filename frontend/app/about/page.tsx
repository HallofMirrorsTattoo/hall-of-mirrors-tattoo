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

function ParagraphDivider() {
  return (
    <div aria-hidden="true" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      margin: '1.75rem 0',
    }}>
      <div style={{ width: '2.5rem', height: '1px', background: 'rgba(201,168,76,0.2)' }} />
      <span style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontStyle: 'italic',
        fontSize: '0.75rem',
        color: 'rgba(201,168,76,0.35)',
        lineHeight: 1,
        letterSpacing: '0.1em',
      }}>
        ✦
      </span>
      <div style={{ width: '2.5rem', height: '1px', background: 'rgba(201,168,76,0.2)' }} />
    </div>
  );
}

const paraStyle: React.CSSProperties = {
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '1rem',
  color: 'var(--text-mid)',
  lineHeight: 1.85,
};

const subheadStyle: React.CSSProperties = {
  fontFamily: '"DM Mono", monospace',
  fontSize: '0.7rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.7)',
  marginBottom: '0.875rem',
  marginTop: '1.75rem',
};

const numberedItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.9375rem',
  color: 'var(--text-mid)',
  lineHeight: 1.75,
};

const numStyle: React.CSSProperties = {
  fontFamily: '"Cormorant Garamond", serif',
  fontStyle: 'italic',
  fontSize: '1.25rem',
  fontWeight: 300,
  color: 'rgba(201,168,76,0.5)',
  flexShrink: 0,
  lineHeight: 1.3,
  minWidth: '1.25rem',
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

      {/* ── HEADER + STUDIO PARAGRAPHS ─────────────────────────────── */}
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

        <p style={paraStyle}>
          Hall of Mirrors is a female-owned, private tattoo studio located at Suite 3, 34 Castle
          Street, Liverpool, L2 0NR. We are a fully inclusive space — a safe and welcoming home
          for everyone and we reserve the right to refuse services to those who do not align with
          our principles.
        </p>

        <ParagraphDivider />

        <p style={paraStyle}>
          Fully licensed by Liverpool City Council. We will happily accept Walk-ins if we have
          time on the day.
        </p>

        <ParagraphDivider />

        <p style={paraStyle}>
          Every piece here is drawn from scratch — custom work built entirely around your story,
          your references, and your vision. There are no off-the-shelf designs and no compromises.
          Just the time, the space, and the skill to make something that is entirely yours.
        </p>

        <ParagraphDivider />

        <p style={paraStyle}>
          We understand that tattooing is a luxury service and your needs are the priority, we
          pride ourselves on our ability to listen and cater to your vision. We will always give
          our honest opinion artistically and practically, and we will make suggestions in your
          best interests so that you will have the best possible tattoo.
        </p>
      </section>

      {/* ── ACCORDION SECTIONS ─────────────────────────────────────── */}
      <section style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem 3rem', borderTop: '1px solid var(--border)' }}>

        {/* HOW TO FIND US */}
        <AccordionItem title="How to Find Us">
          <p style={{ ...paraStyle, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
            We are at{' '}
            <strong style={{ color: 'var(--cream)', fontWeight: 500 }}>
              Hall of Mirrors Tattoo Studio, Suite 3, 34 Castle Street, Liverpool, L2 0NR
            </strong>{' '}
            — in the heart of the city centre, in the business district.
          </p>

          <p style={subheadStyle as React.CSSProperties}>Nearest stations</p>
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

          <p style={{ ...paraStyle, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
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

        {/* PRE-APPOINTMENT PREP */}
        <AccordionItem title="Pre-Appointment Prep">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              'Be well rested before getting tattooed. The experience may be more difficult if you are tired.',
              'Please avoid drugs and alcohol the night before the appointment. Alcohol thins the blood and can cause issues during the process.',
              'Make sure you eat before your appointment, so your body can have the energy it needs to get you through. Bring some chocolate or fruits with you on the day to keep your energy levels up.',
              'Bring water. Make sure you are well hydrated.',
              "Avoid sunbeds for a few weeks prior to your appointment and regularly moisturise your skin. It's easier to tattoo a well hydrated skin and the result will be better.",
            ].map((item, i) => (
              <div key={i} style={numberedItemStyle}>
                <span style={numStyle}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-mid)', lineHeight: 1.75 }}>{item}</p>
              </div>
            ))}
          </div>
        </AccordionItem>

        {/* DAY OF THE APPOINTMENT */}
        <AccordionItem title="Day of the Appointment">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={numberedItemStyle}>
              <span style={numStyle}>1</span>
              <p style={{ margin: 0, fontSize: '0.9375rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                Take a shower before your appointment to wash away any extra bacteria. Please do
                not shave the area — your artist prefers to shave the area for you, less chance of
                post-shave irritation. If you have long body hair, you may trim the area but
                please leave the shaving to your artist.
              </p>
            </div>
            <div style={numberedItemStyle}>
              <span style={numStyle}>2</span>
              <p style={{ margin: 0, fontSize: '0.9375rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                Please wear comfortable clothes which allow easy access to the area being tattooed
                (you may get changed at the studio) and don&apos;t wear anything that you
                aren&apos;t prepared to get ink on — accidents can happen.
              </p>
            </div>
            <p style={{ ...paraStyle, fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              If you need to take a break, or stop for food/drink during your appointment, this is
              completely fine. If you feel unwell at any point during your appointment, please do
              communicate with your artist. They are here for you.
            </p>
          </div>
        </AccordionItem>

        {/* AFTERCARE ADVICE */}
        <AccordionItem title="Aftercare Advice">

          <p style={{ ...paraStyle, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
            If your tattoo artist has used Secondskin adhesive:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
            <div style={numberedItemStyle}>
              <span style={numStyle}>1</span>
              <p style={{ margin: 0, fontSize: '0.9375rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                Your artist will cover your tattoo and give you a second piece of Secondskin to
                take home with you. They will show you how to apply the second piece yourself at
                home.
              </p>
            </div>
            <div style={numberedItemStyle}>
              <span style={numStyle}>2</span>
              <p style={{ margin: 0, fontSize: '0.9375rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                In the first 12 hours after you&apos;ve been tattooed, the area will be quite
                swollen and your skin will be expelling excess blood and plasma. There will likely
                be some goop underneath the Secondskin — this is perfectly normal. Just try to let
                it be and wear loose clothing.
              </p>
            </div>
            <div style={numberedItemStyle}>
              <span style={numStyle}>3</span>
              <p style={{ margin: 0, fontSize: '0.9375rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                Avoid showering immediately after your appointment as this may cause the adhesive
                to soften and the Secondskin to come off.
              </p>
            </div>
          </div>

          <p style={{ ...subheadStyle, marginTop: 0 } as React.CSSProperties}>
            What to do if your Secondskin comes off prematurely
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
            {[
              'If the Secondskin comes off prematurely, wash the area and pat dry with a paper towel.',
              'Apply the second piece your artist provided to the dry area within 5–10 minutes (leave a generous border).',
              'Do not apply the Secondskin if your tattoo has had contact with the open air for longer than 20 minutes as this changes the practice of wet healing.',
              "If you aren't able to apply your Secondskin within 20 minutes, discard it and allow the tattoo to completely dry out. Clean and moisturise as many times as your artist suggested.",
            ].map((item, i) => (
              <div key={i} style={numberedItemStyle}>
                <span style={numStyle}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-mid)', lineHeight: 1.75 }}>{item}</p>
              </div>
            ))}
          </div>

          <p style={{ ...subheadStyle, marginTop: 0 } as React.CSSProperties}>
            Removing the Secondskin
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
            {[
              'Ideally you will shower when you wake up the following day and (very gently) peel the adhesive off as the lukewarm water trickles over the area.',
              'Gently wash the tattoo in the shower with anti-bacterial soap and pat dry with a clean paper towel.',
              'Apply the second piece your artist provided to the dry area within 5–10 minutes (leave a generous border). Leave this piece on for 2–4 days — the longer it stays on the better.',
              "If it starts to peel off and there is an entrance point to the tattoo, remove the whole thing. We wouldn't want bacteria to be able to get in and not get out.",
              'After a few days you can remove the Secondskin, wash/dry/moisturise as normal. During the healing process the new skin is healing over the tattoo so your tattoo will appear more muted until fully healed. Allow 2–3 weeks until you see the full finished result.',
            ].map((item, i) => (
              <div key={i} style={numberedItemStyle}>
                <span style={numStyle}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-mid)', lineHeight: 1.75 }}>{item}</p>
              </div>
            ))}
          </div>

          <p style={{ ...subheadStyle, marginTop: 0 } as React.CSSProperties}>
            What to avoid during the healing process (2–3 weeks)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
            {[
              'Do not go swimming for at least three weeks — chlorinated water will react badly with your tattoo. Avoid hot tubs, saunas or steam rooms.',
              'Avoid sunbathing and tanning beds for at least three weeks and after that use sunscreen to keep your tattoo in good condition.',
              'Avoid going to the gym or doing activities that are going to make you sweat whilst the tattoo is still healing.',
              'Do not allow your pet to have direct contact with your tattoo — tattoos are open wounds and pet hairs can contaminate the tattoo and risk infection.',
            ].map((item, i) => (
              <div key={i} style={numberedItemStyle}>
                <span style={numStyle}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontFamily: '"DM Sans", sans-serif', color: 'var(--text-mid)', lineHeight: 1.75 }}>{item}</p>
              </div>
            ))}
          </div>

          <p style={{ ...subheadStyle, marginTop: 0 } as React.CSSProperties}>Anything else</p>
          <p style={{ ...paraStyle, fontSize: '0.9375rem' }}>
            Please follow the aftercare advice to the best of your ability and contact us
            immediately if something doesn&apos;t seem right. Please don&apos;t take advice from
            your friends or internet forums — each tattooist follows their own procedures and
            aftercare routines to obtain the best results regarding their work. Ultimately please
            communicate with us if there is anything you feel unsure about. We are here to help.
          </p>
        </AccordionItem>

        {/* FAQ */}
        <AccordionItem title="FAQ">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {[
              {
                q: 'Do you take walk-ins?',
                a: 'Yes — we will happily take walk-ins if we have time on the day. To guarantee your slot and give your artist time to prepare your bespoke design, we recommend booking in advance.',
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
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                  {a}
                </p>
              </div>
            ))}
          </div>
        </AccordionItem>

      </section>

      {/* ── CTA BUTTONS ────────────────────────────────────────────── */}
      <section style={{
        maxWidth: '48rem',
        margin: '0 auto',
        padding: '0 1.5rem 6rem',
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <Link href="/booking" className="btn-primary">
          <span>Book Appointment</span>
          <span className="btn-icon" aria-hidden="true">↗</span>
        </Link>
        <Link href="/portfolio" className="btn-secondary">Meet Our Artists</Link>
      </section>

    </div>
  );
}
