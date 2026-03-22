'use client';

interface StatsGridProps {
  stats: {
    totalTracks: number;
    totalPlays: number;
    totalLikes: number;
    totalDownloads: number;
    uniqueListeners: number;
  };
  growth?: {
    playsGrowth?: number;
    likesGrowth?: number;
    sharesGrowth?: number;
  };
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: number;
  growthValue?: number;
}

function StatCard({ label, value, growthValue }: StatCardProps) {
  const hasGrowth = growthValue !== undefined;
  const isPositive = hasGrowth && growthValue >= 0;

  return (
    <div className='flex flex-col gap-1 px-1'>
      <p className='text-xs text-gray-400 dark:text-gray-500 font-medium'>
        {label}
      </p>
      <p className='text-2xl font-semibold text-gray-900 dark:text-white tabular-nums'>
        {value.toLocaleString()}
      </p>
      {hasGrowth ? (
        <p
          className={`text-xs font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}
        >
          {isPositive ? '+' : ''}
          {growthValue.toFixed(1)}%
        </p>
      ) : (
        <p className='text-xs text-transparent select-none'>—</p>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className='flex flex-col gap-1 px-1 animate-pulse'>
      <div className='h-3 w-14 bg-gray-100 dark:bg-slate-700 rounded' />
      <div className='h-7 w-20 bg-gray-100 dark:bg-slate-700 rounded' />
      <div className='h-3 w-10 bg-gray-100 dark:bg-slate-700 rounded' />
    </div>
  );
}

export default function StatsGrid({
  stats,
  growth,
  loading = false,
}: StatsGridProps) {
  if (loading) {
    return (
      <div className='bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm px-6 py-5'>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-gray-100 dark:divide-slate-700'>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm px-6 py-5'>
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-gray-100 dark:divide-slate-700'>
        <StatCard
          label='Plays'
          value={stats.totalPlays}
          growthValue={growth?.playsGrowth}
        />
        <StatCard
          label='Likes'
          value={stats.totalLikes}
          growthValue={growth?.likesGrowth}
        />
        <StatCard label='Listeners' value={stats.uniqueListeners} />
        <StatCard label='Downloads' value={stats.totalDownloads} />
      </div>
    </div>
  );
}
