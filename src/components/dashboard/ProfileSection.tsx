'use client';

import { UserIcon } from '@heroicons/react/24/outline';
import FButton from '@/components/ui/FButton';
import FAvatar from '@/components/ui/FAvatar';
import { toAbsoluteUrl } from '@/lib/url-utils';

interface ProfileSectionProps {
  profile: {
    artistName: string;
    profileImage?: string;
    profileImageUrl?: string | null;
    genre?: string;
  } | null;
  onCreateProfile: () => void;
  onEditProfile: () => void;
}

export default function ProfileSection({
  profile,
  onCreateProfile,
  onEditProfile,
}: ProfileSectionProps) {
  return (
    <div className='sticky top-24 bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700'>
      {!profile ? (
        <div className='text-center'>
          <div className='w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3'>
            <UserIcon className='w-6 h-6 text-gray-400 dark:text-gray-500' />
          </div>
          <h3 className='font-medium text-slate-900 dark:text-white mb-3 text-sm'>
            No Profile
          </h3>
          <FButton size='md' variant='primary' onPress={onCreateProfile}>
            Create Profile
          </FButton>
        </div>
      ) : (
        <div className='text-center'>
          <div className='relative mx-auto mb-3 w-fit'>
            <FAvatar
              src={
                toAbsoluteUrl(profile.profileImageUrl, profile.profileImage) ??
                undefined
              }
              name={profile.artistName}
              size='md'
            />
            <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white dark:border-slate-900' />
          </div>
          <h3 className='font-medium text-slate-900 dark:text-white mb-1 text-sm truncate'>
            {profile.artistName}
          </h3>
          <p className='text-xs text-slate-500 dark:text-slate-400 mb-3'>
            {profile.genre || 'Artist'}
          </p>
          <FButton size='md' variant='outline' onPress={onEditProfile}>
            Edit Profile
          </FButton>
        </div>
      )}
    </div>
  );
}
