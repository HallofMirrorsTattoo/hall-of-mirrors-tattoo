import Link from 'next/link';

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-primary py-20 md:py-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-serif text-accent-gold mb-6">
            Your Vision, Permanently
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Professional tattoo studio in Liverpool, specializing in neo-traditional and custom designs.
          </p>
          <Link href="/booking" className="btn-primary inline-block">
            Book Your Appointment
          </Link>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-4 border-b border-accent-gold/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-lg font-semibold text-accent-gold mb-2">Liverpool City Council Registered</h3>
              <p className="text-white/70 text-sm">Ref: A11394900</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-accent-gold mb-2">Hepatitis B Vaccinated</h3>
              <p className="text-white/70 text-sm">Professional health standards</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-accent-gold mb-2">Years of Experience</h3>
              <p className="text-white/70 text-sm">Expert artist specializing in neo-traditional</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Portfolio */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif text-accent-gold mb-4">Featured Work</h2>
            <p className="text-white/70">Placeholder gallery - to be populated with portfolio images</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-white/5 border border-accent-gold/20 rounded-lg flex items-center justify-center">
                <p className="text-white/50">Portfolio Image {i}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/portfolio" className="btn-secondary inline-block">
              View Full Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-darker py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-serif text-accent-gold mb-4">Ready to Get Inked?</h2>
          <p className="text-white/70 mb-8">
            Book your consultation or appointment today. Limited availability.
          </p>
          <div className="flex gap-4 justify-center flex-col md:flex-row">
            <Link href="/booking" className="btn-primary">
              Book Appointment
            </Link>
            <Link href="/consultation" className="btn-secondary">
              Free Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
