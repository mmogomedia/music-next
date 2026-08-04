import Link from 'next/link';
import { CONTAINER, SECTION_PADDING } from './tokens';

export default function HomeJoinSection() {
  return (
    <section
      id='join'
      className={`scroll-mt-20 bg-white dark:bg-slate-900 ${SECTION_PADDING}`}
    >
      <div
        className={`${CONTAINER} flex flex-wrap items-center justify-between gap-9 rounded-3xl border border-[#ECEBF3] bg-[#F7F6FD] p-8 md:p-14 dark:border-slate-800 dark:bg-slate-800/50`}
      >
        <div>
          <h2 className='max-w-2xl font-jakarta text-[clamp(1.625rem,3vw,2.5rem)] font-extrabold leading-tight tracking-[-.03em] text-[#0F1222] text-balance dark:text-white'>
            One free account. Guides, tools and the stream.
          </h2>
          <p className='mt-3.5 max-w-lg text-[16.5px] leading-relaxed text-[#5B5F73] dark:text-gray-400'>
            No cost, no catch — made for independent artists in South Africa.
          </p>
        </div>

        <div className='flex flex-wrap gap-3.5'>
          <Link
            href='/register'
            className='rounded-xl bg-[#5B3BF0] px-7 py-4 text-base font-bold text-white shadow-[0_10px_26px_rgba(91,59,240,.3)] transition-colors hover:bg-[#4A2CE0]'
          >
            Create free account
          </Link>
          <Link
            href='/learn?view=grid'
            className='rounded-xl border border-[#E4E3EE] bg-white px-7 py-4 text-base font-bold text-[#0F1222] transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-purple-500 dark:hover:text-purple-400'
          >
            Browse guides
          </Link>
        </div>
      </div>
    </section>
  );
}
