'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import MiniPlayer from '@/components/music/MiniPlayer';
import {
  ClockIcon,
  SparklesIcon,
  TrophyIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

export type ViewType = 'timeline' | 'streaming' | 'league';

interface ChatTopBarProps {
  activeView: ViewType;
  onViewChange: (_view: ViewType) => void;
}

export default function ChatTopBar({
  activeView,
  onViewChange,
}: ChatTopBarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile layout
  if (isMobile) {
    return (
      <div className='sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200/80 dark:border-slate-700/80'>
        <div className='px-3 py-2'>
          <div className='flex items-center justify-between gap-2'>
            {/* Active view pill */}
            <div className='flex-1 min-w-0'>
              <div className='inline-flex items-center gap-2 rounded-full bg-gray-100/80 dark:bg-slate-800/80 px-3 py-2 border border-gray-200/60 dark:border-slate-700/70 shadow-sm'>
                {activeView === 'timeline' ? (
                  <ClockIcon className='w-4 h-4 text-gray-700 dark:text-gray-300' />
                ) : activeView === 'streaming' ? (
                  <SparklesIcon className='w-4 h-4 text-gray-700 dark:text-gray-300' />
                ) : (
                  <TrophyIcon className='w-4 h-4 text-gray-700 dark:text-gray-300' />
                )}
                <span className='text-xs font-medium text-gray-800 dark:text-gray-200 truncate'>
                  {activeView === 'timeline'
                    ? 'Timeline'
                    : activeView === 'streaming'
                      ? 'Streaming'
                      : 'League'}
                </span>
              </div>
            </div>

            {/* 3-dot menu for view toggles */}
            <Dropdown placement='bottom-end'>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size='sm'
                  variant='light'
                  radius='full'
                  className='h-9 w-9 min-w-9 bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700/70'
                  aria-label='More'
                >
                  <EllipsisVerticalIcon className='w-5 h-5' />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label='Header menu'
                className='z-[80]'
                classNames={{
                  base: 'bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-slate-700/70 shadow-xl rounded-xl overflow-hidden',
                  list: 'p-1',
                }}
              >
                <DropdownItem
                  key='view-timeline'
                  startContent={<ClockIcon className='w-4 h-4' />}
                  onPress={() => onViewChange('timeline')}
                >
                  Timeline
                </DropdownItem>
                <DropdownItem
                  key='view-streaming'
                  startContent={<SparklesIcon className='w-4 h-4' />}
                  onPress={() => onViewChange('streaming')}
                >
                  Streaming
                </DropdownItem>
                <DropdownItem
                  key='view-league'
                  startContent={<TrophyIcon className='w-4 h-4' />}
                  onPress={() => onViewChange('league')}
                >
                  League
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout: buttons and mini player side by side
  return (
    <div className='hidden lg:block sticky top-0 z-40 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm'>
      <div className='px-4 py-3 flex items-center gap-4'>
        {/* View Toggle Buttons */}
        <div className='flex items-center flex-shrink-0'>
          <div className='inline-flex items-center gap-1.5 rounded-full bg-gray-100/80 dark:bg-slate-800/80 p-1 border border-gray-200/60 dark:border-slate-700/70 shadow-sm'>
            <Button
              size='sm'
              variant={activeView === 'timeline' ? 'solid' : 'light'}
              color={activeView === 'timeline' ? 'primary' : 'default'}
              onPress={() => onViewChange('timeline')}
              className={`gap-1.5 rounded-full text-xs font-medium ${
                activeView === 'timeline'
                  ? 'shadow-sm'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              startContent={
                <ClockIcon className='w-4 h-4' aria-hidden='true' />
              }
            >
              AI Timeline
            </Button>
            <Button
              size='sm'
              variant={activeView === 'streaming' ? 'solid' : 'light'}
              color={activeView === 'streaming' ? 'primary' : 'default'}
              onPress={() => onViewChange('streaming')}
              className={`gap-1.5 rounded-full text-xs font-medium ${
                activeView === 'streaming'
                  ? 'shadow-sm'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              startContent={
                <SparklesIcon className='w-4 h-4' aria-hidden='true' />
              }
            >
              AI Streaming
            </Button>
            <Button
              size='sm'
              variant={activeView === 'league' ? 'solid' : 'light'}
              color={activeView === 'league' ? 'primary' : 'default'}
              onPress={() => onViewChange('league')}
              className={`gap-1.5 rounded-full text-xs font-medium ${
                activeView === 'league'
                  ? 'shadow-sm'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              startContent={
                <TrophyIcon className='w-4 h-4' aria-hidden='true' />
              }
            >
              League
            </Button>
          </div>
        </div>

        <div className='flex-1 flex justify-end min-w-0'>
          <div className='w-full max-w-md'>
            <MiniPlayer />
          </div>
        </div>
      </div>
    </div>
  );
}
