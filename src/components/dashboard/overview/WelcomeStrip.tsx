'use client';

import {
  Avatar,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { toAbsoluteUrl } from '@/lib/url-utils';
import FCard from '@/components/ui/FCard';

interface WelcomeStripProps {
  artistName: string;
  profileImage?: string | null;
  totalTracks: number;
  totalPlays: number;
  timeRange: string;
  onTimeRangeChange: (_range: string) => void;
  loading?: boolean;
}

const TIME_RANGE_OPTIONS = [
  { key: '24h', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: '1y', label: 'Last year' },
  { key: 'all', label: 'All time' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomeStrip({
  artistName,
  profileImage,
  totalTracks,
  totalPlays,
  timeRange,
  onTimeRangeChange,
  loading = false,
}: WelcomeStripProps) {
  if (loading) {
    return (
      <FCard padding='none'>
        <div className='p-5 flex items-center justify-between gap-4 animate-pulse'>
          <div className='flex items-center gap-3'>
            <div className='w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 flex-shrink-0' />
            <div className='space-y-2'>
              <div className='h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded' />
              <div className='h-5 w-36 bg-gray-200 dark:bg-slate-700 rounded' />
              <div className='h-3 w-28 bg-gray-200 dark:bg-slate-700 rounded' />
            </div>
          </div>
          <div className='h-8 w-32 bg-gray-200 dark:bg-slate-700 rounded-lg' />
        </div>
      </FCard>
    );
  }

  const timeRangeLabel =
    TIME_RANGE_OPTIONS.find(o => o.key === timeRange)?.label ??
    TIME_RANGE_OPTIONS[1].label;

  return (
    <FCard padding='none'>
      <div className='p-5 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <Avatar
            size='sm'
            src={toAbsoluteUrl(profileImage) ?? undefined}
            name={artistName}
            className='w-12 h-12 flex-shrink-0'
          />
          <div className='min-w-0'>
            <p className='text-xs font-medium text-gray-500 dark:text-gray-400'>
              {getGreeting()},
            </p>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white truncate'>
              {artistName}
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
              {totalTracks} {totalTracks === 1 ? 'track' : 'tracks'} &middot;{' '}
              {totalPlays.toLocaleString()} plays
            </p>
          </div>
        </div>

        <Dropdown>
          <DropdownTrigger>
            <Button
              variant='bordered'
              size='sm'
              endContent={<ChevronDownIcon className='w-3 h-3' />}
            >
              {timeRangeLabel}
            </Button>
          </DropdownTrigger>
          <DropdownMenu onAction={key => onTimeRangeChange(key as string)}>
            {TIME_RANGE_OPTIONS.map(option => (
              <DropdownItem key={option.key}>{option.label}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
    </FCard>
  );
}
