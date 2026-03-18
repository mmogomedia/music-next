'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@heroui/react';
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
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!overflowOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [overflowOpen]);

  const openMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOverflowOpen(v => !v);
  };

  return (
    <div className='sticky top-0 z-30 border-b border-gray-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm'>
      {/* ── Mobile tab bar ── */}
      <div className='lg:hidden'>
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

          {/* 3-dot trigger — portals the menu to <body> to escape stacking context */}
          <div
            ref={triggerRef}
            className='flex items-center justify-center px-3 border-b-2 border-transparent'
          >
            <button
              onClick={openMenu}
              className={`transition-colors ${
                activeView === 'league'
                  ? 'text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              aria-label='More options'
              aria-expanded={overflowOpen}
            >
              <EllipsisVerticalIcon className='w-5 h-5' />
            </button>
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

      {/* Overflow menu — portalled to <body> so it's never clipped by the sticky bar */}
      {overflowOpen &&
        menuPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Transparent backdrop */}
            <button
              className='fixed inset-0 z-[98] cursor-default'
              onClick={() => setOverflowOpen(false)}
              aria-label='Close menu'
              tabIndex={-1}
            />
            {/* Menu */}
            <div
              style={{
                position: 'fixed',
                top: menuPos.top,
                right: menuPos.right,
                zIndex: 99,
              }}
              className='min-w-[160px] rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl overflow-hidden'
            >
              {overflowItems.map(item => {
                const Icon = item.icon;
                const isActive =
                  item.type === 'view' && activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setOverflowOpen(false);
                      if (item.type === 'view') {
                        onViewChange(item.key as ViewType);
                      } else {
                        router.push(item.href);
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${
                      isActive
                        ? 'text-primary font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className='w-4 h-4 flex-shrink-0' />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
