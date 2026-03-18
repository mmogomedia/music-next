'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ToolShellProps {
  title: string;
  subtitle: string;
  /** Tailwind gradient string — e.g. 'from-purple-500 to-indigo-600' */
  gradient: string;
  /** Action buttons rendered in the sticky header (right side) */
  actions?: React.ReactNode;
  /** Main scrollable content (left/center panel) */
  children: React.ReactNode;
  /** Right sidebar content — rendered inside the standard sidebar chrome */
  sidebar?: React.ReactNode;
}

/**
 * Shared fullscreen layout shell for all Flemoji tools.
 *
 * Renders a sticky header with a colour accent bar, a scrollable left panel,
 * and an optional right sidebar with a standardised footer.
 *
 * Usage:
 *   <ToolShell title="My Tool" subtitle="..." gradient="from-x to-y" actions={<Buttons />} sidebar={<Panel />}>
 *     <div className='max-w-2xl px-8 py-10'>…form…</div>
 *   </ToolShell>
 */
export function ToolShell({
  title,
  subtitle,
  gradient,
  actions,
  children,
  sidebar,
}: ToolShellProps) {
  return (
    <div className='flex h-full'>
      {/* ── Left: Main content ─────────────────────────────────────────── */}
      <div className='flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900'>
        {/* Gradient accent line */}
        <div className={`flex-shrink-0 h-0.5 bg-gradient-to-r ${gradient}`} />

        {/* Sticky header */}
        <div className='flex-shrink-0 px-4 md:px-8 lg:px-12 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 md:gap-4'>
          <div className='min-w-0'>
            <h1 className='text-base font-bold text-gray-900 dark:text-white tracking-tight leading-none truncate'>
              {title}
            </h1>
            <p className='text-xs text-gray-400 dark:text-slate-500 mt-0.5'>
              {subtitle}
            </p>
          </div>
          {actions && (
            <div className='flex items-center gap-2 flex-shrink-0'>
              {actions}
            </div>
          )}
        </div>

        {/* Scrollable content area */}
        <div className='flex-1 overflow-y-auto no-scrollbar'>{children}</div>
      </div>

      {/* ── Right: Sidebar — hidden on mobile, shown md+ ──────────────── */}
      {sidebar && (
        <div className='hidden md:flex md:w-80 lg:w-96 border-l border-gray-100 dark:border-slate-800 flex-shrink-0 flex-col'>
          <div className='flex-1 overflow-y-auto no-scrollbar bg-gray-50 dark:bg-slate-900'>
            <div className='px-5 py-6 space-y-4'>{sidebar}</div>
          </div>

          {/* Sidebar footer — consistent across all tools */}
          <div className='flex-shrink-0 px-5 py-3.5 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between'>
            <Link
              href='/tools'
              className='flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium'
            >
              <ArrowLeftIcon className='w-3 h-3' />
              All tools
            </Link>
            <Link
              href='/learn'
              className='text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium'
            >
              Browse all articles →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
