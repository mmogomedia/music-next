'use client';

import { useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { PostType } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/Toast';

interface AdminTimelinePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const POST_TYPES: Array<{
  value: PostType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'MUSIC_POST',
    label: 'Music Post',
    description: 'Share music',
    icon: '🎵',
  },
  { value: 'SONG', label: 'Song', description: 'Post a song', icon: '🎶' },
  {
    value: 'NEWS_ARTICLE',
    label: 'News',
    description: 'Publish news',
    icon: '📰',
  },
  {
    value: 'VIDEO_CONTENT',
    label: 'Video',
    description: 'Share video',
    icon: '🎥',
  },
  {
    value: 'RELEASE_PROMO',
    label: 'Release',
    description: 'Promote release',
    icon: '🚀',
  },
  {
    value: 'EVENT_ANNOUNCEMENT',
    label: 'Event',
    description: 'Announce event',
    icon: '📅',
  },
  { value: 'ADVERTISEMENT', label: 'Ad', description: 'Create ad', icon: '📢' },
  { value: 'POLL', label: 'Poll', description: 'Create poll', icon: '📊' },
];

export default function AdminTimelinePostModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminTimelinePostModalProps) {
  const { data: session } = useSession();
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    postType: 'MUSIC_POST' as PostType,
    title: '',
    description: '',
    content: '',
    coverImageUrl: '',
    videoUrl: '',
    songUrl: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    tags: [] as string[],
    isFeatured: false,
    scheduledFor: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      showError('You must be signed in to create a post');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/timeline/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          content: formData.content ? JSON.parse(formData.content) : {},
          publishedAt:
            formData.status === 'PUBLISHED'
              ? new Date().toISOString()
              : undefined,
          scheduledFor: formData.scheduledFor
            ? new Date(formData.scheduledFor).toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      showSuccess('Post created successfully!');

      // Reset form
      setFormData({
        postType: 'MUSIC_POST',
        title: '',
        description: '',
        content: '',
        coverImageUrl: '',
        videoUrl: '',
        songUrl: '',
        status: 'DRAFT',
        tags: [],
        isFeatured: false,
        scheduledFor: '',
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      logger.error('Error creating post:', err);
      showError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <button
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
        aria-label='Close modal'
      />
      <div className='relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col overflow-hidden'>
        <div className='flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700'>
          <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
            Create Timeline Post
          </h2>
          <button
            onClick={onClose}
            className='p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
            aria-label='Close'
          >
            <XMarkIcon className='w-5 h-5 text-gray-600 dark:text-gray-300' />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='flex-1 overflow-y-auto scrollbar-subtle p-4'
        >
          <div className='mb-4'>
            <span className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Post Type
            </span>
            <div className='grid grid-cols-4 gap-2'>
              {POST_TYPES.map(type => (
                <button
                  key={type.value}
                  type='button'
                  onClick={() =>
                    setFormData({ ...formData, postType: type.value })
                  }
                  className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                    formData.postType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className='text-lg mb-1'>{type.icon}</div>
                  <div className='text-xs font-medium text-gray-900 dark:text-white'>
                    {type.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
              <label
                htmlFor='admin-post-title'
                className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5'
              >
                Title *
              </label>
              <input
                id='admin-post-title'
                type='text'
                required
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='Enter post title...'
              />
            </div>

            <div className='md:col-span-2'>
              <label
                htmlFor='admin-post-description'
                className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5'
              >
                Description
              </label>
              <textarea
                id='admin-post-description'
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
                placeholder='Enter post description...'
              />
            </div>

            <div>
              <label
                htmlFor='admin-post-cover-image-url'
                className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5'
              >
                Cover Image URL
              </label>
              <input
                id='admin-post-cover-image-url'
                type='url'
                value={formData.coverImageUrl}
                onChange={e =>
                  setFormData({ ...formData, coverImageUrl: e.target.value })
                }
                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='https://...'
              />
            </div>
            <div>
              <label
                htmlFor='admin-post-video-url'
                className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5'
              >
                Video URL
              </label>
              <input
                id='admin-post-video-url'
                type='url'
                value={formData.videoUrl}
                onChange={e =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='https://...'
              />
            </div>
            <div>
              <label
                htmlFor='admin-post-song-url'
                className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5'
              >
                Song URL
              </label>
              <input
                id='admin-post-song-url'
                type='url'
                value={formData.songUrl}
                onChange={e =>
                  setFormData({ ...formData, songUrl: e.target.value })
                }
                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='https://...'
              />
            </div>
            <div>
              <label
                htmlFor='admin-post-scheduled-for'
                className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5'
              >
                Schedule For
              </label>
              <input
                id='admin-post-scheduled-for'
                type='datetime-local'
                value={formData.scheduledFor}
                onChange={e =>
                  setFormData({ ...formData, scheduledFor: e.target.value })
                }
                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <div className='md:col-span-2'>
              <label
                htmlFor='admin-post-content'
                className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5'
              >
                Content (JSON)
              </label>
              <textarea
                id='admin-post-content'
                value={formData.content}
                onChange={e =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={3}
                className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono resize-none'
                placeholder='{"key": "value"}'
              />
            </div>
          </div>

          <div className='mt-4 flex items-center gap-4'>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setFormData({ ...formData, status: 'DRAFT' })}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  formData.status === 'DRAFT'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Draft
              </button>
              <button
                type='button'
                onClick={() =>
                  setFormData({ ...formData, status: 'PUBLISHED' })
                }
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  formData.status === 'PUBLISHED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Publish Now
              </button>
            </div>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={formData.isFeatured}
                onChange={e =>
                  setFormData({ ...formData, isFeatured: e.target.checked })
                }
                className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
              />
              <span className='text-xs text-gray-700 dark:text-gray-300'>
                Featured Post
              </span>
            </label>
          </div>

          <div className='flex gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-slate-700'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
