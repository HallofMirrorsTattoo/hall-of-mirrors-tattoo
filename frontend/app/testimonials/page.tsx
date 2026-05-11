import Link from 'next/link';
import AnimatedSection from '../components/AnimatedSection';

const reviews = [
  {
    id: 1,
    name: 'Sarah H.',
    rating: 5,
    text: 'Amazing experience from start to finish. Robyn was professional, friendly, and the quality of the work is outstanding.',
    style: 'Neo-Traditional',
    date: '2026-04-15',
  },
  {
    id: 2,
    name: 'James M.',
    rating: 5,
    text: "Best tattoo artist I've worked with. Great attention to detail and really listened to what I wanted.",
    style: 'Black & Grey',
    date: '2026-03-20',
  },
  {
    id: 3,
    name: 'Emma T.',
    rating: 5,
    text: 'The studio is clean and professional. Robyn made me feel comfortable despite being nervous about my first tattoo.',
    style: 'Realism',
    date: '2026-02-10',
  },
];

export default function Testimonials() {
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        <AnimatedSection className="mb-16">
          <p className="eyebrow">Client Feedback</p>
          <h1 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(3rem, 7vw, 5rem)',
            color: 'var(--cream)',
            letterSpacing: '-0.025em',
            lineHeight: 1.0,
            marginBottom: '1.25rem',
          }}>
            Reviews
          </h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '2rem', fontWeight: 400, color: 'var(--gold)', lineHeight: 1 }}>
              {avgRating}
            </span>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
              out of 5 &nbsp;·&nbsp; {reviews.length} reviews
            </span>
          </div>
        </AnimatedSection>

        {/* Review rows — editorial, not cards */}
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {reviews.map((review, i) => (
            <AnimatedSection
              key={review.id}
              delay={i * 80}
              style={{ borderBottom: '1px solid var(--border)', padding: '2rem 0' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem', gap: '1rem' }}>
                <div>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.125rem', fontWeight: 400, color: 'var(--cream)', lineHeight: 1.3, marginBottom: '0.25rem', maxWidth: 'none' }}>
                    {review.name}
                  </p>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)', maxWidth: 'none' }}>
                    {review.style}
                  </p>
                </div>
                <span style={{ color: 'var(--gold)', fontSize: '0.875rem', letterSpacing: '0.15em', flexShrink: 0 }}>
                  {'★'.repeat(review.rating)}
                </span>
              </div>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.75, maxWidth: '56ch', marginBottom: '0.875rem' }}>
                {review.text}
              </p>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--text-low)', maxWidth: 'none' }}>
                {new Date(review.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </p>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={300} className="mt-16 text-center">
          <p style={{ marginBottom: '1.5rem', maxWidth: '36ch', margin: '0 auto 1.5rem' }}>
            Had a great experience? We&apos;d love to hear from you.
          </p>
          <Link href="/booking" className="btn-primary inline-flex">
            <span>Book Your Session</span>
            <span className="btn-icon" aria-hidden="true">↗</span>
          </Link>
        </AnimatedSection>

      </div>
    </div>
  );
}
