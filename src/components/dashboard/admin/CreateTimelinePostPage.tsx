'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AdminNavigation from './AdminNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import CreateSongPostForm from './CreateSongPostForm';
import type { PostType } from '@prisma/client';

const POST_TYPES: Array<{
  value: PostType;
  label: string;
  description: string;
  icon: string;
  component?: React.ComponentType;
}> = [
  {
    value: 'SONG',
    label: 'Song',
    description: 'Post a song from your database',
    icon: '🎶',
  },
  {
    value: 'MUSIC_POST',
    label: 'Music Post',
    description: 'Share music content',
    icon: '🎵',
  },
  {
    value: 'NEWS_ARTICLE',
    label: 'News Article',
    description: 'Publish news',
    icon: '📰',
  },
  {
    value: 'VIDEO_CONTENT',
    label: 'Video',
    description: 'Share video content',
    icon: '🎥',
  },
  {
    value: 'RELEASE_PROMO',
    label: 'Release Promo',
    description: 'Promote a release',
    icon: '🚀',
  },
  {
    value: 'EVENT_ANNOUNCEMENT',
    label: 'Event',
    description: 'Announce an event',
    icon: '📅',
  },
  {
    value: 'ADVERTISEMENT',
    label: 'Advertisement',
    description: 'Create an ad',
    icon: '📢',
  },
  {
    value: 'POLL',
    label: 'Poll',
    description: 'Create a poll',
    icon: '📊',
  },
];

export default function CreateTimelinePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { stats } = useAdminDashboardStats();
  const systemHealth = stats?.systemMetrics?.platformHealth || 'healthy';

  const postTypeParam = searchParams.get('type') as PostType | null;
  const [selectedPostType, setSelectedPostType] = useState<PostType | null>(
    postTypeParam || null
  );

  const selectedTypeConfig = useMemo(
    () => POST_TYPES.find(t => t.value === selectedPostType),
    [selectedPostType]
  );

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-3 px-4 sm:px-6'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => router.back()}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
          >
            <ArrowLeftIcon className='w-5 h-5 text-gray-600 dark:text-gray-400' />
          </button>
          <div>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
              {selectedPostType
                ? `Create ${selectedTypeConfig?.label || 'Post'}`
                : 'Create Timeline Post'}
            </h1>
            <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
              {selectedPostType
                ? selectedTypeConfig?.description
                : 'Choose a post type to get started'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <UnifiedLayout
      sidebar={
        <AdminNavigation
          activeTab='timeline-posts'
          onTabChange={() => {}}
          systemHealth={systemHealth}
        />
      }
      header={header}
    >
      <div className='w-full py-4 px-4 sm:px-6'>
        {!selectedPostType ? (
          <div className='max-w-4xl mx-auto'>
            <div className='mb-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                Select Post Type
              </h2>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Choose the type of timeline post you want to create
              </p>
            </div>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {POST_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => {
                    setSelectedPostType(type.value);
                    router.push(
                      `/admin/dashboard/timeline-posts/create?type=${type.value}`
                    );
                  }}
                  className='p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group'
                >
                  <div className='text-3xl mb-2'>{type.icon}</div>
                  <div className='font-medium text-sm text-gray-900 dark:text-white mb-1'>
                    {type.label}
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className='max-w-3xl mx-auto'>
            {selectedPostType === 'SONG' && <CreateSongPostForm />}
            {selectedPostType !== 'SONG' && (
              <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
                <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                  Post type &quot;{selectedTypeConfig?.label}&quot; creation UI
                  coming soon. Please use the modal for now.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </UnifiedLayout>
  );
}
