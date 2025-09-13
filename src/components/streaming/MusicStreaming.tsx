'use client';

import { useState, useEffect } from 'react';
import { HeartIcon, ShareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid';
import { Playlist, PlaylistType } from '@/types/playlist';
import { Track } from '@/types/track';

interface MusicStreamingProps {
  onTrackPlay?: (_track: Track) => void;
  onPlaylistClick?: (_playlist: Playlist) => void;
}

export default function MusicStreaming({
  onTrackPlay,
  onPlaylistClick: _onPlaylistClick,
}: MusicStreamingProps) {
  const [playlists, setPlaylists] = useState<{
    featured: Playlist | null;
    topTen: Playlist | null;
    provinces: Playlist[];
    genres: Playlist[];
  }>({
    featured: null,
    topTen: null,
    provinces: [],
    genres: [],
  });
  const [loading, setLoading] = useState(true);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchAllPlaylists();
  }, []);

  const fetchAllPlaylists = async () => {
    try {
      const [featuredRes, topTenRes, provincesRes, genresRes] =
        await Promise.all([
          fetch('/api/playlists/featured'),
          fetch('/api/playlists/top-ten'),
          fetch('/api/playlists/province'),
          fetch('/api/playlists/genre'),
        ]);

      const [featuredData, topTenData, provincesData, genresData] =
        await Promise.all([
          featuredRes.ok ? featuredRes.json() : { playlist: null },
          topTenRes.ok ? topTenRes.json() : { playlist: null },
          provincesRes.ok ? provincesRes.json() : { playlists: [] },
          genresRes.ok ? genresRes.json() : { playlists: [] },
        ]);

      setPlaylists({
        featured: featuredData.playlist,
        topTen: topTenData.playlist,
        provinces: provincesData.playlists || [],
        genres: genresData.playlists || [],
      });

      // Set featured playlist as active by default
      if (featuredData.playlist) {
        setActivePlaylist(featuredData.playlist);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: Track) => {
    setIsPlaying(!isPlaying);
    onTrackPlay?.(track);
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setActivePlaylist(playlist);
  };

  const getTypeIcon = (type: PlaylistType) => {
    switch (type) {
      case PlaylistType.FEATURED:
        return '🏆';
      case PlaylistType.TOP_TEN:
        return '📊';
      case PlaylistType.PROVINCE:
        return '🏙️';
      case PlaylistType.GENRE:
        return '🎵';
      default:
        return '🎵';
    }
  };

  const getTypeGradient = (type: PlaylistType) => {
    switch (type) {
      case PlaylistType.FEATURED:
        return 'from-purple-500 to-pink-500';
      case PlaylistType.TOP_TEN:
        return 'from-orange-500 to-red-500';
      case PlaylistType.PROVINCE:
        return 'from-green-500 to-teal-500';
      case PlaylistType.GENRE:
        return 'from-blue-500 to-indigo-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white text-lg'>Loading music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-900'>
      {/* Header */}
      <div className='bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-6'>
              <h1 className='text-2xl font-bold text-white font-["Poppins"]'>
                Flemoji Music
              </h1>
              <div className='hidden md:flex items-center gap-4'>
                <button className='text-slate-300 hover:text-white transition-colors duration-200'>
                  Browse
                </button>
                <button className='text-slate-300 hover:text-white transition-colors duration-200'>
                  Radio
                </button>
                <button className='text-slate-300 hover:text-white transition-colors duration-200'>
                  Library
                </button>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <button className='px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200'>
                Sign In
              </button>
              <button className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200'>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
          {/* Sidebar - Playlist Navigation */}
          <div className='lg:col-span-1'>
            <div className='bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 sticky top-24'>
              <h2 className='text-lg font-bold text-white mb-4 font-["Poppins"]'>
                Browse
              </h2>

              <div className='space-y-2'>
                {/* Featured Playlist */}
                {playlists.featured && (
                  <button
                    onClick={() => handlePlaylistSelect(playlists.featured!)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      activePlaylist?.id === playlists.featured?.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-700/30 hover:bg-slate-700/60 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-lg'>
                        {getTypeIcon(playlists.featured.type)}
                      </span>
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium truncate text-sm'>
                          {playlists.featured.name}
                        </div>
                        <div className='text-xs opacity-80'>
                          {playlists.featured.currentTracks} tracks
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Top Ten Playlist */}
                {playlists.topTen && (
                  <button
                    onClick={() => handlePlaylistSelect(playlists.topTen!)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      activePlaylist?.id === playlists.topTen?.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-700/30 hover:bg-slate-700/60 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-lg'>
                        {getTypeIcon(playlists.topTen.type)}
                      </span>
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium truncate text-sm'>
                          {playlists.topTen.name}
                        </div>
                        <div className='text-xs opacity-80'>
                          {playlists.topTen.currentTracks} tracks
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Province Playlists */}
                {playlists.provinces.length > 0 && (
                  <div className='mt-6'>
                    <h3 className='text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide'>
                      Provinces
                    </h3>
                    <div className='space-y-1'>
                      {playlists.provinces.map(playlist => (
                        <button
                          key={playlist.id}
                          onClick={() => handlePlaylistSelect(playlist)}
                          className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${
                            activePlaylist?.id === playlist.id
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-slate-700/30 hover:bg-slate-700/60 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className='flex items-center gap-2'>
                            <span className='text-sm'>
                              {getTypeIcon(playlist.type)}
                            </span>
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium truncate text-xs'>
                                {playlist.name}
                              </div>
                              <div className='text-xs opacity-80'>
                                {playlist.province}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Genre Playlists */}
                {playlists.genres.length > 0 && (
                  <div className='mt-6'>
                    <h3 className='text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wide'>
                      Genres
                    </h3>
                    <div className='space-y-1'>
                      {playlists.genres.slice(0, 4).map(playlist => (
                        <button
                          key={playlist.id}
                          onClick={() => handlePlaylistSelect(playlist)}
                          className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${
                            activePlaylist?.id === playlist.id
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-slate-700/30 hover:bg-slate-700/60 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className='flex items-center gap-2'>
                            <span className='text-sm'>
                              {getTypeIcon(playlist.type)}
                            </span>
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium truncate text-xs'>
                                {playlist.name}
                              </div>
                              <div className='text-xs opacity-80'>
                                {playlist.currentTracks} tracks
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Track Display (Center of Attention) */}
          <div className='lg:col-span-4'>
            {activePlaylist ? (
              <div className='space-y-6'>
                {/* Playlist Header */}
                <div
                  className={`bg-gradient-to-r ${getTypeGradient(activePlaylist.type)} rounded-2xl p-6`}
                >
                  <div className='flex items-center gap-4'>
                    <div className='w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center shadow-lg'>
                      {activePlaylist.coverImage ? (
                        <img
                          src={activePlaylist.coverImage}
                          alt={activePlaylist.name}
                          className='w-full h-full object-cover rounded-xl'
                        />
                      ) : (
                        <span className='text-3xl'>
                          {getTypeIcon(activePlaylist.type)}
                        </span>
                      )}
                    </div>
                    <div className='flex-1 text-white'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='px-2 py-1 bg-white/20 rounded-full text-xs font-medium'>
                          {activePlaylist.type.replace('_', ' ')}
                        </span>
                        {activePlaylist.province && (
                          <span className='px-2 py-1 bg-white/20 rounded-full text-xs font-medium'>
                            {activePlaylist.province}
                          </span>
                        )}
                      </div>
                      <h1 className='text-2xl font-bold mb-1 font-["Poppins"]'>
                        {activePlaylist.name}
                      </h1>
                      <p className='text-sm opacity-90 mb-2'>
                        {activePlaylist.description}
                      </p>
                      <div className='flex items-center gap-4 text-xs'>
                        <span>{activePlaylist.currentTracks} tracks</span>
                        <span>•</span>
                        <span>{activePlaylist.maxTracks} max</span>
                        <span>•</span>
                        <span>
                          {activePlaylist.submissionStatus === 'OPEN'
                            ? 'Open'
                            : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Track List - Modern Spotify-style */}
                {activePlaylist.tracks && activePlaylist.tracks.length > 0 ? (
                  <div className='bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden'>
                    {/* Track List Header */}
                    <div className='px-6 py-4 border-b border-slate-700/50'>
                      <div className='grid grid-cols-12 gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wide'>
                        <div className='col-span-1 text-center'>#</div>
                        <div className='col-span-5'>Title</div>
                        <div className='col-span-3'>Artist</div>
                        <div className='col-span-2'>Album</div>
                        <div className='col-span-1 text-right'>Duration</div>
                      </div>
                    </div>

                    {/* Track List */}
                    <div className='divide-y divide-slate-700/30'>
                      {activePlaylist.tracks.map((playlistTrack, index) => {
                        const track = playlistTrack.track;
                        if (!track) return null;

                        return (
                          <div
                            key={playlistTrack.id}
                            className='group px-6 py-3 hover:bg-slate-700/30 transition-colors duration-200 cursor-pointer'
                            onClick={() => handlePlay(track)}
                            role='button'
                            tabIndex={0}
                            onKeyDown={e =>
                              e.key === 'Enter' && handlePlay(track)
                            }
                            aria-label={`Play ${track.title} by ${track.artist}`}
                          >
                            <div className='grid grid-cols-12 gap-4 items-center'>
                              {/* Track Number */}
                              <div className='col-span-1 text-center text-slate-400 group-hover:text-white transition-colors'>
                                <span className='group-hover:hidden'>
                                  {index + 1}
                                </span>
                                <button className='hidden group-hover:block p-1'>
                                  <PlaySolidIcon className='w-4 h-4' />
                                </button>
                              </div>

                              {/* Track Info */}
                              <div className='col-span-5 flex items-center gap-3'>
                                <div className='w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0'>
                                  {track.coverImageUrl ? (
                                    <img
                                      src={track.coverImageUrl}
                                      alt={track.title}
                                      className='w-full h-full object-cover rounded-lg'
                                    />
                                  ) : (
                                    <PlaySolidIcon className='w-5 h-5 text-slate-400' />
                                  )}
                                </div>
                                <div className='min-w-0 flex-1'>
                                  <h3 className='font-medium text-white truncate group-hover:text-blue-400 transition-colors'>
                                    {track.title}
                                  </h3>
                                  <p className='text-sm text-slate-400 truncate'>
                                    {track.genre}
                                  </p>
                                </div>
                              </div>

                              {/* Artist */}
                              <div className='col-span-3 text-slate-300 text-sm truncate'>
                                {track.artist}
                              </div>

                              {/* Album */}
                              <div className='col-span-2 text-slate-400 text-sm truncate'>
                                {track.album || 'Single'}
                              </div>

                              {/* Duration */}
                              <div className='col-span-1 text-right text-slate-400 text-sm'>
                                {Math.floor((track.duration || 0) / 60)}:
                                {(track.duration || 0) % 60 < 10 ? '0' : ''}
                                {(track.duration || 0) % 60}
                              </div>
                            </div>

                            {/* Hover Actions */}
                            <div className='hidden group-hover:flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-700/30'>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  // Handle like
                                }}
                                className='p-1 text-slate-400 hover:text-white transition-colors duration-200'
                              >
                                <HeartIcon className='w-4 h-4' />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  // Handle add to playlist
                                }}
                                className='p-1 text-slate-400 hover:text-white transition-colors duration-200'
                              >
                                <PlusIcon className='w-4 h-4' />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  // Handle share
                                }}
                                className='p-1 text-slate-400 hover:text-white transition-colors duration-200'
                              >
                                <ShareIcon className='w-4 h-4' />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className='bg-slate-800/30 backdrop-blur-sm rounded-xl p-16 text-center border border-slate-700/50'>
                    <div className='w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6'>
                      <PlaySolidIcon className='w-10 h-10 text-slate-400' />
                    </div>
                    <h3 className='text-xl font-semibold text-white mb-2'>
                      No tracks yet
                    </h3>
                    <p className='text-slate-400 mb-6'>
                      This playlist doesn&apos;t have any tracks yet. Check back
                      later!
                    </p>
                    <button className='px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200'>
                      Submit Your Music
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className='bg-slate-800/30 backdrop-blur-sm rounded-xl p-16 text-center border border-slate-700/50'>
                <div className='w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <PlaySolidIcon className='w-10 h-10 text-slate-400' />
                </div>
                <h3 className='text-2xl font-bold text-white mb-4'>
                  Select a Playlist
                </h3>
                <p className='text-slate-400 mb-8'>
                  Choose a playlist from the sidebar to start streaming music
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
