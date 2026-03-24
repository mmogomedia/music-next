import { cn } from '@/lib/utils/cn';

type FSpinnerSize = 'sm' | 'md' | 'lg';

interface FSpinnerProps {
  size?: FSpinnerSize;
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses: Record<FSpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-[3px]',
};

export default function FSpinner({
  size = 'md',
  label,
  fullScreen = false,
  className,
}: FSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full border-gray-200 dark:border-slate-700 border-t-primary-500 animate-spin',
          sizeClasses[size]
        )}
        role='status'
        aria-label={label ?? 'Loading'}
      />
      {label && (
        <p className='text-sm text-gray-500 dark:text-gray-400'>{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        {spinner}
      </div>
    );
  }

  return spinner;
}
