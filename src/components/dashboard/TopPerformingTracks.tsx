'use client';

import { Button } from '@heroui/react';
import { PlayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import FCard from '@/components/ui/FCard';
import TrackArtwork from '@/components/music/TrackArtwork';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { SourceType } from '@/types/stats';
import ArtistDisplay from '@/components/track/ArtistDisplay';
import CompletionBadge from '@/components/track/CompletionBadge';

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
      completionPercentage?: number;
    } | null;
  }>;
  onViewAll?: () => void;
  hasPulseScore?: boolean;
}

export default function TopPerformingTracks({
  topTracks,
  onViewAll,
  hasPulseScore = false,
}: TopPerformingTracksProps) {
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();

  if (!topTracks || topTracks.length === 0) {
    return (
      <FCard
        title='Top Performing Tracks'
        titleIcon={<ChartBarIcon className='w-4 h-4' />}
      >
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
      </FCard>
    );
  }

  return (
    <FCard
      title='Top Performing Tracks'
      titleIcon={<ChartBarIcon className='w-4 h-4' />}
    >
      <div className='space-y-3'>
        {(() => {
          const maxPlays = topTracks[0]?._count?.id ?? 1;
          const visibleCount = hasPulseScore ? 4 : 2;
          return topTracks.slice(0, visibleCount).map((item, index) => {
            if (!item.track) return null;

            const rank = index + 1;
            const isCurrentlyPlaying =
              currentTrack?.id === item.track.id && isPlaying;
            // Items 3 & 4 only visible on desktop when pulse score is present
            const isExtended = index >= 2;

            return (
              <div
                key={item.trackId}
                className={isExtended ? 'hidden lg:block' : undefined}
              >
                <div className='flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-slate-900/40 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors'>
                  <div className='flex-shrink-0 w-8 text-center'>
                    <span
                      className={`text-base font-extrabold ${
                        rank === 1
                          ? 'text-amber-500 dark:text-amber-400'
                          : rank === 2
                            ? 'text-gray-600 dark:text-gray-400'
                            : rank === 3
                              ? 'text-slate-400 dark:text-slate-500'
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
                    <h5 className='font-medium text-gray-900 dark:text-white truncate mb-1'>
                      {item.track.title}
                    </h5>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        <ArtistDisplay legacyArtist={item.track.artist} />
                      </p>
                      {item.track.completionPercentage !== undefined && (
                        <>
                          <span className='text-xs text-gray-400 dark:text-gray-500'>
                            •
                          </span>
                          <CompletionBadge
                            percentage={item.track.completionPercentage}
                            size='sm'
                            className='flex-shrink-0'
                          />
                        </>
                      )}
                    </div>
                    <div className='mt-1.5 h-1 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden'>
                      <div
                        className='h-full rounded-full bg-primary-500 dark:bg-primary-400 transition-all duration-500'
                        style={{
                          width: `${Math.round(((item._count?.id ?? 0) / maxPlays) * 100)}%`,
                        }}
                      />
                    </div>
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
                          ? 'text-primary-600 dark:text-primary-400'
                          : ''
                      }
                    >
                      {isCurrentlyPlaying ? (
                        <div className='w-4 h-4 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin'></div>
                      ) : (
                        <PlayIcon className='w-4 h-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </div>
      {onViewAll && (
        <div className='mt-4 text-center'>
          <button
            onClick={onViewAll}
            className='text-sm text-primary-600 dark:text-primary-400 hover:underline'
          >
            View all tracks
          </button>
        </div>
      )}
    </FCard>
  );
}
