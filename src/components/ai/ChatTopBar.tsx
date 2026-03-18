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
  { key: 'timeline' as ViewType, label: 'Timeline', icon: ClockIcon },
  { key: 'streaming' as ViewType, label: 'Streaming', icon: SparklesIcon },
  { key: 'league' as ViewType, label: 'League', icon: TrophyIcon },
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
      {/* ── Mobile tab bar ── */}
      <div className='lg:hidden pt-3'>
        <div className='flex'>
          {viewButtons.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={`flex-1 flex flex-col items-center gap-1 pb-2 text-xs font-medium transition-colors border-b-2 ${
                activeView === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className='w-5 h-5' />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop pill bar ── */}
      <div className='hidden lg:flex px-4 py-3 items-center gap-4'>
        <div className='flex-shrink-0'>
          <div className='inline-flex items-center gap-1.5 rounded-full bg-gray-100/80 dark:bg-slate-800/80 p-1 border border-gray-200/60 dark:border-slate-700/70 shadow-sm'>
            {viewButtons.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                size='sm'
                variant={activeView === key ? 'solid' : 'light'}
                color={activeView === key ? 'primary' : 'default'}
                onPress={() => onViewChange(key)}
                className={`gap-1.5 rounded-full text-xs font-medium px-3 ${
                  activeView === key
                    ? 'shadow-sm'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                startContent={
                  <Icon className='w-4 h-4 flex-shrink-0' aria-hidden='true' />
                }
              >
                {label}
              </Button>
            ))}

            <div className='w-px h-5 bg-gray-300/50 dark:bg-slate-600/50 mx-0.5' />

            {linkButtons.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  size='sm'
                  variant='light'
                  color='default'
                  className='gap-1.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 px-3'
                  startContent={
                    <Icon
                      className='w-4 h-4 flex-shrink-0'
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

        <div className='flex-1 flex justify-end min-w-0'>
          <div className='w-full max-w-md'>
            <MiniPlayer />
          </div>
        </div>
      </div>
    </div>
  );
}
