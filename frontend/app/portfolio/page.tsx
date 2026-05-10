import Link from 'next/link';

export default function Portfolio() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4" style={{ backgroundColor: '#2a2a2a' }}>
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <div className="space-y-4">
          <span className="eyebrow">The Work</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-light">
            Portfolio
          </h1>
          <p className="text-primary-light/70 max-w-xl">
            A curated selection of Robyn's work across neo-traditional, colour, and
            fine line styles.
          </p>
        </div>

        {/* Coming soon panel */}
        <div className="card-premium">
          <div className="card-premium-inner text-center py-16 space-y-6">
            <div className="text-accent-gold/30 text-6xl font-serif">✦</div>
            <h2 className="text-2xl font-serif font-semibold text-primary-light">
              Portfolio Coming Soon
            </h2>
            <p className="text-primary-light/60 max-w-md mx-auto">
              Robyn's portfolio images will be added here shortly. In the meantime,
              reach out directly or follow on Instagram to see recent work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link href="/booking" className="btn-primary group">
                <span>Book Appointment</span>
                <div className="btn-primary-icon">↗</div>
              </Link>
              <Link href="/consultation" className="btn-secondary">
                Free Consultation
              </Link>
            </div>
          </div>
        </div>

        {/* Style guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { style: 'Neo-Traditional', desc: 'Bold outlines, rich colour, classic subject matter reinterpreted with a modern edge.' },
            { style: 'Colour Realism', desc: 'Detailed, lifelike colour work with depth, shading, and vibrant palettes.' },
            { style: 'Fine Line', desc: 'Delicate, precise linework for minimalist and detailed illustrative pieces.' },
          ].map((s) => (
            <div key={s.style} className="card-premium">
              <div className="card-premium-inner space-y-2">
                <h3 className="font-serif font-semibold text-accent-gold">{s.style}</h3>
                <p className="text-primary-light/60 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
