import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Hall of Mirrors Tattoo Studio · Liverpool';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0E0C09',
          position: 'relative',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Background radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Corner marks */}
        {[
          { top: 32, left: 32, borderTop: '1px solid rgba(201,168,76,0.35)', borderLeft: '1px solid rgba(201,168,76,0.35)', borderRight: 'none', borderBottom: 'none' },
          { top: 32, right: 32, borderTop: '1px solid rgba(201,168,76,0.35)', borderRight: '1px solid rgba(201,168,76,0.35)', borderLeft: 'none', borderBottom: 'none' },
          { bottom: 32, left: 32, borderBottom: '1px solid rgba(201,168,76,0.35)', borderLeft: '1px solid rgba(201,168,76,0.35)', borderRight: 'none', borderTop: 'none' },
          { bottom: 32, right: 32, borderBottom: '1px solid rgba(201,168,76,0.35)', borderRight: '1px solid rgba(201,168,76,0.35)', borderLeft: 'none', borderTop: 'none' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 40, height: 40, ...s, display: 'flex' }} />
        ))}

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, zIndex: 1 }}>
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: 76,
              fontWeight: 400,
              color: '#C9A84C',
              letterSpacing: '-0.01em',
              lineHeight: 1.0,
              margin: 0,
            }}
          >
            Hall of Mirrors
          </p>
          <p
            style={{
              fontFamily: 'Georgia, monospace',
              fontSize: 14,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.5)',
              margin: '16px 0 0',
            }}
          >
            Tattoo Studio · Liverpool
          </p>
          <div
            style={{
              width: 48,
              height: 1,
              background: 'rgba(201,168,76,0.3)',
              margin: '28px 0',
              display: 'flex',
            }}
          />
          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: 22,
              fontWeight: 300,
              color: '#9A9082',
              letterSpacing: '0.01em',
              margin: 0,
            }}
          >
            Bespoke neo-traditional tattoos — Castle Street
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
