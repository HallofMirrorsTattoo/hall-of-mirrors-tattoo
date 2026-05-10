import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="min-h-[100dvh] pt-32 md:pt-40 px-4 flex items-center relative overflow-hidden">
        {/* Subtle gradient orb background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-dark/[0.02] rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-gold/[0.01] rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto w-full">
          <div className="space-y-8">
            <div className="space-y-6">
              <span className="eyebrow">Bespoke Tattoo Studio</span>
              <h1 className="text-display-xl md:text-[5.5rem] font-serif font-bold leading-[1.1] tracking-tighter text-primary-dark">
                Your Vision, <br />
                <span className="text-accent-gold">Permanently</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-primary-dark/70 leading-relaxed max-w-2xl font-light">
              Dark academia meets modern artistry. Bespoke tattoo designs crafted with meticulous attention to detail and timeless elegance.
            </p>
            <div className="flex gap-4 flex-col md:flex-row pt-4">
              <Link href="/booking" className="btn-primary group w-fit">
                <span>Book Appointment</span>
                <div className="btn-primary-icon">
                  ↗
                </div>
              </Link>
              <Link href="/consultation" className="btn-secondary w-fit">
                Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Premium Double Bezel */}
      <section className="px-4 py-32 bg-primary-light">
        <div className="max-w-6xl mx-auto">
          <div className="card-premium">
            <div className="card-premium-inner">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-3">
                  <div className="text-accent-gold text-4xl font-serif font-bold">✓</div>
                  <h3 className="text-lg font-serif text-primary-dark font-semibold">Liverpool City Council</h3>
                  <p className="text-primary-dark/60 text-sm">Registered & Licensed • Ref: A11394900</p>
                </div>
                <div className="space-y-3">
                  <div className="text-accent-gold text-4xl font-serif font-bold">✓</div>
                  <h3 className="text-lg font-serif text-primary-dark font-semibold">Health & Safety</h3>
                  <p className="text-primary-dark/60 text-sm">Hepatitis B Vaccinated • Autoclave Certified</p>
                </div>
                <div className="space-y-3">
                  <div className="text-accent-gold text-4xl font-serif font-bold">✓</div>
                  <h3 className="text-lg font-serif text-primary-dark font-semibold">Expert Artist</h3>
                  <p className="text-primary-dark/60 text-sm">Neo-Traditional Specialist • Bespoke Designs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Portfolio - Asymmetrical Bento */}
      <section className="px-4 py-32 bg-primary-light">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8 mb-16">
            <span className="eyebrow">Featured Designs</span>
            <h2 className="text-display-md md:text-[3.5rem] font-serif font-bold text-primary-dark">
              Meticulously Crafted <br /> Timeless Works
            </h2>
            <p className="text-primary-dark/70 max-w-2xl text-lg">
              Each piece is a collaboration between artist and client—a permanent reflection of vision, identity, and artistry.
            </p>
          </div>

          {/* Asymmetrical grid */}
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4 auto-rows-[300px]">
            <div className="md:col-span-5 md:row-span-2 card-premium rounded-[2.5rem]">
              <div className="card-premium-inner rounded-[calc(2.5rem-0.375rem)] h-full flex items-center justify-center bg-gradient-to-br from-primary-dark/5 to-accent-gold/5">
                <p className="text-primary-dark/30 text-center">Portfolio Image 1</p>
              </div>
            </div>

            <div className="md:col-span-3 card-premium">
              <div className="card-premium-inner h-full flex items-center justify-center bg-gradient-to-br from-accent-gold/8 to-accent-gold/3">
                <p className="text-primary-dark/30 text-center">Portfolio Image 2</p>
              </div>
            </div>

            <div className="md:col-span-3 card-premium">
              <div className="card-premium-inner h-full flex items-center justify-center bg-gradient-to-br from-accent-teal/8 to-accent-teal/3">
                <p className="text-primary-dark/30 text-center">Portfolio Image 3</p>
              </div>
            </div>

            <div className="md:col-span-5 card-premium">
              <div className="card-premium-inner h-full flex items-center justify-center bg-gradient-to-br from-accent-plum/5 to-primary-dark/3">
                <p className="text-primary-dark/30 text-center">Portfolio Image 4</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href="/portfolio" className="btn-secondary">
              View Complete Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final Section - Dark variant */}
      <section className="section-dark px-4 py-32">
        <div className="max-w-4xl mx-auto card-premium">
          <div className="card-premium-inner text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">
                Ready to Begin?
              </h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">
                Start your consultation or book directly. Limited availability ensures personalized attention.
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-col md:flex-row pt-4">
              <Link href="/booking" className="btn-primary group">
                <span>Book Appointment</span>
                <div className="btn-primary-icon">
                  ↗
                </div>
              </Link>
              <Link href="/consultation" className="btn-secondary">
                Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
