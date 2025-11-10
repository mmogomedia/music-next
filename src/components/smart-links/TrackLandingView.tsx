'use client';

import { type ReactNode, useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button, Chip } from '@heroui/react';
import {
  ArrowDownTrayIcon,
  ClockIcon,
  HeartIcon,
  MusicalNoteIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import type { Track } from '@/types/track';
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

interface TrackLandingViewProps {
  track: TrackLandingData;
  quickLinkSlug: string;
}

const defaultArtwork =
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80';

const formatDuration = (seconds?: number | null) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function TrackLandingView({
  track,
  quickLinkSlug,
}: TrackLandingViewProps) {
  const { playTrack, playPause, currentTrack, isPlaying, addToQueue } =
    useMusicPlayer();
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const playerTrack: Track = useMemo(
    () => mapLandingTrackToPlayerTrack(track),
    [track]
  );

  const isCurrentTrack = currentTrack?.id === track.id;
  const canPlay = Boolean(track.fileUrl);

  const recordEvent = useCallback(
    async (event: 'play' | 'download' | 'share' | 'like') => {
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

  const handlePlay = async () => {
    if (!canPlay) {
      showToast('Audio file not available', 'error');
      return;
    }
    recordEvent('play');
    playTrack(playerTrack, 'landing');
  };

  const handlePause = () => {
    playPause();
  };

  const handleDownload = async () => {
    if (!track.isDownloadable || !track.fileUrl) {
      showToast('Downloads are disabled for this track', 'error');
      return;
    }

    setIsDownloading(true);
    try {
      recordEvent('download');
      const link = document.createElement('a');
      link.href = track.fileUrl;
      link.download = `${track.title || 'track'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Download started');
    } catch (error) {
      console.error(error);
      showToast('Failed to start download', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/quick/${quickLinkSlug}`;
      await navigator.clipboard.writeText(url);
      recordEvent('share');
      showToast('Link copied to clipboard', 'info');
    } catch (error) {
      console.error(error);
      showToast('Failed to copy link', 'error');
    }
  };

  const handleLike = async () => {
    recordEvent('like');
    showToast('Thanks for the love!', 'success');
  };

  const handleQueue = () => {
    addToQueue(playerTrack, false);
    showToast('Added to queue', 'info');
  };

  return (
    <div className='rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl overflow-hidden'>
      <div className='flex flex-col lg:flex-row'>
        <div className='relative lg:w-2/5 aspect-square lg:aspect-auto'>
          <Image
            src={track.albumArtwork || track.coverImageUrl || defaultArtwork}
            alt={track.title}
            fill
            priority
            className='object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent' />
          <div className='absolute bottom-4 left-4 flex flex-col gap-2'>
            <Chip size='sm' color='primary' variant='flat'>
              {track.genre || 'Music'}
            </Chip>
            <Chip size='sm' color='secondary' variant='flat'>
              {formatDuration(track.duration)}
            </Chip>
          </div>
        </div>
        <div className='flex-1 p-6 sm:p-8 space-y-6'>
          <div className='space-y-2'>
            <p className='text-sm uppercase tracking-widest text-blue-300 font-semibold'>
              {track.artist || 'Artist'}
            </p>
            <h2 className='text-3xl sm:text-4xl font-bold text-white leading-tight'>
              {track.title}
            </h2>
            {track.album && (
              <p className='text-sm text-slate-300'>
                From the album {track.album}
              </p>
            )}
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <Button
              color='primary'
              startContent={
                isCurrentTrack && isPlaying ? (
                  <PauseCircleIcon className='w-5 h-5' />
                ) : (
                  <PlayCircleIcon className='w-5 h-5' />
                )
              }
              onPress={() =>
                isCurrentTrack && isPlaying ? handlePause() : handlePlay()
              }
              isDisabled={!canPlay}
            >
              {isCurrentTrack && isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant='bordered'
              startContent={<MusicalNoteIcon className='w-5 h-5' />}
              onPress={handleQueue}
              isDisabled={!canPlay}
            >
              Add to queue
            </Button>
            <Button
              variant='light'
              startContent={<ArrowDownTrayIcon className='w-5 h-5' />}
              onPress={handleDownload}
              isDisabled={!track.isDownloadable || !track.fileUrl}
              isLoading={isDownloading}
            >
              Download
            </Button>
            <Button
              variant='light'
              startContent={<ShareIcon className='w-5 h-5' />}
              onPress={handleShare}
            >
              Share
            </Button>
            <Button
              variant='light'
              startContent={<HeartIcon className='w-5 h-5' />}
              onPress={handleLike}
            >
              Show love
            </Button>
          </div>

          {track.description && (
            <div className='space-y-2'>
              <h3 className='text-sm font-semibold text-slate-200 uppercase tracking-wide'>
                About this track
              </h3>
              <p className='text-sm text-slate-300 leading-relaxed'>
                {track.description}
              </p>
            </div>
          )}

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <InfoRow label='Genre' value={track.genre ?? 'Unknown'} />
            <InfoRow label='Duration' value={formatDuration(track.duration)} />
            <InfoRow label='BPM' value={track.bpm ? `${track.bpm} BPM` : '—'} />
            <InfoRow
              label='Release date'
              value={
                track.releaseDate
                  ? new Date(track.releaseDate).toLocaleDateString()
                  : '—'
              }
              icon={<ClockIcon className='w-4 h-4 text-blue-300' />}
            />
          </div>

          {track.streamingLinks.length > 0 && (
            <div className='space-y-2'>
              <h3 className='text-sm font-semibold text-slate-200 uppercase tracking-wide'>
                Listen on
              </h3>
              <div className='flex flex-wrap gap-2'>
                {track.streamingLinks.map(link => (
                  <a
                    key={`${link.platform}-${link.url}`}
                    href={link.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:border-blue-400 hover:text-white transition-colors'
                    onClick={() => recordEvent('share')}
                  >
                    {PLATFORM_LABELS[link.platform] ?? link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className='rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200 flex items-center gap-3'>
      <div className='flex-shrink-0 text-blue-300'>
        {icon ?? <MusicalNoteIcon className='w-4 h-4' />}
      </div>
      <div>
        <p className='text-xs uppercase tracking-wider text-slate-400'>
          {label}
        </p>
        <p className='font-medium text-slate-100'>{value}</p>
      </div>
    </div>
  );
}
