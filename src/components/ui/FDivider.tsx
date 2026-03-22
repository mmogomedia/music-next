import { cn } from '@/lib/utils/cn';

type FDividerSpacing = 'sm' | 'md' | 'lg';

interface FDividerProps {
  spacing?: FDividerSpacing;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const spacingClasses: Record<FDividerSpacing, string> = {
  sm: 'my-3',
  md: 'my-4',
  lg: 'my-6',
};

export default function FDivider({
  spacing = 'md',
  orientation = 'horizontal',
  className,
}: FDividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn(
          'w-px self-stretch bg-gray-200 dark:bg-slate-700',
          className
        )}
        role='separator'
        aria-orientation='vertical'
      />
    );
  }
  return (
    <hr
      className={cn(
        'border-0 border-t border-gray-200 dark:border-slate-700',
        spacingClasses[spacing],
        className
      )}
    />
  );
}
