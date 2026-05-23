import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

const imgFilter = 'brightness(0.87) contrast(1.06) saturate(0.72) sepia(0.08)';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://hall-of-mirrors-tattoo-production.up.railway.app';

interface ArtistData {
  id: string;
  full_name: string;
  bio: string | null;
  instagram_handle: string | null;
  booking_count: number;
  photos: { id: string; public_url: string }[];
  portrait_url: string | null;
}

// Static record shown while Cristina's DB row doesn't exist yet.
// Remove once her Artist row is live and the API returns her data.
const CRISTINA_STATIC: ArtistData = {
  id: 'static-cristina',
  full_name: 'Cristina',
  bio: "My name is Cristina. My tattoo name is Superstea. And my personal philosophy is simple: drink Coke, wear Adidas Hyper Sleek and make beautiful tattoos. I spend my work hours between neo-trad with a twist and blackwork illustrative.\n\nWhen I'm not drawing or tattooing, I'm usually obsessing about time travel, the simulation theory, alternate realities, post-apocalyptic fashion and whether Jedi mind tricks should be taught in schools. I used to be a journalist and write news for a national news television in Romania, but the love for tattooing won and now I'm helping people customise their avatar, while using a vegan set-up (because no one has to suffer for the pictures we put under the skin).\n\nThe things I like tattooing the most are somewhere between a Victorian botanist's notebook and a fever dream. Wild flowers, poisonous plants, animal skulls or forgotten relics, but I won't say 'no' to pop culture either. If any of this sounds good to you, maybe we're running on similar software. Whether you're looking to mark a milestone, reclaim a piece of yourself or simply give your character a very cool upgrade, I'd love to help. Get in touch and let's start designing your next tattoo.",
  instagram_handle: 'supersteatattoo',
  booking_count: 0,
  photos: [],
  portrait_url: '/assets/artists/cristina.jpg',
};

