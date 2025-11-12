'use client';

import { Card, CardBody } from '@heroui/react';
import {
  MusicalNoteIcon,
  PlayIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';

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
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}
      >
        {isPositive ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
      <Card className='border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow'>
        <CardBody className='p-5'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0'>
              <MusicalNoteIcon className='w-6 h-6 text-white' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                {stats.totalTracks}
              </div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Tracks
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow'>
        <CardBody className='p-5'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0'>
              <PlayIcon className='w-6 h-6 text-white' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                {stats.totalPlays.toLocaleString()}
              </div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Plays
              </div>
              {growth && (
                <div className='mt-1'>{formatGrowth(growth.playsGrowth)}</div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow'>
        <CardBody className='p-5'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0'>
              <HeartIcon className='w-6 h-6 text-white' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                {stats.totalLikes.toLocaleString()}
              </div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Likes
              </div>
              {growth && (
                <div className='mt-1'>{formatGrowth(growth.likesGrowth)}</div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow'>
        <CardBody className='p-5'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0'>
              <ArrowDownTrayIcon className='w-6 h-6 text-white' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                {stats.totalDownloads.toLocaleString()}
              </div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Downloads
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow'>
        <CardBody className='p-5'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0'>
              <UserGroupIcon className='w-6 h-6 text-white' />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                {stats.uniqueListeners.toLocaleString()}
              </div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Listeners
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
