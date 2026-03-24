'use client';

import {
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QueueListIcon,
  ClockIcon,
  TagIcon,
  SparklesIcon,
  DocumentTextIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  UserGroupIcon as UserGroupSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  TagIcon as TagSolidIcon,
  QueueListIcon as QueueListSolidIcon,
  ClockIcon as ClockSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
  SparklesIcon as SparklesSolidIcon,
  DocumentTextIcon as DocumentTextSolidIcon,
  BoltIcon as BoltSolidIcon,
  AdjustmentsHorizontalIcon as AdjustmentsHorizontalSolidIcon,
} from '@heroicons/react/24/solid';
import UserDetailsFooter from '@/components/layout/UserDetailsFooter';
import FSideNav, { FSideNavGroup } from '@/components/ui/FSideNav';

interface AdminNavigationProps {
  systemHealth: 'healthy' | 'warning' | 'critical';
  systemHealthReasons?: string[];
}

const GROUPS: FSideNavGroup[] = [
  {
    label: '',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/admin/dashboard/overview',
        icon: ChartBarIcon,
        activeIcon: ChartBarSolidIcon,
        matchFn: p =>
          p === '/admin/dashboard' || p === '/admin/dashboard/overview',
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        id: 'timeline-posts',
        label: 'Timeline Posts',
        href: '/admin/dashboard/timeline-posts',
        icon: SparklesIcon,
        activeIcon: SparklesSolidIcon,
      },
      {
        id: 'content',
        label: 'Learn',
        href: '/admin/dashboard/content',
        icon: DocumentTextIcon,
        activeIcon: DocumentTextSolidIcon,
      },
      {
        id: 'playlists',
        label: 'Playlists',
        href: '/admin/dashboard/playlists',
        icon: QueueListIcon,
        activeIcon: QueueListSolidIcon,
      },
      {
        id: 'genres',
        label: 'Genres',
        href: '/admin/dashboard/genres',
        icon: TagIcon,
        activeIcon: TagSolidIcon,
      },
    ],
  },
  {
    label: 'Community',
    items: [
      {
        id: 'users',
        label: 'Users',
        href: '/admin/dashboard/users',
        icon: UserGroupIcon,
        activeIcon: UserGroupSolidIcon,
      },
      {
        id: 'submissions',
        label: 'Submissions',
        href: '/admin/dashboard/submissions',
        icon: ClockIcon,
        activeIcon: ClockSolidIcon,
      },
    ],
  },
  {
    label: 'Platform',
    items: [
      {
        id: 'pulse',
        label: 'PULSE³',
        href: '/admin/pulse',
        icon: BoltIcon,
        activeIcon: BoltSolidIcon,
        matchFn: p => p.startsWith('/admin/pulse'),
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/admin/dashboard/analytics',
        icon: ChartBarIcon,
        activeIcon: ChartBarSolidIcon,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        id: 'track-completion',
        label: 'Track Rules',
        href: '/admin/dashboard/track-completion',
        icon: AdjustmentsHorizontalIcon,
        activeIcon: AdjustmentsHorizontalSolidIcon,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/admin/dashboard/settings',
        icon: Cog6ToothIcon,
        activeIcon: Cog6ToothSolidIcon,
      },
    ],
  },
];

export default function AdminNavigation({
  systemHealth,
  systemHealthReasons,
}: AdminNavigationProps) {
  return (
    <FSideNav
      groups={GROUPS}
      mode='href'
      collapsible
      storageKey='admin-sidebar-collapsed'
      aria-label='Admin navigation'
      footer={
        <UserDetailsFooter
          showSystemHealth={true}
          systemHealth={systemHealth}
          systemHealthReasons={systemHealthReasons}
        />
      }
    />
  );
}
