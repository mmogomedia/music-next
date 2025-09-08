'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Card, CardBody, CardHeader } from '@heroui/react';
import {
  LinkIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { SocialLinks } from '@/types/artist-profile';

interface SocialLinksEditorProps {
  socialLinks?: SocialLinks;
  onSave: (_socialLinks: SocialLinks) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Helper function to get the correct name field from any social link
const getSocialName = (linkData: any): string => {
  return (
    linkData?.username ||
    linkData?.channelName ||
    linkData?.pageName ||
    linkData?.artistName ||
    ''
  );
};

const SOCIAL_PLATFORMS = [
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: '@username',
    icon: '📷',
  },
  {
    key: 'twitter',
    label: 'Twitter/X',
    placeholder: '@username',
    icon: '🐦',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: '@username',
    icon: '🎵',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: 'Channel Name',
    icon: '📺',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'Page Name',
    icon: '👥',
  },
  {
    key: 'soundcloud',
    label: 'SoundCloud',
    placeholder: '@username',
    icon: '🎧',
  },
  {
    key: 'bandcamp',
    label: 'Bandcamp',
    placeholder: 'Artist Name',
    icon: '🎸',
  },
] as const;

export default function SocialLinksEditor({
  socialLinks = {},
  onSave,
  onCancel,
  isLoading = false,
}: SocialLinksEditorProps) {
  const [links, setLinks] = useState<SocialLinks>(socialLinks);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLinks(socialLinks);
  }, [socialLinks]);

  const handleLinkChange = (platform: string, field: string, value: string) => {
    setLinks(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform as keyof SocialLinks],
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
    // Auto-generate username from URL for some platforms
    let username = '';

    if (platform === 'instagram' && url.includes('instagram.com/')) {
      username = url.split('instagram.com/')[1]?.split('/')[0] || '';
    } else if (platform === 'twitter' && url.includes('twitter.com/')) {
      username = url.split('twitter.com/')[1]?.split('/')[0] || '';
    } else if (platform === 'tiktok' && url.includes('tiktok.com/@')) {
      username = url.split('tiktok.com/@')[1]?.split('/')[0] || '';
    } else if (platform === 'youtube' && url.includes('youtube.com/c/')) {
      username = url.split('youtube.com/c/')[1]?.split('/')[0] || '';
    }

    setLinks(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform as keyof SocialLinks],
        url,
        username:
          username || getSocialName(prev[platform as keyof SocialLinks]),
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
    delete newLinks[platform as keyof SocialLinks];
    setLinks(newLinks);
  };

  const hasAnyLinks = Object.values(links).some(
    link => link && (link.url || getSocialName(link))
  );

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
            <LinkIcon className='w-6 h-6 text-white' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
              Social Media Links
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Connect your social media accounts
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className='pt-0'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {SOCIAL_PLATFORMS.map(platform => {
            const linkData = links[platform.key as keyof SocialLinks];
            const isActive =
              linkData && (linkData.url || getSocialName(linkData));

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
                        htmlFor={`${platform.key}-username`}
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                      >
                        Username/Name
                      </label>
                      <Input
                        id={`${platform.key}-username`}
                        value={getSocialName(linkData)}
                        onChange={e =>
                          handleLinkChange(
                            platform.key,
                            'username',
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
                        URL
                      </label>
                      <Input
                        id={`${platform.key}-url`}
                        value={linkData?.url || ''}
                        onChange={e =>
                          handleUrlChange(platform.key, e.target.value)
                        }
                        placeholder={`https://${platform.key}.com/...`}
                        isInvalid={!!errors[`${platform.key}-url`]}
                        errorMessage={errors[`${platform.key}-url`]}
                        className='w-full'
                      />
                    </div>

                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label
                          htmlFor={`${platform.key}-followers`}
                          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                        >
                          Followers
                        </label>
                        <Input
                          id={`${platform.key}-followers`}
                          type='number'
                          value={
                            (linkData as any)?.followers ||
                            (linkData as any)?.subscribers ||
                            ''
                          }
                          onChange={e =>
                            handleLinkChange(
                              platform.key,
                              'followers',
                              e.target.value
                            )
                          }
                          placeholder='0'
                          className='w-full'
                        />
                      </div>

                      <div className='flex items-center'>
                        <label className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                          <input
                            type='checkbox'
                            checked={(linkData as any)?.verified || false}
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
                          username: '',
                          url: '',
                          followers: 0,
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
              <LinkIcon className='w-12 h-12 mx-auto mb-3 opacity-50' />
              <p>No social media links added yet</p>
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
              onPress={onCancel}
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
