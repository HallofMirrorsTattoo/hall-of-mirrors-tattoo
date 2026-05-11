import Link from 'next/link';
import Image from 'next/image';
import ShopCarousel from './components/ShopCarousel';
import AnimatedSection from './components/AnimatedSection';

const cornerStyles: Record<string, string> = {
  'top-6 left-6':     '1px 0 0 1px',
  'top-6 right-6':    '1px 1px 0 0',
  'bottom-6 left-6':  '0 0 1px 1px',
  'bottom-6 right-6': '0 1px 1px 0',
};

export default function Home() {
  return (
    <div className="w-full">

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
          <div className="flex gap-3 flex-col md:flex-row justify-center">
            <Link href="/booking" className="btn-primary">
              <span>Book Appointment</span>
              <span className="btn-icon" aria-hidden="true">↗</span>
            </Link>
            <Link href="/consultation" className="btn-secondary">
              Free Consultation
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2" style={{ animation: 'float 6s ease-in-out 1.5s infinite' }}>
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.625rem',
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
      <div className="relative z-10" style={{ backgroundColor: '#0E0C09' }}>

        {/* ── CREDENTIALS STRIP ─────────────────────────────────────────────── */}
        <section className="px-0 py-0" style={{ borderTop: '1px solid rgba(201,168,76,0.12)', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {([
                { label: 'Licensed',        title: 'Liverpool City Council', detail: 'Ref: A11394900' },
                { label: 'Health & Safety', title: 'Autoclave Certified',    detail: 'Hepatitis B Vaccinated' },
                { label: 'Specialist',      title: 'Neo-Traditional',        detail: 'Bespoke Designs' },
              ] as const).map((item, i) => (
                <AnimatedSection
                  key={item.label}
                  delay={i * 120}
                  className={`py-8 px-8 text-center${i < 2 ? ' md:border-r' : ''}`}
                  style={{ borderColor: 'rgba(201,168,76,0.12)' }}
                >
                  <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>{item.label}</p>
                  <p style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '1.2rem',
                    fontWeight: 400,
                    color: 'var(--cream)',
                    lineHeight: 1.3,
                    marginBottom: '0.25rem',
                    maxWidth: 'none',
                  }}>
                    {item.title}
                  </p>
                  <p style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '0.625rem',
                    letterSpacing: '0.12em',
                    color: 'var(--text-low)',
                    maxWidth: 'none',
                  }}>
                    {item.detail}
                  </p>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── PORTFOLIO ─────────────────────────────────────────────────────── */}
        <section className="px-6 py-28 md:py-40">
          <div className="max-w-6xl mx-auto">

            <AnimatedSection className="mb-16 md:mb-20">
              <p className="eyebrow">The Work</p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 300,
                color: 'var(--cream)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                marginBottom: '1.25rem',
              }}>
                Every mark<br />tells a story
              </h2>
              <p style={{ maxWidth: '42ch' }}>
                Each piece is a collaboration — a permanent reflection of vision,
                identity, and artistry. No two are alike.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-8 gap-3" style={{ gridAutoRows: '280px' }}>

              <AnimatedSection delay={0} className="md:col-span-5 md:row-span-2 card-premium group cursor-pointer" style={{ gridRow: 'span 2' }}>
                <div className="card-premium-inner h-full flex flex-col justify-end p-8" style={{ background: 'linear-gradient(135deg, rgba(29,26,21,0.8) 0%, rgba(14,12,9,0.6) 100%)' }}>
                  <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '5rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(201,168,76,0.06)', userSelect: 'none' }}>
                      Portfolio
                    </span>
                  </div>
                  <div className="relative z-10">
                    <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Featured Work</p>
                    <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: 'rgba(242,237,224,0.5)', maxWidth: 'none' }}>
                      Full-colour neo-traditional · Sleeve work
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.3)' }} aria-hidden="true" />
                </div>
              </AnimatedSection>

              <AnimatedSection delay={100} className="md:col-span-3 card-premium group cursor-pointer">
                <div className="card-premium-inner h-full flex flex-col justify-end p-6" style={{ background: 'linear-gradient(225deg, rgba(201,168,76,0.06) 0%, rgba(14,12,9,0.4) 100%)' }}>
                  <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '3rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(201,168,76,0.08)' }}>II</span>
                  </div>
                  <div className="relative z-10">
                    <p className="eyebrow" style={{ marginBottom: '0.25rem' }}>Detail Work</p>
                    <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: 'rgba(242,237,224,0.45)', maxWidth: 'none' }}>Fine-line botanical</p>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={200} className="md:col-span-3 card-premium group cursor-pointer">
                <div className="card-premium-inner h-full flex flex-col justify-end p-6" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, rgba(29,26,21,0.5) 100%)' }}>
                  <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '3rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(201,168,76,0.08)' }}>III</span>
                  </div>
                  <div className="relative z-10">
                    <p className="eyebrow" style={{ marginBottom: '0.25rem' }}>Colour Work</p>
                    <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: 'rgba(242,237,224,0.45)', maxWidth: 'none' }}>Neo-traditional portrait</p>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={150} className="md:col-span-5 card-premium group cursor-pointer">
                <div className="card-premium-inner h-full flex flex-col justify-end p-6" style={{ background: 'linear-gradient(160deg, rgba(29,26,21,0.6) 0%, rgba(201,168,76,0.04) 100%)' }}>
                  <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '3rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(201,168,76,0.08)' }}>IV</span>
                  </div>
                  <div className="relative z-10">
                    <p className="eyebrow" style={{ marginBottom: '0.25rem' }}>Black & Grey</p>
                    <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: 'rgba(242,237,224,0.45)', maxWidth: 'none' }}>Ornamental · Geometric</p>
                  </div>
                </div>
              </AnimatedSection>

            </div>

            <AnimatedSection delay={200} className="text-center mt-12">
              <Link href="/portfolio" className="btn-secondary">View Complete Portfolio</Link>
            </AnimatedSection>

          </div>
        </section>

        {/* HOM Divider */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="section-divider">
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
          </div>
        </div>

        {/* ── THE ARTIST ─────────────────────────────────────────────────────── */}
        <section className="px-6 py-28 md:py-40">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">

              <AnimatedSection>
                <p className="eyebrow">The Artist</p>
                <h2 style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  color: 'var(--cream)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginBottom: '1.5rem',
                }}>
                  Robyn creates work<br />that lasts lifetimes
                </h2>
                <p style={{ marginBottom: '1.25rem' }}>
                  Based in the heart of Liverpool&apos;s Castle Street, Hall of Mirrors is a
                  private studio specialising in neo-traditional tattooing — bold lines,
                  rich colour palettes, and timeless imagery drawn from art history,
                  natural forms, and personal narrative.
                </p>
                <p>
                  Every piece begins with a conversation. Robyn works closely with each
                  client to understand their vision before a single line is drawn, ensuring
                  the result is something truly personal and enduring.
                </p>

                <div className="flex gap-10 mt-10">
                  {([
                    { num: '8+',    label: 'Years Experience' },
                    { num: '100%',  label: 'Custom Designs' },
                    { num: '1:1',   label: 'Consultation' },
                  ] as const).map((s) => (
                    <div key={s.label}>
                      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 400, color: 'var(--gold)', lineHeight: 1, marginBottom: '0.25rem' }}>
                        {s.num}
                      </p>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)', maxWidth: 'none' }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Link href="/about" className="btn-secondary">About the Studio</Link>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                {/* Artist/studio image — replace with real photo */}
                <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '4/5', background: 'linear-gradient(160deg, #1D1A15 0%, #0E0C09 100%)' }}>
                  {/* Mirror frame ornament */}
                  <div className="absolute rounded-xl" style={{ inset: '1.5rem', border: '1px solid rgba(201,168,76,0.15)' }} aria-hidden="true" />
                  <div className="absolute rounded-lg" style={{ inset: '2.5rem', border: '1px solid rgba(201,168,76,0.07)' }} aria-hidden="true" />

                  {/* Corner accents */}
                  {Object.entries(cornerStyles).map(([pos, bw]) => (
                    <div
                      key={pos}
                      className={`absolute ${pos} w-4 h-4`}
                      style={{ borderColor: 'rgba(201,168,76,0.25)', borderStyle: 'solid', borderWidth: bw }}
                      aria-hidden="true"
                    />
                  ))}

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Image
                      src="/assets/logos/White Logo.png"
                      alt=""
                      width={80}
                      height={80}
                      style={{ opacity: 0.1, width: '5rem', height: 'auto' }}
                      aria-hidden="true"
                    />
                    <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.875rem', color: 'rgba(201,168,76,0.3)', marginTop: '1rem', letterSpacing: '0.05em' }}>
                      Artist photo coming soon
                    </p>
                  </div>
                </div>
              </AnimatedSection>

            </div>
          </div>
        </section>

        {/* HOM Divider */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="section-divider">
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
          </div>
        </div>

        {/* ── SERVICES ───────────────────────────────────────────────────────── */}
        <section className="px-6 py-28 md:py-40">
          <div className="max-w-6xl mx-auto">

            <AnimatedSection className="mb-16">
              <p className="eyebrow">Services</p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                color: 'var(--cream)',
                letterSpacing: '-0.02em',
              }}>
                What we offer
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { n: '01', title: 'Bespoke Tattoo',     desc: 'Custom designs drawn from scratch, created in close collaboration with you from initial concept to final line.',                              link: '/booking' },
                { n: '02', title: 'Free Consultation',   desc: 'A relaxed conversation to discuss your idea, placement, sizing, and what the design process looks like.',                                   link: '/consultation' },
                { n: '03', title: 'Cover-Up Work',       desc: "Skilled cover-up and rework of existing tattoos. Book a consultation to discuss what's possible.",                                          link: '/consultation' },
              ] as const).map((s, i) => (
                <AnimatedSection key={s.n} delay={i * 100}>
                  <Link href={s.link} className="block card-premium group h-full">
                    <div className="card-premium-inner flex flex-col" style={{ minHeight: '220px' }}>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6875rem', color: 'var(--gold)', opacity: 0.6, marginBottom: '1rem', letterSpacing: '0.1em' }}>
                        {s.n}
                      </p>
                      <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
                        {s.title}
                      </h3>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.7, flex: 1, maxWidth: 'none' }}>
                        {s.desc}
                      </p>
                      <p className="group-hover:translate-x-1 transition-transform duration-300 mt-6" style={{ fontSize: '0.8125rem', color: 'var(--gold)', fontFamily: '"DM Sans", sans-serif' }}>
                        Find out more →
                      </p>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={300} className="mt-8 text-center">
              <Link href="/services" className="btn-secondary">All Services & Pricing</Link>
            </AnimatedSection>

          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
        <section className="px-6 py-32 md:py-48 relative overflow-hidden" style={{ backgroundColor: '#0E0C09' }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <AnimatedSection>
              <Image
                src="/assets/logos/White Logo.png"
                alt="Hall of Mirrors"
                width={72}
                height={72}
                style={{ width: '4rem', height: 'auto', margin: '0 auto 2rem', opacity: 0.65 }}
              />
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2.25rem, 6vw, 4rem)',
                color: 'var(--cream)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                marginBottom: '1.25rem',
              }}>
                Ready to begin?
              </h2>
              <p style={{ margin: '0 auto 2.5rem', maxWidth: '38ch', textAlign: 'center' }}>
                Limited availability ensures every client receives Robyn&apos;s full attention.
                Book now or start with a free consultation.
              </p>
              <div className="flex gap-3 flex-col md:flex-row justify-center">
                <Link href="/booking" className="btn-primary">
                  <span>Book Appointment</span>
                  <span className="btn-icon" aria-hidden="true">↗</span>
                </Link>
                <Link href="/consultation" className="btn-secondary">
                  Free Consultation
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>

      </div>
    </div>
  );
}
