import Link from 'next/link';
import Image from 'next/image';
import LogoText from './components/LogoText';

export default function Home() {
  return (
    <div>
      {/* Hero Section - Logo First */}
      <section className="min-h-[100dvh] px-4 flex items-center justify-center relative overflow-hidden pattern-gold-accents">
        {/* Subtle gradient orb background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-dark/[0.02] rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-gold/[0.01] rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto w-full text-center space-y-8 relative z-10">
          {/* Logo Section - Animated */}
          <div className="space-y-8 animate-fadeUp" style={{ animationDelay: '0ms' }}>
            {/* Main Logo */}
            <div className="flex justify-center">
              <Image
                src="/assets/logos/HOMLOGO.png"
                alt="Hall of Mirrors"
                width={200}
                height={200}
                className="w-32 md:w-48 h-32 md:h-48 object-contain animate-fadeUp"
                style={{ animationDelay: '100ms' }}
                priority
              />
            </div>

            {/* Logo Text */}
            <div className="animate-fadeUp" style={{ animationDelay: '300ms' }}>
              <LogoText size="lg" className="mx-auto h-16 md:h-24" />
            </div>
          </div>

          {/* Tagline - Animated */}
          <div className="space-y-6 animate-fadeUp" style={{ animationDelay: '500ms' }}>
            <p className="text-xl md:text-2xl text-primary-dark/80 leading-relaxed font-light max-w-2xl mx-auto">
              Dark academia meets modern artistry. Bespoke tattoo designs crafted with meticulous attention to detail and timeless elegance.
            </p>
          </div>

          {/* CTA Buttons - Animated */}
          <div className="flex gap-4 flex-col md:flex-row justify-center pt-8 animate-fadeUp" style={{ animationDelay: '700ms' }}>
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

          {/* Scroll indicator */}
          <div className="pt-8 animate-float" style={{ animationDelay: '1000ms' }}>
            <p className="text-sm text-primary-dark/50 font-medium">Scroll to explore</p>
            <div className="flex justify-center mt-2">
              <svg className="w-5 h-5 text-primary-dark/40 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Premium Double Bezel */}
      <section className="px-4 py-32 bg-primary-light pattern-gold-accents">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="card-premium">
            <div className="card-premium-inner">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-3">
                  <div className="text-accent-gold text-4xl font-serif font-bold">✓</div>
                  <h3 className="text-lg font-serif text-primary-dark font-semibold">Liverpool City Council</h3>
                  <p className="text-primary-dark/75 text-sm font-medium">Registered & Licensed • Ref: A11394900</p>
                </div>
                <div className="space-y-3">
                  <div className="text-accent-gold text-4xl font-serif font-bold">✓</div>
                  <h3 className="text-lg font-serif text-primary-dark font-semibold">Health & Safety</h3>
                  <p className="text-primary-dark/75 text-sm font-medium">Hepatitis B Vaccinated • Autoclave Certified</p>
                </div>
                <div className="space-y-3">
                  <div className="text-accent-gold text-4xl font-serif font-bold">✓</div>
                  <h3 className="text-lg font-serif text-primary-dark font-semibold">Expert Artist</h3>
                  <p className="text-primary-dark/75 text-sm font-medium">Neo-Traditional Specialist • Bespoke Designs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Portfolio - Asymmetrical Bento */}
      <section className="px-4 py-32 bg-primary-light pattern-gold-accents">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="space-y-8 mb-16">
            <span className="eyebrow">Featured Designs</span>
            <h2 className="text-display-md md:text-[3.5rem] font-serif font-bold text-primary-dark">
              Meticulously Crafted <br /> Timeless Works
            </h2>
            <p className="text-primary-dark/80 max-w-2xl text-lg font-medium">
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
              <p className="text-white/80 text-lg max-w-2xl mx-auto font-medium">
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
