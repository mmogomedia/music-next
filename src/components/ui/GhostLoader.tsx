'use client';

interface GhostLoaderProps {
  variant?: 'post' | 'conversation' | 'comment' | 'list' | 'button';
  count?: number;
  className?: string;
}

export default function GhostLoader({
  variant = 'post',
  count = 1,
  className = '',
}: GhostLoaderProps) {
  const renderLoader = () => {
    switch (variant) {
      case 'post':
        return (
          <div className='bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 animate-pulse'>
            <div className='flex items-start gap-3'>
              <div className='w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full flex-shrink-0' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4' />
                <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/6' />
              </div>
            </div>
            <div className='mt-4 space-y-2'>
              <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded' />
              <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6' />
            </div>
            <div className='mt-4 h-48 bg-gray-200 dark:bg-slate-700 rounded-lg' />
            <div className='mt-4 flex items-center gap-4'>
              <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-16' />
              <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-16' />
              <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-16' />
            </div>
          </div>
        );

      case 'conversation':
        return (
          <div className='space-y-1'>
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className='px-3 py-2.5 rounded-lg border border-transparent animate-pulse'
              >
                <div className='flex items-center gap-2'>
                  <div className='flex-1 space-y-1.5'>
                    <div className='h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-full max-w-[85%]' />
                    <div className='flex items-center gap-1.5'>
                      <div className='w-3 h-3 bg-gray-200 dark:bg-slate-700 rounded flex-shrink-0' />
                      <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-16' />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'comment':
        return (
          <div className='space-y-4'>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className='flex gap-3 p-3 rounded-lg animate-pulse'>
                <div className='w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full flex-shrink-0' />
                <div className='flex-1 space-y-2'>
                  <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4' />
                  <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded' />
                  <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4' />
                </div>
              </div>
            ))}
          </div>
        );

      case 'list':
        return (
          <div className='space-y-2'>
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className='flex items-center gap-3 p-2 rounded-lg animate-pulse'
              >
                <div className='w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg flex-shrink-0' />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3' />
                  <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3' />
                </div>
              </div>
            ))}
          </div>
        );

      case 'button':
        return (
          <div className='h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse' />
        );

      default:
        return (
          <div className='h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse' />
        );
    }
  };

  return <div className={className}>{renderLoader()}</div>;
}
