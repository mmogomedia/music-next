'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  FireIcon,
  HeartIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  SparklesIcon,
  StarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import FanNavigation from '@/components/dashboard/fan/FanNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';

type FanTabId =
  | 'trending'
  | 'recommended'
  | 'new-releases'
  | 'saved'
  | 'following'
  | 'profile';

const TAB_IDS: FanTabId[] = [
  'trending',
  'recommended',
  'new-releases',
  'saved',
  'following',
  'profile',
];
const DEFAULT_TAB: FanTabId = 'trending';

interface Track {
  id: string;
  title: string;
  artist: string;
  playCount: number;
  coverImageUrl?: string | null;
  duration?: number;
}

function TrackRow({ track, index }: { track: Track; index: number }) {
  return (
    <div className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors'>
      <span className='w-6 text-center text-sm text-slate-400 font-medium flex-shrink-0'>
        {index + 1}
      </span>
      <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center flex-shrink-0'>
        {track.coverImageUrl ? (
          <img
            src={track.coverImageUrl}
            alt={track.title}
            className='w-10 h-10 rounded-lg object-cover'
          />
        ) : (
          <MusicalNoteIcon className='w-4 h-4 text-primary-400' />
        )}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
          {track.title}
        </p>
        <p className='text-xs text-slate-500 dark:text-slate-400 truncate'>
          {track.artist}
        </p>
      </div>
      <span className='text-xs text-slate-400 flex-shrink-0'>
        {track.playCount?.toLocaleString()} plays
      </span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  onCta,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
      <div className='w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4'>
        <Icon className='w-7 h-7 text-primary-400' />
      </div>
      <h3 className='text-base font-semibold text-gray-900 dark:text-white mb-2'>
        {title}
      </h3>
      <p className='text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4'>
        {description}
      </p>
      {cta && onCta && (
        <button
          onClick={onCta}
          className='text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline'
        >
          {cta}
        </button>
      )}
    </div>
  );
}

function UpgradeCard() {
  const router = useRouter();

  return (
    <div className='rounded-xl border border-primary-100 dark:border-primary-800/40 bg-primary-50 dark:bg-primary-900/10 p-5'>
      <div className='flex items-start gap-4'>
        <div className='w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0'>
          <MusicalNoteIcon className='w-5 h-5 text-white' />
        </div>
        <div className='flex-1'>
          <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
            Share your music on Flemoji
          </h3>
          <p className='text-xs text-slate-600 dark:text-slate-400 mb-3'>
            Create your artist profile to upload tracks, pitch to playlists, and
            reach new listeners.
          </p>
          <button
            onClick={() => router.push('/profile/select')}
            className='text-xs font-semibold px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors'
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}

function TrendingTab() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch('/api/tracks/public?limit=20&sort=plays');
        if (res.ok) {
          const data = await res.json();
          setTracks(data.tracks || []);
        }
      } catch {
        // fallback — show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  return (
    <div className='space-y-4'>
      <UpgradeCard />
      <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden'>
        <div className='flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700'>
          <FireIcon className='w-4 h-4 text-rose-500' />
          <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
            Trending Tracks
          </h3>
        </div>
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin' />
          </div>
        ) : tracks.length > 0 ? (
          <div className='divide-y divide-gray-50 dark:divide-slate-700/50 px-2 py-2'>
            {tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FireIcon}
            title='No tracks yet'
            description='Browse the platform to discover music from South African artists.'
            cta='Go to Browse'
            onCta={() => router.push('/browse')}
          />
        )}
      </div>
    </div>
  );
}

function RecommendedTab() {
  const router = useRouter();

  return (
    <div className='space-y-4'>
      <UpgradeCard />
      <EmptyState
        icon={SparklesIcon}
        title='Personalised recommendations coming soon'
        description="We're building AI-powered recommendations based on what you listen to. For now, explore what's on the platform."
        cta='Browse all music'
        onCta={() => router.push('/browse')}
      />
    </div>
  );
}

function NewReleasesTab() {
  const router = useRouter();

  return (
    <div className='space-y-4'>
      <UpgradeCard />
      <EmptyState
        icon={StarIcon}
        title='New releases coming soon'
        description="See what's freshly dropped by artists you follow. Start following some artists first."
        cta='Browse artists'
        onCta={() => router.push('/browse')}
      />
    </div>
  );
}

function SavedTab() {
  const router = useRouter();

  return (
    <EmptyState
      icon={HeartIcon}
      title='No saved tracks yet'
      description='Like tracks while browsing to save them here for easy access later.'
      cta='Browse and discover music'
      onCta={() => router.push('/browse')}
    />
  );
}

function FollowingTab() {
  const router = useRouter();

  return (
    <EmptyState
      icon={UserGroupIcon}
      title='Not following anyone yet'
      description='Follow artists to stay updated with their latest releases and activity.'
      cta='Browse artists'
      onCta={() => router.push('/browse')}
    />
  );
}

function ProfileTab() {
  const { data: session } = useSession();

  return (
    <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6'>
      <div className='flex items-center gap-4 mb-6'>
        <div className='w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center'>
          <UserCircleIcon className='w-8 h-8 text-primary-400' />
        </div>
        <div>
          <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
            {session?.user?.name || 'Your Account'}
          </h3>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            {session?.user?.email}
          </p>
        </div>
      </div>
      <div className='pt-4 border-t border-gray-100 dark:border-slate-700'>
        <UpgradeCard />
      </div>
    </div>
  );
}

interface FanDashboardContentProps {
  // passed from parent for SSR awareness, but we also do client-side routing
}

export default function FanDashboardContent(_props: FanDashboardContentProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isValidTab = (tab: string | null): tab is FanTabId =>
    !!tab && TAB_IDS.includes(tab as FanTabId);

  const createHrefForTab = useCallback(
    (tab: FanTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === DEFAULT_TAB) {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams]
  );

  const tabParam = searchParams.get('tab');
  const activeTab: FanTabId = isValidTab(tabParam) ? tabParam : DEFAULT_TAB;

  const tabNames: Record<FanTabId, string> = {
    trending: 'Trending',
    recommended: 'Recommended',
    'new-releases': 'New Releases',
    saved: 'Saved Tracks',
    following: 'Following',
    profile: 'Profile',
  };

  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center'>
        <div className='w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-3 px-4 sm:px-5 lg:px-6'>
        <h1 className='text-lg font-bold text-gray-900 dark:text-white'>
          {tabNames[activeTab]}
        </h1>
      </div>
    </header>
  );

  return (
    <RoleBasedRedirect>
      <UnifiedLayout
        sidebar={
          <FanNavigation activeTab={activeTab} getTabHref={createHrefForTab} />
        }
        contentClassName='w-full'
        header={header}
      >
        <div className='w-full py-4 px-4 sm:px-5 lg:px-6'>
          {activeTab === 'trending' && <TrendingTab />}
          {activeTab === 'recommended' && <RecommendedTab />}
          {activeTab === 'new-releases' && <NewReleasesTab />}
          {activeTab === 'saved' && <SavedTab />}
          {activeTab === 'following' && <FollowingTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </div>
      </UnifiedLayout>
    </RoleBasedRedirect>
  );
}
