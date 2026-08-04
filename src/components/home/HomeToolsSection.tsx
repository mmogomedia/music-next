import Link from 'next/link';
import type { ToolDefinition } from '@/lib/tools/registry';
import { artworkGradient, CONTAINER, SECTION_PADDING } from './tokens';
import SectionHeading from './SectionHeading';

interface HomeToolsSectionProps {
  tools: ToolDefinition[];
}

/**
 * Announced in the design but not yet in the tool registry. Rendered as an
 * explicit "Coming soon" card so it never looks like a working link.
 */
const UPCOMING = {
  name: 'Royalty manager',
  description: 'Every song, every collaborator, every payout — in one place.',
} as const;

export default function HomeToolsSection({ tools }: HomeToolsSectionProps) {
  return (
    <section
      id='tools'
      className={`scroll-mt-20 border-t border-[#ECEBF3] bg-[#F7F6FD] dark:border-slate-800 dark:bg-slate-950 ${SECTION_PADDING}`}
    >
      <div className={CONTAINER}>
        <SectionHeading
          number='02'
          eyebrow='Music tools'
          title='The admin, handled for you.'
          blurb='Free tools that do the paperwork most artists put off — and lose money on.'
          action={{ label: 'Open the toolkit', href: '/tools' }}
          actionVariant='solid'
        />

        <div className='mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {tools.map((tool, i) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className='group block overflow-hidden rounded-[20px] border border-[#E7E4F6] bg-white transition-shadow hover:shadow-[0_12px_34px_rgba(15,18,34,.1)] dark:border-slate-700 dark:bg-slate-800'
            >
              <div
                className='flex aspect-[16/10] items-center justify-center border-b border-[#E7E4F6] dark:border-slate-700'
                style={{ background: artworkGradient(i) }}
              >
                <span className='text-xs font-semibold uppercase tracking-[.1em] text-white/90'>
                  {tool.category}
                </span>
              </div>
              <div className='px-6 pb-7 pt-6'>
                <span className='mb-3.5 inline-block rounded-full bg-[#EAFBF2] px-3 py-1 text-[11.5px] font-bold uppercase tracking-[.08em] text-[#0E9F6E] dark:bg-emerald-900/30 dark:text-emerald-400'>
                  Live
                </span>
                <div className='font-jakarta text-[22px] font-extrabold tracking-[-.024em] text-[#0F1222] dark:text-white'>
                  {tool.name}
                </div>
                <p className='mt-2.5 text-[15px] leading-relaxed text-[#5B5F73] text-pretty dark:text-gray-400'>
                  {tool.tagline}
                </p>
              </div>
            </Link>
          ))}

          <div className='overflow-hidden rounded-[20px] border border-[#E7E4F6] bg-white opacity-90 dark:border-slate-700 dark:bg-slate-800'>
            <div
              className='flex aspect-[16/10] items-center justify-center border-b border-[#E7E4F6] dark:border-slate-700'
              style={{ background: artworkGradient(tools.length) }}
            >
              <span className='text-xs font-semibold uppercase tracking-[.1em] text-white/90'>
                In development
              </span>
            </div>
            <div className='px-6 pb-7 pt-6'>
              <span className='mb-3.5 inline-block rounded-full bg-[#F1EFFA] px-3 py-1 text-[11.5px] font-bold uppercase tracking-[.08em] text-[#7C3AED] dark:bg-purple-900/30 dark:text-purple-400'>
                Coming soon
              </span>
              <div className='font-jakarta text-[22px] font-extrabold tracking-[-.024em] text-[#0F1222] dark:text-white'>
                {UPCOMING.name}
              </div>
              <p className='mt-2.5 text-[15px] leading-relaxed text-[#5B5F73] text-pretty dark:text-gray-400'>
                {UPCOMING.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
