'use client';

import Link from 'next/link';
import type { ToolDefinition } from '@/lib/tools/registry';

interface ToolSummaryCardProps {
  tool: ToolDefinition;
}

const CATEGORY_ICONS: Record<string, string> = {
  royalties: '⚖️',
  finance: '📊',
  distribution: '🚀',
  promotion: '📣',
};

const CATEGORY_LABELS: Record<string, string> = {
  royalties: 'Royalties',
  finance: 'Finance',
  distribution: 'Distribution',
  promotion: 'Promotion',
};

export function ToolSummaryCard({ tool }: ToolSummaryCardProps) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className='group relative flex flex-col rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:border-transparent hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/30 transition-all duration-200 cursor-pointer'
    >
      {/* Subtle gradient glow on hover (background layer) */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] bg-gradient-to-br ${tool.gradient} transition-opacity duration-300 pointer-events-none`}
      />

      {/* Top section: icon + meta + arrow */}
      <div className='relative flex items-center gap-4 px-5 pt-5 pb-4'>
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-[1.04] transition-all duration-200`}
        >
          <span className='text-[22px] leading-none select-none'>
            {CATEGORY_ICONS[tool.category] ?? '🔧'}
          </span>
        </div>

        <div className='flex-1 min-w-0'>
          {/* Category label */}
          <p className='text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5'>
            {CATEGORY_LABELS[tool.category]}
          </p>
          {/* Tool name */}
          <p className='text-sm font-bold text-gray-900 dark:text-white leading-snug truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-150'>
            {tool.name}
          </p>
        </div>

        {/* Arrow button */}
        <div
          className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center flex-shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200 shadow-sm`}
        >
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
        {tool.tagline}
      </p>

      {/* Divider */}
      <div className='relative mx-5 my-4 border-t border-gray-100 dark:border-slate-700/50' />

      {/* Feature chips */}
      <div className='relative flex flex-wrap gap-1.5 px-5 pb-5'>
        {tool.features.map(f => (
          <span
            key={f}
            className='inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600/50 rounded-full px-2.5 py-1 leading-none'
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${tool.gradient} flex-shrink-0`}
            />
            {f}
          </span>
        ))}
      </div>

      {/* Gradient bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </Link>
  );
}
