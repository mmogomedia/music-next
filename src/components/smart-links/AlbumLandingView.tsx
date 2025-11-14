'use client';

import { useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Button, Chip } from '@heroui/react';
import { PlayCircleIcon, QueueListIcon } from '@heroicons/react/24/outline';
import type { TrackLandingData } from '@/lib/services/quick-link-service';
import { mapLandingTrackToPlayerTrack } from '@/components/quick-links/utils';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/components/ui/Toast';
import ArtistDisplay from '@/components/track/ArtistDisplay';

const PLATFORM_LABELS: Record<string, string> = {
  SPOTIFY: 'Spotify',
  APPLE_MUSIC: 'Apple Music',
  YOUTUBE: 'YouTube',
  SOUNDCLOUD: 'SoundCloud',
  TIDAL: 'Tidal',
  DEEZER: 'Deezer',
  AMAZON_MUSIC: 'Amazon Music',
};

interface AlbumLandingViewProps {
  album: {
    albumName: string;
    artist: {
      artistName?: string | null;
      profileImage?: string | null;
      slug?: string | null;
    } | null;
    tracks: TrackLandingData[];
  };
  quickLinkSlug: string;
}

export default function QuickLinkAlbumView({
  album,
  quickLinkSlug,
}: AlbumLandingViewProps) {
  const { playTrack, addToQueue } = useMusicPlayer();
  const { showToast } = useToast();

  const heroArtwork = useMemo(() => {
    const withArtwork = album.tracks.find(
      track => track.albumArtwork || track.coverImageUrl
    );
    return (
      withArtwork?.albumArtwork ||
      withArtwork?.coverImageUrl ||
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80'
    );
  }, [album.tracks]);

  const streamingLinks = useMemo(() => {
    const map = new Map<string, string>();
    album.tracks.forEach(track => {
      track.streamingLinks.forEach(link => {
        if (!map.has(link.platform)) {
          map.set(link.platform, link.url);
        }
      });
    });
    return Array.from(map.entries()).map(([platform, url]) => ({
      platform,
      url,
    }));
  }, [album.tracks]);

  const recordEvent = useCallback(
    async (event: 'play' | 'share') => {
      try {
        await fetch(`/api/quick-links/${quickLinkSlug}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event }),
        });
      } catch (error) {
        console.error('Failed to record quick link event', error);
      }
    },
    [quickLinkSlug]
  );

  const handlePlayTrack = (track: TrackLandingData) => {
    recordEvent('play');
    playTrack(mapLandingTrackToPlayerTrack(track), 'landing');
  };

  const handleQueue = (track: TrackLandingData) => {
    addToQueue(mapLandingTrackToPlayerTrack(track), false);
    showToast('Added to queue', 'info');
  };

  const handleShareLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      recordEvent('share');
      showToast('Link copied to clipboard', 'info');
    } catch (error) {
      console.error(error);
      showToast('Failed to copy link', 'error');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl overflow-hidden'>
        <div className='flex flex-col lg:flex-row'>
          <div className='relative lg:w-2/5 aspect-square lg:aspect-auto'>
            <Image
              src={heroArtwork}
              alt={album.albumName}
              fill
              priority
              className='object-cover'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent' />
            <div className='absolute bottom-4 left-4 space-y-1'>
              <Chip size='sm' color='secondary' variant='flat'>
                Album
              </Chip>
              <Chip size='sm' color='primary' variant='flat'>
                {album.tracks.length} tracks
              </Chip>
            </div>
          </div>
          <div className='flex-1 p-6 sm:p-8 space-y-6'>
            <div className='space-y-2'>
              <p className='text-sm uppercase tracking-widest text-blue-300 font-semibold'>
                {album.artist?.artistName ?? 'Artist'}
              </p>
              <h2 className='text-3xl sm:text-4xl font-bold text-white leading-tight'>
                {album.albumName}
              </h2>
              <p className='text-sm text-slate-300'>
                Experience the full body of work including {album.tracks.length}{' '}
                songs.
              </p>
            </div>

            {streamingLinks.length > 0 && (
              <div className='space-y-2'>
                <h3 className='text-sm font-semibold text-slate-200 uppercase tracking-wide'>
                  Stream the album
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {streamingLinks.map(link => (
                    <button
                      key={`${link.platform}-${link.url}`}
                      type='button'
                      className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:border-blue-400 hover:text-white transition-colors'
                      onClick={() => handleShareLink(link.url)}
                    >
                      {PLATFORM_LABELS[link.platform] ?? link.platform}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className='space-y-3'>
              <h3 className='text-sm font-semibold text-slate-200 uppercase tracking-wide'>
                Track list
              </h3>
              <div className='divide-y divide-white/10 rounded-2xl border border-white/10 overflow-hidden bg-white/5'>
                {album.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 hover:bg-white/10 transition-colors'
                  >
                    <div className='flex items-start gap-4'>
                      <div className='text-sm font-semibold text-blue-300 w-6 text-right'>
                        {index + 1}
                      </div>
                      <div>
                        <p className='text-sm font-semibold text-white'>
                          {track.title}
                        </p>
                        <p className='text-xs text-slate-300'>
                          <ArtistDisplay
                            track={mapLandingTrackToPlayerTrack(track)}
                          />
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-slate-400'>
                        {formatDuration(track.duration)}
                      </span>
                      <Button
                        isIconOnly
                        size='sm'
                        variant='light'
                        onPress={() => handlePlayTrack(track)}
                        aria-label={`Play ${track.title}`}
                      >
                        <PlayCircleIcon className='w-5 h-5' />
                      </Button>
                      <Button
                        isIconOnly
                        size='sm'
                        variant='light'
                        onPress={() => handleQueue(track)}
                        aria-label={`Add ${track.title} to queue`}
                      >
                        <QueueListIcon className='w-5 h-5' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const formatDuration = (seconds?: number | null) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};
