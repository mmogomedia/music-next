'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  PlusIcon,
  ClockIcon,
  FireIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'New Chat', href: '/chat', icon: PlusIcon },
  { label: 'History', href: '/chat/history', icon: ClockIcon },
  { label: 'Trending', href: '/chat/trending', icon: FireIcon },
];

const learnItem = { label: 'Learn', href: '/learn', icon: BookOpenIcon };
const settingsItem = {
  label: 'Settings',
  href: '/chat/settings',
  icon: Cog6ToothIcon,
};

export default function ChatSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <aside className='fixed left-0 top-0 h-screen w-60 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 hidden lg:flex flex-col'>
      {/* Brand header */}
      <div className='px-5 pt-5 pb-4 border-b border-gray-50 dark:border-slate-800'>
        <Link href='/' className='flex items-center gap-2.5 group'>
          <Image
            src='/logo_symbol.png'
            alt='Flemoji'
            width={32}
            height={32}
            className='w-8 h-8 rounded-lg'
          />
          <div>
            <p className='text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'>
              Flemoji
            </p>
            <p className='text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest'>
              AI Discovery
            </p>
          </div>
        </Link>
      </div>

      {/* Main nav */}
      <nav className='flex-1 px-3 py-4 space-y-0.5 overflow-y-auto'>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${active ? 'text-purple-600 dark:text-purple-400' : ''}`}
              />
              {item.label}
              {item.label === 'New Chat' && (
                <span className='ml-auto w-5 h-5 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center'>
                  <PlusIcon className='w-3 h-3 text-gray-500' />
                </span>
              )}
            </Link>
          );
        })}

        {/* Divider + Learn section */}
        <div className='pt-4 pb-1'>
          <p className='px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1'>
            Resources
          </p>
        </div>
        <Link
          href={learnItem.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
            isActive(learnItem.href)
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpenIcon
            className={`w-4 h-4 flex-shrink-0 ${isActive(learnItem.href) ? 'text-blue-600 dark:text-blue-400' : ''}`}
          />
          <span className='flex-1'>Learn</span>
          <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
            New
          </span>
        </Link>

        {/* Learn sub-items (always visible as quick links) */}
        <div className='ml-6 pl-3 border-l border-gray-100 dark:border-slate-800 space-y-0.5 py-1'>
          <Link
            href='/learn?cluster='
            className='flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors'
          >
            <span className='w-1 h-1 rounded-full bg-current flex-shrink-0' />
            All articles
          </Link>
          <Link
            href='/learn'
            className='flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors'
          >
            <span className='w-1 h-1 rounded-full bg-current flex-shrink-0' />
            Music business guides
          </Link>
        </div>
      </nav>

      {/* Learn CTA card */}
      <div className='px-3 py-3'>
        <Link
          href='/learn'
          className='block p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-purple-800/30 hover:border-purple-200 dark:hover:border-purple-700 transition-colors group'
        >
          <div className='flex items-center gap-2 mb-1'>
            <BookOpenIcon className='w-4 h-4 text-purple-600 dark:text-purple-400' />
            <p className='text-xs font-bold text-purple-800 dark:text-purple-300'>
              Flemoji Learn
            </p>
          </div>
          <p className='text-[10px] text-purple-600/70 dark:text-purple-400/60 leading-relaxed'>
            Music business guides for SA artists — royalties, distribution &amp;
            more.
          </p>
          <p className='mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 group-hover:underline'>
            Browse articles →
          </p>
        </Link>
      </div>

      {/* Settings at bottom */}
      <div className='px-3 pb-4 border-t border-gray-50 dark:border-slate-800 pt-3'>
        <Link
          href={settingsItem.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive(settingsItem.href)
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <Cog6ToothIcon className='w-4 h-4 flex-shrink-0' />
          Settings
        </Link>
      </div>
    </aside>
  );
}
