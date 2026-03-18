import { ImageResponse } from 'next/og';

export const alt = 'Flemoji — AI-Powered South African Music Discovery';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow circles */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            right: '-80px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '999px',
            marginBottom: '28px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: '#a5b4fc',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
            }}
          >
            🎵 AI Music Discovery
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '80px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            fontFamily: 'sans-serif',
            textAlign: 'center',
          }}
        >
          Flemoji
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: '20px',
            fontSize: '28px',
            fontWeight: 400,
            color: 'rgba(165,180,252,0.85)',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.4,
          }}
        >
          AI-Powered South African Music Discovery
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            fontSize: '18px',
            color: 'rgba(148,163,184,0.6)',
            fontFamily: 'sans-serif',
          }}
        >
          flemoji.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
