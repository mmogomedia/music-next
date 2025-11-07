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
    <>
      {/* Divider with "more music" text */}
      <div className='my-6 flex items-center'>
        <div className='flex-1 border-t border-gray-200 dark:border-slate-700' />
        <span className='px-3 text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest'>
          More Music
        </span>
        <div className='flex-1 border-t border-gray-200 dark:border-slate-700' />
      </div>

      {/* Responsive list of tracks */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6'>
        {displayTracks.map(track => (
          <TrackCard
            key={track.id}
            track={track}
            onPlay={handlePlay}
            size='md'
            showDuration
            variant='compact'
            showActions={false}
          />
        ))}
      </div>
    </>
  );
}
