'use client';

import { Card, CardBody } from '@heroui/react';
import {
  MusicalNoteIcon,
  PlayIcon,
  HeartIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/solid';

interface StatsGridProps {
  stats: {
    totalTracks: number;
    totalPlays: number;
    totalLikes: number;
    totalRevenue: number;
  };
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
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
        </CardBody>
      </Card>

      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-4 text-center'>
          <div className='w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-2'>
            <CurrencyDollarIcon className='w-5 h-5 text-white' />
          </div>
          <div className='text-2xl font-bold text-gray-900 dark:text-white'>
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            Revenue
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
