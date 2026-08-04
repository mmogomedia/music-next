import Link from 'next/link';
import { BRAND_GRADIENT, CONTAINER, GRID_OVERLAY } from './tokens';

/** The three pillars, rendered as the hero's right-hand quick-nav stack. */
const PILLARS = [
  {
    n: '01',
    title: 'Learning material',
    blurb: 'Royalties, splits and distribution, in plain language.',
    href: '#learn',
  },
  {
    n: '02',
    title: 'Music tools',
    blurb: 'Calculators, split sheets and royalty tracking.',
    href: '/tools',
  },
  {
    n: '03',
    title: 'Music streaming',
    blurb: 'Independent SA artists, playing right now.',
    href: '/stream',
  },
] as const;

export default function HomeHero() {
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
        className={`${CONTAINER} relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}
      >
        <div>
          <div className='inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[.16] px-4 py-2'>
            <span className='block h-2 w-2 rounded-full bg-emerald-400' />
            <span className='text-xs font-bold uppercase tracking-[.12em] text-white'>
              Learn · Tools · Streaming
            </span>
          </div>

          <h1 className='mt-6 font-jakarta text-[clamp(2.5rem,5.8vw,5.25rem)] font-extrabold leading-[1.02] tracking-[-.035em] text-white text-balance'>
            Everything an independent artist needs.
          </h1>

          <p className='mt-6 max-w-xl text-[clamp(1.0625rem,1.5vw,1.25rem)] leading-relaxed text-white/80 text-pretty'>
            Practical guides on royalties, splits and distribution. Tools that
            handle the admin. And a stream that puts your music in front of
            people — built for independent South African artists.
          </p>

          <div className='mt-8 flex flex-wrap gap-3.5'>
            <Link
              href='#learn'
              className='rounded-xl bg-white px-7 py-4 text-base font-bold text-[#5B3BF0] shadow-[0_10px_30px_rgba(15,18,34,.18)] transition-colors hover:bg-[#F3EEFF]'
            >
              Start reading →
            </Link>
            <Link
              href='/stream'
              className='rounded-xl border border-white/35 bg-white/[.14] px-7 py-4 text-base font-bold text-white transition-colors hover:bg-white/25'
            >
              Play the stream
            </Link>
          </div>
        </div>

        <div className='flex w-full max-w-[480px] flex-col gap-3.5 lg:justify-self-end'>
          {PILLARS.map(p => (
            <Link
              key={p.n}
              href={p.href}
              className='flex items-center gap-4 rounded-2xl border border-white/25 bg-white/[.14] p-5 text-white backdrop-blur-sm transition-colors hover:bg-white/25'
            >
              <span className='flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/90 font-jakarta text-base font-extrabold text-[#5B3BF0]'>
                {p.n}
              </span>
              <span className='flex-1'>
                <span className='block font-jakarta text-lg font-bold tracking-[-.015em]'>
                  {p.title}
                </span>
                <span className='mt-1 block text-sm leading-snug text-white/75'>
                  {p.blurb}
                </span>
              </span>
              <span aria-hidden className='flex-none text-xl text-white/70'>
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
