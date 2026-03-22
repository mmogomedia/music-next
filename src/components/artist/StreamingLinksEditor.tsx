'use client';

import React, { useState, useEffect } from 'react';
import {
  MusicalNoteIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StreamingLinks } from '@/types/artist-profile';
import { FCard, FButton, FInput, FEmptyState } from '@/components/ui';

interface StreamingLinksEditorProps {
  streamingLinks?: StreamingLinks;
  onSave: (_streamingLinks: StreamingLinks) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const STREAMING_PLATFORMS = [
  {
    key: 'spotify',
    label: 'Spotify',
    placeholder: 'Artist ID',
    icon: '🎵',
    urlPrefix: 'https://open.spotify.com/artist/',
  },
  {
    key: 'appleMusic',
    label: 'Apple Music',
    placeholder: 'Artist ID',
    icon: '🍎',
    urlPrefix: 'https://music.apple.com/artist/',
  },
  {
    key: 'youtubeMusic',
    label: 'YouTube Music',
    placeholder: 'Channel ID',
    icon: '📺',
    urlPrefix: 'https://music.youtube.com/channel/',
  },
  {
    key: 'amazonMusic',
    label: 'Amazon Music',
    placeholder: 'Artist ID',
    icon: '🛒',
    urlPrefix: 'https://music.amazon.com/artists/',
  },
  {
    key: 'deezer',
    label: 'Deezer',
    placeholder: 'Artist ID',
    icon: '🎧',
    urlPrefix: 'https://www.deezer.com/artist/',
  },
  {
    key: 'tidal',
    label: 'Tidal',
    placeholder: 'Artist ID',
    icon: '🌊',
    urlPrefix: 'https://tidal.com/artist/',
  },
] as const;

export default function StreamingLinksEditor({
  streamingLinks = {},
  onSave,
  onCancel,
  isLoading = false,
}: StreamingLinksEditorProps) {
  const [links, setLinks] = useState<StreamingLinks>(streamingLinks);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLinks(streamingLinks);
  }, [streamingLinks]);

  const handleLinkChange = (
    platform: string,
    field: string,
    value: string | number | boolean
  ) => {
    setLinks(prev => ({
      ...prev,
      [platform]: { ...prev[platform as keyof StreamingLinks], [field]: value },
    }));
    const errorKey = `${platform}-${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handleUrlChange = (platform: string, url: string) => {
    let artistId = '';
    if (platform === 'spotify' && url.includes('open.spotify.com/artist/')) {
      artistId = url.split('open.spotify.com/artist/')[1]?.split('?')[0] || '';
    } else if (
      platform === 'appleMusic' &&
      url.includes('music.apple.com/artist/')
    ) {
      artistId = url.split('music.apple.com/artist/')[1]?.split('/')[0] || '';
    } else if (
      platform === 'youtubeMusic' &&
      url.includes('music.youtube.com/channel/')
    ) {
      artistId =
        url.split('music.youtube.com/channel/')[1]?.split('?')[0] || '';
    }

    setLinks(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform as keyof StreamingLinks],
        url,
        artistId:
          artistId ||
          (prev[platform as keyof StreamingLinks] as any)?.artistId ||
          (prev[platform as keyof StreamingLinks] as any)?.channelId ||
          '',
      },
    }));
  };

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    Object.entries(links).forEach(([platform, data]) => {
      if (data?.url && !validateUrl(data.url)) {
        newErrors[`${platform}-url`] = 'Please enter a valid URL';
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) onSave(links);
  };

  const removeLink = (platform: string) => {
    const newLinks = { ...links };
    delete newLinks[platform as keyof StreamingLinks];
    setLinks(newLinks);
  };

  const hasAnyLinks = Object.values(links).some(
    link =>
      link && (link.url || (link as any).artistId || (link as any).channelId)
  );

  return (
    <FCard variant='default' padding='md' className='w-full max-w-2xl mx-auto'>
      <div className='flex items-center gap-3 mb-6'>
        <MusicalNoteIcon className='w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0' />
        <div>
          <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
            Streaming Platform Links
          </h2>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Connect your music on streaming platforms
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {STREAMING_PLATFORMS.map(platform => {
          const linkData = links[platform.key as keyof StreamingLinks];
          const isActive =
            linkData &&
            (linkData.url ||
              (linkData as any).artistId ||
              (linkData as any).channelId);

          return (
            <div key={platform.key} className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-2xl'>{platform.icon}</span>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {platform.label}
                  </span>
                </div>
                {isActive && (
                  <FButton
                    type='button'
                    size='sm'
                    variant='danger-ghost'
                    onPress={() => removeLink(platform.key)}
                    startContent={<TrashIcon className='w-4 h-4' />}
                  >
                    Remove
                  </FButton>
                )}
              </div>

              {isActive && (
                <div className='space-y-3 pl-8'>
                  <FInput
                    id={`${platform.key}-id`}
                    label='Artist/Channel ID'
                    value={
                      (linkData as any)?.artistId ||
                      (linkData as any)?.channelId ||
                      ''
                    }
                    onChange={e =>
                      handleLinkChange(platform.key, 'artistId', e.target.value)
                    }
                    placeholder={platform.placeholder}
                  />

                  <FInput
                    id={`${platform.key}-url`}
                    label='Profile URL'
                    value={linkData?.url || ''}
                    onChange={e =>
                      handleUrlChange(platform.key, e.target.value)
                    }
                    placeholder={platform.urlPrefix}
                    isInvalid={!!errors[`${platform.key}-url`]}
                    errorMessage={errors[`${platform.key}-url`]}
                  />

                  <div className='grid grid-cols-2 gap-3'>
                    <FInput
                      id={`${platform.key}-listeners`}
                      label='Monthly Listeners'
                      type='number'
                      value={
                        (linkData as any)?.monthlyListeners ||
                        (linkData as any)?.subscribers ||
                        ''
                      }
                      onChange={e =>
                        handleLinkChange(
                          platform.key,
                          platform.key === 'youtubeMusic'
                            ? 'subscribers'
                            : 'monthlyListeners',
                          e.target.value
                        )
                      }
                      placeholder='0'
                    />

                    <div className='flex items-end pb-2'>
                      <label
                        htmlFor={`${platform.key}-verified`}
                        className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'
                      >
                        <input
                          id={`${platform.key}-verified`}
                          type='checkbox'
                          checked={linkData?.verified || false}
                          onChange={e =>
                            handleLinkChange(
                              platform.key,
                              'verified',
                              e.target.checked.toString()
                            )
                          }
                          className='rounded border-gray-300'
                        />
                        Verified
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {!isActive && (
                <FButton
                  type='button'
                  variant='outline'
                  onPress={() =>
                    setLinks(prev => ({
                      ...prev,
                      [platform.key]: {
                        artistId: '',
                        url: '',
                        monthlyListeners: 0,
                        verified: false,
                      },
                    }))
                  }
                  startContent={<PlusIcon className='w-4 h-4' />}
                  className='ml-8'
                >
                  Add {platform.label}
                </FButton>
              )}
            </div>
          );
        })}

        {!hasAnyLinks && (
          <FEmptyState
            icon={MusicalNoteIcon}
            title='No streaming platform links added yet'
            description='Click "Add" next to any platform to get started'
            size='sm'
          />
        )}

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <FButton
            type='button'
            variant='ghost'
            onPress={onCancel}
            isDisabled={isLoading}
          >
            Cancel
          </FButton>
          <FButton
            type='submit'
            variant='primary'
            isLoading={isLoading}
            startContent={
              !isLoading ? <CheckIcon className='w-4 h-4' /> : undefined
            }
          >
            Save Links
          </FButton>
        </div>
      </form>
    </FCard>
  );
}
