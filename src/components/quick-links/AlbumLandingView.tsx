'use client';

import { useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  PlayCircleIcon,
  QueueListIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import type { TrackLandingData } from '@/lib/services/quick-link-service';
import { mapLandingTrackToPlayerTrack } from '@/components/quick-links/utils';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/components/ui/Toast';

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
    <div className='h-full rounded-[32px] border border-slate-100 bg-white shadow-[0_35px_100px_-50px_rgba(15,23,42,0.25)] px-4 sm:px-6 lg:px-8 py-6 lg:py-8'>
      <div className='flex h-full flex-col lg:flex-row gap-6 lg:gap-8 items-stretch overflow-hidden'>
        <div className='flex-none w-full lg:w-[220px] xl:w-[240px] flex flex-col items-center justify-between order-1 lg:order-none'>
          <div className='relative w-full'>
            <div className='absolute -top-6 -left-4 w-20 h-20 rounded-full bg-blue-200/40 blur-3xl animate-pulse' />
            <div className='absolute -bottom-6 -right-4 w-20 h-20 rounded-full bg-purple-200/40 blur-3xl animate-pulse delay-700' />
            <div className='aspect-square rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.35)] relative overflow-hidden'>
              <div className='relative h-full w-full overflow-hidden rounded-xl border border-slate-100'>
                <Image
                  src={heroArtwork}
                  alt={album.albumName}
                  fill
                  priority
                  sizes='(max-width: 768px) 100vw, 240px'
                  className='object-cover'
                />
              </div>
              <div className='absolute top-4 left-4 flex gap-2'>
                <span className='rounded-full bg-white/90 border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm'>
                  Album
                </span>
                <span className='rounded-full bg-white/90 border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm'>
                  {album.tracks.length} tracks
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='flex-1 flex flex-col justify-between gap-5 text-slate-900 overflow-hidden order-2'>
          <div className='space-y-4'>
            <div className='inline-flex items-center px-3 py-1 bg-slate-50 rounded-full border border-slate-200 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500'>
              Album • {album.tracks.length} tracks
            </div>
            <div className='space-y-2'>
              <p className='text-xs uppercase tracking-[0.35em] text-slate-400 font-semibold truncate'>
                {album.artist?.artistName ?? 'Artist'}
              </p>
              <h2 className='text-3xl sm:text-[2.3rem] font-bold leading-snug font-["Poppins"] text-slate-900 truncate'>
                {album.albumName}
              </h2>
              <p className='text-sm text-slate-600 max-w-2xl font-["Poppins"]'>
                Experience the full body of work featuring {album.tracks.length}{' '}
                carefully curated songs.
              </p>
            </div>
          </div>

          {streamingLinks.length > 0 && (
            <div className='space-y-2 overflow-hidden'>
              <h3 className='text-xs font-semibold uppercase tracking-[0.35em] text-slate-400'>
                Stream the album
              </h3>
              <div className='flex flex-wrap gap-2'>
                {streamingLinks.map(link => (
                  <button
                    key={`${link.platform}-${link.url}`}
                    type='button'
                    className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors duration-200'
                    onClick={() => handleShareLink(link.url)}
                  >
                    {PLATFORM_LABELS[link.platform] ?? link.platform}
                    <ShareIcon className='w-4 h-4' />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className='space-y-3 overflow-hidden'>
            <h3 className='text-xs font-semibold uppercase tracking-[0.35em] text-slate-400'>
              Track list
            </h3>
            <div className='rounded-[20px] border border-slate-200 bg-slate-50 overflow-hidden shadow-[0_25px_80px_-50px_rgba(15,23,42,0.2)]'>
              {album.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className='flex flex-col gap-3 px-4 py-3 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 last:border-none hover:bg-white'
                >
                  <div className='flex items-start gap-4'>
                    <div className='text-sm font-semibold text-blue-500 w-6 text-right pt-0.5'>
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <div>
                      <p className='text-sm font-semibold text-slate-900'>
                        {track.title}
                      </p>
                      <p className='text-xs text-slate-500'>{track.artist}</p>
                      <div className='flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-slate-400 mt-1'>
                        <span>{track.genre ?? 'Genre'}</span>
                        <span>•</span>
                        <span>{formatDuration(track.duration)}</span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 sm:gap-3'>
                    <button
                      type='button'
                      className='inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200 px-4 py-2 text-xs font-medium shadow-sm'
                      onClick={() => handlePlayTrack(track)}
                    >
                      <PlayCircleIcon className='w-4 h-4 mr-1.5' /> Play
                    </button>
                    <button
                      type='button'
                      className='inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors duration-200 px-4 py-2 text-xs font-medium'
                      onClick={() => handleQueue(track)}
                    >
                      <QueueListIcon className='w-4 h-4 mr-1.5' /> Queue
                    </button>
                  </div>
                </div>
              ))}
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
