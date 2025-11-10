'use client';

import { useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@heroui/react';
import {
  GlobeAltIcon,
  PlayCircleIcon,
  QueueListIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import type { TrackLandingData } from '@/lib/services/quick-link-service';
import { mapLandingTrackToPlayerTrack } from '@/components/quick-links/utils';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/components/ui/Toast';

const defaultAvatar =
  'https://images.unsplash.com/photo-1542178243-bc20204b769f?auto=format&fit=crop&w=1200&q=80';

interface ArtistLandingViewProps {
  artist: {
    profile: {
      artistName?: string | null;
      bio?: string | null;
      profileImage?: string | null;
      location?: string | null;
      genre?: string | null;
      slug?: string | null;
    } | null;
    socialLinks?: Record<string, unknown> | null;
    streamingLinks?: Record<string, unknown> | null;
    topTracks: TrackLandingData[];
  };
  quickLinkSlug: string;
}

export default function QuickLinkArtistView({
  artist,
  quickLinkSlug,
}: ArtistLandingViewProps) {
  const { playTrack, addToQueue } = useMusicPlayer();
  const { showToast } = useToast();

  const socialLinks = useMemo(
    () => extractLinks(artist.socialLinks ?? null),
    [artist.socialLinks]
  );
  const streamingLinks = useMemo(
    () => extractLinks(artist.streamingLinks ?? null, 'Listen'),
    [artist.streamingLinks]
  );

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

  const handleQueueTrack = (track: TrackLandingData) => {
    addToQueue(mapLandingTrackToPlayerTrack(track), false);
    showToast('Added to queue', 'info');
  };

  const handleShare = async (url: string) => {
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
    <div className='h-full flex flex-col gap-6'>
      <div className='flex-1 rounded-[32px] border border-slate-100 bg-white shadow-[0_35px_100px_-50px_rgba(15,23,42,0.25)] overflow-hidden'>
        <div className='grid h-full lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] items-stretch'>
          <div className='relative bg-gradient-to-br from-blue-100/80 via-purple-100/80 to-pink-100/80 flex items-center justify-center p-7'>
            <div className='relative w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl shadow-black/15'>
              <Image
                src={artist.profile?.profileImage || defaultAvatar}
                alt={artist.profile?.artistName ?? 'Artist'}
                fill
                className='object-cover'
              />
            </div>
            <div className='absolute -top-5 -left-6 w-18 h-18 bg-blue-300/40 rounded-full blur-2xl animate-pulse' />
            <div className='absolute -bottom-6 -right-6 w-20 h-20 bg-pink-300/40 rounded-full blur-2xl animate-pulse delay-700' />
          </div>
          <div className='p-6 sm:p-7 flex flex-col justify-between gap-5 text-slate-900 overflow-hidden'>
            <div className='space-y-4'>
              <div className='inline-flex items-center px-3 py-1 bg-slate-50 rounded-full border border-slate-200 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500'>
                Artist Spotlight
              </div>
              <div className='space-y-2'>
                <h2 className='text-3xl sm:text-[2.3rem] font-bold leading-snug font-["Poppins"] text-slate-900 truncate'>
                  {artist.profile?.artistName ?? 'Artist'}
                </h2>
                {artist.profile?.bio && (
                  <p className='text-sm text-slate-600 leading-relaxed'>
                    {artist.profile.bio}
                  </p>
                )}
              </div>

              <div className='flex flex-wrap gap-3 text-[0.6rem] uppercase tracking-[0.3em] text-slate-400'>
                {artist.profile?.genre && <span>{artist.profile.genre}</span>}
                {artist.profile?.location && (
                  <span className='flex items-center gap-2'>
                    <span className='inline-block h-1.5 w-1.5 rounded-full bg-slate-300' />
                    {artist.profile.location}
                  </span>
                )}
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div className='space-y-2'>
                <h3 className='text-xs font-semibold uppercase tracking-[0.35em] text-slate-400'>
                  Connect
                </h3>
                <div className='flex flex-wrap gap-2 overflow-hidden'>
                  {socialLinks.map(link => (
                    <a
                      key={link.url}
                      href={link.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors duration-200'
                    >
                      <GlobeAltIcon className='w-4 h-4 text-blue-500' />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {streamingLinks.length > 0 && (
              <div className='space-y-2'>
                <h3 className='text-xs font-semibold uppercase tracking-[0.35em] text-slate-400'>
                  Listen on
                </h3>
                <div className='flex flex-wrap gap-2 overflow-hidden'>
                  {streamingLinks.map(link => (
                    <button
                      key={link.url}
                      type='button'
                      className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors duration-200'
                      onClick={() => handleShare(link.url)}
                    >
                      {link.label}
                      <ShareIcon className='w-4 h-4' />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {artist.profile?.slug && (
              <div className='flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-slate-400'>
                <Link
                  href={`/artist/${artist.profile.slug}`}
                  className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors duration-200'
                >
                  View full profile
                  <ShareIcon className='w-4 h-4' />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {artist.topTracks.length > 0 && (
        <div className='rounded-[28px] border border-slate-100 bg-white px-5 sm:px-7 py-6 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.2)] space-y-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-slate-900'>
            <div>
              <h3 className='text-2xl font-semibold font-["Poppins"]'>
                Top Tracks
              </h3>
              <p className='text-sm text-slate-600 max-w-2xl'>
                Discover the songs fans are replaying the most from this artist.
              </p>
            </div>
          </div>
          <div className='rounded-[20px] border border-slate-200 bg-slate-50 overflow-hidden'>
            {artist.topTracks.map((track, index) => (
              <div
                key={track.id}
                className='flex flex-col gap-3 px-4 py-3 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 last:border-none hover:bg-white'
              >
                <div className='flex items-start gap-4'>
                  <div className='text-sm font-semibold text-blue-500 w-6 text-right'>
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
                  <Button
                    radius='full'
                    className='px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200 shadow-sm text-xs'
                    onPress={() => handlePlayTrack(track)}
                  >
                    <PlayCircleIcon className='w-4 h-4 mr-1.5' /> Play
                  </Button>
                  <Button
                    radius='full'
                    className='px-4 py-2 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors duration-200 text-xs'
                    onPress={() => handleQueueTrack(track)}
                  >
                    <QueueListIcon className='w-4 h-4 mr-1.5' /> Queue
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

type ExtractedLink = { label: string; url: string };

function extractLinks(
  value: Record<string, unknown> | null,
  defaultLabelPrefix = ''
): ExtractedLink[] {
  if (!value) return [];

  const links: ExtractedLink[] = [];
  Object.entries(value).forEach(([key, raw]) => {
    if (!raw || typeof raw !== 'object') return;
    const url = (raw as any).url ?? (raw as any).link ?? null;
    if (!url || typeof url !== 'string') return;
    const label =
      (raw as any).username || (raw as any).pageName || (raw as any).artistName;
    const finalLabel = label
      ? String(label)
      : defaultLabelPrefix
        ? `${defaultLabelPrefix} ${key}`
        : key.replace(/_/g, ' ');
    links.push({ label: finalLabel, url });
  });
  return links;
}
