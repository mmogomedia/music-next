'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  MusicalNoteIcon,
  FireIcon,
  GlobeAltIcon,
  SparklesIcon,
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
import UserDetailsFooter from '@/components/layout/UserDetailsFooter';
import MiniPlayer from '@/components/music/MiniPlayer';

interface QuickLink {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  message: string;
}

interface ChatNavigationProps {
  onQuickLinkClick?: (_message: string) => void;
  onConversationSelect?: (_conversationId: string) => void;
  getConversationId?: () => string | undefined;
}

export default function ChatNavigation({
  onQuickLinkClick,
  onConversationSelect,
  getConversationId,
}: ChatNavigationProps) {
  const pathname = usePathname();
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

  // Don't render until we know if it's mobile or not (prevents double render)
  if (isMobile === null) {
    return null;
  }

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
      <aside className='w-64 flex-shrink-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col z-30 pb-20 sticky top-0'>
        {/* Logo Section */}
        <div className='p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0'>
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

        {/* Quick Links + Conversations Section */}
        <div className='flex-1 px-4 py-6 flex flex-col min-h-0 overflow-hidden pb-24'>
          <div className='mb-6 flex-shrink-0'>
            <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3'>
              Quick Actions
            </h3>
            <nav className='flex flex-wrap gap-2'>
              {quickLinks.map(link => {
                const IconComponent = isActive(`/${link.id}`)
                  ? link.activeIcon
                  : link.icon;

                return (
                  <button
                    key={link.id}
                    onClick={() => handleQuickLinkClick(link.message)}
                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-gray-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800'
                  >
                    <IconComponent className='w-3.5 h-3.5 flex-shrink-0' />
                    <span>{link.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Conversations Section - scrollable */}
          <div className='mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 flex-1 min-h-0 flex flex-col'>
            <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-3 flex-shrink-0'>
              Recent Conversations
            </h3>
            <ConversationList
              onConversationSelect={onConversationSelect}
              activeConversationId={getConversationId?.()}
            />
          </div>
        </div>

        {/* Auth Status Footer - Absolutely positioned at bottom */}
        <div className='absolute bottom-0 left-0 right-0 px-4 py-3.5 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'>
          <UserDetailsFooter />
        </div>
      </aside>
    );
  }

  // Mobile Header with Drawer
  return (
    <>
      {/* Mobile Header Bar - Hamburger, Logo, Player */}
      <div className='fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-[60] lg:hidden'>
        <div className='flex items-center gap-2 px-3 py-2'>
          {/* Hamburger Menu - Left */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 flex-shrink-0'
            aria-label='Toggle menu'
          >
            {isOpen ? (
              <XMarkIcon className='w-6 h-6' />
            ) : (
              <Bars3Icon className='w-6 h-6' />
            )}
          </button>

          {/* Logo - Center */}
          <Link href='/' className='flex items-center gap-2 flex-shrink-0'>
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg'>
              <MusicalNoteIcon className='w-5 h-5 text-white' />
            </div>
            <span className='text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:inline'>
              Flemoji
            </span>
          </Link>

          {/* Player - Takes remaining space */}
          <div className='flex-1 min-w-0 ml-2'>
            <MiniPlayer />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            type='button'
            className='fixed inset-0 bg-black/50 z-[55] lg:hidden'
            onClick={() => setIsOpen(false)}
            aria-label='Close drawer'
          />

          {/* Drawer Panel - starts below header */}
          <div className={`fixed left-0 top-14 bottom-0 w-64 bg-white dark:bg-slate-900 z-[55] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Quick Links Section - starts immediately below header */}
            <div className='flex-1 px-4 py-4 flex flex-col min-h-0 overflow-hidden'>
              <div className='mb-6 flex-shrink-0'>
                <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3'>
                  Quick Actions
                </h3>
                <nav className='flex flex-wrap gap-2'>
                  {quickLinks.map(link => {
                    const IconComponent = link.icon;

                    return (
                      <button
                        key={link.id}
                        onClick={() => handleQuickLinkClick(link.message)}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-gray-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800'
                      >
                        <IconComponent className='w-3.5 h-3.5 flex-shrink-0' />
                        <span>{link.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Conversations Section - scrollable */}
              <div className='mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 flex-1 min-h-0 flex flex-col'>
                <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3 flex-shrink-0'>
                  Recent Conversations
                </h3>
                <div className='flex-1 min-h-0 overflow-hidden'>
                  <ConversationList
                    onConversationSelect={id => {
                      setIsOpen(false);
                      onConversationSelect?.(id);
                    }}
                    activeConversationId={getConversationId?.()}
                  />
                </div>
              </div>
            </div>

            {/* Auth Footer - At bottom */}
            <div className='mt-auto px-4 py-3.5 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0'>
              <UserDetailsFooter onMobileMenuClose={() => setIsOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
