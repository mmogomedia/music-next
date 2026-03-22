import React from 'react';
import { cn } from '@/lib/utils/cn';

type FChipVariant = 'flat' | 'outline' | 'solid' | 'dot';
type FChipColor =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
type FChipSize = 'xs' | 'sm' | 'md';

interface FChipProps {
  variant?: FChipVariant;
  color?: FChipColor;
  size?: FChipSize;
  children: React.ReactNode;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

// ── Color tokens ──────────────────────────────────────────────────────────────

const flatColors: Record<FChipColor, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
  primary:
    'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  success:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  warning:
    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
};

const outlineColors: Record<FChipColor, string> = {
  default:
    'border border-gray-300 text-gray-600 dark:border-slate-600 dark:text-gray-400',
  primary:
    'border border-primary-400 text-primary-600 dark:border-primary-500 dark:text-primary-400',
  success:
    'border border-emerald-400 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400',
  warning:
    'border border-amber-400 text-amber-600 dark:border-amber-500 dark:text-amber-400',
  danger:
    'border border-rose-400 text-rose-600 dark:border-rose-500 dark:text-rose-400',
  info: 'border border-sky-400 text-sky-600 dark:border-sky-500 dark:text-sky-400',
};

const solidColors: Record<FChipColor, string> = {
  default: 'bg-gray-600 text-white dark:bg-slate-500',
  primary: 'bg-primary-600 text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-rose-600 text-white',
  info: 'bg-sky-600 text-white',
};

const dotColors: Record<FChipColor, string> = {
  default: 'bg-gray-400',
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
};

// ── Size tokens ───────────────────────────────────────────────────────────────

const sizeClasses: Record<FChipSize, string> = {
  xs: 'h-4 px-1.5 text-[10px] gap-0.5 rounded',
  sm: 'h-5 px-2 text-xs gap-1 rounded-md',
  md: 'h-6 px-2.5 text-xs gap-1 rounded-lg',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FChip({
  variant = 'flat',
  color = 'default',
  size = 'sm',
  children,
  startContent,
  endContent,
  onClose,
  className,
}: FChipProps) {
  const colorClass =
    variant === 'flat'
      ? flatColors[color]
      : variant === 'outline'
        ? outlineColors[color]
        : variant === 'solid'
          ? solidColors[color]
          : flatColors[color]; // dot variant uses flat bg

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium leading-none select-none',
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {variant === 'dot' && (
        <span
          className={cn('rounded-full flex-shrink-0', dotColors[color], {
            'w-1.5 h-1.5': size === 'md',
            'w-1 h-1': size === 'sm' || size === 'xs',
          })}
        />
      )}
      {startContent && <span className='flex-shrink-0'>{startContent}</span>}
      {children}
      {endContent && <span className='flex-shrink-0'>{endContent}</span>}
      {onClose && (
        <button
          onClick={onClose}
          className='flex-shrink-0 ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 transition-colors'
          aria-label='Remove'
        >
          <svg
            className='w-2.5 h-2.5'
            viewBox='0 0 10 10'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
          >
            <path d='M1 1l8 8M9 1l-8 8' />
          </svg>
        </button>
      )}
    </span>
  );
}
