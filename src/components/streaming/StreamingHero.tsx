'use client';

import { useState, useEffect } from 'react';
import {
  PauseIcon,
  HeartIcon,
  PlusIcon,
  ShareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid';
import { Track } from '@/types/track';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { SourceType } from '@/types/stats';

interface StreamingHeroProps {
  onTrackPlay?: (_track: Track) => void;
}

export default function StreamingHero({ onTrackPlay }: StreamingHeroProps) {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [featuredPlaylistId, setFeaturedPlaylistId] = useState<
    string | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const {
    currentTrack: globalCurrentTrack,
    isPlaying: globalIsPlaying,
    playTrack,
  } = useMusicPlayer();

  // Find the current track index based on the global player state
  const currentTrackIndex = featuredTracks.findIndex(
    track => track.id === globalCurrentTrack?.id
  );
  const currentTrack =
    currentTrackIndex >= 0
      ? featuredTracks[currentTrackIndex]
      : featuredTracks[0];

  useEffect(() => {
    fetchFeaturedTracks();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const fetchFeaturedTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/playlists/featured');

      if (response.status === 404) {
        // No featured playlist exists - this is not an error, just empty state
        setFeaturedTracks([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.tracks && data.tracks.length > 0) {
        // API returns tracks directly with fileUrl constructed
        setFeaturedTracks(data.tracks);
        setFeaturedPlaylistId(data.playlist?.id);
      } else {
        setFeaturedTracks([]);
        setFeaturedPlaylistId(undefined);
      }
    } catch (error: any) {
      console.error('Error fetching featured tracks:', error);
      setError(error.message || 'Failed to fetch featured tracks');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: Track) => {
    playTrack(track, 'playlist' as SourceType, featuredPlaylistId);
    onTrackPlay?.(track);
  };

  const handlePrevious = () => {
    const prevIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : 0;
    const prevTrack = featuredTracks[prevIndex];
    if (prevTrack) {
      playTrack(prevTrack, 'playlist' as SourceType, featuredPlaylistId);
      onTrackPlay?.(prevTrack);
    }
  };

  const handleNext = () => {
    const nextIndex =
      currentTrackIndex < featuredTracks.length - 1
        ? currentTrackIndex + 1
        : featuredTracks.length - 1;
    const nextTrack = featuredTracks[nextIndex];
    if (nextTrack) {
      playTrack(nextTrack, 'playlist' as SourceType, featuredPlaylistId);
      onTrackPlay?.(nextTrack);
    }
  };

  if (loading) {
    return (
      <div className='bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header Skeleton */}
          <div className='mb-8'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse'></div>
                  <div className='h-8 bg-gray-200 dark:bg-slate-700 rounded w-48 animate-pulse'></div>
                </div>
                <div className='h-6 bg-gray-200 dark:bg-slate-700 rounded w-64 ml-13 animate-pulse'></div>
              </div>
              <div className='hidden lg:flex items-center gap-6'>
                <div className='flex items-end gap-1 h-12'>
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className='w-1 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse'
                      style={{ height: `${40 + Math.random() * 40}%` }}
                    ></div>
                  ))}
                </div>
                <div className='w-20 h-8 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse'></div>
                <div className='text-right'>
                  <div className='h-6 bg-gray-200 dark:bg-slate-700 rounded w-8 animate-pulse mb-1'></div>
                  <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-12 animate-pulse'></div>
                </div>
                <div className='w-24 h-8 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse'></div>
              </div>
            </div>
          </div>

          {/* Banner Skeleton */}
          <div className='relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 animate-pulse overflow-hidden'>
            <div className='flex h-80'>
              <div className='w-1/4 bg-gray-200 dark:bg-slate-700'></div>
              <div className='w-3/4 relative overflow-hidden'>
                <div className='absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10'></div>
                <div className='relative flex flex-col h-full p-8'>
                  <div className='flex-1 flex flex-col justify-center space-y-8'>
                    {/* Title and Artist */}
                    <div className='space-y-3'>
                      <div className='h-16 bg-gray-200 dark:bg-slate-700 rounded w-4/5'></div>
                      <div className='h-10 bg-gray-200 dark:bg-slate-700 rounded w-2/3'></div>
                    </div>

                    {/* Stats Row */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-8'>
                        <div className='text-center space-y-2'>
                          <div className='h-10 bg-gray-200 dark:bg-slate-700 rounded w-20'></div>
                          <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-12 mx-auto'></div>
                        </div>
                        <div className='text-center space-y-2'>
                          <div className='h-10 bg-gray-200 dark:bg-slate-700 rounded w-16'></div>
                          <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-16 mx-auto'></div>
                        </div>
                        <div className='text-center space-y-2'>
                          <div className='h-10 bg-gray-200 dark:bg-slate-700 rounded w-8'></div>
                          <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-12 mx-auto'></div>
                        </div>
                      </div>
                      <div className='h-12 bg-gray-200 dark:bg-slate-700 rounded-2xl w-24'></div>
                    </div>

                    {/* Progress Bar */}
                    <div className='space-y-3'>
                      <div className='flex justify-between'>
                        <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-24'></div>
                        <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-16'></div>
                      </div>
                      <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded-full'></div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className='space-y-8'>
                    <div className='flex justify-center'>
                      <div className='w-24 h-24 bg-gray-200 dark:bg-slate-700 rounded-full'></div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex gap-6'>
                        <div className='w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-2xl'></div>
                        <div className='w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-2xl'></div>
                      </div>
                      <div className='flex gap-4'>
                        <div className='w-14 h-14 bg-gray-200 dark:bg-slate-700 rounded-2xl'></div>
                        <div className='w-14 h-14 bg-gray-200 dark:bg-slate-700 rounded-2xl'></div>
                        <div className='w-14 h-14 bg-gray-200 dark:bg-slate-700 rounded-2xl'></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-red-400'>
          <p>Error: {error}</p>
          <button
            onClick={fetchFeaturedTracks}
            className='mt-4 px-4 py-2 bg-blue-600 rounded-md text-white'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (featuredTracks.length === 0) {
    return (
      <div className='bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg'>
                    <PlaySolidIcon className='w-6 h-6 text-white' />
                  </div>
                  <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                    Featured Track
                  </h1>
                </div>
                <p className='text-lg text-gray-600 dark:text-gray-400 ml-13'>
                  No featured tracks available yet
                </p>
              </div>

              {/* Creative Right Side Element */}
              <div className='hidden lg:flex items-center gap-6'>
                {/* Music Visualizer - Static Design */}
                <div className='flex items-end gap-1 h-12'>
                  <div
                    className='w-1 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-full'
                    style={{ height: '60%' }}
                  ></div>
                  <div
                    className='w-1 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-full'
                    style={{ height: '80%' }}
                  ></div>
                  <div
                    className='w-1 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-full'
                    style={{ height: '40%' }}
                  ></div>
                  <div
                    className='w-1 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-full'
                    style={{ height: '90%' }}
                  ></div>
                  <div
                    className='w-1 bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 rounded-full'
                    style={{ height: '70%' }}
                  ></div>
                </div>

                {/* Playlist Stats */}
                <div className='text-right'>
                  <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                    0
                  </div>
                  <div className='text-sm text-gray-500 dark:text-gray-400'>
                    Tracks
                  </div>
                </div>

                {/* Disabled Play Button */}
                <div className='flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-full shadow-lg cursor-not-allowed'>
                  <PlaySolidIcon className='w-4 h-4 text-gray-500 dark:text-gray-400' />
                  <span className='text-gray-500 dark:text-gray-400 text-sm font-semibold'>
                    PLAY ALL
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className='relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden'>
            <div className='flex h-80'>
              <div className='w-1/4 bg-gray-200 dark:bg-slate-700 flex items-center justify-center'>
                <PlaySolidIcon className='w-16 h-16 text-gray-400 dark:text-slate-500' />
              </div>
              <div className='w-3/4 relative overflow-hidden'>
                <div className='absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10'></div>
                <div className='relative flex flex-col justify-center items-center text-center h-full p-8'>
                  <div className='space-y-8'>
                    <h3 className='text-4xl font-black text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent'>
                      No Featured Tracks Yet
                    </h3>
                    <p className='text-xl text-gray-500 dark:text-gray-400 font-semibold'>
                      Check back later for featured music
                    </p>
                    <button className='px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-3xl font-black text-xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-110'>
                      Browse Music
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 py-16'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Featured Heading - Left Justified with Creative Right Side */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg'>
                  <PlaySolidIcon className='w-6 h-6 text-white' />
                </div>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  Featured Track
                </h1>
              </div>
              <p className='text-lg text-gray-600 dark:text-gray-400 ml-13'>
                Discover the latest trending music
              </p>
            </div>

            {/* Creative Right Side Element */}
            <div className='hidden lg:flex items-center gap-6'>
              {/* Music Visualizer - Static Design */}
              <div className='flex items-end gap-1 h-12'>
                <div
                  className='w-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-full'
                  style={{ height: '60%' }}
                ></div>
                <div
                  className='w-1 bg-gradient-to-t from-blue-400 to-blue-200 rounded-full'
                  style={{ height: '80%' }}
                ></div>
                <div
                  className='w-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-full'
                  style={{ height: '40%' }}
                ></div>
                <div
                  className='w-1 bg-gradient-to-t from-blue-400 to-blue-200 rounded-full'
                  style={{ height: '90%' }}
                ></div>
                <div
                  className='w-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-full'
                  style={{ height: '70%' }}
                ></div>
                <div
                  className='w-1 bg-gradient-to-t from-blue-400 to-blue-200 rounded-full'
                  style={{ height: '50%' }}
                ></div>
                <div
                  className='w-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-full'
                  style={{ height: '85%' }}
                ></div>
                <div
                  className='w-1 bg-gradient-to-t from-blue-400 to-blue-200 rounded-full'
                  style={{ height: '65%' }}
                ></div>
                <div
                  className='w-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-full'
                  style={{ height: '75%' }}
                ></div>
                <div
                  className='w-1 bg-gradient-to-t from-blue-400 to-blue-200 rounded-full'
                  style={{ height: '55%' }}
                ></div>
              </div>

              {/* Playlist Stats */}
              <div className='text-right'>
                <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {featuredTracks.length}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  Tracks
                </div>
              </div>

              {/* Play Button Indicator */}
              <div className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors duration-200 cursor-pointer'>
                <PlaySolidIcon className='w-4 h-4 text-white' />
                <span className='text-white text-sm font-semibold'>
                  PLAY ALL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Track Banner - Creative Design */}
        <div className='relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden'>
          {/* Background Pattern */}
          <div className='absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10'></div>
          <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/20 to-transparent dark:from-blue-900/20 rounded-full -translate-y-32 translate-x-32'></div>
          <div className='absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100/20 to-transparent dark:from-purple-900/20 rounded-full translate-y-24 -translate-x-24'></div>

          <div className='relative flex h-80'>
            {/* Track Artwork - Quarter Width */}
            <div className='w-1/4 relative group overflow-hidden rounded-2xl'>
              {currentTrack?.coverImageUrl ? (
                <img
                  src={currentTrack.coverImageUrl}
                  alt={currentTrack.title}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                />
              ) : (
                <div className='w-full h-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center'>
                  <PlaySolidIcon className='w-24 h-24 text-gray-400 dark:text-slate-400' />
                </div>
              )}
              {/* Featured Badge */}
              <div className='absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800'>
                <span className='text-white text-xl font-bold'>★</span>
              </div>
            </div>

            {/* Track Info and Controls - Right Side */}
            <div className='w-3/4 relative overflow-hidden'>
              {/* Background Pattern */}
              <div className='absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10'></div>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/20 to-transparent dark:from-blue-800/20 rounded-full -translate-y-16 translate-x-16'></div>
              <div className='absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/20 to-transparent dark:from-purple-800/20 rounded-full translate-y-12 -translate-x-12'></div>

              <div className='relative flex flex-col h-full p-8'>
                {/* Track Info Section */}
                <div className='flex-1 flex flex-col justify-center'>
                  {/* Track Title and Artist with Controls */}
                  <div className='mb-6 flex items-start gap-6'>
                    <div className='flex-1 min-w-0 max-w-2xl'>
                      <h2 className='text-5xl font-black text-gray-900 dark:text-white mb-2 overflow-hidden text-ellipsis whitespace-nowrap bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight'>
                        {currentTrack?.title || 'No Track Selected'}
                      </h2>
                      <p className='text-2xl text-gray-600 dark:text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap font-semibold'>
                        {currentTrack?.artist || 'Unknown Artist'}
                      </p>
                    </div>

                    {/* Controls on the Right */}
                    <div className='flex items-center gap-3 mt-2 flex-shrink-0'>
                      {/* Main Play Button */}
                      <button
                        onClick={() => {
                          if (currentTrack) {
                            handlePlay(currentTrack);
                          }
                        }}
                        disabled={!currentTrack}
                        className='group relative w-14 h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none'
                      >
                        <div className='absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300'></div>
                        {globalCurrentTrack?.id === currentTrack?.id &&
                        globalIsPlaying ? (
                          <PauseIcon className='w-7 h-7 relative z-10' />
                        ) : (
                          <PlaySolidIcon className='w-7 h-7 ml-0.5 relative z-10' />
                        )}
                      </button>

                      {/* Track Navigation */}
                      <div className='flex gap-1'>
                        <button
                          onClick={handlePrevious}
                          disabled={currentTrackIndex === 0}
                          className='group w-10 h-10 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg border border-gray-200 dark:border-slate-600 hover:scale-105'
                        >
                          <ChevronLeftIcon className='w-5 h-5 group-hover:scale-110 transition-transform duration-200' />
                        </button>

                        <button
                          onClick={handleNext}
                          disabled={
                            currentTrackIndex === featuredTracks.length - 1
                          }
                          className='group w-10 h-10 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg border border-gray-200 dark:border-slate-600 hover:scale-105'
                        >
                          <ChevronRightIcon className='w-5 h-5 group-hover:scale-110 transition-transform duration-200' />
                        </button>
                      </div>

                      {/* Three Dot Menu */}
                      <div className='relative'>
                        <button
                          onClick={() => setShowMenu(!showMenu)}
                          className='group w-10 h-10 bg-white/90 dark:bg-slate-800/90 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 dark:border-slate-600 hover:scale-105'
                        >
                          <EllipsisVerticalIcon className='w-5 h-5 group-hover:scale-110 transition-transform duration-200' />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                          <div className='absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 z-50'>
                            <div className='py-1'>
                              <button className='w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-3 transition-colors duration-200'>
                                <HeartIcon className='w-4 h-4' />
                                Like
                              </button>
                              <button className='w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-3 transition-colors duration-200'>
                                <PlusIcon className='w-4 h-4' />
                                Add to Playlist
                              </button>
                              <button className='w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-colors duration-200'>
                                <ShareIcon className='w-4 h-4' />
                                Share
                              </button>
                              <button className='w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors duration-200'>
                                <ArrowDownTrayIcon className='w-4 h-4' />
                                Download
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Track Stats Row */}
                  <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-6'>
                      <div className='text-center'>
                        <div className='text-3xl font-black text-blue-600 dark:text-blue-400 mb-1'>
                          {currentTrack?.playCount?.toLocaleString() || '0'}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider'>
                          PLAYS
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='text-3xl font-black text-gray-900 dark:text-white mb-1'>
                          {currentTrack?.duration
                            ? `${Math.floor(currentTrack.duration / 60)}:${currentTrack.duration % 60 < 10 ? '0' : ''}${currentTrack.duration % 60}`
                            : '0:00'}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider'>
                          DURATION
                        </div>
                      </div>
                      <div className='text-center'>
                        <div className='text-3xl font-black text-purple-600 dark:text-purple-400 mb-1'>
                          {currentTrackIndex >= 0 ? currentTrackIndex + 1 : 0}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider'>
                          TRACK
                        </div>
                      </div>
                    </div>

                    {/* Genre Badge */}
                    {currentTrack?.genre && (
                      <div className='px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-xl'>
                        <span className='text-sm font-black uppercase tracking-wider'>
                          {currentTrack.genre}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
