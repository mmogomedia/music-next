import { ImageResponse } from 'next/og';

export const alt =
  'Flemoji Tools — Free Music Business Calculators for Independent Artists';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const content = (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #6d28d9 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
        }}
      />

      {/* Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '999px',
          marginBottom: '28px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            color: '#ffffff',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'sans-serif',
          }}
        >
          🧮 Free Tools
        </span>
      </div>

      {/* Wordmark */}
      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.75)',
          fontFamily: 'sans-serif',
          letterSpacing: '0.02em',
          marginBottom: '8px',
        }}
      >
        Flemoji
      </div>

      {/* Main title */}
      <div
        style={{
          fontSize: '72px',
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}
      >
        Tools
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: '20px',
          fontSize: '26px',
          fontWeight: 400,
          color: 'rgba(224,231,255,0.85)',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          maxWidth: '680px',
          lineHeight: 1.4,
        }}
      >
        Free interactive calculators for independent artists — split sheets,
        revenue prediction, and more.
      </div>

      {/* Bottom URL */}
      <div
        style={{
          position: 'absolute',
          bottom: '36px',
          fontSize: '18px',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'sans-serif',
        }}
      >
        flemoji.com/tools
      </div>
    </div>
  );

  return new ImageResponse(content, { width: 1200, height: 630 });
}
