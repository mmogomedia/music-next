'use client';

import { MusicalNoteIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Track } from '@/types/track';
import TrackArtwork from '@/components/music/TrackArtwork';
import ArtistDisplay from '@/components/track/ArtistDisplay';
import CompletionBadge from '@/components/track/CompletionBadge';
import FCard from '@/components/ui/FCard';
import FButton from '@/components/ui/FButton';
import FEmptyState from '@/components/ui/FEmptyState';

interface RecentTracksProps {
  tracks: Track[];
  onViewAll: () => void;
  onPlay: (_track: Track) => void;
}

export default function RecentTracks({
  tracks,
  onViewAll,
  onPlay,
}: RecentTracksProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <FCard
      title='Recent Uploads'
      titleIcon={<MusicalNoteIcon className='w-4 h-4' />}
    >
      {tracks.length === 0 ? (
        <FEmptyState
          icon={MusicalNoteIcon}
          title='No tracks yet'
          description='Upload your first track to get started'
          action={{ label: 'Upload Music', onPress: onViewAll }}
        />
      ) : (
        <>
          <div className='space-y-3'>
            {tracks.slice(0, 5).map(track => (
              <div
                key={track.id}
                className='flex items-center justify-between p-3 bg-gray-50/80 dark:bg-slate-900/40 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors'
              >
                <div className='flex items-center gap-3 flex-1 min-w-0'>
                  <TrackArtwork
                    artworkUrl={track.albumArtwork || track.coverImageUrl}
                    title={track.title}
                    size='sm'
                  />
                  <div className='flex-1 min-w-0'>
                    <h5 className='font-medium text-gray-900 dark:text-white truncate mb-1'>
                      {track.title}
                    </h5>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        <ArtistDisplay track={track} />
                      </p>
                      <span className='text-xs text-gray-400 dark:text-gray-500'>
                        •
                      </span>
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        {formatDate(track.createdAt.toString())}
                      </span>
                      <span className='text-xs text-gray-400 dark:text-gray-500'>
                        •
                      </span>
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        {formatDuration(track.duration || 0)}
                      </span>
                      {track.completionPercentage !== undefined && (
                        <>
                          <span className='text-xs text-gray-400 dark:text-gray-500'>
                            •
                          </span>
                          <CompletionBadge
                            percentage={track.completionPercentage}
                            size='sm'
                            className='flex-shrink-0'
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-3 flex-shrink-0'>
                  <div className='text-right hidden sm:block'>
                    <div className='text-sm font-medium text-gray-900 dark:text-white'>
                      {track.playCount.toLocaleString()}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      plays
                    </div>
                  </div>
                  <FButton
                    size='sm'
                    variant='ghost'
                    isIconOnly
                    onPress={() => onPlay(track)}
                    className='flex-shrink-0'
                  >
                    <PlayIcon className='w-4 h-4' />
                  </FButton>
                </div>
              </div>
            ))}
          </div>
          <div className='mt-4 text-center'>
            <button
              onClick={onViewAll}
              className='text-sm text-primary-600 dark:text-primary-400 hover:underline'
            >
              View all tracks
            </button>
          </div>
        </>
      )}
    </FCard>
  );
}
