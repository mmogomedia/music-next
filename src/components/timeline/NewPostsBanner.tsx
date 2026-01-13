'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface NewPostsBannerProps {
  count: number;
  onRefresh: () => void;
  onDismiss?: () => void;
}

export default function NewPostsBanner({
  count,
  onRefresh,
  onDismiss,
}: NewPostsBannerProps) {
  if (count === 0) return null;

  return (
    <div className='sticky top-20 z-30 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mb-3 animate-in slide-in-from-top-2 duration-300'>
      <div className='bg-gray-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-lg shadow-sm p-2.5 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          <div className='flex-shrink-0 w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse' />
          <span className='text-xs text-gray-700 dark:text-gray-300 truncate'>
            {count} new {count === 1 ? 'post' : 'posts'} available
          </span>
        </div>
        <div className='flex items-center gap-1.5 flex-shrink-0'>
          <button
            onClick={onRefresh}
            className='px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5'
          >
            <ArrowPathIcon className='w-3.5 h-3.5' />
            Refresh
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className='px-2.5 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md text-xs font-medium transition-colors'
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
