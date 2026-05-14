import Link from 'next/link';
import AnimatedSection from '../components/AnimatedSection';

export const metadata = {
  title: 'Our Artists | Hall of Mirrors Tattoo Studio Liverpool',
  description: 'Meet the artists at Hall of Mirrors — a private tattoo studio on Castle Street, Liverpool. Bespoke neo-traditional tattooing, colour realism, and custom design.',
};

interface Artist {
  id: string;
  full_name: string;
  specialties: string | null;
  years_experience: number | null;
  bio: string | null;
  instagram_handle: string | null;
  cover_photo: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hall-of-mirrors-tattoo-production.up.railway.app';

async function fetchArtists(): Promise<Artist[]> {
  try {
    const res = await fetch(`${API}/api/artist`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.artists ?? [];
  } catch {
    return [];
  }
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Static placeholder — rendered when the API doesn't yet return Christina.
// Remove once her Artist row is live in the DB.
const CHRISTINA_PLACEHOLDER: Artist = {
  id: 'placeholder-christina',
  full_name: 'Christina',
  specialties: null,
  years_experience: null,
  bio: null,
  instagram_handle: null,
  cover_photo: null,
};

const GALLERY_LABELS = ['Neo-Traditional', 'Cover-Up', 'Colour Work', 'Fine Detail', 'Portrait', 'Custom Design'];
const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

const styles = [
  {
    n: '01',
    name: 'Neo-Traditional',
    desc: 'Bold outlines, rich colour, classic subject matter reinterpreted with a modern edge. The cornerstone of our practice — rooted in art history, driven by personal narrative.',
  },
  {
    n: '02',
    name: 'Colour Realism',
    desc: 'Detailed, lifelike colour work with depth, shading, and vibrant palettes. Every layer considered, every reference studied.',
  },
  {
    n: '03',
    name: 'Fine Line',
    desc: 'Delicate, precise linework for minimalist and detailed illustrative pieces. Technically demanding, quietly striking.',
  },
  {
    n: '04',
    name: 'Cover-Up & Rework',
    desc: 'Skilled transformation of existing tattoos — whether a full cover or a rework to refresh faded work. Every cover-up case is assessed individually in consultation first.',
  },
];

function ArtistSection({ artist }: { artist: Artist }) {
  const slug = toSlug(artist.full_name);
  const igUrl = artist.instagram_handle
    ? `https://instagram.com/${artist.instagram_handle.replace('@', '')}`
    : null;
  const firstName = artist.full_name.split(' ')[0];
  const hasProfile = Boolean(artist.bio);
  const specialtyTags = artist.specialties
    ? artist.specialties.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <section className="px-6 pb-28 md:pb-40">
      <div className="max-w-6xl mx-auto">
        {!hasProfile && (
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.6875rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase' as const,
              color: 'var(--gold)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: '0.25rem',
              padding: '0.3rem 0.75rem',
              backgroundColor: 'rgba(201,168,76,0.05)',
            }}>
              Coming Soon
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">
          {/* Left — Bio */}
          <AnimatedSection>
            <p className="eyebrow">Resident Artist</p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(4rem, 9vw, 7rem)',
              color: 'var(--gold)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              marginBottom: '1.75rem',
            }}>
              {firstName}
            </h2>

            {specialtyTags.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                {specialtyTags.map((tag) => (
                  <span key={tag} style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--gold)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    borderRadius: '0.25rem',
                    padding: '0.3rem 0.7rem',
                    backgroundColor: 'rgba(201,168,76,0.05)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : !hasProfile && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                <span style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  color: 'var(--text-low)',
                  border: '1px solid rgba(201,168,76,0.1)',
                  borderRadius: '0.25rem',
                  padding: '0.3rem 0.7rem',
                  backgroundColor: 'rgba(201,168,76,0.03)',
                }}>
                  Profile coming soon
                </span>
              </div>
            )}

            {artist.bio ? (
              <p style={{ marginBottom: '2.5rem', whiteSpace: 'pre-line' }}>{artist.bio}</p>
            ) : (
              <p style={{ marginBottom: '2.5rem' }}>
                {firstName} joins the Hall of Mirrors studio bringing their own distinct approach
                to tattooing. Full artist profile and booking availability coming soon —
                follow us on Instagram for updates.
              </p>
            )}

