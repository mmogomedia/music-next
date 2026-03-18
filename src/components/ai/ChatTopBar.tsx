'use client';

import React from 'react';
import { Button } from '@heroui/react';
import Link from 'next/link';
import MiniPlayer from '@/components/music/MiniPlayer';
import {
  ClockIcon,
  SparklesIcon,
  TrophyIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export type ViewType = 'timeline' | 'streaming' | 'league';

interface ChatTopBarProps {
  activeView: ViewType;
  onViewChange: (_view: ViewType) => void;
}

const viewButtons = [
  {
    key: 'timeline' as ViewType,
    label: 'Timeline',
    mobileLabel: 'Timeline',
    icon: ClockIcon,
  },
  {
    key: 'streaming' as ViewType,
    label: 'AI Streaming',
    mobileLabel: 'Streaming',
    icon: SparklesIcon,
  },
  {
    key: 'league' as ViewType,
    label: 'League',
    mobileLabel: 'League',
    icon: TrophyIcon,
  },
] as const;

const linkButtons = [
  { href: '/learn', label: 'Learn', icon: BookOpenIcon },
  { href: '/tools', label: 'Tools', icon: WrenchScrewdriverIcon },
] as const;

export default function ChatTopBar({
  activeView,
  onViewChange,
}: ChatTopBarProps) {
  return (
    <div className='sticky top-0 z-40 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm'>
      <div className='px-3 lg:px-4 py-2 lg:py-3 flex items-center gap-3 lg:gap-4'>
        {/* View Toggle Buttons — horizontal scroll on mobile, inline on desktop */}
        <div className='flex-1 min-w-0 lg:flex-initial lg:flex-shrink-0 overflow-x-auto scrollbar-hide'>
          <div className='inline-flex items-center gap-1 lg:gap-1.5 rounded-full bg-gray-100/80 dark:bg-slate-800/80 p-0.5 lg:p-1 border border-gray-200/60 dark:border-slate-700/70 shadow-sm'>
            {viewButtons.map(({ key, label, mobileLabel, icon: Icon }) => (
              <Button
                key={key}
                size='sm'
                variant={activeView === key ? 'solid' : 'light'}
                color={activeView === key ? 'primary' : 'default'}
                onPress={() => onViewChange(key)}
                className={`gap-1 lg:gap-1.5 rounded-full text-[11px] lg:text-xs font-medium min-w-0 px-2.5 lg:px-3 ${
                  activeView === key
                    ? 'shadow-sm'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                startContent={
                  <Icon
                    className='w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0'
                    aria-hidden='true'
                  />
                }
              >
                <span className='lg:hidden'>{mobileLabel}</span>
                <span className='hidden lg:inline'>{label}</span>
              </Button>
            ))}

            {/* Divider */}
            <div className='w-px h-5 bg-gray-300/50 dark:bg-slate-600/50 mx-0.5' />

            {linkButtons.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  size='sm'
                  variant='light'
                  color='default'
                  className='gap-1 lg:gap-1.5 rounded-full text-[11px] lg:text-xs font-medium text-gray-700 dark:text-gray-300 min-w-0 px-2.5 lg:px-3'
                  startContent={
                    <Icon
                      className='w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0'
                      aria-hidden='true'
                    />
                  }
                >
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Mini Player — hidden on mobile, shown on desktop */}
        <div className='hidden lg:flex flex-1 justify-end min-w-0'>
          <div className='w-full max-w-md'>
            <MiniPlayer />
          </div>
        </div>
      </div>
    </div>
  );
}
