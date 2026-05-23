'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, CheckIcon } from '@heroicons/react/24/outline';

interface DownloadArticleButtonProps {
  slug: string;
}

export default function DownloadArticleButton({
  slug,
}: DownloadArticleButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleDownload = async () => {
    if (state === 'loading') return;
    setState('loading');
    try {
      const res = await fetch(`/api/articles/${slug}/export`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState('done');
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('idle');
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={state === 'loading'}
      title='Download article as Markdown'
      className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
    >
      {state === 'done' ? (
        <>
          <CheckIcon className='w-3.5 h-3.5 text-green-500' />
          <span className='text-green-600 dark:text-green-400'>
            Downloaded!
          </span>
        </>
      ) : state === 'loading' ? (
        <>
          <span className='w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin' />
          Exporting…
        </>
      ) : (
        <>
          <ArrowDownTrayIcon className='w-3.5 h-3.5' />
          Download .md
        </>
      )}
    </button>
  );
}
