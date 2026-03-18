'use client';

import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import type { Track } from '@/types/track';
import TrackCard from '@/components/ai/TrackCard';

interface MoreMusicSectionProps {
  tracks: Track[];
  onTrackPlay?: (_track: Track) => void;
}

export default function MoreMusicSection({
  tracks,
  onTrackPlay,
}: MoreMusicSectionProps) {
  const { playTrack } = useMusicPlayer();

  const handlePlay = (track: Track) => {
    playTrack(track);
    onTrackPlay?.(track);
  };

  // Show up to 6 tracks
  const displayTracks = tracks.slice(0, 6);

  if (displayTracks.length === 0) return null;

  return (
    <div className='mt-5'>
      {/* Minimal header — just a faint label */}
      <p className='mb-3 text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-slate-600'>
        You might also like
      </p>

      {/* Responsive grid of compact track cards */}
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
        {displayTracks.map(track => (
          <TrackCard
            key={track.id}
            track={track}
            onPlay={handlePlay}
            size='md'
            showDuration
            variant='compact'
            showActions
          />
        ))}
      </div>
    </div>
  );
}
