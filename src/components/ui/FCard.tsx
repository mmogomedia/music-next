'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

// ── Public types ──────────────────────────────────────────────────────────────

export interface FCardProps {
  // ── Header (only rendered when title is provided) ──────────────────────────
  title?: string;
  /** Small icon displayed before the title text */
  titleIcon?: ReactNode;
  /** Small muted line below the title */
  subtitle?: string;
  /** Right-side slot: button, badge, chip, live indicator, etc. */
  action?: ReactNode;

  // ── Body ───────────────────────────────────────────────────────────────────
  children: ReactNode;
  /** @default 'md' */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Adds divide-y between direct children — ideal for list cards */
  divided?: boolean;

  // ── Footer (tags, action buttons, status chips) ────────────────────────────
  /** Rendered below the body separated by a border-t divider */
  footer?: ReactNode;

  // ── States ─────────────────────────────────────────────────────────────────
  /** Renders FCardSkeleton in place of children when true */
  loading?: boolean;
  /** Makes the entire card clickable — adds hover shadow + cursor-pointer */
  onClick?: () => void;

  // ── Accent left-border strip ───────────────────────────────────────────────
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info';

  // ── Appearance ─────────────────────────────────────────────────────────────
  /** @default 'default' */
  variant?: 'default' | 'flat';
  className?: string;
  bodyClassName?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const variantClasses: Record<'default' | 'flat', string> = {
  default:
    'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm',
  flat: 'bg-gray-50/80 dark:bg-slate-900/40 border-0 rounded-xl',
};

const paddingClasses: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

const accentClasses: Record<NonNullable<FCardProps['accent']>, string> = {
  primary: 'border-l-[3px] border-l-primary-500',
  success: 'border-l-[3px] border-l-emerald-500',
  warning: 'border-l-[3px] border-l-amber-500',
  danger: 'border-l-[3px] border-l-rose-500',
  info: 'border-l-[3px] border-l-sky-500',
};

// ── FCardSkeleton ─────────────────────────────────────────────────────────────

export function FCardSkeleton({
  rows = 4,
  header = true,
}: {
  rows?: number;
  header?: boolean;
}) {
  return (
    <div className='animate-pulse space-y-3'>
      {header && (
        <div className='h-3 w-1/3 bg-gray-100 dark:bg-slate-700 rounded' />
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='h-4 bg-gray-100 dark:bg-slate-700 rounded' />
      ))}
    </div>
  );
}

// ── FCard ─────────────────────────────────────────────────────────────────────

export default function FCard({
  title,
  titleIcon,
  subtitle,
  action,
  children,
  padding = 'md',
  divided = false,
  footer,
  loading = false,
  onClick,
  accent,
  variant = 'default',
  className,
  bodyClassName,
}: FCardProps) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        accent && accentClasses[accent],
        onClick &&
          'cursor-pointer hover:shadow-md transition-shadow duration-200',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
    >
      {/* Header — only rendered when title is provided */}
      {title && (
        <div className='px-5 py-3.5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2 min-w-0'>
            {titleIcon && (
              <span className='flex-shrink-0 text-gray-400 dark:text-gray-500'>
                {titleIcon}
              </span>
            )}
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                {title}
              </p>
              {subtitle && (
                <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate'>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className='flex-shrink-0'>{action}</div>}
        </div>
      )}

      {/* Body */}
      <div
        className={cn(
          paddingClasses[padding],
          divided &&
            'divide-y divide-gray-100 dark:divide-slate-700/50 [&>*]:py-3 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0',
          bodyClassName
        )}
      >
        {loading ? <FCardSkeleton /> : children}
      </div>

      {/* Footer — tags, action buttons, links, status chips */}
      {footer && (
        <div className='px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2 flex-wrap'>
          {footer}
        </div>
      )}
    </div>
  );
}
