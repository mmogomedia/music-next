'use client';

import { useState, useEffect } from 'react';
import {
  PauseIcon,
  HeartIcon,
  MapPinIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid';
import { Track } from '@/types/track';
import { Playlist } from '@/types/playlist';

interface ProvincialPlaylistsProps {
  onTrackPlay?: (_track: Track) => void;
}

const SOUTH_AFRICAN_PROVINCES = [
  'Western Cape',
  'Eastern Cape',
  'Northern Cape',
  'Free State',
  'KwaZulu-Natal',
  'North West',
  'Gauteng',
  'Mpumalanga',
  'Limpopo',
];

export default function ProvincialPlaylists({
  onTrackPlay,
}: ProvincialPlaylistsProps) {
  const [provincialPlaylists, setProvincialPlaylists] = useState<Playlist[]>(
    []
  );
  const [selectedProvince, setSelectedProvince] =
    useState<string>('Western Cape');
  const [provincialTracks, setProvincialTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchProvincialPlaylists();
  }, []);

  useEffect(() => {
    if (provincialPlaylists.length > 0) {
      fetchProvincialTracks(selectedProvince);
    }
  }, [provincialPlaylists, selectedProvince]);

  const fetchProvincialPlaylists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/playlists/province');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProvincialPlaylists(data.playlists || []);
    } catch (error: any) {
      console.error('Error fetching provincial playlists:', error);
      setError(error.message || 'Failed to fetch provincial playlists');
    } finally {
      setLoading(false);
    }
  };

  const fetchProvincialTracks = async (province: string) => {
    try {
      const playlist = provincialPlaylists.find(p => p.name === province);
      if (playlist) {
        const response = await fetch(`/api/playlists/${playlist.id}/tracks`);
        if (response.ok) {
          const data = await response.json();
          // The API returns tracks directly in data.tracks, not nested in pt.track
          const tracks = data.tracks || [];
          setProvincialTracks(tracks.slice(0, 10)); // Limit to 10 tracks
        }
      }
    } catch (error) {
      console.error('Error fetching provincial tracks:', error);
    }
  };

  const handlePlay = (track: Track) => {
    setPlayingTrack(playingTrack === track.id ? null : track.id);
    onTrackPlay?.(track);
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setIsDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className='bg-gray-50 dark:bg-slate-900 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header Skeleton */}
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse'></div>
              <div className='h-6 bg-gray-200 dark:bg-slate-700 rounded w-48 animate-pulse'></div>
            </div>
            <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-64 ml-11 animate-pulse'></div>
          </div>

          {/* Tracks Skeleton */}
          <div className='space-y-4'>
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className='bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700 animate-pulse'
              >
                <div className='flex items-center gap-4'>
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

  if (error) {
    return (
      <div className='bg-gray-50 dark:bg-slate-900 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-red-400'>
          <p>Error: {error}</p>
          <button
            onClick={fetchProvincialPlaylists}
            className='mt-4 px-4 py-2 bg-blue-600 rounded-md text-white'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-50 dark:bg-slate-900 py-12'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header with Inline Dropdown */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <MapPinIcon className='w-5 h-5 text-white' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Provincial Playlists
              </h2>
            </div>

            {/* Province Selector */}
            <div className='relative'>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200'
              >
                <MapPinIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                <span className='text-lg font-semibold text-gray-900 dark:text-white'>
                  {selectedProvince}
                </span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isDropdownOpen && (
                <div className='absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden'>
                  {SOUTH_AFRICAN_PROVINCES.map(province => (
                    <button
                      key={province}
                      onClick={() => handleProvinceChange(province)}
                      className={`w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200 ${
                        selectedProvince === province
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <MapPinIcon className='w-4 h-4' />
                        <span className='font-medium'>{province}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className='text-sm text-gray-500 dark:text-gray-400 ml-11'>
            Discover music from different provinces across South Africa
          </p>
        </div>

        {/* Tracks List */}
        {provincialTracks.length === 0 ? (
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <MapPinIcon className='w-8 h-8 text-gray-400 dark:text-slate-500' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No Tracks Available
            </h3>
            <p className='text-gray-500 dark:text-gray-400'>
              No tracks found for {selectedProvince}
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {provincialTracks.map((track, index) => (
              <div
                key={track.id}
                className='group bg-white dark:bg-slate-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 border border-gray-100 dark:border-slate-700 hover:shadow-lg'
              >
                <div className='flex items-center gap-4'>
                  {/* Track Number */}
                  <div className='flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm'>
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
                  </div>

                  {/* Track Info */}
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                      {track.title}
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                      {track.artist}
                    </p>
                  </div>

                  {/* Genre */}
                  <div className='hidden sm:block flex-shrink-0'>
                    <span className='px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium'>
                      {track.genre}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className='flex-shrink-0 text-sm text-gray-500 dark:text-gray-400 font-medium'>
                    {Math.floor((track.duration || 0) / 60)}:
                    {(track.duration || 0) % 60 < 10 ? '0' : ''}
                    {(track.duration || 0) % 60}
                  </div>

                  {/* Play Count */}
                  <div className='hidden md:block flex-shrink-0 text-sm text-gray-500 dark:text-gray-400'>
                    {track.playCount.toLocaleString()} plays
                  </div>

                  {/* Action Buttons - Always Visible */}
                  <div className='flex items-center gap-2'>
                    <button className='w-8 h-8 bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg flex items-center justify-center transition-all duration-200'>
                      <HeartIcon className='w-4 h-4' />
                    </button>
                    <button className='w-8 h-8 bg-gray-100 dark:bg-slate-700 hover:bg-green-100 dark:hover:bg-green-900/20 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 rounded-lg flex items-center justify-center transition-all duration-200'>
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
                    </button>
                    <button
                      onClick={() => handlePlay(track)}
                      className='w-8 h-8 bg-gray-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg flex items-center justify-center transition-all duration-200'
                    >
                      {playingTrack === track.id ? (
                        <PauseIcon className='w-4 h-4' />
                      ) : (
                        <PlaySolidIcon className='w-4 h-4 ml-0.5' />
                      )}
                    </button>
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
