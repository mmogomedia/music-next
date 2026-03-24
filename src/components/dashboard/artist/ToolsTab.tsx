'use client';

import { useRouter } from 'next/navigation';
import {
  WrenchScrewdriverIcon,
  ScaleIcon,
  BanknotesIcon,
  MegaphoneIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { FCard, FStat } from '@/components/ui';
import { getAllTools } from '@/lib/tools/registry';
import { ToolSummaryCard } from '@/components/tools/ToolSummaryCard';

// Quick Links lives in the dashboard, not the public registry
const QUICK_LINKS_CARD = {
  name: 'Quick Links',
  tagline:
    'Create shareable links for your tracks, artist profile, and albums.',
  category: 'Promotion',
  gradient: 'from-blue-500 to-cyan-500',
  features: [
    'Track, artist & album links',
    'Custom slugs',
    'Visit & play analytics',
  ],
};

export default function ToolsTab() {
  const router = useRouter();
  const publicTools = getAllTools();

  const grouped = {
    royalties: publicTools.filter(t => t.category === 'royalties').length,
    finance: publicTools.filter(t => t.category === 'finance').length,
    promotion: publicTools.filter(t => t.category === 'promotion').length + 1,
  };
  const totalTools = publicTools.length + 1;

  return (
    <div className='space-y-4'>
      {/* Stats row — mirrors LibraryTab */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <FCard padding='sm'>
          <FStat
            label='Total Tools'
            value={totalTools}
            icon={WrenchScrewdriverIcon}
            color='purple'
          />
        </FCard>
        <FCard padding='sm'>
          <FStat
            label='Royalties'
            value={grouped.royalties}
            icon={ScaleIcon}
            color='purple'
          />
        </FCard>
        <FCard padding='sm'>
          <FStat
            label='Finance'
            value={grouped.finance}
            icon={BanknotesIcon}
            color='emerald'
          />
        </FCard>
        <FCard padding='sm'>
          <FStat
            label='Promotion'
            value={grouped.promotion}
            icon={MegaphoneIcon}
            color='blue'
          />
        </FCard>
      </div>

      {/* Tools grid — mirrors the tracks FCard in LibraryTab */}
      <FCard
        padding='none'
        title='Artist Tools'
        titleIcon={<WrenchScrewdriverIcon className='w-4 h-4' />}
      >
        <div className='p-5 sm:p-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Public tools from registry — link to /tools/[slug] */}
            {publicTools.map(tool => (
              <ToolSummaryCard key={tool.slug} tool={tool} />
            ))}

            {/* Quick Links — navigates to its own dashboard page */}
            <button
              type='button'
              onClick={() => router.push('/dashboard/tools/quick-links')}
              className='group relative flex flex-col rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/30 transition-all duration-200 text-left cursor-pointer'
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
                    {QUICK_LINKS_CARD.category}
                  </p>
                  <p className='text-sm font-bold text-gray-900 dark:text-white leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150'>
                    {QUICK_LINKS_CARD.name}
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
                {QUICK_LINKS_CARD.tagline}
              </p>

              {/* Divider */}
              <div className='relative mx-5 my-4 border-t border-gray-100 dark:border-slate-700/50' />

              {/* Feature chips */}
              <div className='relative flex flex-wrap gap-1.5 px-5 pb-5'>
                {QUICK_LINKS_CARD.features.map(f => (
                  <span
                    key={f}
                    className='inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600/50 rounded-full px-2.5 py-1 leading-none'
                  >
                    <span className='w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0' />
                    {f}
                  </span>
                ))}
              </div>

              {/* Gradient bottom accent */}
              <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300' />
            </button>
          </div>
        </div>
      </FCard>
    </div>
  );
}
