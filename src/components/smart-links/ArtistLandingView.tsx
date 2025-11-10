'use client';

import { useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';
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
    <div className='space-y-8'>
      <div className='rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl overflow-hidden'>
        <div className='flex flex-col lg:flex-row'>
          <div className='relative lg:w-2/5 bg-gradient-to-br from-blue-600/70 via-purple-600/60 to-pink-500/70 flex items-center justify-center p-10'>
            <div className='relative w-48 h-48 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl'>
              <Image
                src={artist.profile?.profileImage || defaultAvatar}
                alt={artist.profile?.artistName ?? 'Artist'}
                fill
                className='object-cover'
              />
            </div>
          </div>
          <div className='flex-1 p-6 sm:p-8 space-y-6'>
            <div className='space-y-2'>
              <Chip size='sm' color='primary' variant='flat'>
                Artist Spotlight
              </Chip>
              <h2 className='text-3xl sm:text-4xl font-bold text-white leading-tight'>
                {artist.profile?.artistName ?? 'Artist'}
              </h2>
              {artist.profile?.bio && (
                <p className='text-sm text-slate-300 leading-relaxed max-w-3xl'>
                  {artist.profile.bio}
                </p>
              )}
            </div>

            {socialLinks.length > 0 && (
              <div className='space-y-2'>
                <h3 className='text-sm font-semibold text-slate-200 uppercase tracking-wide'>
                  Connect
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {socialLinks.map(link => (
                    <a
                      key={link.url}
                      href={link.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:border-blue-400 hover:text-white transition-colors'
                    >
                      <GlobeAltIcon className='w-4 h-4 text-blue-300' />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {streamingLinks.length > 0 && (
              <div className='space-y-2'>
                <h3 className='text-sm font-semibold text-slate-200 uppercase tracking-wide'>
                  Listen on
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {streamingLinks.map(link => (
                    <button
                      key={link.url}
                      type='button'
                      className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:border-blue-400 hover:text-white transition-colors'
                      onClick={() => handleShare(link.url)}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {artist.profile?.slug && (
              <Link
                href={`/artist/${artist.profile.slug}`}
                className='inline-flex items-center gap-2 text-sm text-blue-300 hover:text-white'
              >
                View full profile
                <ShareIcon className='w-4 h-4' />
              </Link>
            )}
          </div>
        </div>
      </div>

      {artist.topTracks.length > 0 && (
        <div className='rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-xl font-semibold text-white'>Top Tracks</h3>
              <p className='text-sm text-slate-300'>
                Listen to the most popular songs from this artist.
              </p>
            </div>
          </div>
          <div className='divide-y divide-white/10 rounded-2xl border border-white/10 overflow-hidden'>
            {artist.topTracks.map((track, index) => (
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
                    <p className='text-xs text-slate-300'>{track.artist}</p>
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
                    onPress={() => handleQueueTrack(track)}
                    aria-label={`Queue ${track.title}`}
                  >
                    <QueueListIcon className='w-5 h-5' />
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
