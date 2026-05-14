import Link from 'next/link';
import Image from 'next/image';
import { getStudioSettings } from '@/lib/studioSettings';

export default async function Footer() {
  const studio = await getStudioSettings();
  return (
    <footer style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">

          {/* Brand */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <Image
                src="/assets/logos/White Logo.png"
                alt="Hall of Mirrors"
                width={44}
                height={44}
                style={{ width: '2.75rem', height: 'auto', opacity: 0.85 }}
              />
              <Image
                src="/assets/logos/White Logo Text.png"
                alt="Hall of Mirrors Tattoo Studio"
                width={160}
                height={40}
                style={{ width: '9rem', height: 'auto', opacity: 0.75 }}
              />
            </div>
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.875rem',
              lineHeight: 1.8,
              color: 'var(--text-low)',
              maxWidth: '28ch',
            }}>
              Bespoke tattoo artistry in Liverpool.<br />
              Neo-traditional specialist. Every design custom.
            </p>
            <div className="flex gap-4 mt-6">
              {studio?.instagram_handle && (
                <a href={`https://instagram.com/${studio.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="footer-social">Instagram</a>
              )}
              {studio?.tiktok_handle && (
                <a href={`https://tiktok.com/@${studio.tiktok_handle}`} target="_blank" rel="noopener noreferrer" className="footer-social">TikTok</a>
              )}
              {studio?.facebook_url && (
                <a href={studio.facebook_url} target="_blank" rel="noopener noreferrer" className="footer-social">Facebook</a>
              )}
              {!studio?.instagram_handle && !studio?.tiktok_handle && !studio?.facebook_url && (
                <>
                  <a href="#" className="footer-social">Instagram</a>
                  <a href="#" className="footer-social">TikTok</a>
                </>
              )}
            </div>
          </div>

          {/* Studio address */}
          <div className="md:col-span-3 md:col-start-6">
            <h4 style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              opacity: 0.6,
              marginBottom: '1rem',
            }}>
              Studio
            </h4>
            <address style={{
              fontFamily: '"DM Sans", sans-serif',
              fontStyle: 'normal',
              fontSize: '0.875rem',
              lineHeight: 2,
              color: 'var(--text-mid)',
            }}>
              {studio?.address ? (
                <>
                  {studio.address}<br />
                  {studio.postcode && <>{studio.postcode}<br /></>}
                  United Kingdom
                </>
              ) : (
                <>
                  Suite 3<br />
                  34 Castle Street<br />
                  Liverpool L2 0NR<br />
                  United Kingdom
                </>
              )}
            </address>
          </div>

          {/* Navigate */}
          <div className="md:col-span-2">
            <h4 style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              opacity: 0.6,
              marginBottom: '1rem',
            }}>
              Navigate
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { href: '/booking',      label: 'Book Appointment' },
                { href: '/portfolio',    label: 'Portfolio' },
                { href: '/services',     label: 'Services' },
                { href: '/consultation', label: 'Consultation' },
                { href: '/about',        label: 'About' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="footer-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              opacity: 0.6,
              marginBottom: '1rem',
            }}>
              Legal
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { href: '/terms',     label: 'Terms' },
                { href: '/privacy',   label: 'Privacy' },
                { href: '/cookies',   label: 'Cookies' },
                { href: '/aftercare', label: 'Aftercare' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="footer-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(201,168,76,0.08)',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            color: 'var(--text-low)',
            opacity: 0.7,
          }}>
            © {new Date().getFullYear()} Hall of Mirrors Tattoo. All rights reserved.
          </p>
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            color: 'var(--text-low)',
            opacity: 0.4,
          }}>
            Liverpool City Council Reg. · A11394900
          </p>
        </div>

      </div>
    </footer>
  );
}
