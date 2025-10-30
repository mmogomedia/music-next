'use client';

import { useState, useEffect } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid';
import { Playlist } from '@/types/playlist';
import { constructFileUrl } from '@/lib/url-utils';

interface PlaylistGridProps {
  type: 'top-ten' | 'province' | 'genre';
  title: string;
  description?: string;
  onPlaylistClick?: (_playlist: Playlist) => void;
  onTrackPlay?: (_track: any) => void;
}

export default function PlaylistGrid({
  type,
  title,
  description,
  onPlaylistClick,
  onTrackPlay: _onTrackPlay,
}: PlaylistGridProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, [type]);

  const fetchPlaylists = async () => {
    try {
      const endpoint =
        type === 'top-ten'
          ? '/api/playlists/top-ten'
          : type === 'province'
            ? '/api/playlists/province'
            : '/api/playlists/genre';

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (type === 'top-ten') {
          setPlaylists(data.playlist ? [data.playlist] : []);
        } else {
          setPlaylists(data.playlists || []);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type} playlists:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (playlist: Playlist) => {
    const typeSlug = playlist.playlistType?.slug;
    switch (typeSlug) {
      case 'featured':
        return '🏆';
      case 'top-ten':
        return '📊';
      case 'province':
        return '🏙️';
      case 'genre':
        return '🎵';
      default:
        return '🎵';
    }
  };

  const getTypeColor = (playlist: Playlist) => {
    const typeSlug = playlist.playlistType?.slug;
    switch (typeSlug) {
      case 'featured':
        return 'from-purple-500 to-blue-500';
      case 'top-ten':
        return 'from-orange-500 to-red-500';
      case 'province':
        return 'from-green-500 to-teal-500';
      case 'genre':
        return 'from-blue-500 to-indigo-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-2'></div>
          <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2'></div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className='h-48 bg-gray-200 dark:bg-slate-700 rounded-xl'
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className='space-y-6'>
        <div>
          <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
            {title}
          </h3>
          {description && (
            <p className='text-gray-600 dark:text-gray-400 mt-1'>
              {description}
            </p>
          )}
        </div>
        <div className='text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-xl'>
          <div className='w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4'>
            <MusicalNoteIcon className='w-8 h-8 text-gray-400' />
          </div>
          <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            No {title} Available
          </h4>
          <p className='text-gray-500 dark:text-gray-400'>
            Check back later for new content
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
          {title}
        </h3>
        {description && (
          <p className='text-gray-600 dark:text-gray-400 mt-1'>{description}</p>
        )}
      </div>

      {/* Playlist Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {playlists.map(playlist => (
          <div
            key={playlist.id}
            className='group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer'
            onClick={() => onPlaylistClick?.(playlist)}
            role='button'
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onPlaylistClick?.(playlist)}
            aria-label={`View ${playlist.name} playlist`}
          >
            {/* Playlist Cover */}
            <div className='relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600'>
              {playlist.coverImage ? (
                <img
                  src={constructFileUrl(playlist.coverImage)}
                  alt={playlist.name}
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center'>
                  <span className='text-4xl'>{getTypeIcon(playlist)}</span>
                </div>
              )}

              {/* Play Button Overlay */}
              <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center'>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    // Handle play all tracks
                  }}
                  className='w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200'
                >
                  <PlaySolidIcon className='w-6 h-6 text-gray-900 ml-1' />
                </button>
              </div>

              {/* Type Badge */}
              <div className='absolute top-3 left-3'>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${getTypeColor(playlist)} text-white`}
                >
                  {playlist.playlistType?.name || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Playlist Info */}
            <div className='p-4'>
              <h4 className='font-semibold text-gray-900 dark:text-white truncate mb-1'>
                {playlist.name}
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3'>
                {playlist.description}
              </p>

              <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400'>
                <span>{playlist.currentTracks} tracks</span>
                {playlist.province && (
                  <span className='px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-xs'>
                    {playlist.province}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View More Button */}
      {playlists.length >= 4 && (
        <div className='text-center'>
          <button className='px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200'>
            View All {title}
          </button>
        </div>
      )}
    </div>
  );
}
