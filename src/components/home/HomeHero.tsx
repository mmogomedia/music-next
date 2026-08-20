import Link from 'next/link';
import { BRAND_GRADIENT, CONTAINER, GRID_OVERLAY } from './tokens';
import HomeHeroCovers from './HomeHeroCovers';
import type { StreamTrack } from './HomeStreamSection';

/**
 * Product-forward: the hero shows the thing you get.
 *
 * Three earlier passes all arranged ALBUM ART — a stack, an arc, then a
 * full-bleed wall. Every one of them said "music platform" and none of them
 * said what Flemoji does for an artist, which is why they read as generic:
 * swap the covers for stock photos and the same hero sells anything.
 *
 * So the exhibit is now the Split Sheet Calculator, mirroring the real tool
 * at `/tools/split-sheet` — the least glamorous and most load-bearing
 * document an independent artist deals with. A chart of streams would say
 * "analytics startup"; a split sheet says precisely what this is for.
 *
 * SPECIFICITY IS THE POINT. The song and lead artist come from the track
 * actually playing on the stream, the ISRC carries the ZA prefix the tool's
 * own placeholders use, and the collaborators are South African names. Those
 * details are what a generic template cannot fake.
 *
 * The gradient is the ground again — `tokens.ts` unchanged — because a white
 * product card needs a field to sit on, not a photograph to compete with.
 */

/** The three pillars, as a link row rather than a stack of numbered cards:
 *  they are wayfinding, and the numbering duplicated every section heading. */
const PILLARS = [
  { title: 'Learning material', href: '#learn' },
  { title: 'Music tools', href: '/tools' },
  { title: 'Music streaming', href: '/stream' },
] as const;

export default function HomeHero({ tracks = [] }: { tracks?: StreamTrack[] }) {
  return (
    <section
      id='top'
      className='relative overflow-hidden px-5 py-16 sm:px-8 md:py-24 lg:px-12 lg:py-28'
      style={{ background: BRAND_GRADIENT }}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0'
        style={GRID_OVERLAY}
      />

      <div
        className={`${CONTAINER} relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:gap-16`}
      >
        <div>
          <div className='inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[.16] px-4 py-2'>
            <span className='block h-2 w-2 rounded-full bg-emerald-400' />
            <span className='text-xs font-bold uppercase tracking-[.12em] text-white'>
              Free tools · No account needed
            </span>
          </div>

          <h1 className='mt-6 font-jakarta text-[clamp(2.5rem,5.4vw,4.75rem)] font-extrabold leading-[1.02] tracking-[-.035em] text-white text-balance'>
            Everything an independent artist needs.
          </h1>

          <p className='mt-6 max-w-xl text-[clamp(1.0625rem,1.5vw,1.25rem)] leading-relaxed text-white/80 text-pretty'>
            Split sheets, royalty estimates and the paperwork most artists put
            off — done in minutes, in plain language. Plus guides on how the
            business actually works, and a stream for independent South African
            artists.
          </p>

          <div className='mt-8 flex flex-wrap gap-3.5'>
            <Link
              href='/tools/split-sheet'
              className='rounded-xl bg-white px-7 py-4 text-base font-bold text-[#5B3BF0] shadow-[0_10px_30px_rgba(15,18,34,.18)] transition-colors hover:bg-[#F3EEFF]'
            >
              Start a split sheet →
            </Link>
            <Link
              href='#learn'
              className='rounded-xl border border-white/35 bg-white/[.14] px-7 py-4 text-base font-bold text-white transition-colors hover:bg-white/25'
            >
              Read the guides
            </Link>
          </div>

          <nav
            aria-label='Sections'
            className='mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/15 pt-6'
          >
            {PILLARS.map(p => (
              <Link
                key={p.href}
                href={p.href}
                className='group inline-flex items-center gap-2 text-[15px] font-semibold text-white/70 transition-colors hover:text-white'
              >
                {p.title}
                <span
                  aria-hidden
                  className='transition-transform group-hover:translate-x-0.5'
                >
                  →
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className='w-full'>
          <HomeHeroCovers tracks={tracks} />
        </div>
      </div>
    </section>
  );
}
