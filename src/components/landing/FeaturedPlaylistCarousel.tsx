'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';

interface FeaturedPlaylistCarouselProps {
  onTrackPlay?: (_track: Track) => void;
  onPlaylistClick?: (_playlist: Playlist) => void;
}

export default function FeaturedPlaylistCarousel({
  onTrackPlay,
  onPlaylistClick,
}: FeaturedPlaylistCarouselProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchFeaturedPlaylist();
  }, []);

  const fetchFeaturedPlaylist = async () => {
    try {
      const response = await fetch('/api/playlists/featured');
      if (response.ok) {
        const data = await response.json();
        setPlaylist(data.playlist);
        setTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Error fetching featured playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleTrackPlay = (track: Track) => {
    setIsPlaying(!isPlaying);
    onTrackPlay?.(track);
  };

  const handlePlaylistClick = () => {
    if (playlist) {
      onPlaylistClick?.(playlist);
    }
  };

  if (loading) {
    return (
      <div className='bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white'>
        <div className='animate-pulse'>
          <div className='h-8 bg-white/20 rounded w-1/3 mb-4'></div>
          <div className='h-4 bg-white/20 rounded w-1/2 mb-6'></div>
          <div className='h-32 bg-white/20 rounded'></div>
        </div>
      </div>
    );
  }

  if (!playlist || tracks.length === 0) {
    return (
      <div className='bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center'>
        <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4'>
          <PlaySolidIcon className='w-8 h-8' />
        </div>
        <h3 className='text-xl font-semibold mb-2'>No Featured Playlist</h3>
        <p className='text-white/80'>Check back later for curated content</p>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className='bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-10'>
        <div className='absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32'></div>
        <div className='absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24'></div>
      </div>

      <div className='relative z-10'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <span className='px-3 py-1 bg-white/20 rounded-full text-sm font-medium'>
                Featured
              </span>
              <span className='text-white/80 text-sm'>
                {tracks.length} tracks
              </span>
            </div>
            <h2 className='text-3xl font-bold mb-2'>{playlist.name}</h2>
            <p className='text-white/80 text-lg'>{playlist.description}</p>
          </div>
          <button
            onClick={handlePlaylistClick}
            className='px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors duration-200 backdrop-blur-sm'
          >
            View All
          </button>
        </div>

        {/* Track Carousel */}
        {currentTrack && (
          <div className='bg-white/10 backdrop-blur-sm rounded-xl p-6'>
            <div className='flex items-center gap-6'>
              {/* Track Image */}
              <div className='w-20 h-20 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0'>
                {currentTrack.coverImageUrl ? (
                  <img
                    src={currentTrack.coverImageUrl}
                    alt={currentTrack.title}
                    className='w-full h-full object-cover rounded-lg'
                  />
                ) : (
                  <PlaySolidIcon className='w-8 h-8' />
                )}
              </div>

              {/* Track Info */}
              <div className='flex-1 min-w-0'>
                <h3 className='text-xl font-semibold truncate'>
                  {currentTrack.title}
                </h3>
                <p className='text-white/80 truncate'>{currentTrack.artist}</p>
                <div className='flex items-center gap-4 mt-2 text-sm text-white/70'>
                  <span>{currentTrack.genre}</span>
                  <span>•</span>
                  <span>
                    {Math.floor((currentTrack.duration || 0) / 60)}:
                    {(currentTrack.duration || 0) % 60 < 10 ? '0' : ''}
                    {(currentTrack.duration || 0) % 60}
                  </span>
                  <span>•</span>
                  <span>{currentTrack.playCount || 0} plays</span>
                </div>
              </div>

              {/* Controls */}
              <div className='flex items-center gap-3'>
                <button
                  onClick={prevTrack}
                  className='p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200'
                >
                  <ChevronLeftIcon className='w-5 h-5' />
                </button>
                <button
                  onClick={() => handleTrackPlay(currentTrack)}
                  className='p-3 bg-white hover:bg-white/90 text-purple-600 rounded-full transition-colors duration-200'
                >
                  {isPlaying ? (
                    <PauseIcon className='w-6 h-6' />
                  ) : (
                    <PlayIcon className='w-6 h-6' />
                  )}
                </button>
                <button
                  onClick={nextTrack}
                  className='p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200'
                >
                  <ChevronRightIcon className='w-5 h-5' />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Track Indicators */}
        {tracks.length > 1 && (
          <div className='flex items-center justify-center gap-2 mt-6'>
            {tracks.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTrackIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === currentTrackIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
