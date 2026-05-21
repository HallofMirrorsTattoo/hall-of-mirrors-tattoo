import type { Metadata } from 'next';
import Link from 'next/link';
import AnimatedSection from '@/app/components/AnimatedSection';

export const metadata: Metadata = {
  title: 'FAQ | Hall of Mirrors Tattoo Studio Liverpool',
  description: 'Frequently asked questions about Hall of Mirrors Tattoo Studio, Liverpool. Booking, pricing, consultations, cover-ups, and what to expect on the day.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com/faq',
  },
  openGraph: {
    title: 'FAQ | Hall of Mirrors Tattoo Studio Liverpool',
    description: 'Everything you need to know before booking at Hall of Mirrors Tattoo Studio, Castle Street Liverpool. Pricing, booking, consultations, and aftercare.',
    url: 'https://hallofmirrorstattoo.com/faq',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ | Hall of Mirrors Tattoo Studio Liverpool',
    description: 'Everything you need to know before booking at Hall of Mirrors, Liverpool.',
  },
};

const faqs = [
  {
    q: 'Do you take walk-ins?',
    a: 'No — Hall of Mirrors is appointment-only. Every session is booked in advance so your artist has time to prepare your design, and you get a dedicated private slot without any rush. Walk-ins don\'t give us the space to do our best work, so we don\'t offer them.',
  },
  {
    q: 'How much does a tattoo cost in Liverpool at Hall of Mirrors?',
    a: 'Pricing depends on size and complexity. Small tattoos (1–3") start from £150–£250. Medium work (3–6") typically runs £300–£500. Large or complex pieces — multi-session work, sleeves, detailed cover-ups — are quoted individually after your consultation. Cover-ups are always quoted in person. All prices include your custom design.',
  },
  {
    q: 'How far in advance do I need to book?',
    a: 'Availability varies — typically 2–6 weeks ahead, depending on the time of year. We recommend booking early, especially for larger pieces or if you have a specific date in mind. You can check availability and book directly through our online booking system.',
  },
  {
    q: 'What is a consultation and is it really free?',
    a: 'Yes, completely free and no obligation. A consultation is a relaxed conversation — in person or online — where we talk through your idea: what you\'re picturing, where you want it, approximate size, and what the design process will look like. Most clients start with a consultation before booking a session. It\'s how we make sure the final piece is exactly right.',
  },
  {
    q: 'Can you cover up an old tattoo?',
    a: 'Yes. Cover-up and rework is one of our specialities. Whether it\'s a name, a design that\'s lost its meaning, or simply work that wasn\'t quite right, we can assess what\'s possible. Cover-ups always require a consultation first — the existing ink affects what we can do — but the results can be transformative.',
  },
  {
    q: 'Do I need to pay a deposit?',
    a: 'Yes. A non-refundable deposit is required to secure your booking. This is deducted from your final session price on the day. Cancellations within 48 hours forfeit the deposit. We\'re a small studio and last-minute cancellations genuinely impact our artists — we appreciate you respecting their time.',
  },
  {
    q: 'What styles do you specialise in?',
    a: 'Neo-traditional is the foundation of our practice — bold outlines, rich colour, classic subject matter reinterpreted with a modern edge, and occasionally a sprinkle of camp humour. We also work in colour realism, fine line, and cover-up work. Everything here is bespoke: animals, ladies, timeless objects, pop culture, nostalgia, and more. Honestly, if you\'re not sure whether your idea fits — just ask. We\'ll tell you straight.',
  },
  {
    q: 'Where exactly are you located?',
    a: 'Hall of Mirrors Tattoo Studio, Suite 3, 34 Castle Street, Liverpool, L2 0NR — in the heart of the city centre, in the business district. A few minutes\' walk from Liverpool Central, Moorfields, and Lime Street stations. Paid parking on Castle Street and Water Street.',
  },
  {
    q: 'What do I need to bring on the day?',
    a: 'Wear — or bring — loose, comfortable clothing that gives easy access to the area being tattooed. Eat a proper meal beforehand (low blood sugar makes the session harder). Bring a valid photo ID if it\'s your first visit. You\'re welcome to bring a snack or drink for longer sessions. Leave the friends at home unless you\'ve arranged otherwise — our space is private and it\'s easier for your artist to work without an audience.',
  },
  {
    q: 'How do I prepare for my tattoo appointment?',
    a: 'Eat well before you arrive — a good meal a couple of hours beforehand makes a real difference. Stay hydrated. Avoid alcohol for 24 hours before your session. Moisturise the area to be tattooed in the days leading up to your appointment (but don\'t apply anything on the day). Avoid sunburn on the area. Come rested. The more comfortable you are, the better the session will go.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.a,
    },
  })),
};

export default function FAQ() {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Header */}
      <section className="px-6 pt-8 pb-16 md:pb-24">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <p className="eyebrow">Common Questions</p>
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
              FAQ
            </h1>
            <p style={{ maxWidth: '52ch' }}>
              Everything you probably want to know before getting in touch. If it&apos;s
              not here, just ask — there&apos;s no such thing as a silly question when it
              comes to something permanent.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ rows */}
      <section className="px-6 pb-24 md:pb-40">
        <div className="max-w-3xl mx-auto">
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {faqs.map((faq, i) => (
              <AnimatedSection
                key={i}
                delay={i * 60}
                style={{ borderBottom: '1px solid var(--border)', padding: '2rem 0' }}
              >
                <h2 style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)',
                  color: 'var(--cream)',
                  lineHeight: 1.3,
                  marginBottom: '1rem',
                }}>
                  {faq.q}
                </h2>
                <p style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.8,
                  color: 'var(--text-mid)',
                  maxWidth: '62ch',
                }}>
                  {faq.a}
                </p>
              </AnimatedSection>
            ))}
          </div>

          {/* CTA */}
          <AnimatedSection delay={300} className="mt-16 text-center">
            <p style={{ marginBottom: '1.5rem', maxWidth: '38ch', margin: '0 auto 1.5rem' }}>
              Still have a question? We&apos;d love to hear from you.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/booking" className="btn-primary">
                <span>Book Appointment</span>
                <span className="btn-icon" aria-hidden="true">↗</span>
              </Link>
              <Link href="/booking?mode=consultation" className="btn-secondary">
                Free Consultation
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
