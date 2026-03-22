'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MusicalNoteIcon,
  ChartBarIcon,
  PlusIcon,
  UserIcon,
  FolderOpenIcon,
  Bars3Icon,
  XMarkIcon,
  LinkIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import {
  MusicalNoteIcon as MusicalNoteSolid,
  ChartBarIcon as ChartBarSolid,
  PlusIcon as PlusSolid,
  UserIcon as UserSolid,
  FolderOpenIcon as FolderOpenSolid,
  LinkIcon as LinkSolid,
  HomeIcon as HomeSolid,
} from '@heroicons/react/24/solid';
import UserDetailsFooter from '@/components/layout/UserDetailsFooter';

type TabId =
  | 'overview'
  | 'library'
  | 'upload'
  | 'submissions'
  | 'quick-links'
  | 'analytics'
  | 'profile'
  | 'pulse';

interface ArtistNavigationProps {
  activeTab: string;
  getTabHref: (_tab: TabId) => string;
}

interface NavItem {
  id: TabId;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Music',
    items: [
      {
        id: 'overview',
        name: 'Overview',
        icon: HomeIcon,
        activeIcon: HomeSolid,
      },
      {
        id: 'library',
        name: 'Library',
        icon: MusicalNoteIcon,
        activeIcon: MusicalNoteSolid,
      },
      {
        id: 'upload',
        name: 'Upload',
        icon: PlusIcon,
        activeIcon: PlusSolid,
      },
    ],
  },
  {
    label: 'Promote',
    items: [
      {
        id: 'submissions',
        name: 'Submissions',
        icon: FolderOpenIcon,
        activeIcon: FolderOpenSolid,
      },
      {
        id: 'quick-links',
        name: 'Quick Links',
        icon: LinkIcon,
        activeIcon: LinkSolid,
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        id: 'analytics',
        name: 'Analytics',
        icon: ChartBarIcon,
        activeIcon: ChartBarSolid,
        badge: 'Soon',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 'profile',
        name: 'Profile',
        icon: UserIcon,
        activeIcon: UserSolid,
      },
    ],
  },
];

function NavLink({
  item,
  isActive,
  href,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  href: string;
  onClick?: () => void;
}) {
  const Icon = isActive ? item.activeIcon : item.icon;

  return (
    <Link
      href={href}
      scroll={false}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <Icon className='w-4.5 h-4.5 w-[18px] h-[18px] flex-shrink-0' />
      <span className='flex-1'>{item.name}</span>
      {item.badge && (
        <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({
  activeTab,
  getTabHref,
  onLinkClick,
}: {
  activeTab: string;
  getTabHref: (_tab: TabId) => string;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className='px-5 py-5 border-b border-gray-100 dark:border-slate-800 flex-shrink-0'>
        <Link href='/' className='flex items-center gap-2 group'>
          <Image
            src='/main_logo.png'
            alt='Flemoji'
            width={120}
            height={32}
            className='h-8 w-auto'
          />
        </Link>
      </div>

      {/* Nav groups */}
      <div className='flex-1 px-3 py-4 overflow-y-auto min-h-0 space-y-5'>
        {navGroups.map(group => (
          <div key={group.label}>
            <p className='px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500'>
              {group.label}
            </p>
            <nav className='space-y-0.5'>
              {group.items.map(item => (
                <NavLink
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  href={getTabHref(item.id)}
                  onClick={onLinkClick}
                />
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className='flex-shrink-0 px-4 py-3.5 border-t border-gray-100 dark:border-slate-800'>
        <UserDetailsFooter onMobileMenuClose={onLinkClick} />
      </div>
    </>
  );
}

export default function ArtistNavigation({
  activeTab,
  getTabHref,
}: ArtistNavigationProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile === null) return null;

  // Desktop sidebar
  if (!isMobile) {
    return (
      <aside className='relative w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col z-30'>
        <SidebarContent activeTab={activeTab} getTabHref={getTabHref} />
      </aside>
    );
  }

  // Mobile header + drawer
  return (
    <>
      <header className='lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800'>
        <div className='flex items-center justify-between px-4 py-3'>
          <Link href='/' className='flex items-center gap-2'>
            <Image
              src='/logo_symbol.png'
              alt='Flemoji'
              width={32}
              height={32}
              className='h-8 w-auto'
            />
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
            aria-label='Toggle menu'
          >
            {isOpen ? (
              <XMarkIcon className='w-5 h-5' />
            ) : (
              <Bars3Icon className='w-5 h-5' />
            )}
          </button>
        </div>
      </header>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 bg-black/40 z-[54] lg:hidden'
            onClick={() => setIsOpen(false)}
            role='button'
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') setIsOpen(false);
            }}
          />
          <div className='fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 z-[55] shadow-2xl flex flex-col'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0'>
              <Link
                href='/'
                className='flex items-center gap-2'
                onClick={() => setIsOpen(false)}
              >
                <Image
                  src='/logo_symbol.png'
                  alt='Flemoji'
                  width={32}
                  height={32}
                  className='h-8 w-auto'
                />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className='p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
                aria-label='Close menu'
              >
                <XMarkIcon className='w-4 h-4' />
              </button>
            </div>

            <div className='flex-1 px-3 py-4 overflow-y-auto min-h-0 space-y-5'>
              {navGroups.map(group => (
                <div key={group.label}>
                  <p className='px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500'>
                    {group.label}
                  </p>
                  <nav className='space-y-0.5'>
                    {group.items.map(item => (
                      <NavLink
                        key={item.id}
                        item={item}
                        isActive={activeTab === item.id}
                        href={getTabHref(item.id)}
                        onClick={() => setIsOpen(false)}
                      />
                    ))}
                  </nav>
                </div>
              ))}
            </div>

            <div className='flex-shrink-0 px-4 py-3.5 border-t border-gray-100 dark:border-slate-800'>
              <UserDetailsFooter onMobileMenuClose={() => setIsOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
