'use client';

import React from 'react';

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
  borderColor: string;
  growthValue?: number;
}

function StatCard({ label, value, borderColor, growthValue }: StatCardProps) {
  const isPositive = growthValue !== undefined && growthValue >= 0;

  return (
    <div
      className={`bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm p-5 border-l-4 ${borderColor}`}
    >
      <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1'>
        {label}
      </p>
      <p className='text-3xl font-bold text-gray-900 dark:text-white leading-none'>
        {value.toLocaleString()}
      </p>
      {/* growth row — always render to keep height consistent */}
      <div className='mt-2 h-5 flex items-center'>
        {growthValue !== undefined ? (
          <span
            className={`text-xs font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(growthValue).toFixed(1)}%{' '}
            <span className='text-gray-400 dark:text-gray-500 font-normal'>
              vs prev period
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className='bg-white dark:bg-slate-800/60 rounded-2xl shadow-sm p-5 border-l-4 border-l-gray-200 dark:border-l-slate-700 animate-pulse'>
      <div className='h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-2' />
      <div className='h-8 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-3' />
      <div className='h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded' />
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
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
      <StatCard
        label='Plays'
        value={stats.totalPlays}
        borderColor='border-l-emerald-500'
        growthValue={growth?.playsGrowth}
      />
      <StatCard
        label='Likes'
        value={stats.totalLikes}
        borderColor='border-l-rose-500'
        growthValue={growth?.likesGrowth}
      />
      <StatCard
        label='Listeners'
        value={stats.uniqueListeners}
        borderColor='border-l-primary-500'
      />
      <StatCard
        label='Downloads'
        value={stats.totalDownloads}
        borderColor='border-l-violet-500'
      />
    </div>
  );
}
