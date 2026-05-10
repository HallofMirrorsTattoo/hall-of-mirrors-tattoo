import Link from 'next/link';
import Image from 'next/image';
import ShopCarousel from './components/ShopCarousel';
import ScrollGradientFade from './components/ScrollGradientFade';

export default function Home() {
  return (
    <div className="w-full">

      {/* ── HERO ─────────────────────────────────────────────────────────────────
          sticky + z-0  →  stays in the document flow (occupies 100vh of space)
          so it can NEVER appear below the content sections.
          Content sections have z-10 + solid bg so they scroll over and cover it.
      ─────────────────────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-0 w-full -mt-24 md:-mt-32"
        style={{ height: '100vh' }}
      >
        {/* Carousel images + gradient fade — fills the whole hero div */}
        <ShopCarousel />
        <ScrollGradientFade />

        {/* Logo overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-36 z-10 pointer-events-none">
          <div className="w-full flex flex-col items-center space-y-4 animate-fadeUp">
            <Image
              src="/assets/logos/White Logo.png"
              alt="Hall of Mirrors"
              width={200}
              height={200}
              className="w-32 md:w-48 h-32 md:h-48 object-contain animate-float"
              priority
            />
            <Image
              src="/assets/logos/White Logo Text.png"
              alt="Hall of Mirrors Tattoo Studio"
              width={400}
              height={100}
              className="w-48 md:w-96 h-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* CTA buttons + scroll indicator at the bottom of the hero */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-20 gap-4 pb-12 pointer-events-auto">
          <div
            className="flex gap-4 flex-col md:flex-row justify-center animate-fadeUp"
            style={{ animationDelay: '700ms' }}
          >
            <Link href="/booking" className="btn-primary group">
              <span>Book Appointment</span>
              <div className="btn-primary-icon">↗</div>
            </Link>
            <Link href="/consultation" className="btn-secondary">
              Free Consultation
            </Link>
          </div>

          <div className="animate-float" style={{ animationDelay: '1000ms' }}>
            <p className="text-sm text-primary-light/70 font-medium text-center">
              Scroll to explore
            </p>
            <div className="flex justify-center mt-2">
              <svg
                className="w-5 h-5 text-primary-light/60 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────────────
          z-10 + solid charcoal background.
          As the user scrolls, this block rises over the sticky hero, hiding it.
          The carousel can never bleed through because this div has a solid bg.
      ─────────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-10" style={{ backgroundColor: '#2a2a2a' }}>

        {/* Trust Indicators */}
        <section className="px-4 py-32">
          <div className="max-w-6xl mx-auto">
            <div className="card-premium">
              <div className="card-premium-inner">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="space-y-3">
                    <div className="text-accent-gold text-4xl font-serif font-bold">✓</div>
                    <h3 className="text-lg font-serif text-primary-light font-semibold">
                      Liverpool City Council
                    </h3>
                    <p className="text-primary-light/75 text-sm font-medium">
                      Registered & Licensed • Ref: A11394900
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="text-accent-gold text-4xl font-serif font-bold">✓</div>
                    <h3 className="text-lg font-serif text-primary-light font-semibold">
                      Health & Safety
                    </h3>
                    <p className="text-primary-light/75 text-sm font-medium">
                      Hepatitis B Vaccinated • Autoclave Certified
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="text-accent-gold text-4xl font-serif font-bold">✓</div>
                    <h3 className="text-lg font-serif text-primary-light font-semibold">
                      Expert Artist
                    </h3>
                    <p className="text-primary-light/75 text-sm font-medium">
                      Neo-Traditional Specialist • Bespoke Designs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Portfolio */}
        <section className="px-4 py-32">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-8 mb-16">
              <span className="eyebrow">Featured Designs</span>
              <h2 className="text-display-md md:text-[3.5rem] font-serif font-bold text-primary-light">
                Meticulously Crafted <br /> Timeless Works
              </h2>
              <p className="text-primary-light/80 max-w-2xl text-lg font-medium">
                Each piece is a collaboration between artist and client—a permanent reflection of
                vision, identity, and artistry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 auto-rows-[300px]">
              <div className="md:col-span-5 md:row-span-2 card-premium rounded-[2.5rem]">
                <div className="card-premium-inner rounded-[calc(2.5rem-0.375rem)] h-full flex items-center justify-center bg-gradient-to-br from-primary-dark/5 to-accent-gold/5">
                  <p className="text-primary-light/30 text-center">Portfolio Image 1</p>
                </div>
              </div>
              <div className="md:col-span-3 card-premium">
                <div className="card-premium-inner h-full flex items-center justify-center bg-gradient-to-br from-accent-gold/8 to-accent-gold/3">
                  <p className="text-primary-light/30 text-center">Portfolio Image 2</p>
                </div>
              </div>
              <div className="md:col-span-3 card-premium">
                <div className="card-premium-inner h-full flex items-center justify-center bg-gradient-to-br from-accent-teal/8 to-accent-teal/3">
                  <p className="text-primary-light/30 text-center">Portfolio Image 3</p>
                </div>
              </div>
              <div className="md:col-span-5 card-premium">
                <div className="card-premium-inner h-full flex items-center justify-center bg-gradient-to-br from-accent-plum/5 to-primary-dark/3">
                  <p className="text-primary-light/30 text-center">Portfolio Image 4</p>
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

        {/* Final CTA */}
        <section className="section-dark px-4 py-32">
          <div className="max-w-4xl mx-auto card-premium">
            <div className="card-premium-inner text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">
                  Ready to Begin?
                </h2>
                <p className="text-white/80 text-lg max-w-2xl mx-auto font-medium">
                  Start your consultation or book directly. Limited availability ensures
                  personalised attention.
                </p>
              </div>
              <div className="flex gap-4 justify-center flex-col md:flex-row pt-4">
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
        </section>

      </div>
    </div>
  );
}
