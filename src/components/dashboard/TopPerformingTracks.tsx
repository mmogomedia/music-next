'use client';

import { Card, CardBody, Button } from '@heroui/react';
import { PlayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import TrackArtwork from '@/components/music/TrackArtwork';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { SourceType } from '@/types/stats';

interface TopPerformingTracksProps {
  topTracks: Array<{
    trackId: string;
    _count: { id: number };
    track: {
      id: string;
      title: string;
      artist: string;
      playCount: number;
      coverImageUrl: string | null;
    } | null;
  }>;
  onViewAll?: () => void;
}

export default function TopPerformingTracks({
  topTracks,
  onViewAll,
}: TopPerformingTracksProps) {
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();

  if (!topTracks || topTracks.length === 0) {
    return (
      <Card className='border border-gray-200 dark:border-slate-700'>
        <CardBody className='p-6'>
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4'>
              <ChartBarIcon className='w-8 h-8 text-gray-400' />
            </div>
            <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
              No performance data yet
            </h4>
            <p className='text-gray-500 dark:text-gray-400'>
              Your top performing tracks will appear here once you get plays
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='border border-gray-200 dark:border-slate-700'>
      <CardBody className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <ChartBarIcon className='w-5 h-5 text-gray-500 dark:text-gray-400' />
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Top Performing Tracks
            </h3>
          </div>
          {onViewAll && (
            <Button size='sm' variant='light' onPress={onViewAll}>
              View All
            </Button>
          )}
        </div>

        <div className='space-y-3'>
          {topTracks.map((item, index) => {
            if (!item.track) return null;

            const rank = index + 1;
            const isCurrentlyPlaying =
              currentTrack?.id === item.track.id && isPlaying;

            return (
              <div
                key={item.trackId}
                className='flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
              >
                <div className='flex-shrink-0 w-8 text-center'>
                  <span
                    className={`text-sm font-bold ${
                      rank === 1
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : rank === 2
                          ? 'text-gray-600 dark:text-gray-400'
                          : rank === 3
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    #{rank}
                  </span>
                </div>

                <TrackArtwork
                  artworkUrl={item.track.coverImageUrl || undefined}
                  title={item.track.title}
                  size='sm'
                />

                <div className='flex-1 min-w-0'>
                  <h5 className='font-medium text-gray-900 dark:text-white truncate'>
                    {item.track.title}
                  </h5>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {item.track.artist || 'Unknown Artist'}
                  </p>
                </div>

                <div className='flex items-center gap-4 flex-shrink-0'>
                  <div className='text-right'>
                    <div className='text-sm font-semibold text-gray-900 dark:text-white'>
                      {item._count.id.toLocaleString()}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      plays
                    </div>
                  </div>

                  <Button
                    size='sm'
                    variant='light'
                    isIconOnly
                    onPress={async () => {
                      try {
                        // Fetch full track data for playback
                        const response = await fetch(
                          `/api/tracks/${item.track!.id}`
                        );
                        if (response.ok) {
                          const data = await response.json();
                          if (data.track) {
                            playTrack(data.track, 'dashboard' as SourceType);
                          }
                        }
                      } catch (error) {
                        console.error('Error fetching track:', error);
                      }
                    }}
                    className={
                      isCurrentlyPlaying
                        ? 'text-blue-600 dark:text-blue-400'
                        : ''
                    }
                  >
                    {isCurrentlyPlaying ? (
                      <div className='w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <PlayIcon className='w-4 h-4' />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
