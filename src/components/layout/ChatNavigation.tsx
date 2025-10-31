'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  MusicalNoteIcon,
  FireIcon,
  GlobeAltIcon,
  SparklesIcon,
  FolderOpenIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  MusicalNoteIcon as MusicalNoteSolidIcon,
  FireIcon as FireSolidIcon,
  GlobeAltIcon as GlobeAltSolidIcon,
  SparklesIcon as SparklesSolidIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import ConversationList from '@/components/ai/ConversationList';

interface QuickLink {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  message: string;
}

interface ChatNavigationProps {
  onQuickLinkClick?: (_message: string) => void;
}

export default function ChatNavigation({
  onQuickLinkClick,
}: ChatNavigationProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine if we should be active based on current route
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const quickLinks: QuickLink[] = [
    {
      id: 'trending',
      title: 'Trending Now',
      icon: FireIcon,
      activeIcon: FireSolidIcon,
      message: 'Show me the trending music right now',
    },
    {
      id: 'genres',
      title: 'Browse Genres',
      icon: MusicalNoteIcon,
      activeIcon: MusicalNoteSolidIcon,
      message: 'What music genres are available?',
    },
    {
      id: 'provinces',
      title: 'Provincial Music',
      icon: GlobeAltIcon,
      activeIcon: GlobeAltSolidIcon,
      message: 'Show me music from different provinces',
    },
    {
      id: 'discover',
      title: 'Discover New Music',
      icon: SparklesIcon,
      activeIcon: SparklesSolidIcon,
      message: 'Help me discover new music based on my preferences',
    },
  ];

  const handleQuickLinkClick = (_message: string) => {
    if (onQuickLinkClick) {
      onQuickLinkClick(_message);
    }
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <aside className='fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col z-30'>
        {/* Logo Section */}
        <div className='p-6 border-b border-gray-200 dark:border-slate-700'>
          <Link href='/' className='flex items-center gap-3 group'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200'>
              <MusicalNoteIcon className='w-6 h-6 text-white' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
                Flemoji
              </span>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                Music Discovery
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Links Section */}
        <div className='flex-1 px-4 py-6 overflow-y-auto'>
          <div className='mb-6'>
            <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
              Quick Actions
            </h3>
            <nav className='space-y-2'>
              {quickLinks.map(link => {
                const IconComponent = isActive(`/${link.id}`)
                  ? link.activeIcon
                  : link.icon;

                return (
                  <button
                    key={link.id}
                    onClick={() => handleQuickLinkClick(link.message)}
                    className='w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  >
                    <div className='w-2 h-2 rounded-full bg-transparent group-hover:bg-blue-600 dark:group-hover:bg-blue-400 transition-colors duration-200' />
                    <IconComponent className='w-5 h-5 flex-shrink-0' />
                    <span className='text-sm flex-1'>{link.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Conversations Section */}
          <div className='mt-8 pt-6 border-t border-gray-200 dark:border-slate-700'>
            <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
              Recent Conversations
            </h3>
            <ConversationList
              onConversationSelect={() => {
                // TODO: Load conversation
              }}
            />
          </div>

          {/* Classic View Link */}
          <div className='pt-6 border-t border-gray-200 dark:border-slate-700'>
            <Link
              href='/classic'
              className='flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
            >
              <FolderOpenIcon className='w-5 h-5' />
              <span className='text-sm'>Classic View</span>
            </Link>
          </div>
        </div>

        {/* Bottom Padding for Music Player */}
        <div className='h-20' />
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
              <MusicalNoteIcon className='w-5 h-5 text-white' />
            </div>
            <span className='text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
              Flemoji
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
          <div className='fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 z-[55] shadow-2xl transform transition-transform duration-300 ease-in-out'>
            {/* Logo Section */}
            <div className='p-6 border-b border-gray-200 dark:border-slate-700'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg'>
                    <MusicalNoteIcon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
                      Flemoji
                    </span>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      Music Discovery
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

            {/* Quick Links Section */}
            <div className='flex-1 px-4 py-6 overflow-y-auto'>
              <div className='mb-6'>
                <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
                  Quick Actions
                </h3>
                <nav className='space-y-2'>
                  {quickLinks.map(link => {
                    const IconComponent = link.icon;

                    return (
                      <button
                        key={link.id}
                        onClick={() => handleQuickLinkClick(link.message)}
                        className='w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                      >
                        <IconComponent className='w-5 h-5 flex-shrink-0' />
                        <span className='text-sm flex-1'>{link.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Conversations Section */}
              <div className='mt-8 pt-6 border-t border-gray-200 dark:border-slate-700'>
                <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3'>
                  Recent Conversations
                </h3>
                <ConversationList
                  onConversationSelect={() => {
                    setIsOpen(false);
                    // TODO: Load conversation
                  }}
                />
              </div>

              {/* Classic View Link */}
              <div className='pt-6 border-t border-gray-200 dark:border-slate-700'>
                <Link
                  href='/classic'
                  onClick={() => setIsOpen(false)}
                  className='flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                >
                  <FolderOpenIcon className='w-5 h-5' />
                  <span className='text-sm'>Classic View</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
