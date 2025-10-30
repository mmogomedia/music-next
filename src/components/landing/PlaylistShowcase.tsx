'use client';

import { useState, useEffect } from 'react';
import { HeartIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';
import { constructFileUrl } from '@/lib/url-utils';
import { api } from '@/lib/api-client';

interface PlaylistShowcaseProps {
  onPlaylistClick?: (_playlist: Playlist) => void;
  onTrackPlay?: (_track: Track) => void;
}

export default function PlaylistShowcase({
  onPlaylistClick,
  onTrackPlay: _onTrackPlay,
}: PlaylistShowcaseProps) {
  const [playlists, setPlaylists] = useState<{
    topTen: Playlist | null;
    provinces: Playlist[];
    genres: Playlist[];
  }>({
    topTen: null,
    provinces: [],
    genres: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<
    'top-ten' | 'provinces' | 'genres'
  >('top-ten');

  useEffect(() => {
    fetchAllPlaylists();
  }, []);

  const fetchAllPlaylists = async () => {
    try {
      const [topTenRes, provincesRes, genresRes] = await Promise.all([
        api.playlists.getTopTen().catch(() => ({ data: { playlist: null } })),
        api.playlists.getProvince().catch(() => ({ data: { playlists: [] } })),
        api.playlists.getGenre().catch(() => ({ data: { playlists: [] } })),
      ]);

      setPlaylists({
        topTen: topTenRes.data.playlist,
        provinces: provincesRes.data.playlists || [],
        genres: genresRes.data.playlists || [],
      });
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (playlist: Playlist) => {
    const typeSlug = playlist.playlistType?.slug;
    switch (typeSlug) {
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

  const getTypeGradient = (playlist: Playlist) => {
    const typeSlug = playlist.playlistType?.slug;
    switch (typeSlug) {
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

  const categories = [
    {
      id: 'top-ten',
      name: 'Top 10',
      icon: '📊',
      count: playlists.topTen ? 1 : 0,
    },
    {
      id: 'provinces',
      name: 'Provinces',
      icon: '🏙️',
      count: playlists.provinces.length,
    },
    {
      id: 'genres',
      name: 'Genres',
      icon: '🎵',
      count: playlists.genres.length,
    },
  ];

  const getCurrentPlaylists = () => {
    switch (activeCategory) {
      case 'top-ten':
        return playlists.topTen ? [playlists.topTen] : [];
      case 'provinces':
        return playlists.provinces;
      case 'genres':
        return playlists.genres;
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className='py-20 bg-slate-900'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='animate-pulse'>
            <div className='h-12 bg-slate-700 rounded w-1/3 mx-auto mb-12'></div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='h-80 bg-slate-700 rounded-2xl'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='py-20 bg-slate-900'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-16'>
          <h2 className='text-4xl lg:text-5xl font-bold text-white mb-6 font-["Poppins"] text-gradient'>
            Discover Amazing Music
          </h2>
          <p className='text-xl text-slate-300 max-w-3xl mx-auto font-["Poppins"]'>
            Explore curated playlists featuring the best music from South Africa
            and beyond
          </p>
        </div>

        {/* Category Tabs */}
        <div className='flex justify-center mb-12'>
          <div className='bg-slate-800/50 backdrop-blur-sm rounded-2xl p-2 border border-slate-700'>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id as any)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeCategory === category.id
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span className='text-lg'>{category.icon}</span>
                {category.name}
                <span className='text-xs bg-slate-600 text-slate-200 px-2 py-1 rounded-full'>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Playlist Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
          {getCurrentPlaylists().map(playlist => (
            <div
              key={playlist.id}
              className='group bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl'
              onClick={() => onPlaylistClick?.(playlist)}
              role='button'
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onPlaylistClick?.(playlist)}
              aria-label={`View ${playlist.name} playlist`}
            >
              {/* Playlist Cover */}
              <div className='relative aspect-square bg-gradient-to-br from-slate-700 to-slate-800'>
                {playlist.coverImage ? (
                  <img
                    src={constructFileUrl(playlist.coverImage)}
                    alt={playlist.name}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <span className='text-6xl'>{getTypeIcon(playlist)}</span>
                  </div>
                )}

                {/* Overlay */}
                <div
                  className='absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                  role='button'
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation();
                    // Handle play all
                  }}
                  onKeyDown={e => e.key === 'Enter' && e.stopPropagation()}
                  aria-label='Play all tracks'
                >
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        // Handle play all
                      }}
                      className='w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-2xl'
                      aria-label='Play all tracks'
                    >
                      <PlaySolidIcon className='w-8 h-8 text-slate-900 ml-1' />
                    </button>
                  </div>
                </div>

                {/* Type Badge */}
                <div className='absolute top-4 left-4'>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getTypeGradient(playlist)} text-white shadow-lg`}
                  >
                    {playlist.playlistType?.name || 'Unknown'}
                  </span>
                </div>

                {/* Province Badge */}
                {playlist.province && (
                  <div className='absolute top-4 right-4'>
                    <span className='px-3 py-1 text-xs font-semibold rounded-full bg-slate-900/80 text-white backdrop-blur-sm'>
                      {playlist.province}
                    </span>
                  </div>
                )}
              </div>

              {/* Playlist Info */}
              <div className='p-6'>
                <h3 className='text-xl font-bold text-white mb-2 line-clamp-1'>
                  {playlist.name}
                </h3>
                <p className='text-slate-400 text-sm mb-4 line-clamp-2'>
                  {playlist.description}
                </p>

                {/* Stats */}
                <div className='flex items-center justify-between text-sm text-slate-500 mb-4'>
                  <span>{playlist.currentTracks} tracks</span>
                  <span>{playlist.maxTracks} max</span>
                </div>

                {/* Action Buttons */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <button className='p-2 text-slate-400 hover:text-white transition-colors duration-200'>
                      <HeartIcon className='w-5 h-5' />
                    </button>
                    <button className='p-2 text-slate-400 hover:text-white transition-colors duration-200'>
                      <ShareIcon className='w-5 h-5' />
                    </button>
                    <button className='p-2 text-slate-400 hover:text-white transition-colors duration-200'>
                      <EyeIcon className='w-5 h-5' />
                    </button>
                  </div>
                  <span className='text-xs text-slate-500'>
                    {playlist.submissionStatus === 'OPEN' ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {getCurrentPlaylists().length === 0 && (
          <div className='text-center py-16'>
            <div className='w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6'>
              <span className='text-4xl'>
                {categories.find(c => c.id === activeCategory)?.icon}
              </span>
            </div>
            <h3 className='text-2xl font-bold text-white mb-4'>
              No {categories.find(c => c.id === activeCategory)?.name} Available
            </h3>
            <p className='text-slate-400 max-w-md mx-auto'>
              Check back later for new curated playlists in this category
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className='mt-20 text-center'>
          <div className='bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-12 border border-slate-700'>
            <h3 className='text-3xl font-bold text-white mb-4'>
              Want to Submit Your Music?
            </h3>
            <p className='text-xl text-slate-300 mb-8 max-w-2xl mx-auto'>
              Join our community of artists and submit your tracks to be
              featured in our curated playlists
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <button className='px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl'>
                Sign Up as Artist
              </button>
              <button className='px-8 py-4 bg-slate-700/50 backdrop-blur-sm border border-slate-600 text-white rounded-full font-semibold hover:bg-slate-600/50 transition-colors duration-200'>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
