'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PauseIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';
import { constructFileUrl } from '@/lib/url-utils';

interface HeroSectionProps {
  onTrackPlay?: (_track: Track) => void;
  onPlaylistClick?: (_playlist: Playlist) => void;
}

export default function HeroSection({
  onTrackPlay,
  onPlaylistClick,
}: HeroSectionProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex] = useState(0);

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

  const handlePlay = () => {
    if (tracks.length > 0) {
      setIsPlaying(!isPlaying);
      onTrackPlay?.(tracks[currentTrackIndex]);
    }
  };

  // Render static background immediately for faster FCP
  const staticBackground = (
    <div className='absolute inset-0'>
      <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20'></div>
      <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl'></div>
      <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl'></div>
    </div>
  );

  if (loading) {
    return (
      <div className='relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden'>
        {staticBackground}
        {/* Loading Content - Simplified for faster render */}
        <div className='relative z-10 flex items-center justify-center min-h-screen px-4'>
          <div className='text-center text-white'>
            <h1 className='text-4xl font-bold mb-4'>Welcome to Flemoji</h1>
            <p className='text-xl text-white/80'>
              Discover amazing music from South Africa
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className='relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center'>
        <div className='text-center text-white'>
          <div className='w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8'>
            <PlaySolidIcon className='w-16 h-16' />
          </div>
          <h1 className='text-4xl font-bold mb-4'>Welcome to Flemoji</h1>
          <p className='text-xl text-white/80'>
            Discover amazing music from South Africa
          </p>
        </div>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden'>
      {/* Animated Background */}
      <div className='absolute inset-0'>
        <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20'></div>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500'></div>
      </div>

      {/* Floating Music Notes Animation */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className='absolute text-white/20 text-4xl animate-float'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            ♪
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className='relative z-10 flex items-center min-h-screen px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left Side - Content */}
          <div className='text-white space-y-8'>
            {/* Badge */}
            <div className='inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20'>
              <span className='w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse'></span>
              <span className='text-sm font-medium'>Featured Playlist</span>
            </div>

            {/* Title */}
            <div>
              <h1 className='text-5xl lg:text-7xl font-bold mb-6 leading-tight font-poppins text-gradient-blue'>
                {playlist.name}
              </h1>
              <p className='text-xl lg:text-2xl text-white/80 leading-relaxed font-poppins'>
                {playlist.description}
              </p>
            </div>

            {/* Stats */}
            <div className='flex items-center space-x-8'>
              <div className='text-center'>
                <div className='text-2xl font-bold'>
                  {playlist.currentTracks}
                </div>
                <div className='text-sm text-white/60'>Tracks</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>{playlist.maxTracks}</div>
                <div className='text-sm text-white/60'>Max</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>
                  {playlist.maxSubmissionsPerArtist}
                </div>
                <div className='text-sm text-white/60'>Submissions</div>
              </div>
            </div>

            {/* Controls */}
            <div className='flex items-center space-x-4'>
              <button
                onClick={handlePlay}
                className='flex items-center justify-center w-16 h-16 bg-white text-slate-900 rounded-full hover:scale-105 transition-transform duration-200 shadow-2xl'
              >
                {isPlaying ? (
                  <PauseIcon className='w-8 h-8' />
                ) : (
                  <PlaySolidIcon className='w-8 h-8 ml-1' />
                )}
              </button>

              <button className='flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full hover:bg-white/20 transition-colors duration-200'>
                <HeartIcon className='w-6 h-6' />
              </button>

              <button className='flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full hover:bg-white/20 transition-colors duration-200'>
                <ShareIcon className='w-6 h-6' />
              </button>
            </div>

            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row gap-4'>
              <button
                onClick={() => onPlaylistClick?.(playlist)}
                className='px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl'
              >
                Explore Playlist
              </button>
              <button className='px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-semibold hover:bg-white/20 transition-colors duration-200'>
                Submit Your Music
              </button>
            </div>
          </div>

          {/* Right Side - Visual */}
          <div className='relative'>
            {/* Album Artwork */}
            <div className='relative w-full max-w-md mx-auto'>
              <div className='aspect-square bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl backdrop-blur-sm border border-white/20 p-8 shadow-2xl'>
                {playlist.coverImage ? (
                  <Image
                    src={constructFileUrl(playlist.coverImage)}
                    alt={playlist.name}
                    width={800}
                    height={800}
                    priority
                    className='w-full h-full object-cover rounded-2xl shadow-xl'
                    unoptimized
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <PlaySolidIcon className='w-32 h-32 text-white/40' />
                  </div>
                )}
              </div>

              {/* Floating Elements */}
              <div className='absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-pink-500/30 to-red-500/30 rounded-full blur-xl animate-pulse'></div>
              <div className='absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-xl animate-pulse delay-1000'></div>
            </div>

            {/* Current Track Info */}
            {currentTrack && (
              <div className='mt-8 text-center text-white'>
                <h3 className='text-xl font-semibold mb-2'>
                  {currentTrack.title}
                </h3>
                <p className='text-white/80'>{currentTrack.artist}</p>
                <div className='flex items-center justify-center space-x-2 mt-2 text-sm text-white/60'>
                  <span>{currentTrack.genre}</span>
                  <span>•</span>
                  <span>
                    {Math.floor((currentTrack.duration || 0) / 60)}:
                    {(currentTrack.duration || 0) % 60 < 10 ? '0' : ''}
                    {(currentTrack.duration || 0) % 60}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce'>
        <div className='w-6 h-10 border-2 border-white/30 rounded-full flex justify-center'>
          <div className='w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse'></div>
        </div>
      </div>
    </div>
  );
}
