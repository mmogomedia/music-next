'use client';

import { StatCard, StatCardSkeleton } from '@/components/ui/StatCard';

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

export default function StatsGrid({
  stats,
  growth,
  loading = false,
}: StatsGridProps) {
  return (
    <div className='bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm px-6 py-5'>
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-gray-100 dark:divide-slate-700'>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label='Plays'
              value={stats.totalPlays}
              growth={growth?.playsGrowth}
            />
            <StatCard
              label='Likes'
              value={stats.totalLikes}
              growth={growth?.likesGrowth}
            />
            <StatCard label='Listeners' value={stats.uniqueListeners} />
            <StatCard label='Downloads' value={stats.totalDownloads} />
          </>
        )}
      </div>
    </div>
  );
}
