'use client';

import React from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MiniPlayer from '@/components/music/MiniPlayer';
import {
  ClockIcon,
  SparklesIcon,
  TrophyIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

export type ViewType = 'timeline' | 'streaming' | 'league';

interface ChatTopBarProps {
  activeView: ViewType;
  onViewChange: (_view: ViewType) => void;
}

// Visible tabs on mobile
const mobileTabs = [
  { key: 'timeline' as ViewType, label: 'Timeline', icon: ClockIcon },
  { key: 'streaming' as ViewType, label: 'Streaming', icon: SparklesIcon },
  { key: 'learn', label: 'Learn', href: '/learn', icon: BookOpenIcon },
] as const;

// Overflow menu items (3-dot)
const overflowItems = [
  {
    key: 'league' as ViewType,
    label: 'League',
    icon: TrophyIcon,
    type: 'view' as const,
  },
  {
    key: 'tools',
    label: 'Tools',
    href: '/tools',
    icon: WrenchScrewdriverIcon,
    type: 'link' as const,
  },
] as const;

// All buttons for desktop pill
const desktopViewButtons = [
  { key: 'timeline' as ViewType, label: 'Timeline', icon: ClockIcon },
  { key: 'streaming' as ViewType, label: 'AI Streaming', icon: SparklesIcon },
  { key: 'league' as ViewType, label: 'League', icon: TrophyIcon },
] as const;

const desktopLinkButtons = [
  { href: '/learn', label: 'Learn', icon: BookOpenIcon },
  { href: '/tools', label: 'Tools', icon: WrenchScrewdriverIcon },
] as const;

export default function ChatTopBar({
  activeView,
  onViewChange,
}: ChatTopBarProps) {
  const router = useRouter();

  return (
    <div className='sticky top-0 z-30 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm'>
      {/* ── Mobile tab bar ── */}
      <div className='lg:hidden'>
        {/* h-14 gives all children a fixed height to fill; justify-center then truly centres */}
        <div className='flex h-14'>
          {mobileTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = 'href' in tab ? false : activeView === tab.key;
            const sharedCls =
              'flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors border-b-2';

            if ('href' in tab) {
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`${sharedCls} border-transparent text-gray-500 dark:text-gray-400`}
                >
                  <Icon className='w-5 h-5' />
                  {tab.label}
                </Link>
              );
            }

            return (
              <button
                key={tab.key}
                onClick={() => onViewChange(tab.key)}
                className={`${sharedCls} ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon className='w-5 h-5' />
                {tab.label}
              </button>
            );
          })}

          {/* 3-dot — fills the same h-14, icon centred inside */}
          <div className='flex items-center justify-center px-3 border-b-2 border-transparent'>
            <Dropdown placement='bottom-end'>
              <DropdownTrigger>
                <button
                  className={`transition-colors ${
                    activeView === 'league'
                      ? 'text-primary'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  aria-label='More options'
                >
                  <EllipsisVerticalIcon className='w-5 h-5' />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label='More navigation options'
                classNames={{ base: 'z-[60]' }}
              >
                {overflowItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <DropdownItem
                      key={item.key}
                      startContent={<Icon className='w-4 h-4' />}
                      onPress={() => {
                        if (item.type === 'view') {
                          onViewChange(item.key as ViewType);
                        } else {
                          router.push(item.href);
                        }
                      }}
                      className={
                        item.type === 'view' && activeView === item.key
                          ? 'text-primary'
                          : ''
                      }
                    >
                      {item.label}
                    </DropdownItem>
                  );
                })}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* ── Desktop pill bar ── */}
      <div className='hidden lg:flex px-4 py-3 items-center gap-4'>
        <div className='flex-shrink-0'>
          <div className='inline-flex items-center gap-1.5 rounded-full bg-gray-100/80 dark:bg-slate-800/80 p-1 border border-gray-200/60 dark:border-slate-700/70 shadow-sm'>
            {desktopViewButtons.map(({ key, label, icon: Icon }) => (
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

            {desktopLinkButtons.map(({ href, label, icon: Icon }) => (
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
