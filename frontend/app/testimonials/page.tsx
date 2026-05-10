import Link from 'next/link';

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
    <div className="min-h-screen pt-32 pb-20 px-4" style={{ backgroundColor: '#2a2a2a' }}>
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header */}
        <div className="space-y-4">
          <span className="eyebrow">Client Feedback</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-light">
            Reviews
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-3xl text-accent-gold font-serif font-bold">{avgRating}</span>
            <span className="text-primary-light/50 text-sm">
              out of 5 &nbsp;·&nbsp; {reviews.length} reviews
            </span>
          </div>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="card-premium">
              <div className="card-premium-inner space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-primary-light">{review.name}</p>
                    <p className="text-primary-light/50 text-xs">{review.style}</p>
                  </div>
                  <span className="text-accent-gold text-sm tracking-widest">
                    {'★'.repeat(review.rating)}
                  </span>
                </div>
                <p className="text-primary-light/75 text-sm leading-relaxed">{review.text}</p>
                <p className="text-primary-light/35 text-xs">
                  {new Date(review.date).toLocaleDateString('en-GB', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card-premium">
          <div className="card-premium-inner text-center space-y-4">
            <p className="text-primary-light/70">
              Had a great experience? We&apos;d love to hear from you.
            </p>
            <Link href="/booking" className="btn-primary group inline-flex">
              <span>Book Your Session</span>
              <div className="btn-primary-icon">↗</div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