            {artist.years_experience && (
              <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 400, color: 'var(--gold)', lineHeight: 1, marginBottom: '0.25rem' }}>
                    {artist.years_experience}+
                  </p>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--text-low)', maxWidth: 'none' }}>
                    Years Experience
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.75rem', fontWeight: 400, color: 'var(--gold)', lineHeight: 1, marginBottom: '0.25rem' }}>
                    100%
                  </p>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--text-low)', maxWidth: 'none' }}>
                    Custom Designs
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {hasProfile ? (
                <>
                  <Link href={`/artists/${slug}`} className="btn-secondary">
                    View full profile
                  </Link>
                  <Link href={`/booking?artist=${artist.id}`} className="btn-primary">
                    <span>Book with {firstName}</span>
                    <span className="btn-icon" aria-hidden="true">↗</span>
                  </Link>
                </>
              ) : (
                <Link href="/booking" className="btn-secondary">Get Notified</Link>
              )}
              {igUrl && (
                <a href={igUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  Instagram ↗
                </a>
              )}
            </div>
          </AnimatedSection>

          {/* Right — Cover photo or placeholder */}
          <AnimatedSection delay={180}>
            {artist.cover_photo ? (
              <div style={{ borderRadius: '0.375rem', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '3/4' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artist.cover_photo}
                  alt={`${artist.full_name} portfolio`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ) : hasProfile ? (
              <div className="grid grid-cols-2 gap-3">
                {GALLERY_LABELS.slice(0, 4).map((label, i) => (
                  <div
                    key={label}
                    className="card-premium relative overflow-hidden"
                    style={{ minHeight: '240px', aspectRatio: '3/4' }}
                  >
                    <div className="card-premium-inner h-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(160deg, rgba(29,26,21,0.8) 0%, rgba(14,12,9,0.6) 100%)' }}>
                      <span
                        aria-hidden="true"
                        style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '4rem', fontWeight: 300, color: 'var(--gold)', opacity: 0.06, lineHeight: 1, userSelect: 'none', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      >
                        {ROMANS[i]}
                      </span>
                      <p className="eyebrow" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-premium relative overflow-hidden" style={{ minHeight: '480px' }}>
                <div className="card-premium-inner h-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(160deg, rgba(29,26,21,0.6) 0%, rgba(14,12,9,0.5) 100%)', minHeight: '480px' }}>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9375rem', color: 'rgba(201,168,76,0.3)', letterSpacing: '0.05em', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    Artist profile coming soon
                  </p>
                </div>
              </div>
            )}
            {hasProfile && igUrl && !artist.cover_photo && (
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--text-low)', textAlign: 'center', marginTop: '1rem' }}>
                <a href={igUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(201,168,76,0.5)', textDecoration: 'none' }}>See work on Instagram ↗</a>
              </p>
            )}
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

export default async function Portfolio() {
  const artists = await fetchArtists();
  const hasChristina = artists.some(a => a.full_name.toLowerCase().includes('christina'));
  const displayArtists = hasChristina ? artists : [...artists, CHRISTINA_PLACEHOLDER];

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <section className="px-6 pt-8 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <p className="eyebrow">Our Artists</p>
            <h1 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(3.5rem, 8vw, 6rem)',
              color: 'var(--cream)',
              letterSpacing: '-0.025em',
              lineHeight: 1.0,
              marginBottom: '1.5rem',
            }}>
              The people behind the ink
            </h1>
            <p style={{ maxWidth: '52ch' }}>
              Hall of Mirrors is home to two resident tattoo artists working from our private
              studio on Castle Street in Liverpool city centre. Every client is seen by
              appointment — no walk-ins, no rushing.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── ARTIST SECTIONS ───────────────────────────────────────────────── */}
      {displayArtists.map((artist, index) => (
        <div key={artist.id}>
          <ArtistSection artist={artist} />
          {index < displayArtists.length - 1 && (
            <div className="max-w-5xl mx-auto px-6">
              <div className="section-divider">
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Fallback if API is down */}
      {artists.length === 0 && (
        <section className="px-6 pb-28">
          <div className="max-w-6xl mx-auto" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
              Artist profiles loading…
            </p>
          </div>
        </section>
      )}

      {/* HOM Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="section-divider">
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
        </div>
      </div>

      {/* ── SPECIALISMS ───────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="mb-12">
            <p className="eyebrow">Specialisms</p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              color: 'var(--cream)',
              letterSpacing: '-0.025em',
              lineHeight: 1.0,
              marginTop: '0.75rem',
            }}>
              What we do best
            </h2>
          </AnimatedSection>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {styles.map((s, i) => (
              <AnimatedSection
                key={s.n}
                delay={i * 80}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '5.5rem 1px 1fr',
                  alignItems: 'center',
                  gap: '0 2.5rem',
                  padding: '2.5rem 0',
                }}>
                  <span style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
                    fontWeight: 300,
                    color: 'var(--gold)',
                    opacity: 0.35,
                    lineHeight: 1,
                    textAlign: 'right',
                  }}>
                    {s.n}
                  </span>
                  <span style={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'var(--border)' }} aria-hidden="true" />
                  <div>
                    <h3 style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontStyle: 'italic',
                      fontSize: 'clamp(1.375rem, 3vw, 2rem)',
                      fontWeight: 300,
                      color: 'var(--cream)',
                      lineHeight: 1.2,
                      marginBottom: '0.625rem',
                    }}>
                      {s.name}
                    </h3>
                    <p style={{ fontSize: '0.9rem', maxWidth: '52ch' }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* HOM Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="section-divider">
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
        </div>
      </div>

      {/* ── FLASH DAYS ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <AnimatedSection>
              <p className="eyebrow" style={{ marginBottom: '1rem' }}>Flash Days</p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                color: 'var(--cream)',
                letterSpacing: '-0.025em',
                lineHeight: 1.0,
                marginBottom: '1.5rem',
              }}>
                One day.<br />Original designs.
              </h2>
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: '44ch', marginBottom: '2rem' }}>
                Occasionally our artists host flash days — special events where a collection
                of pre-drawn designs is available at a fixed price. Each design is unique,
                first come first served. Once claimed, it&apos;s gone.
              </p>
              <Link href="/flash" className="btn-secondary">
                See upcoming flash days ↗
              </Link>
            </AnimatedSection>

            <AnimatedSection delay={150}>
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                padding: '2.5rem',
                background: 'var(--surface)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div aria-hidden="true" style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,168,76,0.04) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
                {[
                  { label: 'Pre-drawn designs', detail: 'Ready to go — no waiting on custom artwork.' },
                  { label: 'Fixed price', detail: 'No surprises. Each design is priced up front.' },
                  { label: 'Limited availability', detail: 'Every design is one of a kind. Claim it or lose it.' },
                ].map((item) => (
                  <div key={item.label} style={{ paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.65)', marginBottom: '0.3rem' }}>
                      {item.label}
                    </p>
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6, maxWidth: 'none' }}>
                      {item.detail}
                    </p>
                  </div>
                ))}
                <div style={{ paddingBottom: 0, marginBottom: 0 }}>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.65)', marginBottom: '0.3rem' }}>
                    Announced via Instagram
                  </p>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.6, maxWidth: 'none' }}>
                    Follow us to be first to know when the next flash day drops.
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
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)' }}>HOM</span>
        </div>
      </div>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section className="px-6 py-28 md:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <p style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              opacity: 0.4,
              marginBottom: '2rem',
            }}>
              Suite 3 · Castle Street · Liverpool
            </p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(3rem, 7vw, 5rem)',
              color: 'var(--cream)',
              letterSpacing: '-0.025em',
              lineHeight: 1.0,
              marginBottom: '1.5rem',
            }}>
              Start with a conversation
            </h2>
            <p style={{ margin: '0 auto 2.5rem', maxWidth: '44ch', textAlign: 'center' }}>
              Every tattoo at Hall of Mirrors begins with a consultation — a chance to talk
              through your idea, explore placement, and see if we&apos;re the right fit for
              your vision.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/booking" className="btn-primary">
                <span>Book Appointment</span>
                <span className="btn-icon" aria-hidden="true">↗</span>
              </Link>
              <Link href="/about" className="btn-secondary">About the Studio</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
