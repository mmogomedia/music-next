'use client';

import type { PlaylistResponse } from '@/types/ai-responses';
import { Button } from '@heroui/react';
import Image from 'next/image';
import TrackCard from '@/components/ai/TrackCard';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import type { Track } from '@/types/track';

interface PlaylistRendererProps {
  response: PlaylistResponse;
  onPlayPlaylist?: (_playlistId: string) => void;
  onAction?: (_action: any) => void;
}

/**
 * Renders a single playlist with its tracks
 */
export function PlaylistRenderer({
  response,
  onPlayPlaylist,
  onAction,
}: PlaylistRendererProps) {
  const { data: playlist } = response;
  const { playTrack } = useMusicPlayer();

  const normalizeTrack = (track: any): Track => ({
    id: track.id,
    title: track.title ?? 'Untitled',
    filePath: track.filePath ?? '',
    fileUrl: track.fileUrl ?? '',
    coverImageUrl: track.coverImageUrl ?? track.albumArtwork ?? undefined,
    albumArtwork: track.albumArtwork ?? undefined,
    genre: track.genre ?? undefined,
    album: track.album ?? undefined,
    description: track.description ?? undefined,
    duration:
      typeof track.duration === 'number' && Number.isFinite(track.duration)
        ? track.duration
        : undefined,
    playCount: track.playCount ?? 0,
    likeCount: track.likeCount ?? 0,
    artistId: track.artistId ?? track.artistProfileId ?? '',
    artistProfileId: track.artistProfileId ?? undefined,
    userId: track.userId ?? '',
    createdAt: track.createdAt ?? new Date().toISOString(),
    updatedAt: track.updatedAt ?? new Date().toISOString(),
    artist: track.artist ?? track.artistProfile?.artistName ?? 'Unknown Artist',
    composer: track.composer ?? undefined,
    year: track.year ?? undefined,
    releaseDate: track.releaseDate ?? undefined,
    bpm: track.bpm ?? undefined,
    isrc: track.isrc ?? undefined,
    lyrics: track.lyrics ?? undefined,
    isPublic: track.isPublic ?? true,
    isDownloadable: track.isDownloadable ?? false,
    isExplicit: track.isExplicit ?? false,
    watermarkId: track.watermarkId ?? undefined,
    copyrightInfo: track.copyrightInfo ?? undefined,
    licenseType: track.licenseType ?? undefined,
    distributionRights: track.distributionRights ?? undefined,
    downloadCount: track.downloadCount ?? undefined,
    shareCount: track.shareCount ?? undefined,
  });

  const handlePlay = () => {
    if (onPlayPlaylist) {
      onPlayPlaylist(playlist.id);
    }
  };

  const handlePlayTrack = (track: any) => {
    if (!track) return;
    playTrack(track);
  };

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'play_playlist':
        if (onPlayPlaylist) {
          onPlayPlaylist(playlist.id);
        }
        break;
      case 'open_playlist':
        // Navigate to playlist page (if exists)
        if (playlist.id) {
          // TODO: Navigate to playlist detail page
        }
        break;
      case 'save_playlist':
        // TODO: Implement save playlist functionality
        break;
      case 'share_track':
        if (navigator.share) {
          navigator
            .share({
              title: playlist.name,
              text: `Check out "${playlist.name}" playlist`,
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
      {/* Playlist Header */}
      <div className='flex items-start gap-4'>
        <div className='w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0'>
          {playlist.tracks.length > 0 &&
          playlist.tracks[0].track.coverImageUrl ? (
            <Image
              src={playlist.tracks[0].track.coverImageUrl}
              alt={playlist.name}
              width={80}
              height={80}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <svg
                className='w-10 h-10 text-gray-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' />
              </svg>
            </div>
          )}
        </div>

        <div className='flex-1'>
          <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
              {playlist.description}
            </p>
          )}
          <p className='text-xs text-gray-500 dark:text-gray-500 mt-2'>
            {playlist.tracks.length}{' '}
            {playlist.tracks.length === 1 ? 'track' : 'tracks'}
          </p>
        </div>
      </div>

      {/* Play Button */}
      <Button
        color='primary'
        onClick={handlePlay}
        className='w-full'
        startContent={
          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z' />
          </svg>
        }
      >
        Play Playlist
      </Button>

      {/* Tracks List */}
      {playlist.tracks.length > 0 && (
        <div className='space-y-2'>
          <h4 className='text-sm font-semibold text-gray-900 dark:text-white'>
            Tracks
          </h4>
          <div className='space-y-2'>
            {playlist.tracks.slice(0, 6).map(item => {
              const track = normalizeTrack(item.track);
              return (
                <TrackCard
                  key={track.id}
                  track={track}
                  variant='compact'
                  size='md'
                  showDuration
                  onPlay={handlePlayTrack}
                />
              );
            })}
          </div>
        </div>
      )}

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
    </div>
  );
}
