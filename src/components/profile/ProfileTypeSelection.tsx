'use client';

import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import {
  UserIcon,
  MusicalNoteIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ProfileType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  available: boolean;
  comingSoon?: boolean;
}

const profileTypes: ProfileType[] = [
  {
    id: 'artist',
    name: 'Artist Profile',
    description: 'Upload music, manage your tracks, and build your fanbase',
    icon: <MusicalNoteIcon className='w-8 h-8' />,
    href: '/profile/create/artist',
    available: true,
  },
  {
    id: 'producer',
    name: 'Producer Profile',
    description:
      'Create beats, collaborate with artists, and showcase your work',
    icon: <MicrophoneIcon className='w-8 h-8' />,
    href: '/profile/create/producer',
    available: false,
    comingSoon: true,
  },
  {
    id: 'podcaster',
    name: 'Podcaster Profile',
    description: 'Host podcasts, manage episodes, and grow your audience',
    icon: <SpeakerWaveIcon className='w-8 h-8' />,
    href: '/profile/create/podcaster',
    available: false,
    comingSoon: true,
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Create videos, manage content, and monetize your creativity',
    icon: <VideoCameraIcon className='w-8 h-8' />,
    href: '/profile/create/content-creator',
    available: false,
    comingSoon: true,
  },
  {
    id: 'designer',
    name: 'Designer Profile',
    description: 'Create album artwork, visual content, and design services',
    icon: <PaintBrushIcon className='w-8 h-8' />,
    href: '/profile/create/designer',
    available: false,
    comingSoon: true,
  },
];

export default function ProfileTypeSelection() {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900'>
      {/* Header */}
      <div className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <MusicalNoteIcon className='w-5 h-5 text-white' />
              </div>
              <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                Flemoji
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24'>
        <div className='text-center mb-12'>
          <div className='w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6'>
            <UserIcon className='w-10 h-10 text-blue-600' />
          </div>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
            Welcome to Flemoji!
          </h2>
          <p className='text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
            To get started, you&apos;ll need to create a profile. Choose the
            type that best fits your creative journey.
          </p>
        </div>

        {/* Profile Type Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
          {profileTypes.map(profileType => (
            <Card
              key={profileType.id}
              className={`transition-all duration-200 hover:shadow-lg ${
                profileType.available
                  ? 'hover:scale-105 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <CardBody className='p-6 text-center'>
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    profileType.available
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {profileType.icon}
                </div>

                <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
                  {profileType.name}
                </h3>

                <p className='text-gray-600 dark:text-gray-400 mb-6'>
                  {profileType.description}
                </p>

                {profileType.available ? (
                  <Link href={profileType.href}>
                    <Button color='primary' size='lg' className='w-full'>
                      Create Profile
                    </Button>
                  </Link>
                ) : (
                  <div className='space-y-2'>
                    <Button
                      color='default'
                      size='lg'
                      className='w-full'
                      isDisabled
                    >
                      Coming Soon
                    </Button>
                    {profileType.comingSoon && (
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        This profile type will be available soon
                      </p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className='mt-12 text-center'>
          <Card className='max-w-2xl mx-auto'>
            <CardBody className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                Why do I need a profile?
              </h3>
              <div className='text-left space-y-2 text-gray-600 dark:text-gray-400'>
                <p>• Upload and manage your creative content</p>
                <p>• Access personalized features and analytics</p>
                <p>• Connect with other creators and fans</p>
                <p>• Monetize your content and build your brand</p>
                <p>• Get access to exclusive tools and features</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
