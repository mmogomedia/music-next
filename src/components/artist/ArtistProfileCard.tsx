'use client';

import { Card, CardBody, Button, Chip } from '@heroui/react';
import {
  MapPinIcon,
  GlobeAltIcon,
  MusicalNoteIcon,
  PlayIcon,
  HeartIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import {
  PlayIcon as PlaySolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';
import { ArtistProfile } from '@/types/artist-profile';
import Image from 'next/image';

interface ArtistProfileCardProps {
  profile: ArtistProfile;
  onPlay?: (_profile: ArtistProfile) => void;
  onLike?: (_profile: ArtistProfile) => void;
  onShare?: (_profile: ArtistProfile) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function ArtistProfileCard({
  profile,
  onPlay,
  onLike,
  onShare,
  showActions = true,
  variant = 'default',
}: ArtistProfileCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getSocialIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📷',
      twitter: '🐦',
      tiktok: '🎵',
      youtube: '📺',
      facebook: '👥',
      soundcloud: '🎧',
      bandcamp: '🎸',
    };
    return icons[platform] || '🔗';
  };

  const getStreamingIcon = (platform: string) => {
    const icons: Record<string, string> = {
      spotify: '🎵',
      appleMusic: '🍎',
      youtubeMusic: '📺',
      amazonMusic: '🛒',
      deezer: '🎧',
      tidal: '🌊',
    };
    return icons[platform] || '🎵';
  };

  if (variant === 'compact') {
    return (
      <Card className='w-full'>
        <CardBody className='p-4'>
          <div className='flex items-center gap-4'>
            {/* Profile Image */}
            <div className='w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0'>
              {profile.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={profile.artistName}
                  width={64}
                  height={64}
                  className='w-16 h-16 rounded-full object-cover'
                  referrerPolicy='no-referrer'
                />
              ) : (
                <MusicalNoteIcon className='w-8 h-8 text-white' />
              )}
            </div>

            {/* Profile Info */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='font-bold text-lg text-gray-900 dark:text-white truncate'>
                  {profile.artistName}
                </h3>
                {profile.isVerified && (
                  <Chip size='sm' color='primary' variant='flat'>
                    Verified
                  </Chip>
                )}
              </div>
              <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                {profile.bio || 'No bio available'}
              </p>
              <div className='flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400'>
                <span>{formatNumber(profile.totalPlays)} plays</span>
                <span>{formatNumber(profile.totalLikes)} likes</span>
                <span>{formatNumber(profile.totalFollowers)} followers</span>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className='flex items-center gap-2'>
                <Button
                  isIconOnly
                  size='sm'
                  color='primary'
                  variant='flat'
                  onClick={() => onPlay?.(profile)}
                >
                  <PlaySolidIcon className='w-4 h-4' />
                </Button>
                <Button
                  isIconOnly
                  size='sm'
                  variant='light'
                  onClick={() => onLike?.(profile)}
                >
                  <HeartIcon className='w-4 h-4' />
                </Button>
                <Button
                  isIconOnly
                  size='sm'
                  variant='light'
                  onClick={() => onShare?.(profile)}
                >
                  <ShareIcon className='w-4 h-4' />
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='w-full'>
      <CardBody className='p-0'>
        {/* Cover Image */}
        {profile.coverImage && (
          <div className='relative h-48 w-full'>
            <Image
              src={profile.coverImage}
              alt={`${profile.artistName} cover`}
              fill
              className='object-cover rounded-t-lg'
              referrerPolicy='no-referrer'
            />
            <div className='absolute inset-0 bg-black bg-opacity-20 rounded-t-lg' />
          </div>
        )}

        <div className='p-6'>
          {/* Profile Header */}
          <div className='flex items-start gap-4 mb-6'>
            {/* Profile Image */}
            <div className='w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 -mt-10 border-4 border-white dark:border-gray-900'>
              {profile.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={profile.artistName}
                  width={80}
                  height={80}
                  className='w-20 h-20 rounded-full object-cover'
                  referrerPolicy='no-referrer'
                />
              ) : (
                <MusicalNoteIcon className='w-10 h-10 text-white' />
              )}
            </div>

            {/* Profile Info */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {profile.artistName}
                </h1>
                {profile.isVerified && (
                  <Chip color='primary' variant='flat'>
                    Verified
                  </Chip>
                )}
              </div>

              {profile.bio && (
                <p className='text-gray-600 dark:text-gray-300 mb-3'>
                  {profile.bio}
                </p>
              )}

              {/* Location and Website */}
              <div className='flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4'>
                {profile.location && (
                  <div className='flex items-center gap-1'>
                    <MapPinIcon className='w-4 h-4' />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                  >
                    <GlobeAltIcon className='w-4 h-4' />
                    <span>Website</span>
                    <ArrowTopRightOnSquareIcon className='w-3 h-3' />
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className='flex items-center gap-6 text-sm'>
                <div className='flex items-center gap-1'>
                  <PlaySolidIcon className='w-4 h-4 text-blue-600' />
                  <span className='font-medium'>
                    {formatNumber(profile.totalPlays)}
                  </span>
                  <span className='text-gray-500'>plays</span>
                </div>
                <div className='flex items-center gap-1'>
                  <HeartSolidIcon className='w-4 h-4 text-red-500' />
                  <span className='font-medium'>
                    {formatNumber(profile.totalLikes)}
                  </span>
                  <span className='text-gray-500'>likes</span>
                </div>
                <div className='flex items-center gap-1'>
                  <span className='font-medium'>
                    {formatNumber(profile.totalFollowers)}
                  </span>
                  <span className='text-gray-500'>followers</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className='flex items-center gap-2'>
                <Button
                  color='primary'
                  startContent={<PlayIcon className='w-4 h-4' />}
                  onClick={() => onPlay?.(profile)}
                >
                  Play All
                </Button>
                <Button
                  variant='bordered'
                  startContent={<HeartIcon className='w-4 h-4' />}
                  onClick={() => onLike?.(profile)}
                >
                  Follow
                </Button>
                <Button
                  isIconOnly
                  variant='light'
                  onClick={() => onShare?.(profile)}
                >
                  <ShareIcon className='w-4 h-4' />
                </Button>
              </div>
            )}
          </div>

          {/* Social Links */}
          {profile.socialLinks &&
            Object.keys(profile.socialLinks).length > 0 && (
              <div className='mb-6'>
                <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                  Social Media
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {Object.entries(profile.socialLinks).map(
                    ([platform, data]) =>
                      data?.url && (
                        <a
                          key={platform}
                          href={data.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                        >
                          <span>{getSocialIcon(platform)}</span>
                          <span className='text-sm font-medium capitalize'>
                            {platform}
                          </span>
                          {data.followers && (
                            <span className='text-xs text-gray-500'>
                              {formatNumber(data.followers)}
                            </span>
                          )}
                        </a>
                      )
                  )}
                </div>
              </div>
            )}

          {/* Streaming Links */}
          {profile.streamingLinks &&
            Object.keys(profile.streamingLinks).length > 0 && (
              <div>
                <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                  Streaming Platforms
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {Object.entries(profile.streamingLinks).map(
                    ([platform, data]) =>
                      data?.url && (
                        <a
                          key={platform}
                          href={data.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors'
                        >
                          <span>{getStreamingIcon(platform)}</span>
                          <span className='text-sm font-medium capitalize'>
                            {platform.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          {(data.monthlyListeners || data.subscribers) && (
                            <span className='text-xs text-gray-500'>
                              {formatNumber(
                                data.monthlyListeners || data.subscribers || 0
                              )}
                            </span>
                          )}
                        </a>
                      )
                  )}
                </div>
              </div>
            )}
        </div>
      </CardBody>
    </Card>
  );
}
