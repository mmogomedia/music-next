'use client';

import React from 'react';
import {
  MusicalNoteIcon,
  ArrowRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';

interface ProfileType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  available: boolean;
}

// Only show available profile types (extensible for future types)
const profileTypes: ProfileType[] = [
  {
    id: 'artist',
    name: 'Artist Profile',
    description: 'Upload music, manage your tracks, and build your fanbase',
    icon: <MusicalNoteIcon className='w-5 h-5' />,
    href: '/profile/onboarding/artist',
    available: true,
  },
];

export default function ProfileTypeSelection() {
  const router = useRouter();

  const handleCancel = () => {
    // Redirect to home page since dashboard requires a profile
    router.push('/');
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-950'>
      {/* Header */}
      <div className='bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800'>
        <div className='max-w-4xl mx-auto px-6 py-5'>
          <Link href='/' className='inline-block'>
            <Image
              src='/main_logo.png'
              alt='Flemoji'
              width={180}
              height={54}
              priority
              className='h-9 w-auto'
            />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-2xl mx-auto px-6 py-16'>
        {/* Header Section */}
        <div className='text-center mb-12'>
          <h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3'>
            Choose Your Profile Type
          </h1>
          <p className='text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed'>
            Select the type of profile that best fits your needs. You can always
            update this later.
          </p>
        </div>

        {/* Profile Type Card */}
        <div className='space-y-4 mb-8'>
          {profileTypes
            .filter(pt => pt.available)
            .map(profileType => (
              <Link key={profileType.id} href={profileType.href}>
                <div className='group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-6 hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200'>
                  <div className='flex items-start gap-4'>
                    {/* Icon */}
                    <div className='flex-shrink-0 w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors'>
                      {profileType.icon}
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1.5'>
                        {profileType.name}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed'>
                        {profileType.description}
                      </p>
                      <div className='flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400'>
                        <span>Continue</span>
                        <ArrowRightIcon className='w-4 h-4 group-hover:translate-x-0.5 transition-transform' />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>

        {/* Cancel Button */}
        <div className='flex justify-center pt-6 border-t border-gray-200 dark:border-slate-800'>
          <Button
            variant='light'
            onPress={handleCancel}
            className='text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            startContent={<XMarkIcon className='w-4 h-4' />}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
