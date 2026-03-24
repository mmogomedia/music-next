'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import ArtistNavigation from '@/components/dashboard/artist/ArtistNavigation';
import { FButton } from '@/components/ui';
import QuickLinksManager from '@/components/dashboard/quick-links/QuickLinksManager';
import type { Track } from '@/types/track';
import type { ArtistProfile } from '@/types/artist-profile';

interface QuickLinksPageClientProps {
  profile: Pick<
    ArtistProfile,
    'id' | 'userId' | 'artistName' | 'profileImage' | 'slug'
  > & { isPublic?: boolean; isVerified?: boolean; isActive?: boolean };
  tracks: Track[];
}

const getTabHref = (tabId: string) =>
  tabId === 'overview' ? '/dashboard' : `/dashboard?tab=${tabId}`;

export default function QuickLinksPageClient({
  profile,
  tracks,
}: QuickLinksPageClientProps) {
  const router = useRouter();

  const header = (
    <header className='border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950'>
      <div className='py-3 px-4 sm:px-6 lg:px-8 flex items-center gap-4'>
        <FButton
          variant='ghost'
          size='sm'
          isIconOnly
          onPress={() => router.push('/dashboard?tab=tools')}
          aria-label='Back to tools'
        >
          <ArrowLeftIcon className='w-4 h-4' />
        </FButton>
        <div>
          <p className='text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium'>
            Tools
          </p>
          <h1 className='text-base font-semibold text-gray-900 dark:text-white leading-none'>
            Quick Links
          </h1>
        </div>
      </div>
    </header>
  );

  return (
    <RoleBasedRedirect>
      <UnifiedLayout
        sidebar={<ArtistNavigation activeTab='tools' getTabHref={getTabHref} />}
        contentClassName='w-full bg-gray-50 dark:bg-slate-950 min-h-screen'
        header={header}
      >
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10'>
          <QuickLinksManager
            tracks={tracks}
            profile={profile as ArtistProfile}
          />
        </div>
      </UnifiedLayout>
    </RoleBasedRedirect>
  );
}
