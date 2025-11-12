'use client';

import { useState, useEffect } from 'react';
import { PauseIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import {
  PlayIcon as PlaySolidIcon,
  TrophyIcon,
} from '@heroicons/react/24/solid';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Track } from '@/types/track';
import { SourceType } from '@/types/stats';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

interface TopTenTracksProps {
  onTrackPlay?: (_track: Track) => void;
}

export default function TopTenTracks({ onTrackPlay }: TopTenTracksProps) {
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [allTopTracks, setAllTopTracks] = useState<Track[]>([]);
  const [topTenPlaylistId, setTopTenPlaylistId] = useState<
    string | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { currentTrack, isPlaying, playTrack, addToQueue } = useMusicPlayer();

  useEffect(() => {
    fetchTopTracks();
  }, []);

  const fetchTopTracks = async () => {
    try {
      const response = await fetch('/api/playlists/top-ten');

      if (response.status === 404) {
        // No top ten playlist exists - this is not an error, just empty state
        setTopTracks([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tracks) {
          setAllTopTracks(data.tracks);
          setTopTracks(data.tracks.slice(0, 9));
          setTopTenPlaylistId(data.playlist?.id);
        } else {
          setTopTracks([]);
          setAllTopTracks([]);
          setTopTenPlaylistId(undefined);
        }
      } else {
        console.error('Error fetching top ten tracks:', response.status);
        setTopTracks([]);
        setAllTopTracks([]);
        setTopTenPlaylistId(undefined);
      }
    } catch (error) {
      console.error('Error fetching top ten tracks:', error);
      setTopTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: Track) => {
    playTrack(track, 'playlist' as SourceType, topTenPlaylistId);
    onTrackPlay?.(track);
  };

  const handleAddToQueue = (track: Track) => {
    addToQueue(track);
  };

  if (loading) {
    return (
      <div className='bg-gray-50 dark:bg-slate-900 py-8'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header Skeleton */}
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse'></div>
              <div className='h-6 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-pulse'></div>
            </div>
            <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-48 ml-11 animate-pulse'></div>
          </div>

          {/* Tracks Skeleton */}
          <div className='space-y-2'>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className='bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700 animate-pulse'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-6 h-6 bg-gray-200 dark:bg-slate-700 rounded-full'></div>
                  <div className='w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg'></div>
                  <div className='flex-1'>
                    <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2'></div>
                    <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3'></div>
                  </div>
                  <div className='w-16 h-6 bg-gray-200 dark:bg-slate-700 rounded'></div>
                  <div className='w-12 h-6 bg-gray-200 dark:bg-slate-700 rounded'></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (topTracks.length === 0) {
    return (
      <div className='bg-gray-50 dark:bg-slate-900 py-8'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header */}
          <div className='mb-6'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <TrophyIcon className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Top Ten Tracks
              </h2>
            </div>
            <p className='text-sm text-gray-500 dark:text-gray-400 ml-11'>
              No top tracks available yet
            </p>
          </div>

          {/* Empty State */}
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <TrophyIcon className='w-8 h-8 text-gray-400 dark:text-slate-500' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No Top Tracks Yet
            </h3>
            <p className='text-gray-500 dark:text-gray-400'>
              Check back later for trending music
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-50 dark:bg-slate-900 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header - Left Justified */}
        <div className='mb-6'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <TrophyIcon className='w-5 h-5 text-white' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Top Ten Tracks
            </h2>
          </div>
          <p className='text-sm text-gray-500 dark:text-gray-400 ml-11'>
            The most popular tracks right now
          </p>
        </div>

        {/* Tracks Grid - 2 per row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {(showAll ? allTopTracks : topTracks).map((track, index) => (
            <div
              key={track.id}
              className='group relative overflow-hidden bg-white dark:bg-slate-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 border border-gray-100 dark:border-slate-700'
            >
              <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
                <div className='flex items-center gap-3 sm:gap-4 flex-1 min-w-0'>
                  {/* Rank */}
                  <div className='flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs'>
                    {index + 1}
                  </div>

                  {/* Track Artwork */}
                  <div className='relative group/artwork flex-shrink-0'>
                    <div className='w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden'>
                      {track.coverImageUrl ? (
                        <img
                          src={track.coverImageUrl}
                          alt={track.title}
                          className='w-full h-full object-cover group-hover/artwork:scale-105 transition-transform duration-200'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <PlaySolidIcon className='w-5 h-5 text-gray-400 dark:text-slate-400' />
                        </div>
                      )}
                    </div>
                    {/* Play Overlay */}
                    <div className='absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover/artwork:opacity-100 transition-opacity duration-200'>
                      <button
                        onClick={() => handlePlay(track)}
                        className='w-6 h-6 bg-white/90 text-gray-900 rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-0'
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <PauseIcon className='w-3 h-3' />
                        ) : (
                          <PlaySolidIcon className='w-3 h-3 ml-0.5' />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                      {track.title}
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                      {track.artist}
                    </p>

                    {/* Genre - mobile */}
                    <div className='mt-1 sm:hidden'>
                      <span className='inline-flex items-center px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded text-[10px] font-medium'>
                        {track.genre}
                      </span>
                    </div>
                  </div>

                  {/* Genre - desktop */}
                  <div className='hidden sm:block flex-shrink-0'>
                    <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded text-xs font-medium'>
                      {track.genre}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto'>
                  {/* Duration */}
                  <div className='text-xs sm:text-sm text-gray-500 dark:text-gray-400'>
                    {Math.floor((track.duration || 0) / 60)}:
                    {(track.duration || 0) % 60 < 10 ? '0' : ''}
                    {(track.duration || 0) % 60}
                  </div>

                  {/* Play Button - desktop */}
                  <button
                    onClick={() => handlePlay(track)}
                    className='hidden sm:flex flex-shrink-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-0'
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <PauseIcon className='w-4 h-4' />
                    ) : (
                      <PlaySolidIcon className='w-4 h-4 ml-0.5' />
                    )}
                  </button>

                  {/* Mobile Actions Menu */}
                  <div className='sm:hidden flex-shrink-0'>
                    <Dropdown placement='bottom-end'>
                      <DropdownTrigger>
                        <button
                          type='button'
                          aria-label='Track actions'
                          className='p-2 rounded-full border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                        >
                          <EllipsisVerticalIcon className='w-4 h-4' />
                        </button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label='Track actions' variant='flat'>
                        <DropdownItem
                          key='play'
                          onPress={() => handlePlay(track)}
                        >
                          {currentTrack?.id === track.id && isPlaying
                            ? 'Pause'
                            : 'Play'}
                        </DropdownItem>
                        <DropdownItem
                          key='queue'
                          onPress={() => handleAddToQueue(track)}
                        >
                          Add to queue
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All / Show Less Button */}
        {allTopTracks.length > 9 && (
          <div className='text-center mt-6'>
            <button
              onClick={() => setShowAll(!showAll)}
              className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200'
            >
              {showAll
                ? 'Show Less'
                : `View All Top Tracks (${allTopTracks.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
