import Image from 'next/image';
import Link from 'next/link';
import { artworkGradient } from './tokens';
import type { StreamTrack } from './HomeStreamSection';

/**
 * The hero's right-side exhibit: a 2×2 wall of album covers from the current
 * stream. Multiple images, so it reads as a music platform rather than a
 * single-artist landing page. Sized so the whole right column stays under
 * the copy column's height and the section doesn't outgrow the viewport.
 *
 * The first cover carries the "Now streaming" pill so the eye has an anchor;
 * the other three are peers, not decoration.
 */
export default function HomeHeroCovers({ tracks }: { tracks: StreamTrack[] }) {
  const cells = tracks.slice(0, 4);
  if (cells.length === 0) return null;

  return (
    <div className='mx-auto w-full max-w-[500px]'>
      <div className='grid grid-cols-2 gap-3'>
        {cells.map((track, i) => (
          <Link
            key={track.id}
            href={track.href}
            className='group relative block aspect-square overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_50px_-20px_rgba(15,18,34,.6)] transition-transform hover:-translate-y-1'
            style={
              track.artworkUrl ? undefined : { background: artworkGradient(i) }
            }
          >
            {track.artworkUrl && (
              <Image
                src={track.artworkUrl}
                alt={`${track.title}${track.artist ? ` — ${track.artist}` : ''}`}
                fill
                sizes='(min-width: 1024px) 250px, 50vw'
                className='object-cover'
                priority={i === 0}
              />
            )}

            {i === 0 && (
              <div className='absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.14em] text-white backdrop-blur-md'>
                <span className='block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400' />
                Now streaming
              </div>
            )}

            <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 py-2.5 opacity-0 transition-opacity group-hover:opacity-100'>
              <div className='truncate text-[13px] font-semibold text-white'>
                {track.title}
              </div>
              {track.artist && (
                <div className='truncate text-[11px] text-white/70'>
                  {track.artist}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className='mt-5 flex items-center justify-between gap-4 text-sm'>
        <span className='text-white/70'>
          Featured on{' '}
          <Link
            href='/stream'
            className='font-semibold text-white underline-offset-4 hover:underline'
          >
            the stream
          </Link>{' '}
          today
        </span>
        <Link
          href='/stream'
          className='shrink-0 font-semibold text-white/80 transition-colors hover:text-white'
        >
          Open →
        </Link>
      </div>
    </div>
  );
}
