'use client';

import { useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { PostType } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const POST_TYPES: Array<{
  value: PostType;
  label: string;
  description: string;
}> = [
  {
    value: 'MUSIC_POST',
    label: 'Music Post',
    description: 'Share music content',
  },
  { value: 'SONG', label: 'Song', description: 'Post a song' },
  {
    value: 'NEWS_ARTICLE',
    label: 'News Article',
    description: 'Publish news (Admin/Publisher only)',
  },
  {
    value: 'VIDEO_CONTENT',
    label: 'Video',
    description: 'Share video content',
  },
  {
    value: 'RELEASE_PROMO',
    label: 'Release Promo',
    description: 'Promote a release',
  },
  {
    value: 'EVENT_ANNOUNCEMENT',
    label: 'Event',
    description: 'Announce an event',
  },
  { value: 'POLL', label: 'Poll', description: 'Create a poll' },
];

export default function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePostModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      setError('You must be signed in to create a post');
      return;
    }

    setLoading(true);
    setError(null);

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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

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
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      logger.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const availablePostTypes = POST_TYPES.filter(type => {
    // Filter based on user permissions
    if (type.value === 'NEWS_ARTICLE' || type.value === 'ADVERTISEMENT') {
      // Only show if user is admin or publisher (simplified check)
      return true; // Will be validated on backend
    }
    return true;
  });

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onClose}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        role='button'
        tabIndex={0}
        aria-label='Close modal'
      />

      {/* Modal */}
      <div className='relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden'>
        {/* Header */}
        <div className='flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700'>
          <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
            Create New Post
          </h2>
          <button
            onClick={onClose}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
            aria-label='Close'
          >
            <XMarkIcon className='w-5 h-5 text-gray-600 dark:text-gray-300' />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form
          onSubmit={handleSubmit}
          className='flex-1 overflow-y-auto scrollbar-subtle p-6'
        >
          {error && (
            <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
              <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
            </div>
          )}

          {/* Post Type Selection */}
          <div className='mb-6'>
            <div className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Post Type
            </div>
            <div className='grid grid-cols-2 gap-2'>
              {availablePostTypes.map(type => (
                <button
                  key={type.value}
                  type='button'
                  onClick={() =>
                    setFormData({ ...formData, postType: type.value })
                  }
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.postType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className='font-medium text-sm text-gray-900 dark:text-white'>
                    {type.label}
                  </div>
                  <div className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className='mb-4'>
            <label
              htmlFor='create-post-title'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Title
            </label>
            <input
              id='create-post-title'
              type='text'
              value={formData.title}
              onChange={e =>
                setFormData({ ...formData, title: e.target.value })
              }
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Enter post title...'
            />
          </div>

          {/* Description */}
          <div className='mb-4'>
            <label
              htmlFor='create-post-description'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Description
            </label>
            <textarea
              id='create-post-description'
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
              placeholder='Enter post description...'
            />
          </div>

          {/* Content (JSON) */}
          <div className='mb-4'>
            <label
              htmlFor='create-post-content'
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            >
              Content (JSON)
            </label>
            <textarea
              id='create-post-content'
              value={formData.content}
              onChange={e =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={4}
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none'
              placeholder='{"key": "value"}'
            />
            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              Optional: JSON content for the post
            </p>
          </div>

          {/* URLs */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
            <div>
              <label
                htmlFor='create-post-cover-image-url'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                Cover Image URL
              </label>
              <input
                id='create-post-cover-image-url'
                type='url'
                value={formData.coverImageUrl}
                onChange={e =>
                  setFormData({ ...formData, coverImageUrl: e.target.value })
                }
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                placeholder='https://...'
              />
            </div>
            <div>
              <label
                htmlFor='create-post-video-url'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                Video URL
              </label>
              <input
                id='create-post-video-url'
                type='url'
                value={formData.videoUrl}
                onChange={e =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                placeholder='https://...'
              />
            </div>
            <div>
              <label
                htmlFor='create-post-song-url'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
              >
                Song URL
              </label>
              <input
                id='create-post-song-url'
                type='url'
                value={formData.songUrl}
                onChange={e =>
                  setFormData({ ...formData, songUrl: e.target.value })
                }
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                placeholder='https://...'
              />
            </div>
          </div>

          {/* Status */}
          <div className='mb-4'>
            <div className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Status
            </div>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setFormData({ ...formData, status: 'DRAFT' })}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.status === 'PUBLISHED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Publish Now
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
