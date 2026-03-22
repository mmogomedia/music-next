'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  HeartIcon,
  UserGroupIcon,
  UserIcon,
  SparklesIcon,
  Bars3Icon,
  XMarkIcon,
  FireIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import {
  MusicalNoteIcon as MusicalNoteSolid,
  HeartIcon as HeartSolid,
  UserGroupIcon as UserGroupSolid,
  UserIcon as UserSolid,
  SparklesIcon as SparklesSolid,
  FireIcon as FireSolid,
  StarIcon as StarSolid,
} from '@heroicons/react/24/solid';
import UserDetailsFooter from '@/components/layout/UserDetailsFooter';

type FanTabId =
  | 'trending'
  | 'recommended'
  | 'new-releases'
  | 'saved'
  | 'following'
  | 'profile';

interface FanNavigationProps {
  activeTab: string;
  getTabHref: (_tab: FanTabId) => string;
}

interface NavItem {
  id: FanTabId;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Discover',
    items: [
      {
        id: 'trending',
        name: 'Trending',
        icon: FireIcon,
        activeIcon: FireSolid,
      },
      {
        id: 'recommended',
        name: 'Recommended',
        icon: SparklesIcon,
        activeIcon: SparklesSolid,
      },
      {
        id: 'new-releases',
        name: 'New Releases',
        icon: StarIcon,
        activeIcon: StarSolid,
      },
    ],
  },
  {
    label: 'Library',
    items: [
      {
        id: 'saved',
        name: 'Saved Tracks',
        icon: HeartIcon,
        activeIcon: HeartSolid,
      },
      {
        id: 'following',
        name: 'Following',
        icon: UserGroupIcon,
        activeIcon: UserGroupSolid,
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
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <Icon className='w-[18px] h-[18px] flex-shrink-0' />
      <span className='flex-1'>{item.name}</span>
    </Link>
  );
}

function UpgradeCTA({ onClose }: { onClose?: () => void }) {
  const router = useRouter();

  return (
    <div className='mx-3 mb-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50'>
      <div className='flex items-center gap-2 mb-2'>
        <MusicalNoteSolid className='w-4 h-4 text-blue-600 dark:text-blue-400' />
        <span className='text-xs font-semibold text-blue-700 dark:text-blue-300'>
          Share Your Music
        </span>
      </div>
      <p className='text-xs text-blue-600 dark:text-blue-400 mb-3'>
        Create your artist profile and reach new listeners.
      </p>
      <button
        onClick={() => {
          onClose?.();
          router.push('/profile/select');
        }}
        className='w-full text-xs font-semibold px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors'
      >
        Get Started →
      </button>
    </div>
  );
}

export default function FanNavigation({
  activeTab,
  getTabHref,
}: FanNavigationProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile === null) return null;

  const sidebarBody = (onLinkClick?: () => void) => (
    <>
      {/* Logo */}
      <div className='px-5 py-5 border-b border-gray-100 dark:border-slate-800 flex-shrink-0'>
        <Link
          href='/'
          className='flex items-center gap-2 group'
          onClick={onLinkClick}
        >
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

      {/* Upgrade CTA */}
      <UpgradeCTA onClose={onLinkClick} />

      {/* Footer */}
      <div className='flex-shrink-0 px-4 py-3.5 border-t border-gray-100 dark:border-slate-800'>
        <UserDetailsFooter onMobileMenuClose={onLinkClick} />
      </div>
    </>
  );

  // Desktop sidebar
  if (!isMobile) {
    return (
      <aside className='relative w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col z-30'>
        {sidebarBody()}
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
            {sidebarBody(() => setIsOpen(false))}
          </div>
        </>
      )}
    </>
  );
}
