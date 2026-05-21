import Link from 'next/link';
import Image from 'next/image';
import ShopCarousel from './components/ShopCarousel';
import AnimatedSection from './components/AnimatedSection';

export const metadata = {
  title: 'Hall of Mirrors Tattoo Studio | Liverpool City Centre',
  description: 'Hall of Mirrors is a private tattoo studio on Castle Street, Liverpool. Specialising in neo-traditional tattoos, custom bespoke designs, colour realism, and cover-up work. Book online.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com',
  },
  openGraph: {
    title: 'Hall of Mirrors Tattoo Studio | Liverpool',
    description: 'Bespoke neo-traditional tattoos in Liverpool city centre. Book online.',
    url: 'https://hallofmirrorstattoo.com',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website' as const,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Hall of Mirrors Tattoo Studio | Liverpool City Centre',
    description: 'Bespoke neo-traditional tattoos in Liverpool city centre. Book online.',
  },
};

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'TattooShop'],
  name: 'Hall of Mirrors Tattoo Studio',
  description: 'Bespoke neo-traditional tattoos. Private studio on Castle Street, Liverpool city centre.',
  url: 'https://hallofmirrorstattoo.com',
  email: 'studio@hallofmirrorstattoo.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Suite 3, 34 Castle Street',
    addressLocality: 'Liverpool',
    postalCode: 'L2 0NR',
    addressCountry: 'GB',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 53.4068,
    longitude: -2.9934,
  },
  openingHours: ['Mo-Sa 10:00-18:00'],
  priceRange: '££',
  image: 'https://hallofmirrorstattoo.com/opengraph-image.png',
};

const imgFilter = 'brightness(0.87) contrast(1.06) saturate(0.72) sepia(0.08)';

