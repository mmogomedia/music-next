'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MusicalNoteIcon,
  PlayIcon,
  PauseIcon,
  HeartIcon,
  ChevronDownIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { Track } from '@/types/track';
import { SourceType } from '@/types/stats';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

interface GenrePlaylistsProps {
  onTrackPlay?: (_track: Track) => void;
}

export default function GenrePlaylists({ onTrackPlay }: GenrePlaylistsProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<
    string | undefined
  >();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const { currentTrack, isPlaying, playTrack } = useMusicPlayer();

  // Fetch available genres
  const fetchGenres = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const playlistsResponse = await fetch('/api/playlists/genre');
      if (!playlistsResponse.ok) {
        throw new Error('Failed to fetch genre playlists');
      }
      const playlistsData = await playlistsResponse.json();
      const genres = playlistsData.playlists?.map((p: any) => p.name) || [];
      setAvailableGenres(genres);

      // Set the first genre as selected if no genre is selected and genres exist
      if (!selectedGenre && genres.length > 0) {
        setSelectedGenre(genres[0]);
      }
    } catch (err) {
      console.error('Error fetching genres:', err);
      setError('Failed to load genres');
      setAvailableGenres([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGenre]);

  // Fetch tracks for selected genre
  const fetchTracks = useCallback(async () => {
    if (!selectedGenre) {
      setTracks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get all genre playlists to find the selected one
      const playlistsResponse = await fetch('/api/playlists/genre');
      if (!playlistsResponse.ok) {
        throw new Error('Failed to fetch genre playlists');
      }
      const playlistsData = await playlistsResponse.json();

      // Find the playlist for the selected genre
      const playlist = playlistsData.playlists?.find(
        (p: any) => p.name === selectedGenre
      );

      if (!playlist) {
        setTracks([]);
        setSelectedPlaylistId(undefined);
        return;
      }

      setSelectedPlaylistId(playlist.id);

      // Get tracks for this playlist
      const tracksResponse = await fetch(
        `/api/playlists/${playlist.id}/tracks`
      );
      if (!tracksResponse.ok) {
        throw new Error('Failed to fetch genre tracks');
      }
      const tracksData = await tracksResponse.json();

      setTracks(tracksData.tracks || []);
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError('Failed to load tracks');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGenre]);

  // Handle genre change
  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setIsDropdownOpen(false);
  };

  // Handle track play
  const handlePlay = (track: Track) => {
    playTrack(track, 'playlist' as SourceType, selectedPlaylistId);
    onTrackPlay?.(track);
  };

  // Load genres when component mounts
  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  // Load tracks when genre changes
  useEffect(() => {
    if (selectedGenre && availableGenres.length > 0) {
      fetchTracks();
    }
  }, [selectedGenre, fetchTracks, availableGenres.length]);

  if (loading) {
    return (
      <div className='bg-white dark:bg-slate-800 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
              {selectedGenre
                ? `Loading ${selectedGenre} Tracks...`
                : 'Loading Genre Playlists...'}
            </h2>
            <p className='text-gray-500 dark:text-gray-400'>
              Please wait while we load the content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || availableGenres.length === 0) {
    return (
      <div className='bg-white dark:bg-slate-800 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <MusicalNoteIcon className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Genre Playlists
              </h2>
            </div>
            <p className='text-sm text-gray-500 dark:text-gray-400 ml-11'>
              Explore music by genre and discover your next favorite track
            </p>
          </div>

          {/* Placeholder */}
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <MusicalNoteIcon className='w-8 h-8 text-gray-400 dark:text-slate-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No Genre Playlists Available
            </h3>
            <p className='text-gray-500 dark:text-gray-400 mb-4'>
              Genre playlists will appear here once they are created. Check back
              later!
            </p>
            <button
              onClick={fetchGenres}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-slate-800 py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header with Genre Filter */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <MusicalNoteIcon className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Genre Playlists
              </h2>
            </div>

            {/* Genre Filter Dropdown */}
            <div className='relative'>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={availableGenres.length === 0}
                className='flex items-center gap-3 px-6 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <MusicalNoteIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                  {selectedGenre || 'Select Genre'}
                </span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isDropdownOpen && availableGenres.length > 0 && (
                <div className='absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden'>
                  {availableGenres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => handleGenreChange(genre)}
                      className={`w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200 ${
                        selectedGenre === genre
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <MusicalNoteIcon className='w-4 h-4' />
                        <span className='font-medium'>{genre}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className='text-sm text-gray-500 dark:text-gray-400 ml-11'>
            Explore music by genre and discover your next favorite track
          </p>
        </div>

        {/* Editor's Choice Track - More Compact */}
        {tracks.length > 0 && (
          <div className='mb-6'>
            <div className='bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800'>
              <div className='flex items-center gap-2 mb-4'>
                <StarIcon className='w-5 h-5 text-yellow-500' />
                <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
                  Editor&apos;s Choice
                </h3>
              </div>

              <div className='flex items-center gap-4'>
                {/* Track Artwork - Smaller */}
                <div className='w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0'>
                  {tracks[0].coverImageUrl ? (
                    <img
                      src={tracks[0].coverImageUrl}
                      alt={tracks[0].title}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <PlayIcon className='w-6 h-6 text-gray-400 dark:text-slate-400' />
                    </div>
                  )}
                </div>

                {/* Track Info - More Compact */}
                <div className='flex-1 min-w-0'>
                  <h4 className='font-bold text-gray-900 dark:text-white text-lg mb-1 truncate'>
                    {tracks[0]?.title || 'Unknown Title'}
                  </h4>
                  <p className='text-gray-600 dark:text-gray-300 text-sm mb-2 truncate'>
                    {tracks[0]?.artist || 'Unknown Artist'}
                  </p>
                  <div className='flex items-center gap-3'>
                    <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full'>
                      {tracks[0]?.genre || 'Unknown Genre'}
                    </span>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      {tracks[0]?.duration
                        ? `${Math.floor(tracks[0].duration / 60)}:${(tracks[0].duration % 60).toString().padStart(2, '0')}`
                        : '0:00'}
                    </span>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      {tracks[0]?.playCount?.toLocaleString() || '0'} plays
                    </span>
                  </div>
                </div>

                {/* Play Button - Smaller */}
                <button
                  onClick={() => handlePlay(tracks[0])}
                  className='w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 flex-shrink-0'
                >
                  {currentTrack?.id === tracks[0].id && isPlaying ? (
                    <PauseIcon className='w-6 h-6' />
                  ) : (
                    <PlayIcon className='w-6 h-6 ml-0.5' />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tracks Grid - 3 per row, compact */}
        {tracks.length === 0 ? (
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <MusicalNoteIcon className='w-8 h-8 text-gray-400 dark:text-slate-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No Tracks Available
            </h3>
            <p className='text-gray-500 dark:text-gray-400'>
              No tracks found for {selectedGenre} genre yet.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
            {tracks.slice(1).map(track => (
              <div
                key={track.id}
                className='group flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 border border-gray-200 dark:border-slate-600'
              >
                {/* Track Artwork - Small */}
                <div className='w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0'>
                  {track.coverImageUrl ? (
                    <img
                      src={track.coverImageUrl}
                      alt={track.title}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <MusicalNoteIcon className='w-4 h-4 text-gray-400 dark:text-slate-400' />
                    </div>
                  )}
                </div>

                {/* Track Details */}
                <div className='flex-1 min-w-0'>
                  <h4 className='font-medium text-gray-900 dark:text-white text-sm truncate'>
                    {track.title}
                  </h4>
                  <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                    {track.artist}
                  </p>
                </div>

                {/* Genre Badge - Hidden on small screens */}
                <div className='hidden sm:block flex-shrink-0'>
                  <span className='text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full'>
                    {track.genre}
                  </span>
                </div>

                {/* Duration */}
                <div className='text-xs text-gray-500 dark:text-gray-400 flex-shrink-0'>
                  {track.duration
                    ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`
                    : '0:00'}
                </div>

                {/* Action Buttons */}
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <button
                    onClick={() => handlePlay(track)}
                    className='w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center transition-all duration-200 hover:scale-105'
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <PauseIcon className='w-3 h-3' />
                    ) : (
                      <PlayIcon className='w-3 h-3 ml-0.5' />
                    )}
                  </button>

                  {/* 3-dot menu */}
                  <div className='relative group'>
                    <button className='w-6 h-6 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 rounded flex items-center justify-center transition-all duration-200'>
                      <svg
                        className='w-3 h-3'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                      </svg>
                    </button>

                    {/* Dropdown menu */}
                    <div className='absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10'>
                      <div className='py-1'>
                        <button className='w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2'>
                          <HeartIcon className='w-4 h-4' />
                          Like
                        </button>
                        <button className='w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2'>
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
