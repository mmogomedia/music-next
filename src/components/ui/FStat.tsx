import React from 'react';
import { cn } from '@heroui/react';

type FStatColor =
  | 'purple'
  | 'indigo'
  | 'violet'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'default'
  // legacy aliases kept for backward compat
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'teal';

type FStatLayout = 'icon-left' | 'stacked';

interface FStatProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: { value: number; label?: string };
  color?: FStatColor;
  size?: 'sm' | 'md';
  layout?: FStatLayout;
  className?: string;
}

/**
 * Color map — accent bar color + icon text color only.
 * No containers. Color lives as a 2px accent bar and inline icon tint.
 */
const colorMap: Record<FStatColor, { accent: string; icon: string }> = {
  purple: {
    accent: 'bg-primary-600',
    icon: 'text-primary-500 dark:text-primary-400',
  },
  indigo: {
    accent: 'bg-indigo-500',
    icon: 'text-indigo-500 dark:text-indigo-400',
  },
  violet: {
    accent: 'bg-violet-500',
    icon: 'text-violet-500 dark:text-violet-400',
  },
  emerald: {
    accent: 'bg-emerald-500',
    icon: 'text-emerald-500 dark:text-emerald-400',
  },
  rose: { accent: 'bg-rose-500', icon: 'text-rose-500 dark:text-rose-400' },
  amber: { accent: 'bg-amber-500', icon: 'text-amber-500 dark:text-amber-400' },
  default: { accent: 'bg-gray-300', icon: 'text-gray-400 dark:text-gray-500' },
  // Legacy aliases
  blue: {
    accent: 'bg-indigo-500',
    icon: 'text-indigo-500 dark:text-indigo-400',
  },
  green: {
    accent: 'bg-emerald-500',
    icon: 'text-emerald-500 dark:text-emerald-400',
  },
  red: { accent: 'bg-rose-500', icon: 'text-rose-500 dark:text-rose-400' },
  orange: {
    accent: 'bg-violet-500',
    icon: 'text-violet-500 dark:text-violet-400',
  },
  teal: {
    accent: 'bg-primary-600',
    icon: 'text-primary-500 dark:text-primary-400',
  },
};

function TrendBadge({ value, label }: { value: number; label?: string }) {
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isPositive
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-rose-500 dark:text-rose-400'
      )}
    >
      {isPositive ? '↑' : '↓'} {Math.abs(value)}%
      {label ? (
        <span className='text-gray-400 font-normal'> {label}</span>
      ) : null}
    </span>
  );
}

export default function FStat({
  label,
  value,
  icon: Icon,
  trend,
  color = 'default',
  size = 'md',
  layout = 'icon-left',
  className,
}: FStatProps) {
  const colors = colorMap[color];

  // Stacked layout — used for quick-stats strips (no icon, just value + label)
  if (layout === 'stacked') {
    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        <span
          className={cn(
            'font-bold text-gray-900 dark:text-white',
            size === 'sm' ? 'text-lg' : 'text-2xl'
          )}
        >
          {value}
        </span>
        <span className='text-xs text-gray-500 dark:text-gray-400'>
          {label}
        </span>
        {trend && <TrendBadge value={trend.value} label={trend.label} />}
      </div>
    );
  }

  // icon-left layout — thin accent bar + number + icon-inline label
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      {/* Thin left accent bar — the ONLY colored surface */}
      <div
        className={cn(
          'w-0.5 self-stretch rounded-full flex-shrink-0',
          colors.accent
        )}
      />
      <div className='flex flex-col min-w-0 gap-0.5'>
        {/* Value — the hero */}
        <span
          className={cn(
            'font-bold text-gray-900 dark:text-white leading-none',
            size === 'sm' ? 'text-xl' : 'text-2xl'
          )}
        >
          {value}
        </span>
        {/* Label row — icon tinted, text gray */}
        <div className='flex items-center gap-1 min-w-0'>
          {Icon && (
            <Icon
              className={cn(
                'flex-shrink-0',
                size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5',
                colors.icon
              )}
            />
          )}
          <span className='text-xs text-gray-500 dark:text-gray-400 truncate'>
            {label}
          </span>
        </div>
        {trend && <TrendBadge value={trend.value} label={trend.label} />}
      </div>
    </div>
  );
}
