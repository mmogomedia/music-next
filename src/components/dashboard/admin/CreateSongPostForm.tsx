'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';
import { useToast } from '@/components/ui/Toast';
import { Input, Button, Chip } from '@heroui/react';
import Image from 'next/image';
import { constructFileUrl } from '@/lib/url-utils';

interface Track {
  id: string;
  title: string;
  artist?: string;
  artistProfile?: {
    artistName: string;
  } | null;
  genre?: string | null;
  coverImageUrl?: string | null;
  albumArtwork?: string | null;
  filePath?: string | null;
  fileUrl?: string | null;
}

export default function CreateSongPostForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    isFeatured: false,
    scheduledFor: '',
  });
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = useCallback(
    async (query: string) => {
      try {
        const response = await fetch(
          `/api/tracks/search?q=${encodeURIComponent(query)}&limit=20`
        );
        if (!response.ok) {
          throw new Error('Failed to search tracks');
        }

        const data = await response.json();
        setSearchResults(data.tracks || []);
      } catch (err) {
        logger.error('Error searching tracks:', err);
        showError('Failed to search tracks');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [showError]
  );

  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
    const artistName =
      track.artist || track.artistProfile?.artistName || 'Unknown Artist';
    setFormData(prev => ({
      ...prev,
      title: prev.title || track.title,
      description: prev.description || `${track.title} by ${artistName}`,
    }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      showError('You must be signed in to create a post');
      return;
    }

    if (!selectedTrack) {
      showError('Please select a song');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/timeline/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postType: 'SONG',
          title: formData.title || selectedTrack.title,
          description:
            formData.description ||
            `${selectedTrack.title} by ${
              selectedTrack.artist ||
              selectedTrack.artistProfile?.artistName ||
              'Unknown Artist'
            }`,
          content: {
            trackId: selectedTrack.id,
            trackTitle: selectedTrack.title,
            trackArtist:
              selectedTrack.artist ||
              selectedTrack.artistProfile?.artistName ||
              'Unknown Artist',
            trackGenre: selectedTrack.genre,
          },
          coverImageUrl:
            selectedTrack.coverImageUrl ||
            selectedTrack.albumArtwork ||
            undefined,
          songUrl: selectedTrack.fileUrl || selectedTrack.filePath || undefined,
          status: formData.status,
          publishedAt:
            formData.status === 'PUBLISHED'
              ? new Date().toISOString()
              : undefined,
          scheduledFor: formData.scheduledFor
            ? new Date(formData.scheduledFor).toISOString()
            : undefined,
          isFeatured: formData.isFeatured,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      showSuccess('Song post created successfully!');
      router.push('/admin/dashboard/timeline-posts');
    } catch (err) {
      logger.error('Error creating song post:', err);
      showError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Song Selection */}
      <div>
        <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
          Select Song *
        </span>
        {!selectedTrack ? (
          <div className='relative' ref={searchRef}>
            <Input
              placeholder='Search for a song...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              startContent={
                <MagnifyingGlassIcon className='w-4 h-4 text-gray-400' />
              }
              endContent={
                searchQuery && (
                  <button
                    type='button'
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className='p-1'
                  >
                    <XMarkIcon className='w-4 h-4 text-gray-400' />
                  </button>
                )
              }
            />
            {isSearching && (
              <div className='absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 p-2'>
                <div className='text-sm text-gray-500 dark:text-gray-400 text-center py-2'>
                  Searching...
                </div>
              </div>
            )}
            {!isSearching && searchResults.length > 0 && (
              <div className='absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto'>
                {searchResults.map(track => {
                  const imageUrl =
                    track.coverImageUrl || track.albumArtwork || null;
                  const displayImageUrl = imageUrl
                    ? imageUrl.startsWith('http')
                      ? imageUrl
                      : constructFileUrl(imageUrl)
                    : null;

                  return (
                    <button
                      key={track.id}
                      type='button'
                      onClick={() => handleSelectTrack(track)}
                      className='w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left'
                    >
                      <div className='w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden'>
                        {displayImageUrl ? (
                          <Image
                            src={displayImageUrl}
                            alt={track.title}
                            width={48}
                            height={48}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <MusicalNoteIcon className='w-6 h-6 text-gray-400' />
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                          {track.title}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                          {track.artist ||
                            track.artistProfile?.artistName ||
                            'Unknown Artist'}
                        </p>
                        {track.genre && (
                          <Chip size='sm' variant='flat' className='mt-1'>
                            {track.genre}
                          </Chip>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className='absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 p-4'>
                <p className='text-sm text-gray-500 dark:text-gray-400 text-center'>
                  No songs found
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className='p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden'>
                {(() => {
                  const imageUrl =
                    selectedTrack.coverImageUrl ||
                    selectedTrack.albumArtwork ||
                    null;
                  const displayImageUrl = imageUrl
                    ? imageUrl.startsWith('http')
                      ? imageUrl
                      : constructFileUrl(imageUrl)
                    : null;

                  return displayImageUrl ? (
                    <Image
                      src={displayImageUrl}
                      alt={selectedTrack.title}
                      width={64}
                      height={64}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <MusicalNoteIcon className='w-8 h-8 text-gray-400' />
                  );
                })()}
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                  {selectedTrack.title}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {selectedTrack.artist ||
                    selectedTrack.artistProfile?.artistName ||
                    'Unknown Artist'}
                </p>
                {selectedTrack.genre && (
                  <Chip size='sm' variant='flat' className='mt-1'>
                    {selectedTrack.genre}
                  </Chip>
                )}
              </div>
              <button
                type='button'
                onClick={() => setSelectedTrack(null)}
                className='p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors'
              >
                <XMarkIcon className='w-5 h-5 text-gray-600 dark:text-gray-400' />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor='song-post-title'
          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
        >
          Post Title *
        </label>
        <Input
          id='song-post-title'
          type='text'
          required
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder='Enter post title...'
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor='song-post-description'
          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
        >
          Description
        </label>
        <textarea
          id='song-post-description'
          value={formData.description}
          onChange={e =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
          placeholder='Enter post description...'
        />
      </div>

      {/* Status & Featured */}
      <div className='flex items-center gap-4'>
        <div className='flex gap-2'>
          <Button
            type='button'
            variant={formData.status === 'DRAFT' ? 'solid' : 'bordered'}
            size='sm'
            onClick={() => setFormData({ ...formData, status: 'DRAFT' })}
          >
            Draft
          </Button>
          <Button
            type='button'
            variant={formData.status === 'PUBLISHED' ? 'solid' : 'bordered'}
            color='primary'
            size='sm'
            onClick={() => setFormData({ ...formData, status: 'PUBLISHED' })}
          >
            Publish Now
          </Button>
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
          <span className='text-sm text-gray-700 dark:text-gray-300'>
            Featured Post
          </span>
        </label>
      </div>

      {/* Schedule */}
      <div>
        <label
          htmlFor='song-post-scheduled-for'
          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
        >
          Schedule For (Optional)
        </label>
        <Input
          id='song-post-scheduled-for'
          type='datetime-local'
          value={formData.scheduledFor}
          onChange={e =>
            setFormData({ ...formData, scheduledFor: e.target.value })
          }
        />
      </div>

      {/* Actions */}
      <div className='flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700'>
        <Button
          type='button'
          variant='light'
          onClick={() => router.back()}
          className='flex-1'
        >
          Cancel
        </Button>
        <Button
          type='submit'
          color='primary'
          isLoading={loading}
          disabled={!selectedTrack}
          className='flex-1'
        >
          {loading ? 'Creating...' : 'Create Post'}
        </Button>
      </div>
    </form>
  );
}
