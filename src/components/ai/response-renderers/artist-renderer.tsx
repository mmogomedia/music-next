'use client';

import type { ArtistResponse, ArtistItem, Action } from '@/types/ai-responses';
import { Button } from '@heroui/react';
import Image from 'next/image';
import { SuggestedActions } from './suggested-actions';

interface ArtistRendererProps {
  response: ArtistResponse;
  onViewArtist?: (_artistId: string) => void;
  onAction?: (_action: Action) => void;
}

function resolveArtist(data: ArtistItem): ArtistItem {
  const maybeWrapped = data as unknown as { artist?: ArtistItem };
  if (
    maybeWrapped &&
    maybeWrapped.artist &&
    typeof maybeWrapped.artist === 'object'
  ) {
    return maybeWrapped.artist;
  }
  return data;
}

/**
 * Renders an artist profile with their tracks
 */
export function ArtistRenderer({
  response,
  onViewArtist,
  onAction,
}: ArtistRendererProps) {
  // Support both shapes: { data: ArtistItem } and { data: { artist: ArtistItem } }
  const artist: ArtistItem = resolveArtist(response.data);
  const displayName: string =
    typeof artist?.artistName === 'string' && artist.artistName.length > 0
      ? artist.artistName
      : 'Artist';

  const handleViewArtist = () => {
    if (onViewArtist) {
      onViewArtist(artist.id);
    } else if (onAction) {
      // Fallback: send a message to show tracks by this artist
      onAction({
        type: 'send_message',
        data: { message: `Show me tracks by ${displayName}` },
      });
    }
  };

  const handleAction = (action: Action) => {
    switch (action.type) {
      case 'view_artist':
        if (onViewArtist) {
          onViewArtist(artist.id);
        }
        break;
      case 'share_track':
        if (navigator.share) {
          navigator
            .share({
              title: displayName,
              text: `Check out ${displayName} on Flemoji`,
              url: window.location.href,
            })
            .catch(() => {
              // Share failed or cancelled
            });
        }
        break;
      default:
        break;
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
            typeof artist.socialLinks === 'object' &&
            Object.entries(artist.socialLinks as Record<string, unknown>).map(
              ([platform, linkData]) => {
                const href =
                  typeof linkData === 'string'
                    ? linkData
                    : typeof linkData === 'object' &&
                        linkData !== null &&
                        'url' in linkData
                      ? String((linkData as Record<string, unknown>).url ?? '')
                      : '';
                if (!href) return null;
                return (
                  <Button
                    key={platform}
                    size='sm'
                    variant='bordered'
                    as='a'
                    href={href}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {platform}
                  </Button>
                );
              }
            )}
          {artist.streamingLinks &&
            typeof artist.streamingLinks === 'object' &&
            Object.entries(
              artist.streamingLinks as Record<string, unknown>
            ).map(([platform, linkData]) => {
              const href =
                typeof linkData === 'string'
                  ? linkData
                  : typeof linkData === 'object' &&
                      linkData !== null &&
                      'url' in linkData
                    ? String((linkData as Record<string, unknown>).url ?? '')
                    : '';
              if (!href) return null;
              return (
                <Button
                  key={platform}
                  size='sm'
                  variant='bordered'
                  as='a'
                  href={href}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {platform}
                </Button>
              );
            })}
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
                if (onAction) {
                  onAction(action);
                } else {
                  handleAction(action);
                }
              }}
            >
              {action.icon && <span className='mr-1'>{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Follow-up suggestions */}
      <SuggestedActions
        suggestions={[
          {
            label: 'Show their tracks',
            message: `Show me tracks by ${displayName}`,
          },
          {
            label: 'Similar artists',
            message: `Find artists similar to ${displayName}`,
          },
          ...(artist?.genre
            ? [
                {
                  label: 'Browse genre',
                  message: `Show me ${artist.genre} artists`,
                },
              ]
            : []),
        ]}
        onAction={onAction}
      />
    </div>
  );
}
