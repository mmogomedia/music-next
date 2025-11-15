'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserGroupIcon,
  MusicalNoteIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QueueListIcon,
  ClockIcon,
  TagIcon,
  Bars3Icon,
  XMarkIcon,
  MusicalNoteIcon as MusicalNoteSolidIcon,
} from '@heroicons/react/24/outline';
import {
  UserGroupIcon as UserGroupSolidIcon,
  MusicalNoteIcon as MusicalNoteSolidIcon2,
  ChartBarIcon as ChartBarSolidIcon,
  TagIcon as TagSolidIcon,
  QueueListIcon as QueueListSolidIcon,
  ClockIcon as ClockSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
} from '@heroicons/react/24/solid';
import UserDetailsFooter from '@/components/layout/UserDetailsFooter';

interface AdminNavigationProps {
  activeTab: string;
  onTabChange: (_tab: string) => void;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface NavItem {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function AdminNavigation({
  activeTab,
  onTabChange,
  systemHealth,
}: AdminNavigationProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render until we know if it's mobile or not
  if (isMobile === null) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      id: 'overview',
      name: 'Overview',
      icon: ChartBarIcon,
      activeIcon: ChartBarSolidIcon,
    },
    {
      id: 'users',
      name: 'Users',
      icon: UserGroupIcon,
      activeIcon: UserGroupSolidIcon,
    },
    {
      id: 'content',
      name: 'Content',
      icon: MusicalNoteIcon,
      activeIcon: MusicalNoteSolidIcon2,
    },
    { id: 'genres', name: 'Genres', icon: TagIcon, activeIcon: TagSolidIcon },
    {
      id: 'playlists',
      name: 'Playlists',
      icon: QueueListIcon,
      activeIcon: QueueListSolidIcon,
    },
    {
      id: 'submissions',
      name: 'Submissions',
      icon: ClockIcon,
      activeIcon: ClockSolidIcon,
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: ChartBarIcon,
      activeIcon: ChartBarSolidIcon,
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Cog6ToothIcon,
      activeIcon: Cog6ToothSolidIcon,
    },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <aside className='fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col z-30 pb-20 relative'>
        {/* Logo Section */}
        <div className='p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0'>
          <Link href='/' className='flex items-center gap-3 group'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200'>
              <MusicalNoteSolidIcon className='w-6 h-6 text-white' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
                Admin
              </span>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                Dashboard
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className='flex-1 px-4 py-6 overflow-y-auto min-h-0'>
          <div className='mb-6'>
            <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
              Navigation
            </h3>
            <nav className='space-y-2'>
              {navItems.map(item => {
                const IconComponent =
                  activeTab === item.id ? item.activeIcon : item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group text-left ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-600 dark:bg-blue-400'
                          : 'bg-transparent group-hover:bg-blue-600 dark:group-hover:bg-blue-400'
                      }`}
                    />
                    <IconComponent className='w-5 h-5 flex-shrink-0' />
                    <span className='text-sm flex-1'>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* System Health & Auth Footer - Absolutely positioned at bottom, above music player */}
        <div className='absolute bottom-0 left-0 right-0 px-4 py-3.5 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-50'>
          <UserDetailsFooter
            showSystemHealth={true}
            systemHealth={systemHealth}
          />
        </div>
      </aside>
    );
  }

  // Mobile Header with Drawer
  return (
    <>
      {/* Mobile Header Bar */}
      <div className='fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-[60] lg:hidden'>
        <div className='flex items-center justify-between p-4'>
          <Link href='/' className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg'>
              <MusicalNoteSolidIcon className='w-5 h-5 text-white' />
            </div>
            <span className='text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
              Admin
            </span>
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300'
          >
            {isOpen ? (
              <XMarkIcon className='w-6 h-6' />
            ) : (
              <Bars3Icon className='w-6 h-6' />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            type='button'
            className='fixed inset-0 bg-black/50 z-[55]'
            onClick={() => setIsOpen(false)}
            aria-label='Close drawer'
          />

          {/* Drawer Panel */}
          <div className='fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 z-[55] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col pb-20 relative'>
            {/* Logo Section */}
            <div className='p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg'>
                    <MusicalNoteSolidIcon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
                      Admin
                    </span>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      Dashboard
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300'
                >
                  <XMarkIcon className='w-5 h-5' />
                </button>
              </div>
            </div>

            {/* Navigation Items */}
            <div className='flex-1 px-4 py-6 overflow-y-auto min-h-0'>
              <div className='mb-6'>
                <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
                  Navigation
                </h3>
                <nav className='space-y-2'>
                  {navItems.map(item => {
                    const IconComponent =
                      activeTab === item.id ? item.activeIcon : item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group text-left ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                            isActive
                              ? 'bg-blue-600 dark:bg-blue-400'
                              : 'bg-transparent group-hover:bg-blue-600 dark:group-hover:bg-blue-400'
                          }`}
                        />
                        <IconComponent className='w-5 h-5 flex-shrink-0' />
                        <span className='text-sm flex-1'>{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* System Health & Auth Footer - Absolutely positioned at bottom, above music player */}
            <div className='absolute bottom-0 left-0 right-0 px-4 py-3.5 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-50'>
              <UserDetailsFooter
                showSystemHealth={true}
                systemHealth={systemHealth}
                onMobileMenuClose={() => setIsOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
