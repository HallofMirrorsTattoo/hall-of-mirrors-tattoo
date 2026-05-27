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
          <div className="md:col-span-5">
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
            <div className="flex gap-3 mt-1">
              <a
                href="https://instagram.com/hallofmirrorstattoo"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
                aria-label="Hall of Mirrors on Instagram"
              >
                {/* Instagram glyph */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://tiktok.com/@hallofmirrorstattoo"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
                aria-label="Hall of Mirrors on TikTok"
              >
                {/* TikTok glyph */}
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.5 3.5c.4 1.8 1.5 3.2 3.2 4 .7.3 1.5.5 2.3.5v3.3c-1.4 0-2.7-.3-4-.9-.6-.3-1.1-.6-1.5-.9v6.5a6.2 6.2 0 1 1-6.2-6.2c.4 0 .8 0 1.2.1v3.3c-.4-.1-.8-.2-1.2-.2a3 3 0 1 0 3 3V3.5h3.2z" />
                </svg>
              </a>
              {studio?.facebook_url && (
                <a
                  href={studio.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social"
                  aria-label="Hall of Mirrors on Facebook"
                >
                  {/* Facebook glyph */}
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.7V4.2c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2v2.5H7.5V14h2.7v8h3.3z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Studio address */}
          <div className="md:col-span-3">
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
            <a
              href="https://share.google/VD7dtKwuFYH5QnWvh"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-address-link"
            >
              <address style={{
                fontFamily: '"DM Sans", sans-serif',
                fontStyle: 'normal',
                fontSize: '0.875rem',
                lineHeight: 2,
              }}>
                Hall of Mirrors Tattoo Studio<br />
                Suite 3, 34 Castle Street<br />
                Liverpool, L2 0NR<br />
                United Kingdom
                <span className="footer-address-cta">Get directions ↗</span>
              </address>
            </a>
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
                { href: '/artists',   label: 'Artists' },
                { href: '/about',     label: 'Studio' },
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
                { href: '/terms',   label: 'Terms' },
                { href: '/privacy', label: 'Privacy' },
                { href: '/cookies', label: 'Cookies' },
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
            color: 'var(--text-mid)',
            maxWidth: 'none',
          }}>
            © {new Date().getFullYear()} Hall of Mirrors Tattoo. All rights reserved.
          </p>
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            color: 'var(--text-mid)',
            maxWidth: 'none',
          }}>
            Fully licensed by Liverpool City Council
          </p>
        </div>

      </div>
    </footer>
  );
}
