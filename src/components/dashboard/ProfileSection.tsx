'use client';

import { Button, Avatar } from '@heroui/react';
import { UserIcon } from '@heroicons/react/24/outline';

interface ProfileSectionProps {
  profile: {
    artistName: string;
    profileImage?: string;
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
          <div className='w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3'>
            <UserIcon className='w-5 h-5 text-white' />
          </div>
          <h3 className='font-medium text-slate-900 dark:text-white mb-3 text-sm'>
            No Profile
          </h3>
          <Button
            size='md'
            color='primary'
            variant='solid'
            onPress={onCreateProfile}
          >
            Create Profile
          </Button>
        </div>
      ) : (
        <div className='text-center'>
          <div className='relative mx-auto mb-3'>
            <Avatar
              src={profile.profileImage}
              name={profile.artistName}
              className='w-10 h-10 mx-auto'
            />
            <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white dark:border-slate-900'></div>
          </div>
          <h3 className='font-medium text-slate-900 dark:text-white mb-1 text-sm truncate'>
            {profile.artistName}
          </h3>
          <p className='text-xs text-slate-500 dark:text-slate-400 mb-3'>
            {profile.genre || 'Artist'}
          </p>
          <Button
            size='md'
            color='primary'
            variant='bordered'
            onPress={onEditProfile}
          >
            Edit Profile
          </Button>
        </div>
      )}
    </div>
  );
}
