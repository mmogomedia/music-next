import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { LinkIcon } from '@heroicons/react/24/outline';
import { getAllTools, getToolsByCategory } from '@/lib/tools/registry';
import { ToolSummaryCard } from '@/components/tools/ToolSummaryCard';
import LearnHeader from '@/components/layout/LearnHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import { absoluteUrl, SITE_URL } from '@/lib/utils/site-url';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Free Music Business Tools for Independent Artists | Flemoji',
  description:
    'Free interactive tools for South African independent artists — split sheet calculator, revenue predictor, and more. No sign-up needed.',
  alternates: {
    canonical: absoluteUrl('/tools'),
  },
  openGraph: {
    title: 'Free Music Business Tools for Independent Artists | Flemoji',
    description:
      'Free interactive calculators to help independent artists navigate royalties, earnings, and the music business.',
    type: 'website',
    url: absoluteUrl('/tools'),
    siteName: 'Flemoji',
    // OG image is auto-discovered from src/app/tools/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Music Business Tools | Flemoji',
    description:
      'Free interactive calculators for independent artists — split sheets, revenue prediction, and more.',
    site: '@flemoji',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  royalties: 'Royalties',
  finance: 'Finance',
  distribution: 'Distribution',
  promotion: 'Promotion',
};

const QUICK_LINKS_TOOL = {
  name: 'Quick Links',
  tagline:
    'Create shareable links for your tracks, artist profile, and albums. Track visits and plays in real time.',
  category: 'Promotion',
  gradient: 'from-blue-500 to-cyan-500',
  features: [
    'Track, artist & album links',
    'Custom slugs',
    'Visit & play analytics',
  ],
};

export default function ToolsPage() {
  const byCategory = getToolsByCategory();
  const all = getAllTools();
  // +1 for Quick Links (dashboard-only, not in registry)
  const totalTools = all.length + 1;
  const activeCategories = Object.entries(byCategory).filter(
    ([, tools]) => tools.length > 0
  );
  // +1 for Promotion (Quick Links adds this category even if registry has none)
  const totalCategories =
    activeCategories.length +
    (activeCategories.some(([c]) => c === 'promotion') ? 0 : 1);

  return (
    <div className='min-h-screen bg-white dark:bg-slate-900'>
      <LearnHeader />

      {/* Hero */}
      <section className='relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700'>
        <div
          className='absolute inset-0 opacity-[0.07]'
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className='relative max-w-5xl mx-auto px-6 py-14 md:py-20'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-8'>
            <div className='max-w-xl'>
              <div className='mb-6'>
                <Image
                  src='/main_logo.png'
                  alt='Flemoji'
                  width={160}
                  height={44}
                  className='h-10 w-auto brightness-0 invert'
                  priority
                />
              </div>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-sm'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                Free Tools
              </div>
              <h1 className='font-poppins text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4'>
                Tools for
                <br className='hidden sm:block' /> independent artists
              </h1>
              <p className='text-indigo-100/80 text-lg leading-relaxed max-w-md'>
                Practical, free calculators and generators to help you navigate
                royalties, earnings, and the music business.
              </p>
            </div>

            <div className='flex gap-6 md:flex-col md:gap-4 md:text-right'>
              <div>
                <p className='text-3xl font-extrabold text-white'>
                  {totalTools}
                </p>
                <p className='text-indigo-200/70 text-sm'>Tools</p>
              </div>
              <div>
                <p className='text-3xl font-extrabold text-white'>
                  {totalCategories}
                </p>
                <p className='text-indigo-200/70 text-sm'>Categories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools by category */}
      <div className='max-w-5xl mx-auto px-6 py-12 space-y-12'>
        {activeCategories.map(([category, tools]) => (
          <section key={category}>
            <div className='flex items-center gap-3 mb-6'>
              <h2 className='font-poppins text-lg font-bold text-gray-900 dark:text-white'>
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <span className='px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-full'>
                {tools.length}
              </span>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {tools.map(tool => (
                <ToolSummaryCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        ))}

        {/* Promotion — Quick Links (dashboard-native, requires account) */}
        <section>
          <div className='flex items-center gap-3 mb-6'>
            <h2 className='font-poppins text-lg font-bold text-gray-900 dark:text-white'>
              Promotion
            </h2>
            <span className='px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-full'>
              1
            </span>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Quick Links — routes to dashboard (auth required) */}
            <Link
              href='/dashboard/tools/quick-links'
              className='group relative flex flex-col rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/30 transition-all duration-200 cursor-pointer'
            >
              {/* Hover glow */}
              <div className='absolute inset-0 opacity-0 group-hover:opacity-[0.03] bg-gradient-to-br from-blue-500 to-cyan-500 transition-opacity duration-300 pointer-events-none' />

              {/* Top: icon + meta + arrow */}
              <div className='relative flex items-center gap-4 px-5 pt-5 pb-4'>
                <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-[1.04] transition-all duration-200'>
                  <LinkIcon className='w-6 h-6 text-white' aria-hidden='true' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5'>
                    {QUICK_LINKS_TOOL.category}
                  </p>
                  <p className='text-sm font-bold text-gray-900 dark:text-white leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150'>
                    {QUICK_LINKS_TOOL.name}
                  </p>
                </div>
                <div className='w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 shadow-sm'>
                  <svg
                    className='w-3.5 h-3.5 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2.5}
                      d='M17 8l4 4m0 0l-4 4m4-4H3'
                    />
                  </svg>
                </div>
              </div>

              {/* Tagline */}
              <p className='relative px-5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2'>
                {QUICK_LINKS_TOOL.tagline}
              </p>

              {/* Divider */}
              <div className='relative mx-5 my-4 border-t border-gray-100 dark:border-slate-700/50' />

              {/* Feature chips + account badge */}
              <div className='relative flex flex-wrap gap-1.5 px-5 pb-5'>
                {QUICK_LINKS_TOOL.features.map(f => (
                  <span
                    key={f}
                    className='inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600/50 rounded-full px-2.5 py-1 leading-none'
                  >
                    <span className='w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0' />
                    {f}
                  </span>
                ))}
                <span className='inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-full px-2.5 py-1 leading-none ml-auto'>
                  Free account
                </span>
              </div>

              {/* Gradient bottom accent line */}
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300' />
            </Link>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
