export default function Testimonials() {
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
      text: 'Best tattoo artist I\'ve worked with. Great attention to detail and really listened to what I wanted.',
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

  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif text-accent-gold mb-4">Client Reviews</h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl text-accent-gold font-semibold">{avgRating}</span>
          <span className="text-white/70">out of 5 stars ({reviews.length} reviews)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map(review => (
          <div key={review.id} className="glassmorphism p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{review.name}</h3>
                <p className="text-white/50 text-sm">{review.style}</p>
              </div>
              <div className="text-accent-gold">{'★'.repeat(review.rating)}</div>
            </div>
            <p className="text-white/80 mb-3">{review.text}</p>
            <p className="text-white/50 text-xs">
              {new Date(review.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-white/70">Your reviews help us improve. Share your experience!</p>
      </div>
    </div>
  );
}
