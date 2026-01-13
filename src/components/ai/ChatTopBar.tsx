'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import MiniPlayer from '@/components/music/MiniPlayer';
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

export type ViewType = 'timeline' | 'streaming';

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
      <div className='fixed top-14 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200/80 dark:border-slate-700/80'>
        <div className='px-3 py-2'>
          <div className='flex items-center gap-1.5 rounded-full bg-gray-100/80 dark:bg-slate-800/80 p-1 border border-gray-200/60 dark:border-slate-700/70 shadow-sm'>
            <Button
              size='sm'
              variant={activeView === 'timeline' ? 'solid' : 'light'}
              color={activeView === 'timeline' ? 'primary' : 'default'}
              onPress={() => onViewChange('timeline')}
              className={`flex-1 justify-center gap-1.5 rounded-full text-xs font-medium ${
                activeView === 'timeline'
                  ? 'shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              startContent={
                <ClockIcon className='w-3.5 h-3.5' aria-hidden='true' />
              }
            >
              Timeline
            </Button>
            <Button
              size='sm'
              variant={activeView === 'streaming' ? 'solid' : 'light'}
              color={activeView === 'streaming' ? 'primary' : 'default'}
              onPress={() => onViewChange('streaming')}
              className={`flex-1 justify-center gap-1.5 rounded-full text-xs font-medium ${
                activeView === 'streaming'
                  ? 'shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              startContent={
                <SparklesIcon className='w-3.5 h-3.5' aria-hidden='true' />
              }
            >
              Streaming
            </Button>
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
