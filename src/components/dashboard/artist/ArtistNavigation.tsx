'use client';

import {
  MusicalNoteIcon,
  ChartBarIcon,
  PlusIcon,
  UserIcon,
  FolderOpenIcon,
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
import FSideNav, { FSideNavGroup } from '@/components/ui/FSideNav';

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

const NAV_GROUP_DEFS = [
  {
    label: 'Music',
    items: [
      {
        id: 'overview' as TabId,
        label: 'Overview',
        icon: HomeIcon,
        activeIcon: HomeSolid,
      },
      {
        id: 'library' as TabId,
        label: 'Library',
        icon: MusicalNoteIcon,
        activeIcon: MusicalNoteSolid,
      },
      {
        id: 'upload' as TabId,
        label: 'Upload',
        icon: PlusIcon,
        activeIcon: PlusSolid,
      },
    ],
  },
  {
    label: 'Promote',
    items: [
      {
        id: 'submissions' as TabId,
        label: 'Submissions',
        icon: FolderOpenIcon,
        activeIcon: FolderOpenSolid,
      },
      {
        id: 'quick-links' as TabId,
        label: 'Quick Links',
        icon: LinkIcon,
        activeIcon: LinkSolid,
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        id: 'analytics' as TabId,
        label: 'Analytics',
        icon: ChartBarIcon,
        activeIcon: ChartBarSolid,
        badge: 'Soon' as const,
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 'profile' as TabId,
        label: 'Profile',
        icon: UserIcon,
        activeIcon: UserSolid,
      },
    ],
  },
];

export default function ArtistNavigation({
  activeTab,
  getTabHref,
}: ArtistNavigationProps) {
  const groups: FSideNavGroup[] = NAV_GROUP_DEFS.map(g => ({
    label: g.label,
    items: g.items.map(item => ({
      ...item,
      href: getTabHref(item.id),
    })),
  }));

  return (
    <FSideNav
      groups={groups}
      mode='tab'
      activeTab={activeTab}
      aria-label='Artist navigation'
      footer={<UserDetailsFooter />}
    />
  );
}
