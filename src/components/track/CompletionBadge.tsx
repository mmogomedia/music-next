/**
 * CompletionBadge Component
 *
 * Displays track completion percentage with enhanced color coding and visual design
 * - Red/Danger: 0-39% (Needs Work)
 * - Yellow/Warning: 40-79% (In Progress)
 * - Green/Success: 80-100% (Complete)
 */

import { Tooltip } from '@heroui/react';
import { getCompletionStatus } from '@/lib/utils/track-completion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

interface CompletionBadgeProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'flat' | 'solid' | 'bordered' | 'light' | 'dot' | 'faded';
  showTooltip?: boolean;
  className?: string;
}

export default function CompletionBadge({
  percentage,
  size = 'sm',
  showTooltip = true,
  className = '',
}: CompletionBadgeProps) {
  const status = getCompletionStatus(percentage);
  const isComplete = percentage >= 80;
  const isWarning = percentage >= 40 && percentage < 80;

  // Size-based styling
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  // Color-based styling with vibrant, visible colors
  const getColorClasses = () => {
    if (isComplete) {
      return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
    } else if (isWarning) {
      return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
    } else {
      return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
    }
  };

  const iconSize =
    size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  // Get icon based on status
  const getIcon = () => {
    if (isComplete) {
      return <CheckCircleIcon className={iconSize} />;
    } else if (isWarning) {
      return <ExclamationTriangleIcon className={iconSize} />;
    } else {
      return <XCircleIcon className={iconSize} />;
    }
  };

  const badge = (
    <div
      className={`
        inline-flex items-center gap-1.5
        ${sizeClasses[size]}
        ${getColorClasses()}
        border rounded-full
        font-semibold
        transition-all duration-200
        ${className}
      `}
    >
      {getIcon()}
      <span className='tabular-nums'>{percentage}%</span>
    </div>
  );

  if (showTooltip) {
    return (
      <Tooltip
        content={
          <div className='space-y-1'>
            <p className='font-medium'>Track Completion: {percentage}%</p>
            <p className='text-xs opacity-90'>{status}</p>
            {isComplete && (
              <p className='text-xs text-green-300'>Track is complete!</p>
            )}
            {!isComplete && (
              <p className='text-xs text-gray-300'>
                {100 - percentage}% remaining to complete
              </p>
            )}
          </div>
        }
      >
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
