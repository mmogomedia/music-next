'use client';

import type { ArtistResponse } from '@/types/ai-responses';
import { Button } from '@heroui/react';
import Image from 'next/image';

interface ArtistRendererProps {
  response: ArtistResponse;
  onViewArtist?: (_artistId: string) => void;
}

/**
 * Renders an artist profile with their tracks
 */
export function ArtistRenderer({
  response,
  onViewArtist,
}: ArtistRendererProps) {
  // Support both shapes: { data: Artist } and { data: { artist: Artist } }
  const payload = response.data as unknown as { artist?: any } & Record<
    string,
    any
  >;
  const artist = payload && payload.artist ? payload.artist : (payload as any);
  const displayName: string =
    typeof artist?.artistName === 'string' && artist.artistName.length > 0
      ? artist.artistName
      : 'Artist';

  const handleViewArtist = () => {
    if (onViewArtist) {
      onViewArtist(artist.id);
    }
  };

  return (
    <div className='space-y-4'>
      {/* Artist Header */}
      <div className='flex items-start gap-4'>
        {/* Profile Image */}
        <div className='w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0'>
          {artist?.profileImageUrl ? (
            <Image
              src={artist.profileImageUrl}
              alt={displayName}
              width={96}
              height={96}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <span className='text-2xl font-bold text-gray-400'>
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Artist Info */}
        <div className='flex-1'>
          <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
            {displayName}
          </h3>
          {artist?.genre && (
            <span className='inline-block mt-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full'>
              {artist.genre}
            </span>
          )}
          {artist?.location && (
            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
              📍 {artist.location}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {artist?.bio && (
        <div className='rounded-lg bg-gray-50 dark:bg-slate-800 p-4'>
          <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
            {artist.bio}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className='flex gap-4'>
        {artist?.totalPlays > 0 && (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
              {artist.totalPlays.toLocaleString()}
            </p>
            <p className='text-xs text-gray-600 dark:text-gray-400'>Plays</p>
          </div>
        )}
        {artist?.totalLikes > 0 && (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
              {artist.totalLikes.toLocaleString()}
            </p>
            <p className='text-xs text-gray-600 dark:text-gray-400'>Likes</p>
          </div>
        )}
        {artist?.profileViews > 0 && (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
              {artist.profileViews.toLocaleString()}
            </p>
            <p className='text-xs text-gray-600 dark:text-gray-400'>Views</p>
          </div>
        )}
      </div>

      {/* Social Links */}
      {(artist.socialLinks || artist.streamingLinks) && (
        <div className='flex gap-2 flex-wrap'>
          {artist.socialLinks &&
            Object.entries(artist.socialLinks).map(([platform, url]) => (
              <Button
                key={platform}
                size='sm'
                variant='bordered'
                as='a'
                href={url as string}
                target='_blank'
                rel='noopener noreferrer'
              >
                {platform}
              </Button>
            ))}
          {artist.streamingLinks &&
            Object.entries(artist.streamingLinks).map(([platform, url]) => (
              <Button
                key={platform}
                size='sm'
                variant='bordered'
                as='a'
                href={url as string}
                target='_blank'
                rel='noopener noreferrer'
              >
                {platform}
              </Button>
            ))}
        </div>
      )}

      {/* View Artist Button */}
      <Button
        color='primary'
        onClick={handleViewArtist}
        className='w-full'
        variant='bordered'
      >
        View Full Profile
      </Button>

      {/* Actions */}
      {response.actions && response.actions.length > 0 && (
        <div className='flex gap-2 flex-wrap'>
          {response.actions.map((action, index) => (
            <Button
              key={index}
              size='sm'
              variant='bordered'
              onClick={() => {
                // TODO: Implement action handling
              }}
            >
              {action.icon && <span className='mr-1'>{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
