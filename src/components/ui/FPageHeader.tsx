import React from 'react';
import { cn } from '@/lib/utils/cn';

interface FPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: string[];
  className?: string;
}

export default function FPageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  className,
}: FPageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className='min-w-0'>
        {breadcrumb && breadcrumb.length > 0 && (
          <p className='text-xs text-gray-400 dark:text-gray-500 mb-1'>
            {breadcrumb.join(' / ')}
          </p>
        )}
        <h2 className='font-poppins text-xl font-bold text-gray-900 dark:text-white leading-tight truncate'>
          {title}
        </h2>
        {subtitle && (
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className='flex items-center gap-2 flex-shrink-0'>{actions}</div>
      )}
    </div>
  );
}
