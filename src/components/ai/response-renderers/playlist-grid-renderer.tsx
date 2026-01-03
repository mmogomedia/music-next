'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlaylistGridResponse } from '@/types/ai-responses';
import type { Track } from '@/types/track';
import TrackCard from '@/components/ai/TrackCard';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlayIcon,
  PauseIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { constructFileUrl } from '@/lib/url-utils';

interface PlaylistGridRendererProps {
  response: PlaylistGridResponse;
  onSelectPlaylist?: (_playlistId: string) => void;
  onPlayTrack?: (_trackId: string, _track: Track) => void;
}

interface PlaylistWithTracks {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  coverImage?: string;
  tracks: Track[];
  isLoading: boolean;
  isExpanded: boolean;
}

/**
 * Renders a grid of playlists with expandable track listings
 */
export function PlaylistGridRenderer({
  response,
  onSelectPlaylist: _onSelectPlaylist,
  onPlayTrack,
}: PlaylistGridRendererProps) {
  const { playlists } = response.data;
  const { playTrack, setQueue, isPlaying, currentPlaylistId, playPause } =
    useMusicPlayer();
  const [playlistsWithTracks, setPlaylistsWithTracks] = useState<
    PlaylistWithTracks[]
  >([]);

  // Initialize playlists state - first playlist expanded by default
  useEffect(() => {
    setPlaylistsWithTracks(
      playlists.map((playlist, index) => {
        const playlistData = playlist as any;
        const coverImage =
          playlistData.coverImage || playlistData.coverImageUrl || undefined;

        return {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || undefined,
          trackCount: playlist.trackCount || 0,
          coverImage,
          tracks: [],
          isLoading: index === 0, // Load tracks for first playlist immediately
          isExpanded: index === 0, // First playlist expanded by default
        };
      })
    );

    // Auto-fetch tracks for the first playlist
    if (playlists.length > 0) {
      fetchPlaylistTracks(playlists[0].id);
    }
  }, [playlists]);

  // Fetch tracks for a playlist
  const fetchPlaylistTracks = useCallback(
    async (playlistId: string): Promise<Track[]> => {
      setPlaylistsWithTracks(prev =>
        prev.map(p => (p.id === playlistId ? { ...p, isLoading: true } : p))
      );

      try {
        const response = await fetch(`/api/playlists/${playlistId}/tracks`);
        if (!response.ok) {
          throw new Error('Failed to fetch playlist tracks');
        }

        const data = await response.json();
        const tracks = (data.tracks || []).map(
          (track: any): Track => ({
            id: track.id,
            title: track.title ?? 'Untitled',
            filePath: track.filePath ?? '',
            fileUrl:
              track.fileUrl ||
              (track.filePath ? constructFileUrl(track.filePath) : ''),
            coverImageUrl:
              track.coverImageUrl || track.albumArtwork || undefined,
            albumArtwork: track.albumArtwork || undefined,
            genre: track.genre || undefined,
            album: track.album || undefined,
            description: track.description || undefined,
            duration:
              typeof track.duration === 'number' ? track.duration : undefined,
            playCount: track.playCount || 0,
            likeCount: track.likeCount || 0,
            artistId: track.artistId || track.artistProfileId || '',
            artistProfileId: track.artistProfileId || undefined,
            userId: track.userId || '',
            createdAt: track.createdAt || new Date().toISOString(),
            updatedAt: track.updatedAt || new Date().toISOString(),
            artist:
              track.artist ||
              track.artistProfile?.artistName ||
              'Unknown Artist',
            composer: track.composer || undefined,
            year: track.year || undefined,
            releaseDate: track.releaseDate || undefined,
            bpm: track.bpm || undefined,
            isrc: track.isrc || undefined,
            isPublic: track.isPublic !== false,
            isDownloadable: track.isDownloadable ?? false,
            isExplicit: track.isExplicit ?? false,
            attributes: Array.isArray(track.attributes) ? track.attributes : [],
            mood: Array.isArray(track.mood) ? track.mood : [],
          })
        );

        setPlaylistsWithTracks(prev =>
          prev.map(p =>
            p.id === playlistId
              ? { ...p, tracks, isLoading: false, isExpanded: true }
              : p
          )
        );

        return tracks;
      } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        setPlaylistsWithTracks(prev =>
          prev.map(p =>
            p.id === playlistId ? { ...p, isLoading: false, tracks: [] } : p
          )
        );
        return [];
      }
    },
    []
  );

  const togglePlaylist = (playlistId: string) => {
    setPlaylistsWithTracks(prev =>
      prev.map(p => {
        if (p.id === playlistId) {
          const willExpand = !p.isExpanded;
          // If expanding and tracks not loaded, fetch them
          if (willExpand && p.tracks.length === 0 && !p.isLoading) {
            fetchPlaylistTracks(playlistId);
          }
          return { ...p, isExpanded: willExpand };
        }
        return p;
      })
    );
  };

  const handlePlayPlaylist = async (playlist: PlaylistWithTracks) => {
    // If this playlist is currently playing, toggle pause
    if (currentPlaylistId === playlist.id && isPlaying) {
      playPause();
      return;
    }

    let tracksToPlay = playlist.tracks;

    // If tracks not loaded, fetch them first
    if (tracksToPlay.length === 0 && !playlist.isLoading) {
      tracksToPlay = await fetchPlaylistTracks(playlist.id);
    }

    if (tracksToPlay.length > 0) {
      // Set queue first, then play after a brief delay to ensure state is updated
      setQueue(tracksToPlay, 0, 'playlist');
      // Use setTimeout to ensure setQueue state update completes before playTrack
      setTimeout(() => {
        playTrack(tracksToPlay[0], 'playlist', playlist.id);
      }, 0);
    }
  };

  const handlePlayTrack = (track: Track, playlistId: string) => {
    if (onPlayTrack) {
      onPlayTrack(track.id, track);
    } else {
      playTrack(track, 'playlist', playlistId);
    }
  };

  const handleQueueAdd = (track: Track, playlistId: string) => {
    setPlaylistsWithTracks(prev => {
      const playlist = prev.find(p => p.id === playlistId);
      if (playlist) {
        const trackIndex = playlist.tracks.findIndex(t => t.id === track.id);
        if (trackIndex >= 0) {
          setQueue(playlist.tracks, trackIndex, 'playlist');
        }
      }
      return prev;
    });
  };

  if (playlists.length === 0) {
    return (
      <div className='rounded-lg bg-gray-50 dark:bg-slate-800 p-4'>
        <p className='text-gray-600 dark:text-gray-400'>No playlists found.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {playlistsWithTracks.map((playlist, index) => {
        const isFirst = index === 0;
        const isExpanded = playlist.isExpanded;

        return (
          <div
            key={playlist.id}
            className='rounded-lg overflow-hidden transition-all duration-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700'
          >
            {/* Playlist Header */}
            <div className='p-4 sm:p-6'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-4 mb-2'>
                    {/* Cover Image */}
                    {playlist.coverImage ? (
                      <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md relative bg-gradient-to-br from-blue-500 to-purple-600'>
                        {/* Use regular img for external URLs that might not be in next.config */}
                        <img
                          src={playlist.coverImage}
                          alt={playlist.name}
                          className='w-full h-full object-cover absolute inset-0'
                          style={{
                            display: 'block',
                          }}
                          onError={e => {
                            // Hide image on error, show gradient background
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        {/* Fallback icon - visible if image fails */}
                        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                          <svg
                            className='w-8 h-8 sm:w-10 sm:h-10 text-white'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                            style={{ opacity: 0 }}
                          >
                            <path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md'>
                        <svg
                          className='w-8 h-8 sm:w-10 sm:h-10 text-white'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' />
                        </svg>
                      </div>
                    )}

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white truncate'>
                          {playlist.name}
                        </h3>
                      </div>
                      {playlist.description && (
                        <p
                          className={`text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 ${
                            isFirst && isExpanded ? 'text-sm' : 'text-sm'
                          }`}
                        >
                          {playlist.description}
                        </p>
                      )}
                      <div className='flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400'>
                        <span className='font-medium'>
                          {playlist.trackCount}{' '}
                          {playlist.trackCount === 1 ? 'track' : 'tracks'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <Button
                    size='sm'
                    color='primary'
                    variant='flat'
                    startContent={
                      currentPlaylistId === playlist.id && isPlaying ? (
                        <PauseIcon className='w-4 h-4' />
                      ) : (
                        <PlayIcon className='w-4 h-4' />
                      )
                    }
                    onPress={() => handlePlayPlaylist(playlist)}
                    isDisabled={playlist.isLoading}
                  >
                    {currentPlaylistId === playlist.id && isPlaying
                      ? 'Pause'
                      : 'Play'}
                  </Button>
                  <Button
                    size='sm'
                    variant='light'
                    isIconOnly
                    onPress={() => togglePlaylist(playlist.id)}
                    aria-label={playlist.isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {playlist.isExpanded ? (
                      <ChevronUpIcon className='w-5 h-5' />
                    ) : (
                      <ChevronDownIcon className='w-5 h-5' />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tracks List - Expandable */}
            {playlist.isExpanded && (
              <div className='border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50'>
                {playlist.isLoading ? (
                  <div className='p-8 text-center'>
                    <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                      Loading tracks...
                    </p>
                  </div>
                ) : playlist.tracks.length > 0 ? (
                  <div className='p-4 sm:p-6 space-y-2'>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        Tracks ({playlist.tracks.length})
                      </h4>
                      <Button
                        size='sm'
                        variant='light'
                        startContent={<QueueListIcon className='w-4 h-4' />}
                        onPress={() => {
                          setQueue(playlist.tracks, 0, 'playlist');
                        }}
                      >
                        Add all to queue
                      </Button>
                    </div>
                    <div className='space-y-1'>
                      {playlist.tracks.map((track, trackIndex) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          variant='compact'
                          size='md'
                          showDuration
                          showActions={true}
                          badge={String(trackIndex + 1)}
                          onPlay={() => handlePlayTrack(track, playlist.id)}
                          onQueueAdd={() => handleQueueAdd(track, playlist.id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className='p-8 text-center'>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      No tracks in this playlist.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
