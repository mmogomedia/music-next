'use client';

import { Card, CardBody, Button } from '@heroui/react';
import { MusicalNoteIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Track } from '@/types/track';

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
                  <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <MusicalNoteIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h5 className='font-medium text-gray-900 dark:text-white truncate'>
                      {track.title}
                    </h5>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {track.artist || 'Unknown Artist'} •{' '}
                      {formatDate(track.createdAt.toString())}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <div className='text-right'>
                    <div className='text-sm font-medium text-gray-900 dark:text-white'>
                      {formatDuration(track.duration || 0)}
                    </div>
                    <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                      <span>{track.playCount} plays</span>
                      <span>•</span>
                      <span>{track.likeCount || 0} likes</span>
                    </div>
                  </div>
                  <Button
                    size='sm'
                    variant='light'
                    isIconOnly
                    onPress={() => onPlay(track)}
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
