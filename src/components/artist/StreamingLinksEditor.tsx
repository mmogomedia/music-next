'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react';
import {
  MusicalNoteIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StreamingLinks } from '@/types/artist-profile';

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
      [platform]: {
        ...prev[platform as keyof StreamingLinks],
        [field]: value,
      },
    }));

    // Clear error when user starts typing
    const errorKey = `${platform}-${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: '',
      }));
    }
  };

  const handleUrlChange = (platform: string, url: string) => {
    // Auto-extract ID from URL for some platforms
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
    if (!url) return true; // Optional field
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

    // Validate URLs
    Object.entries(links).forEach(([platform, data]) => {
      if (data?.url && !validateUrl(data.url)) {
        newErrors[`${platform}-url`] = 'Please enter a valid URL';
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave(links);
    }
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
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
            <MusicalNoteIcon className='w-6 h-6 text-white' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
              Streaming Platform Links
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Connect your music on streaming platforms
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className='pt-0'>
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
                    <Button
                      type='button'
                      size='sm'
                      variant='light'
                      color='danger'
                      onClick={() => removeLink(platform.key)}
                      startContent={<TrashIcon className='w-4 h-4' />}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {isActive && (
                  <div className='space-y-3 pl-8'>
                    <div>
                      <label
                        htmlFor={`${platform.key}-id`}
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                      >
                        Artist/Channel ID
                      </label>
                      <Input
                        id={`${platform.key}-id`}
                        value={
                          (linkData as any)?.artistId ||
                          (linkData as any)?.channelId ||
                          ''
                        }
                        onChange={e =>
                          handleLinkChange(
                            platform.key,
                            'artistId',
                            e.target.value
                          )
                        }
                        placeholder={platform.placeholder}
                        className='w-full'
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${platform.key}-url`}
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                      >
                        Profile URL
                      </label>
                      <Input
                        id={`${platform.key}-url`}
                        value={linkData?.url || ''}
                        onChange={e =>
                          handleUrlChange(platform.key, e.target.value)
                        }
                        placeholder={platform.urlPrefix}
                        isInvalid={!!errors[`${platform.key}-url`]}
                        errorMessage={errors[`${platform.key}-url`]}
                        className='w-full'
                      />
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label
                          htmlFor={`${platform.key}-listeners`}
                          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                        >
                          Monthly Listeners
                        </label>
                        <Input
                          id={`${platform.key}-listeners`}
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
                          className='w-full'
                        />
                      </div>

                      <div className='flex items-center'>
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
                  <Button
                    type='button'
                    variant='bordered'
                    onClick={() =>
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
                  </Button>
                )}
              </div>
            );
          })}

          {!hasAnyLinks && (
            <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
              <MusicalNoteIcon className='w-12 h-12 mx-auto mb-3 opacity-50' />
              <p>No streaming platform links added yet</p>
              <p className='text-sm'>
                Click &quot;Add&quot; next to any platform to get started
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <Button
              type='button'
              variant='bordered'
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              color='primary'
              isLoading={isLoading}
              startContent={!isLoading && <CheckIcon className='w-4 h-4' />}
            >
              Save Links
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
