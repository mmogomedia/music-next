'use client';

export interface StatCardProps {
  label: string;
  value: number | string;
  /** Optional growth/change percentage. Positive = green, negative = red */
  growth?: number;
  /** Additional text below the value (e.g. "/ 100", "plays") */
  suffix?: string;
}

export default function StatCard({
  label,
  value,
  growth,
  suffix,
}: StatCardProps) {
  const hasGrowth = growth !== undefined;
  const isPositive = hasGrowth && growth >= 0;
  const displayValue =
    typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className='flex flex-col gap-1 px-1'>
      <p className='text-xs text-gray-400 dark:text-gray-500 font-medium'>
        {label}
      </p>
      <p className='text-2xl font-semibold text-gray-900 dark:text-white tabular-nums'>
        {displayValue}
        {suffix && (
          <span className='text-sm font-normal text-gray-400 dark:text-gray-500 ml-1'>
            {suffix}
          </span>
        )}
      </p>
      {/* Fixed height row keeps cards vertically aligned whether or not growth is shown */}
      <div className='h-4 flex items-center'>
        {hasGrowth && (
          <p
            className={`text-xs font-medium ${
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-500 dark:text-rose-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {growth.toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
}

/** Skeleton placeholder — same grid footprint as StatCard */
export function StatCardSkeleton() {
  return (
    <div className='flex flex-col gap-1 px-1 animate-pulse'>
      <div className='h-3 w-14 bg-gray-100 dark:bg-slate-700 rounded' />
      <div className='h-7 w-20 bg-gray-100 dark:bg-slate-700 rounded' />
      <div className='h-3 w-10 bg-gray-100 dark:bg-slate-700 rounded' />
    </div>
  );
}
