import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Hall of Mirrors Tattoo Studio — Liverpool';
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
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0E0C09',
          position: 'relative',
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,168,76,0.09) 0%, transparent 65%)',
            display: 'flex',
          }}
        />

        {/* Outer border */}
        <div style={{ position: 'absolute', top: 36, left: 36, right: 36, bottom: 36, border: '1px solid rgba(201,168,76,0.22)', display: 'flex' }} />
        {/* Inner border */}
        <div style={{ position: 'absolute', top: 48, left: 48, right: 48, bottom: 48, border: '1px solid rgba(201,168,76,0.09)', display: 'flex' }} />

        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 60, left: 60, width: 24, height: 24, borderTop: '1px solid rgba(201,168,76,0.5)', borderLeft: '1px solid rgba(201,168,76,0.5)', display: 'flex' }} />
        <div style={{ position: 'absolute', top: 60, right: 60, width: 24, height: 24, borderTop: '1px solid rgba(201,168,76,0.5)', borderRight: '1px solid rgba(201,168,76,0.5)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 60, width: 24, height: 24, borderBottom: '1px solid rgba(201,168,76,0.5)', borderLeft: '1px solid rgba(201,168,76,0.5)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 60, right: 60, width: 24, height: 24, borderBottom: '1px solid rgba(201,168,76,0.5)', borderRight: '1px solid rgba(201,168,76,0.5)', display: 'flex' }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>

          {/* HOM monogram */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: 13,
            letterSpacing: '0.55em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.45)',
            marginBottom: 36,
            display: 'flex',
          }}>
            HOM
          </div>

          {/* Studio name */}
          <div style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: 88,
            fontWeight: 400,
            color: '#F2EDE0',
            letterSpacing: '-2px',
            lineHeight: 1,
            display: 'flex',
          }}>
            Hall of Mirrors
          </div>

          {/* Separator */}
          <div style={{
            width: 180,
            height: 1,
            background: 'rgba(201,168,76,0.4)',
            margin: '30px 0',
            display: 'flex',
          }} />

          {/* Tagline */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: 17,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#C9A84C',
            display: 'flex',
          }}>
            TATTOO STUDIO · LIVERPOOL
          </div>

          {/* Address */}
          <div style={{
            fontFamily: 'monospace',
            fontSize: 13,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(242,237,224,0.22)',
            marginTop: 14,
            display: 'flex',
          }}>
            SUITE 3, 34 CASTLE STREET
          </div>

        </div>
      </div>
    ),
    { ...size }
  );
}
