'use client';

import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Track } from '@/types/track';
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

  // Limit to 5 tracks
  const displayTracks = tracks.slice(0, 5);

  if (displayTracks.length === 0) {
    return null;
  }

  return (
    <div className='my-6 rounded-xl border border-gray-200/80 dark:border-slate-700/80 bg-gray-50/50 dark:bg-slate-800/30 p-4 md:p-6'>
      {/* Section header */}
      <div className='mb-4 flex items-center gap-2'>
        <div className='h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent' />
        <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
          Other Songs
        </h3>
        <div className='h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent' />
      </div>

      {/* Responsive list of tracks */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
        {displayTracks.map(track => (
          <TrackCard
            key={track.id}
            track={track}
            onPlay={handlePlay}
            size='md'
            showDuration
            variant='compact'
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
}
