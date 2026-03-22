import React from 'react';
import { cn } from '@heroui/react';
import FButton from './FButton';

interface FEmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'outline';
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: {
    container: 'w-12 h-12',
    icon: 'w-5 h-5',
    title: 'text-base font-semibold',
    padding: 'py-6',
  },
  md: {
    container: 'w-16 h-16',
    icon: 'w-7 h-7',
    title: 'text-lg font-semibold',
    padding: 'py-8',
  },
  lg: {
    container: 'w-20 h-20',
    icon: 'w-9 h-9',
    title: 'text-xl font-bold',
    padding: 'py-12',
  },
};

export default function FEmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: FEmptyStateProps) {
  const s = sizeMap[size];

  return (
    <div className={cn('text-center', s.padding, className)}>
      <div
        className={cn(
          'flex items-center justify-center mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800',
          s.container
        )}
      >
        <Icon className={cn(s.icon, 'text-gray-400 dark:text-gray-500')} />
      </div>
      <h4 className={cn(s.title, 'text-gray-900 dark:text-white mb-1')}>
        {title}
      </h4>
      {description && (
        <p className='text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto'>
          {description}
        </p>
      )}
      {action && (
        <FButton
          variant={action.variant ?? 'primary'}
          size='sm'
          onPress={action.onPress}
        >
          {action.label}
        </FButton>
      )}
    </div>
  );
}
