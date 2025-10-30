'use client';

import { Card, CardBody } from '@heroui/react';
import {
  MusicalNoteIcon,
  PlayIcon,
  HeartIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  BookmarkIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';

interface StatsGridProps {
  stats: {
    totalTracks: number;
    totalPlays: number;
    totalLikes: number;
    totalShares: number;
    totalDownloads: number;
    totalSaves: number;
    uniqueListeners: number;
    avgDuration: number;
    avgCompletionRate: number;
  };
  growth?: {
    playsGrowth: number;
    likesGrowth: number;
    sharesGrowth: number;
  };
}

export default function StatsGrid({ stats, growth }: StatsGridProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <span
        className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}
      >
        {isPositive ? '+' : ''}
        {growth.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-4 text-center'>
          <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2'>
            <MusicalNoteIcon className='w-5 h-5 text-white' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {stats.totalTracks}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Tracks</div>
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-4 text-center'>
          <div className='w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2'>
            <PlayIcon className='w-5 h-5 text-white' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {stats.totalPlays.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Plays</div>
          {growth && (
            <div className='mt-1'>{formatGrowth(growth.playsGrowth)}</div>
          )}
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-4 text-center'>
          <div className='w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-2'>
            <HeartIcon className='w-5 h-5 text-white' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {stats.totalLikes.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Likes</div>
          {growth && (
            <div className='mt-1'>{formatGrowth(growth.likesGrowth)}</div>
          )}
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-4 text-center'>
          <div className='w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2'>
            <ShareIcon className='w-5 h-5 text-white' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {stats.totalShares.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Shares</div>
          {growth && (
            <div className='mt-1'>{formatGrowth(growth.sharesGrowth)}</div>
          )}
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-4 text-center'>
          <div className='w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-2'>
            <ArrowDownTrayIcon className='w-5 h-5 text-white' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {stats.totalDownloads.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Downloads
          </div>
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-4 text-center'>
          <div className='w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-2'>
            <BookmarkIcon className='w-5 h-5 text-white' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {stats.totalSaves.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>Saves</div>
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-4 text-center'>
          <div className='w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mx-auto mb-2'>
            <UserGroupIcon className='w-5 h-5 text-white' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {stats.uniqueListeners.toLocaleString()}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Listeners
          </div>
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-4 text-center'>
          <div className='w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-2'>
            <ClockIcon className='w-5 h-5 text-white' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            {formatDuration(stats.avgDuration)}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Avg Duration
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
