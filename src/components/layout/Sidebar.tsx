'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  MusicalNoteIcon,
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
} from '@heroicons/react/24/solid';
import MobileHeader from './MobileHeader';

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

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

  // On mobile, render MobileHeader instead
  if (isMobile) {
    return <MobileHeader />;
  }
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { name: 'Explore', href: '/', icon: HomeIcon, activeIcon: HomeSolidIcon },
    {
      name: 'Albums',
      href: '/albums',
      icon: ChartBarIcon,
      activeIcon: ChartBarSolidIcon,
    },
    {
      name: 'Genres',
      href: '/genres',
      icon: UserGroupIcon,
      activeIcon: UserGroupSolidIcon,
    },
    {
      name: 'Artist',
      href: '/artists',
      icon: UserGroupIcon,
      activeIcon: UserGroupSolidIcon,
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: ChartBarIcon,
      activeIcon: ChartBarSolidIcon,
    },
  ];

  const authItems = [
    { name: 'Login', href: '/login', icon: UserIcon },
    { name: 'Sign Up', href: '/register', icon: UserIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className='w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 h-screen flex flex-col fixed left-0 top-0 z-30 pb-20'>
      {/* Logo Section */}
      <div className='p-6 border-b border-gray-200 dark:border-slate-700'>
        <div className='flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-3 group'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200'>
              <MusicalNoteIcon className='w-6 h-6 text-white' />
            </div>
            <div>
              <p className='font-bold text-xl text-gray-900 dark:text-white'>
                Flemoji
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400 -mt-1'>
                Music
              </p>
            </div>
          </Link>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className='p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200'
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <SunIcon className='w-5 h-5' />
            ) : (
              <MoonIcon className='w-5 h-5' />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className='flex-1 px-4 py-6 overflow-y-auto'>
        {/* MENU Section */}
        <div className='mb-8'>
          <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
            MENU
          </h3>
          <nav className='space-y-1'>
            {menuItems.map(item => {
              const active = isActive(item.href);
              const IconComponent = active ? item.activeIcon : item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${active ? 'bg-blue-600 dark:bg-blue-400' : 'bg-transparent'}`}
                  />
                  <IconComponent className='w-5 h-5' />
                  <span className='text-sm'>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ACCOUNT Section - Only show for non-authenticated users */}
        {!session && (
          <div>
            <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
              ACCOUNT
            </h3>
            <nav className='space-y-1'>
              {authItems.map(item => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 group ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <item.icon className='w-5 h-5' />
                    <span className='text-sm'>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom Section - User Profile */}
      <div className='mt-auto'>
        {session ? (
          <div className='p-4 border-t border-gray-200 dark:border-slate-700'>
            {/* User Profile Section */}
            <div className='relative'>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className='w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-200 group'
              >
                <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm'>
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={40}
                      height={40}
                      className='w-10 h-10 rounded-full object-cover'
                    />
                  ) : (
                    <UserIcon className='w-5 h-5 text-white' />
                  )}
                </div>
                <div className='flex-1 text-left min-w-0'>
                  <p className='font-medium text-gray-900 dark:text-white text-sm truncate'>
                    {session.user?.name || session.user?.email || 'User'}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                    {session.user?.email}
                  </p>
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className='absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50'>
                  <Link
                    href='/account'
                    className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200'
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Cog6ToothIcon className='w-4 h-4' />
                    Account
                  </Link>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    className='flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 w-full text-left'
                  >
                    <ArrowRightOnRectangleIcon className='w-4 h-4' />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
