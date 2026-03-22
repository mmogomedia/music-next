import type { Metadata } from 'next';
import Image from 'next/image';
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

export default function ToolsPage() {
  const byCategory = getToolsByCategory();
  const all = getAllTools();
  const activeCategories = Object.entries(byCategory).filter(
    ([, tools]) => tools.length > 0
  );

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
                  {all.length}
                </p>
                <p className='text-indigo-200/70 text-sm'>Tools</p>
              </div>
              <div>
                <p className='text-3xl font-extrabold text-white'>
                  {activeCategories.length}
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
      </div>

      <PublicFooter />
    </div>
  );
}