export default function Home() {
  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-0 w-full -mt-24 md:-mt-32" style={{ height: '100dvh' }}>
        <ShopCarousel />

        {/* Large atmospheric watermark text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" aria-hidden="true">
          <span style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 'clamp(5rem, 18vw, 18rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '-0.03em',
            color: 'rgba(201, 168, 76, 0.045)',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}>
            Hall of Mirrors
          </span>
        </div>

        {/* Logo + studio name */}
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-36 md:pt-44 z-20 pointer-events-none">
          <div
            className="flex flex-col items-center gap-5"
            style={{ animation: 'fadeUp 1.1s cubic-bezier(0.32,0.72,0,1) forwards' }}
          >
            {/* Glow ring behind logo */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute"
                style={{
                  inset: '-2rem',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(201,168,76,0.22) 0%, transparent 70%)',
                  animation: 'pulseGlow 5s ease-in-out infinite',
                }}
                aria-hidden="true"
              />
              <Image
                src="/assets/logos/White Logo.png"
                alt="Hall of Mirrors"
                width={200}
                height={200}
                className="relative"
                style={{
                  width: 'clamp(6rem, 14vw, 10rem)',
                  height: 'auto',
                  filter: 'drop-shadow(0 0 24px rgba(201,168,76,0.28))',
                }}
                priority
              />
            </div>

            <Image
              src="/assets/logos/White Logo Text.png"
              alt="Hall of Mirrors Tattoo Studio"
              width={420}
              height={100}
              style={{ width: 'clamp(11rem, 30vw, 22rem)', height: 'auto', opacity: 0.9 }}
              priority
            />

            <p style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              color: 'rgba(201,168,76,0.65)',
              letterSpacing: '0.18em',
              animation: 'fadeUp 1.1s cubic-bezier(0.32,0.72,0,1) 0.3s both',
            }}>
              Neo-Traditional Artistry · Liverpool
            </p>
          </div>
        </div>

        {/* CTAs + scroll indicator */}
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-20 pb-14 gap-6 pointer-events-auto"
          style={{ animation: 'fadeUp 1.1s cubic-bezier(0.32,0.72,0,1) 0.6s both' }}
        >
          <div className="flex justify-center">
            <Link href="/booking" className="btn-primary">
              <span>Book Appointment</span>
              <span className="btn-icon" aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2" style={{ animation: 'float 6s ease-in-out 1.5s infinite' }}>
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(242,237,224,0.35)',
            }}>
              Scroll to explore
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M4 9l4 4 4-4" stroke="rgba(201,168,76,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── SCROLLING CONTENT ───────────────────────────────────────────────── */}
      <div className="relative z-10" style={{ backgroundColor: 'var(--bg)' }}>

        {/* Section 1 — Hello */}
        <section style={{ padding: '10rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '52rem', margin: '0 auto' }}>
            <AnimatedSection>
              <p className="eyebrow" style={{ marginBottom: '2rem' }}>Hall of Mirrors · Liverpool</p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(3.25rem, 9vw, 7.5rem)',
                color: 'var(--cream)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}>
                Hello, and thank you<br />for being here.
              </h2>
            </AnimatedSection>
          </div>
        </section>

        {/* Section 2 — We believe */}
        <section style={{ padding: '8rem 1.5rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
              <AnimatedSection>
                <p className="eyebrow" style={{ marginBottom: '1.5rem' }}>The Studio</p>
                <h2 style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                  color: 'var(--cream)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginBottom: '1.75rem',
                }}>
                  &ldquo;We believe in the telling<br />of your story.&rdquo;
                </h2>
                <p style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                  lineHeight: 1.9,
                  color: 'var(--text-mid)',
                  maxWidth: '40ch',
                }}>
                  To us, tattoos are a way of recording one&apos;s history, celebrating your own identity and letting the world see.
                </p>
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: '1rem', overflow: 'hidden' }}>
                  <Image
                    src="/assets/shop-carousel/DSCF4202.jpg"
                    alt="Hall of Mirrors Tattoo Studio, Liverpool"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    style={{ filter: imgFilter }}
                    quality={90}
                  />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '1rem', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.18)', pointerEvents: 'none' }} aria-hidden="true" />
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Section 3 — The Metaphor */}
        <section style={{ padding: '9rem 1.5rem 11rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '52rem', margin: '0 auto' }}>
            <AnimatedSection delay={0}>
              <p className="eyebrow" style={{ marginBottom: '2.5rem' }}>The name</p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                color: 'var(--cream)',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                marginBottom: '1.5rem',
              }}>
                &ldquo;When you walk through a hall of mirrors,<br />you can see a hundred versions of yourself —&rdquo;
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                color: 'var(--cream)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                opacity: 0.7,
                marginBottom: '1.5rem',
              }}>
                &ldquo;different shapes and angles.&rdquo;
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={400}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                color: 'var(--cream)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: '2rem',
              }}>
                &ldquo;But which is the truest?&rdquo;
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={600}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(3rem, 8vw, 6.5rem)',
                color: 'var(--gold)',
                lineHeight: 1.0,
                letterSpacing: '-0.025em',
              }}>
                Only you can decide.
              </h2>
            </AnimatedSection>
          </div>
        </section>

        {/* Section 4 — Self-determination (full-bleed photo) */}
        <section style={{ position: 'relative', overflow: 'hidden', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
          <Image
            src="/assets/shop-carousel/E-DSCF3046.jpg"
            alt="Hall of Mirrors Tattoo Studio"
            fill
            sizes="100vw"
            className="object-cover"
            style={{ filter: imgFilter }}
            quality={90}
          />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(14,12,9,0.76)' }} aria-hidden="true" />
          <div style={{ position: 'relative', zIndex: 10, maxWidth: '48rem', margin: '0 auto', padding: '8rem 1.5rem', textAlign: 'center', width: '100%' }}>
            <AnimatedSection delay={0}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4.5vw, 4rem)',
                color: 'var(--cream)',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                marginBottom: '1.25rem',
              }}>
                &ldquo;It is you who gets to decide<br />which reflection is your reality —&rdquo;
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4.5vw, 4rem)',
                color: 'var(--cream)',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                opacity: 0.75,
                marginBottom: '1.25rem',
              }}>
                &ldquo;and it is you who gets to morph<br />and alter your reality as and when you wish,&rdquo;
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={400}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4.5vw, 4rem)',
                color: 'var(--gold)',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
              }}>
                &ldquo;without anyone&apos;s permission.&rdquo;
              </h2>
            </AnimatedSection>
          </div>
        </section>

        {/* Section 5 — Tattoos as armour */}
        <section style={{ padding: '9rem 1.5rem 10rem' }}>
          <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
            <AnimatedSection delay={0}>
              <p className="eyebrow" style={{ marginBottom: '2rem' }}>What they are</p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(3rem, 7vw, 6rem)',
                color: 'var(--cream)',
                lineHeight: 1.0,
                letterSpacing: '-0.025em',
                marginBottom: '1.5rem',
              }}>
                Tattoos can be armour.
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                color: 'var(--cream)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                opacity: 0.75,
                paddingLeft: 'clamp(1.5rem, 5vw, 4rem)',
                marginBottom: '1.25rem',
              }}>
                A way to feel secure in our own sense of identity.
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={400}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                color: 'var(--cream)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                opacity: 0.9,
                paddingLeft: 'clamp(1.5rem, 5vw, 4rem)',
              }}>
                A playful and beautifully permanent way<br />to bring who we are to the surface.
              </h2>
            </AnimatedSection>
          </div>
        </section>

        {/* Section 6 — Photo strip */}
        <section style={{ padding: '4rem 1.5rem 6rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { src: '/assets/shop-carousel/DSCF4137.jpg', delay: 0 },
                { src: '/assets/shop-carousel/DSCF4160.jpg', delay: 150 },
                { src: '/assets/shop-carousel/DSCF4185.jpg', delay: 300 },
              ] as const).map(({ src, delay }) => (
                <AnimatedSection key={src} delay={delay}>
                  <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <Image
                      src={src}
                      alt="Hall of Mirrors Tattoo Studio — Liverpool"
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      style={{ filter: imgFilter }}
                      quality={85}
                    />
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7 — The Promise */}
        <section style={{ padding: '9rem 1.5rem 10rem', textAlign: 'center' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
            <AnimatedSection delay={0}>
              <p className="eyebrow" style={{ marginBottom: '2.5rem' }}>The promise</p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4.5vw, 3.75rem)',
                color: 'var(--cream)',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                marginBottom: '1.25rem',
              }}>
                &ldquo;When you visit Hall of Mirrors, I hope you embrace every version of yourself you&apos;ve been,&rdquo;
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={300}>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4.5vw, 3.75rem)',
                color: 'var(--cream)',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                marginBottom: '2rem',
              }}>
                &ldquo;so you can evolve into who you&apos;re next becoming.&rdquo;
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={500}>
              <p style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '1.1rem',
                lineHeight: 1.9,
                color: 'var(--text-mid)',
                maxWidth: '42ch',
                margin: '0 auto',
              }}>
                We will do everything in our power to make your experience beautiful.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Section 8 — Meet Robyn */}
        <section style={{ padding: '9rem 1.5rem 10rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
              <AnimatedSection delay={0}>
                <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: '1rem', overflow: 'hidden' }}>
                  <Image
                    src="/assets/shop-carousel/E-DSCF3032.jpg"
                    alt="Robyn Clove — Hall of Mirrors Tattoo Studio, Liverpool"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    style={{ filter: imgFilter }}
                    quality={90}
                  />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '1rem', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.18)', pointerEvents: 'none' }} aria-hidden="true" />
                </div>
              </AnimatedSection>
              <div>
                <AnimatedSection delay={150}>
                  <p className="eyebrow" style={{ marginBottom: '1.5rem' }}>The artist</p>
                  <h2 style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                    color: 'var(--cream)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    marginBottom: '1.5rem',
                  }}>
                    My name is Robyn Clove.
                  </h2>
                  <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                    lineHeight: 2,
                    color: 'var(--text-mid)',
                    marginBottom: '1rem',
                  }}>
                    Neo-traditional at its core — with the occasional sprinkle of camp humour.
                  </p>
                  <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                    lineHeight: 2,
                    color: 'var(--text-mid)',
                    marginBottom: '1rem',
                  }}>
                    I have always had a huge love for the LGBTQ community — people living dynamically and unapologetically inspires me creatively.
                  </p>
                  <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                    lineHeight: 2,
                    color: 'var(--text-mid)',
                    marginBottom: '1.5rem',
                  }}>
                    I love to tattoo animals, ladies, timeless objects, pop culture and nostalgia.
                  </p>
                  <p style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    color: 'var(--cream)',
                    marginBottom: '0.5rem',
                  }}>
                    Part time poet. Full time cat mother.
                  </p>
                  <p style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                    color: 'var(--gold)',
                    marginBottom: '2.5rem',
                  }}>
                    I would love to tattoo you.
                  </p>
                </AnimatedSection>
                <AnimatedSection delay={400}>
                  <Link href="/booking" className="btn-primary">
                    <span>Book Appointment</span>
                    <span className="btn-icon" aria-hidden="true">↗</span>
                  </Link>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </section>

        {/* Section 9 — Credentials strip */}
        <section style={{
          padding: '2rem 1.5rem',
          borderTop: '1px solid rgba(201,168,76,0.12)',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--text-low)',
          }}>
            Licensed · Liverpool City Council · Suite 3, 34 Castle Street · Appointment Only
          </p>
        </section>

      </div>
    </div>
  );
}
