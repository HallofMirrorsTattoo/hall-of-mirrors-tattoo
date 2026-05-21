import Link from 'next/link';
import Image from 'next/image';
import AnimatedSection from '../components/AnimatedSection';

export const metadata = {
  title: 'Our Artists | Hall of Mirrors Tattoo Studio Liverpool',
  description: 'Meet the artists at Hall of Mirrors — a private tattoo studio on Castle Street, Liverpool. Bespoke neo-traditional tattooing, colour realism, and custom design.',
  alternates: {
    canonical: 'https://hallofmirrorstattoo.com/portfolio',
  },
  openGraph: {
    title: 'Our Artists | Hall of Mirrors Tattoo Studio Liverpool',
    description: 'Meet the artists at Hall of Mirrors — a private tattoo studio on Castle Street, Liverpool. Neo-traditional specialists. Every design bespoke.',
    url: 'https://hallofmirrorstattoo.com/portfolio',
    siteName: 'Hall of Mirrors Tattoo Studio',
    locale: 'en_GB',
    type: 'website' as const,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Our Artists | Hall of Mirrors Tattoo Studio Liverpool',
    description: 'Meet the artists at Hall of Mirrors — a private tattoo studio on Castle Street, Liverpool. Neo-traditional specialists.',
  },
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

const imgFilter = 'brightness(0.87) contrast(1.06) saturate(0.72) sepia(0.08)';

export default async function Portfolio() {
  const artists = await fetchArtists();
  const hasChristina = artists.some(a => a.full_name.toLowerCase().includes('christina'));
  const displayArtists = hasChristina ? artists : [...artists, CHRISTINA_PLACEHOLDER];

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>

      {/* Page header */}
      <section style={{ padding: '5rem 1.5rem 4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
          <AnimatedSection>
            <p className="eyebrow" style={{ marginBottom: '1.5rem' }}>Hall of Mirrors · Liverpool</p>
            <h1 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(3.5rem, 8vw, 6rem)',
              color: 'var(--cream)',
              lineHeight: 1.0,
              letterSpacing: '-0.025em',
              marginBottom: '1.5rem',
            }}>
              Meet the Artists
            </h1>
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.1rem)',
              lineHeight: 1.8,
              color: 'var(--text-mid)',
              maxWidth: '38ch',
              margin: '0 auto',
            }}>
              Two resident artists. One private studio. Every piece drawn from scratch.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Artist cards */}
      <section style={{ padding: '3rem 1.5rem 8rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayArtists.map((artist, i) => {
              const slug = toSlug(artist.full_name);
              const hasProfile = Boolean(artist.bio);
              const isPlaceholder = artist.id.startsWith('placeholder-');
              const specialty = artist.specialties
                ? artist.specialties.split(',')[0].trim()
                : 'Neo-Traditional';

              const cardContent = (
                <AnimatedSection delay={i * 150}>
                  {/* Portrait */}
                  <div style={{
                    position: 'relative',
                    aspectRatio: '4/5',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    marginBottom: '1.5rem',
                    background: 'var(--surface)',
                  }}>
                    {artist.cover_photo ? (
                      <Image
                        src={artist.cover_photo}
                        alt={`${artist.full_name} — Hall of Mirrors Tattoo Studio`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        style={{ filter: imgFilter }}
                        quality={90}
                      />
                    ) : (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(160deg, rgba(29,26,21,0.95) 0%, rgba(14,12,9,0.9) 100%)',
                      }}>
                        <span style={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontStyle: 'italic',
                          fontSize: '7rem',
                          fontWeight: 300,
                          color: 'rgba(201,168,76,0.12)',
                          lineHeight: 1,
                          userSelect: 'none',
                        }}>
                          {artist.full_name.charAt(0)}
                        </span>
                        {isPlaceholder && (
                          <p style={{
                            fontFamily: '"DM Mono", monospace',
                            fontSize: '0.6rem',
                            letterSpacing: '0.28em',
                            textTransform: 'uppercase',
                            color: 'rgba(201,168,76,0.25)',
                            marginTop: '1.25rem',
                          }}>
                            Coming Soon
                          </p>
                        )}
                      </div>
                    )}
                    {/* Gold border overlay */}
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '0.75rem', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.15)', pointerEvents: 'none' }} aria-hidden="true" />
                  </div>

                  {/* Name */}
                  <h2 style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                    color: 'var(--cream)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    marginBottom: '0.5rem',
                  }}>
                    {artist.full_name}
                  </h2>

                  {/* Specialty / coming soon tag */}
                  <p style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: isPlaceholder ? 'var(--text-low)' : 'rgba(201,168,76,0.55)',
                    marginBottom: hasProfile ? '0.875rem' : 0,
                  }}>
                    {isPlaceholder ? 'Profile coming soon' : specialty}
                  </p>

                  {/* View profile link — only for real artists */}
                  {hasProfile && (
                    <p style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '0.7rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--gold)',
                      opacity: 0.6,
                    }}>
                      View Profile ↗
                    </p>
                  )}
                </AnimatedSection>
              );

              return hasProfile ? (
                <Link key={artist.id} href={`/artists/${slug}`} style={{ display: 'block', textDecoration: 'none' }}>
                  {cardContent}
                </Link>
              ) : (
                <div key={artist.id}>{cardContent}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '2rem 1.5rem 8rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
          <AnimatedSection>
            <p style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              opacity: 0.4,
              marginBottom: '1.5rem',
            }}>
              Suite 3 · Castle Street · Liverpool
            </p>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              color: 'var(--cream)',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              marginBottom: '1.5rem',
            }}>
              Start with a conversation.
            </h2>
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.9375rem',
              color: 'var(--text-mid)',
              lineHeight: 1.8,
              maxWidth: '38ch',
              margin: '0 auto 2.5rem',
            }}>
              Every tattoo at Hall of Mirrors starts with a conversation — your idea, your
              story, your vision. We&apos;d love to hear from you.
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
