'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QueueListIcon,
  ClockIcon,
  TagIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  TrophyIcon,
  DocumentTextIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import {
  UserGroupIcon as UserGroupSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  TagIcon as TagSolidIcon,
  QueueListIcon as QueueListSolidIcon,
  ClockIcon as ClockSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
  SparklesIcon as SparklesSolidIcon,
  TrophyIcon as TrophySolidIcon,
  DocumentTextIcon as DocumentTextSolidIcon,
  BoltIcon as BoltSolidIcon,
  AdjustmentsHorizontalIcon as AdjustmentsHorizontalSolidIcon,
} from '@heroicons/react/24/solid';
import UserDetailsFooter from '@/components/layout/UserDetailsFooter';

interface AdminNavigationProps {
  activeTab: string;
  onTabChange: (_tab: string) => void;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface NavItemDef {
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  activeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  matchFn?: (_pathname: string) => boolean;
}

interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

function getItemActive(item: NavItemDef, pathname: string): boolean {
  if (item.matchFn) return item.matchFn(pathname);
  return pathname === item.href;
}

function SidebarItem({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: NavItemDef;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}) {
  const IconComponent = isActive ? item.activeIcon : item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={isCollapsed ? item.label : undefined}
      className={`flex items-center gap-3 py-2.5 border-l-2 font-medium transition-all duration-150 group ${
        isCollapsed ? 'justify-center px-2' : 'pl-3 pr-3'
      } ${
        isActive
          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-r-lg'
          : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white hover:rounded-lg'
      }`}
    >
      <IconComponent className='w-5 h-5 flex-shrink-0' />
      {!isCollapsed && <span className='text-sm'>{item.label}</span>}
    </Link>
  );
}

function SidebarGroup({
  group,
  pathname,
  isCollapsed,
  onItemClick,
}: {
  group: NavGroupDef;
  pathname: string;
  isCollapsed: boolean;
  onItemClick?: () => void;
}) {
  return (
    <div className='mb-4'>
      {!isCollapsed && (
        <p className='text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 px-3'>
          {group.title}
        </p>
      )}
      {isCollapsed && <div className='h-3' />}
      <nav className='space-y-0.5'>
        {group.items.map(item => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={getItemActive(item, pathname)}
            isCollapsed={isCollapsed}
            onClick={onItemClick}
          />
        ))}
      </nav>
    </div>
  );
}

const OVERVIEW_ITEM: NavItemDef = {
  href: '/admin/dashboard/overview',
  icon: ChartBarIcon,
  activeIcon: ChartBarSolidIcon,
  label: 'Overview',
  matchFn: p => p === '/admin/dashboard' || p === '/admin/dashboard/overview',
};

const NAV_GROUPS: NavGroupDef[] = [
  {
    title: 'Content',
    items: [
      {
        href: '/admin/dashboard/timeline-posts',
        icon: SparklesIcon,
        activeIcon: SparklesSolidIcon,
        label: 'Timeline Posts',
      },
      {
        href: '/admin/dashboard/content',
        icon: DocumentTextIcon,
        activeIcon: DocumentTextSolidIcon,
        label: 'Learn',
      },
      {
        href: '/admin/dashboard/playlists',
        icon: QueueListIcon,
        activeIcon: QueueListSolidIcon,
        label: 'Playlists',
      },
      {
        href: '/admin/dashboard/genres',
        icon: TagIcon,
        activeIcon: TagSolidIcon,
        label: 'Genres',
      },
    ],
  },
  {
    title: 'Community',
    items: [
      {
        href: '/admin/dashboard/users',
        icon: UserGroupIcon,
        activeIcon: UserGroupSolidIcon,
        label: 'Users',
      },
      {
        href: '/admin/dashboard/submissions',
        icon: ClockIcon,
        activeIcon: ClockSolidIcon,
        label: 'Submissions',
      },
      {
        href: '/admin/dashboard/league',
        icon: TrophyIcon,
        activeIcon: TrophySolidIcon,
        label: 'League',
      },
    ],
  },
  {
    title: 'Platform',
    items: [
      {
        href: '/admin/pulse',
        icon: BoltIcon,
        activeIcon: BoltSolidIcon,
        label: 'PULSE³',
        matchFn: p => p.startsWith('/admin/pulse'),
      },
      {
        href: '/admin/dashboard/analytics',
        icon: ChartBarIcon,
        activeIcon: ChartBarSolidIcon,
        label: 'Analytics',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        href: '/admin/dashboard/track-completion',
        icon: AdjustmentsHorizontalIcon,
        activeIcon: AdjustmentsHorizontalSolidIcon,
        label: 'Track Rules',
      },
      {
        href: '/admin/dashboard/settings',
        icon: Cog6ToothIcon,
        activeIcon: Cog6ToothSolidIcon,
        label: 'Settings',
      },
    ],
  },
];

