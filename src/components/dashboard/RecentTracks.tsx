'use client';

import { Card, CardBody, Button } from '@heroui/react';
import { MusicalNoteIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Track } from '@/types/track';
import TrackArtwork from '@/components/music/TrackArtwork';
import ArtistDisplay from '@/components/track/ArtistDisplay';
import CompletionBadge from '@/components/track/CompletionBadge';

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
    <Card className='border border-gray-200 dark:border-slate-700'>
      <CardBody className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
            Recent Tracks
          </h3>
          <Button size='sm' variant='light' onPress={onViewAll}>
            View All
          </Button>
        </div>

        {tracks.length === 0 ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4'>
              <MusicalNoteIcon className='w-8 h-8 text-gray-400' />
            </div>
            <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
              No tracks yet
            </h4>
            <p className='text-gray-500 dark:text-gray-400 mb-4'>
              Upload your first track to get started
            </p>
            <Button color='primary' variant='solid' onPress={onViewAll}>
              Upload Music
            </Button>
          </div>
        ) : (
          <div className='space-y-3'>
            {tracks.slice(0, 5).map(track => (
              <div
                key={track.id}
                className='flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
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
                  <Button
                    size='sm'
                    variant='light'
                    isIconOnly
                    onPress={() => onPlay(track)}
                    className='flex-shrink-0'
                  >
                    <PlayIcon className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