async function fetchArtist(slug: string): Promise<ArtistData | null> {
  try {
    const res = await fetch(`${API}/api/artist/${slug}`, { cache: 'no-store' });
    if (!res.ok) return slug === 'cristina' ? CRISTINA_STATIC : null;
    const data = await res.json();
    return data.artist ?? (slug === 'cristina' ? CRISTINA_STATIC : null);
  } catch {
    return slug === 'cristina' ? CRISTINA_STATIC : null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const artist = await fetchArtist(params.slug);
  if (!artist) return { title: 'Artist Not Found | Hall of Mirrors' };

  const description = artist.bio
    ? artist.bio.substring(0, 155)
    : `${artist.full_name} is a tattoo artist at Hall of Mirrors Studio, Liverpool. Book online.`;

  return {
    title: `${artist.full_name} | Tattoo Artist Liverpool | Hall of Mirrors`,
    description,
    alternates: {
      canonical: `https://hallofmirrorstattoo.com/artists/${params.slug}`,
    },
    openGraph: {
      title: `${artist.full_name} — Hall of Mirrors Tattoo Studio, Liverpool`,
      description: artist.bio?.substring(0, 155) ?? `Tattoo artist at Hall of Mirrors, Liverpool. Bespoke neo-traditional tattooing.`,
      url: `https://hallofmirrorstattoo.com/artists/${params.slug}`,
      siteName: 'Hall of Mirrors Tattoo Studio',
      locale: 'en_GB',
      type: 'profile',
      images: artist.portrait_url ? [{ url: artist.portrait_url, alt: `${artist.full_name} — Hall of Mirrors` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `${artist.full_name} | Tattoo Artist Liverpool | Hall of Mirrors`,
      description: artist.bio?.substring(0, 155) ?? `Tattoo artist at Hall of Mirrors, Liverpool.`,
    },
  };
}

const GALLERY_PLACEHOLDERS = [
  { roman: 'I',    label: 'Neo-Traditional' },
  { roman: 'II',   label: 'Colour Work' },
  { roman: 'III',  label: 'Fine Line' },
  { roman: 'IV',   label: 'Cover-Up' },
  { roman: 'V',    label: 'Portrait' },
  { roman: 'VI',   label: 'Custom Design' },
];

function GalleryGrid({ photos }: { photos: { id: string; public_url: string }[] }) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2px',
    background: 'var(--border)',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    border: '1px solid var(--border)',
  };

  if (photos.length > 0) {
    return (
      <div style={gridStyle}>
        {photos.map(photo => (
          <div key={photo.id} className="gallery-cell" style={{ aspectRatio: '1', position: 'relative' }}>
            <Image
              src={photo.public_url}
              alt="Portfolio piece"
              fill
              sizes="(max-width: 768px) 33vw, 20vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      {GALLERY_PLACEHOLDERS.map((item) => (
        <div key={item.roman} className="gallery-cell" style={{
          aspectRatio: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          position: 'relative',
        }}>
          <span aria-hidden="true" style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '3.5rem', fontWeight: 300, color: 'rgba(201,168,76,0.08)', lineHeight: 1 }}>
            {item.roman}
          </span>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-low)', position: 'absolute', bottom: '0.875rem' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const artist = await fetchArtist(params.slug);
  if (!artist) notFound();

  const igUrl = artist.instagram_handle
    ? `https://instagram.com/${artist.instagram_handle.replace('@', '')}`
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.full_name,
    jobTitle: 'Tattoo Artist',
    worksFor: {
      '@type': 'LocalBusiness',
      name: 'Hall of Mirrors Tattoo Studio',
      url: 'https://hallofmirrorstattoo.com',
    },
    url: `https://hallofmirrorstattoo.com/artists/${params.slug}`,
    description: artist.bio ?? undefined,
    image: artist.portrait_url ?? undefined,
    sameAs: igUrl ? [igUrl] : undefined,
  };

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section style={{
        padding: '6rem 1.5rem 4rem',
        maxWidth: '64rem',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '3rem',
        alignItems: 'start',
      }}>
        {/* Portrait placeholder */}
        <div style={{ position: 'relative' }}>
          <div style={{
            aspectRatio: '4/5',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.25rem',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {artist.portrait_url ? (
              <Image
                src={artist.portrait_url}
                alt={`${artist.full_name} — tattoo artist`}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
                style={{ filter: imgFilter }}
              />
            ) : (
              <>
                {/* Corner marks */}
                {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                  <span key={i} aria-hidden="true" style={{
                    position: 'absolute',
                    width: '1.25rem', height: '1.25rem',
                    borderTop: ['top-0 left-0','top-0 right-0'].includes(pos) ? '1px solid rgba(201,168,76,0.3)' : 'none',
                    borderBottom: ['bottom-0 left-0','bottom-0 right-0'].includes(pos) ? '1px solid rgba(201,168,76,0.3)' : 'none',
                    borderLeft: ['top-0 left-0','bottom-0 left-0'].includes(pos) ? '1px solid rgba(201,168,76,0.3)' : 'none',
                    borderRight: ['top-0 right-0','bottom-0 right-0'].includes(pos) ? '1px solid rgba(201,168,76,0.3)' : 'none',
                    top: pos.includes('top') ? '0.75rem' : 'auto',
                    bottom: pos.includes('bottom') ? '0.75rem' : 'auto',
                    left: pos.includes('left-0') ? '0.75rem' : 'auto',
                    right: pos.includes('right-0') ? '0.75rem' : 'auto',
                  }} />
                ))}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '3rem', fontWeight: 300, color: 'rgba(201,168,76,0.15)', margin: 0, lineHeight: 1 }}>
                    {artist.full_name.charAt(0)}
                  </p>
                </div>
              </>
            )}
          </div>
          {/* Stat strip below portrait */}
          {artist.booking_count > 0 && (
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.75rem', fontWeight: 300, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
                  {artist.booking_count}
                </p>
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-low)', margin: '0.25rem 0 0' }}>
                  Sessions booked
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info column */}
        <div>
          <p className="eyebrow" style={{ marginBottom: '0.875rem' }}>Artist Profile</p>
          <h1 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
            color: 'var(--cream)',
            letterSpacing: '-0.02em',
            lineHeight: 1.0,
            marginBottom: '1.25rem',
          }}>
            {artist.full_name}
          </h1>

          {artist.bio && (
            <div style={{ marginBottom: '2rem' }}>
              {artist.bio.split('\n\n').map((para, i) => (
                <p key={i} style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '1rem', color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: '44ch', marginBottom: i < artist.bio!.split('\n\n').length - 1 ? '1rem' : 0 }}>
                  {para}
                </p>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href={`/booking?artist=${artist.id}`}
              className="btn-primary"
              style={{ alignSelf: 'flex-start' }}
            >
              <span>Book with {artist.full_name}</span>
              <span className="btn-icon" aria-hidden="true">↗</span>
            </Link>

            {igUrl && (
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>@{artist.instagram_handle?.replace('@', '')}</span>
                <span aria-hidden="true" style={{ opacity: 0.6 }}>↗</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="section-divider"><span>HOM</span></div>

      {/* Gallery placeholder */}
      <section style={{ padding: '4rem 1.5rem 6rem', maxWidth: '64rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem' }}>
          <h2 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            color: 'var(--cream)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            The work
          </h2>
          {igUrl && (
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', textDecoration: 'none', transition: 'color 0.2s ease' }}
            >
              View on Instagram ↗
            </a>
          )}
        </div>

        <GalleryGrid photos={artist.photos ?? []} />

        {igUrl && (
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-low)', textAlign: 'center', marginTop: '1.25rem' }}>
            More work on{' '}
            <a href={igUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(201,168,76,0.5)', textDecoration: 'none' }}>
              Instagram ↗
            </a>
          </p>
        )}
      </section>

      {/* Section divider */}
      <div className="section-divider"><span>HOM</span></div>

      {/* Final CTA */}
      <section style={{ padding: '5rem 1.5rem 7rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(201,168,76,0.045) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <p className="eyebrow" style={{ marginBottom: '1.25rem' }}>Ready to begin?</p>
        <h2 style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          color: 'var(--cream)',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          marginBottom: '1.5rem',
        }}>
          Book a session with {artist.full_name}
        </h2>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem', color: 'var(--text-mid)', lineHeight: 1.7, maxWidth: '36ch', margin: '0 auto 2.5rem' }}>
          Limited availability. All sessions confirmed within 24 hours.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/booking" className="btn-primary">
            <span>Book a session</span>
            <span className="btn-icon" aria-hidden="true">↗</span>
          </Link>
          <Link href="/booking?mode=consultation" className="btn-secondary">
            Request a consultation
          </Link>
        </div>
      </section>

    </div>
  );
}