const STORAGE_KEY = 'admin-sidebar-collapsed';

export default function AdminNavigation({
  activeTab: _activeTab,
  onTabChange: _onTabChange,
  systemHealth,
}: AdminNavigationProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setIsCollapsed(stored === 'true');
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  if (isMobile === null) return null;

  const isOverviewActive = getItemActive(OVERVIEW_ITEM, pathname);

  // ── Desktop Sidebar ────────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <aside
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col z-30 pb-20 relative transition-all duration-200 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo + collapse toggle */}
        <div
          className={`border-b border-gray-200 dark:border-slate-700 flex-shrink-0 h-16 flex items-center ${
            isCollapsed
              ? 'flex-col justify-center gap-1 px-2 py-2'
              : 'justify-between px-4'
          }`}
        >
          <Link href='/'>
            {isCollapsed ? (
              <Image
                src='/logo_symbol.png'
                alt='Flemoji'
                width={32}
                height={32}
                className='w-8 h-8 rounded-lg'
              />
            ) : (
              <Image
                src='/main_logo.png'
                alt='Flemoji'
                width={120}
                height={32}
                className='h-8 w-auto'
              />
            )}
          </Link>
          <button
            onClick={toggleCollapsed}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className='p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0'
          >
            {isCollapsed ? (
              <ChevronDoubleRightIcon className='w-4 h-4' />
            ) : (
              <ChevronDoubleLeftIcon className='w-4 h-4' />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className='flex-1 overflow-y-auto min-h-0 py-4 px-2'>
          {/* Overview — standalone at top */}
          <div className='mb-4'>
            <SidebarItem
              item={OVERVIEW_ITEM}
              isActive={isOverviewActive}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Grouped sections */}
          {NAV_GROUPS.map(group => (
            <SidebarGroup
              key={group.title}
              group={group}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>

        {/* Footer — absolutely positioned at bottom, above music player */}
        <div className='absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-50'>
          <UserDetailsFooter
            showSystemHealth={true}
            systemHealth={systemHealth}
          />
        </div>
      </aside>
    );
  }

  // ── Mobile ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile header bar */}
      <div className='fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-[60] lg:hidden'>
        <div className='flex items-center justify-between px-4 py-3'>
          <Link href='/'>
            <Image
              src='/logo_symbol.png'
              alt='Flemoji'
              width={32}
              height={32}
              className='w-8 h-8 rounded-lg'
            />
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

      {/* Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            type='button'
            className='fixed inset-0 bg-black/50 z-[55]'
            onClick={() => setIsOpen(false)}
            aria-label='Close drawer'
          />

          {/* Drawer panel */}
          <div className='fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 z-[56] shadow-2xl flex flex-col pb-20 relative'>
            {/* Drawer header */}
            <div className='h-14 px-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0'>
              <Link href='/' onClick={() => setIsOpen(false)}>
                <Image
                  src='/logo_symbol.png'
                  alt='Flemoji'
                  width={32}
                  height={32}
                  className='w-8 h-8 rounded-lg'
                />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300'
              >
                <XMarkIcon className='w-5 h-5' />
              </button>
            </div>

            {/* Nav items */}
            <div className='flex-1 overflow-y-auto py-4 px-2 min-h-0'>
              <div className='mb-4'>
                <SidebarItem
                  item={OVERVIEW_ITEM}
                  isActive={isOverviewActive}
                  isCollapsed={false}
                  onClick={() => setIsOpen(false)}
                />
              </div>
              {NAV_GROUPS.map(group => (
                <SidebarGroup
                  key={group.title}
                  group={group}
                  pathname={pathname}
                  isCollapsed={false}
                  onItemClick={() => setIsOpen(false)}
                />
              ))}
            </div>

            {/* Footer */}
            <div className='absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-50'>
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
