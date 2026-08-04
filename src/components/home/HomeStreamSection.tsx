import Image from 'next/image';
import Link from 'next/link';
import {
  artworkGradient,
  BRAND_GRADIENT,
  CONTAINER,
  GRID_OVERLAY,
  SECTION_PADDING,
} from './tokens';
import SectionHeading from './SectionHeading';

export interface StreamTrack {
  id: string;
  title: string;
  artist: string | null;
  artworkUrl: string | null;
  href: string;
}

interface HomeStreamSectionProps {
  tracks: StreamTrack[];
}

/** Bar heights are derived from the index, so the server and client agree. */
const EQ_BARS = Array.from({ length: 34 }, (_, i) => ({
  height: Math.round(38 * (0.3 + 0.7 * Math.abs(Math.sin((i + 2) * 1.37)))),
  duration: 520 + ((i * 97) % 360),
  delay: (i * 53) % 400,
}));

export default function HomeStreamSection({ tracks }: HomeStreamSectionProps) {
  return (
    <section
      id='stream'
      className={`relative scroll-mt-20 overflow-hidden ${SECTION_PADDING}`}
      style={{ background: BRAND_GRADIENT }}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0'
        style={GRID_OVERLAY}
      />

      <div className={`${CONTAINER} relative`}>
        <SectionHeading
          number='03'
          eyebrow='Music streaming'
          title='Music from people doing it themselves.'
          blurb='A stream built for independent South African artists — and for listeners who want to hear them first.'
          action={{ label: 'Submit your music', href: '/submissions' }}
          tone='onGradient'
        />

        {/* Entry point into the real player, which lives at /stream. */}
        <Link
          href='/stream'
          className='mt-10 flex flex-wrap items-center gap-5 rounded-[18px] border border-white/25 bg-white/[.14] px-6 py-4 backdrop-blur-md transition-colors hover:bg-white/[.2]'
        >
          <span className='flex h-14 w-14 flex-none items-center justify-center rounded-full bg-white shadow-[0_8px_22px_rgba(15,18,34,.2)]'>
            <span
              aria-hidden
              className='ml-1 block h-0 w-0'
              style={{
                borderLeft: '15px solid #5B3BF0',
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
              }}
            />
          </span>

          <span className='min-w-[200px] flex-1'>
            <span className='flex items-center gap-2'>
              <span className='block h-[7px] w-[7px] rounded-full bg-emerald-400' />
              <span className='text-[11.5px] font-bold uppercase tracking-[.12em] text-white'>
                On air now
              </span>
            </span>
            <span className='mt-1.5 block font-jakarta text-[19px] font-bold tracking-[-.02em] text-white'>
              Flemoji Radio — independents only
            </span>
          </span>

          <span
            aria-hidden
            className='flex h-[38px] flex-none items-end gap-[3px]'
          >
            {EQ_BARS.map((bar, i) => (
              <span
                key={i}
                className='eq-bar block rounded-sm bg-white/75'
                style={{
                  width: 3,
                  height: bar.height,
                  transformOrigin: 'bottom',
                  animation: `eq ${bar.duration}ms ease-in-out ${bar.delay}ms infinite alternate`,
                }}
              />
            ))}
          </span>

          <span className='flex-none text-[13.5px] font-semibold text-white/70'>
            Open player →
          </span>
        </Link>

        {tracks.length > 0 && (
          <div className='mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5'>
            {tracks.map((track, i) => (
              <Link
                key={track.id}
                href={track.href}
                className='group block text-white'
              >
                <div
                  className='relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/30'
                  style={
                    track.artworkUrl
                      ? undefined
                      : { background: artworkGradient(i) }
                  }
                >
                  {track.artworkUrl ? (
                    <Image
                      src={track.artworkUrl}
                      alt={track.title}
                      fill
                      className='object-cover transition-transform duration-500 group-hover:scale-105'
                      sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px'
                    />
                  ) : (
                    <span
                      aria-hidden
                      className='font-jakarta text-4xl font-extrabold text-white/40'
                    >
                      {track.title.charAt(0)}
                    </span>
                  )}
                </div>
                <div className='mt-3 font-jakarta text-base font-bold tracking-[-.015em]'>
                  {track.title}
                </div>
                {track.artist && (
                  <div className='mt-0.5 text-[13.5px] text-white/70'>
                    {track.artist}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
