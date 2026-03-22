'use client';

import {
  MusicalNoteIcon,
  PlayIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface StatsGridProps {
  stats: {
    totalTracks: number;
    totalPlays: number;
    totalLikes: number;
    totalDownloads: number;
    uniqueListeners: number;
  };
  growth?: {
    playsGrowth: number;
    likesGrowth: number;
  };
}

export default function StatsGrid({ stats, growth }: StatsGridProps) {
  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <span
        className={`text-xs font-medium ${
          isPositive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        {isPositive ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
      </span>
    );
  };

  const statItems = [
    {
      label: 'Tracks',
      value: stats.totalTracks,
      icon: MusicalNoteIcon,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    },
    {
      label: 'Plays',
      value: stats.totalPlays,
      icon: PlayIcon,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      growth: growth?.playsGrowth,
    },
    {
      label: 'Likes',
      value: stats.totalLikes,
      icon: HeartIcon,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/20',
      growth: growth?.likesGrowth,
    },
    {
      label: 'Downloads',
      value: stats.totalDownloads,
      icon: ArrowDownTrayIcon,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-950/20',
    },
    {
      label: 'Listeners',
      value: stats.uniqueListeners,
      icon: UserGroupIcon,
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-950/20',
    },
  ];

  return (
    <div className='grid grid-cols-2 gap-2'>
      {statItems.map(item => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`group flex items-center gap-2 p-2 rounded-lg ${item.bgColor} hover:bg-opacity-80 dark:hover:bg-opacity-30 transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-700`}
          >
            <div
              className={`w-7 h-7 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
            >
              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                {item.label}
              </div>
              <div className='flex items-baseline gap-1'>
                <span className='text-base font-bold text-gray-900 dark:text-white'>
                  {item.value.toLocaleString()}
                </span>
                {item.growth !== undefined && (
                  <div className='flex-shrink-0 text-[10px]'>
                    {formatGrowth(item.growth)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
