'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PauseIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';
import { constructFileUrl } from '@/lib/url-utils';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from '@heroui/react';

interface HeroSectionProps {
  onTrackPlay?: (_track: Track) => void;
  onPlaylistClick?: (_playlist: Playlist) => void;
}

export default function HeroSection({
  onTrackPlay,
  onPlaylistClick,
}: HeroSectionProps) {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex] = useState(0);
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);

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

  if (loading) {
    return (
      <div className='relative min-h-screen bg-white overflow-hidden'>
        {/* Loading Content - Simplified for faster render */}
        <div className='relative z-10 flex items-center justify-center min-h-screen px-4'>
          <div className='text-center text-gray-900'>
            <h1 className='text-4xl font-bold mb-4'>Welcome to Flemoji</h1>
            <p className='text-xl text-gray-600'>
              Discover amazing music from South Africa
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className='relative min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center text-gray-900'>
          <div className='w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8'>
            <PlaySolidIcon className='w-16 h-16 text-gray-400' />
          </div>
          <h1 className='text-4xl font-bold mb-4'>Welcome to Flemoji</h1>
          <p className='text-xl text-gray-600'>
            Discover amazing music from South Africa
          </p>
        </div>
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className='relative min-h-screen bg-white overflow-hidden'>
      {/* Main Content */}
      <div className='relative z-10 flex items-center min-h-screen px-4 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left Side - Content */}
          <div className='text-gray-900 space-y-8'>
            {/* Badge */}
            <div className='inline-flex items-center px-4 py-2 bg-gray-100 rounded-full border border-gray-200'>
              <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
              <span className='text-sm font-medium text-gray-700'>
                Featured Playlist
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className='text-5xl lg:text-7xl font-bold mb-6 leading-tight font-poppins text-gray-900'>
                {playlist.name}
              </h1>
              <p className='text-xl lg:text-2xl text-gray-600 leading-relaxed font-poppins'>
                {playlist.description}
              </p>
            </div>

            {/* Stats */}
            <div className='flex items-center space-x-8'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-900'>
                  {playlist.currentTracks}
                </div>
                <div className='text-sm text-gray-500'>Tracks</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-900'>
                  {playlist.maxTracks}
                </div>
                <div className='text-sm text-gray-500'>Max</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-900'>
                  {playlist.maxSubmissionsPerArtist}
                </div>
                <div className='text-sm text-gray-500'>Submissions</div>
              </div>
            </div>

            {/* Controls */}
            <div className='flex items-center space-x-4'>
              <button
                onClick={handlePlay}
                className='flex items-center justify-center w-16 h-16 bg-gray-900 text-white rounded-full hover:scale-105 transition-transform duration-200 shadow-2xl'
              >
                {isPlaying ? (
                  <PauseIcon className='w-8 h-8' />
                ) : (
                  <PlaySolidIcon className='w-8 h-8 ml-1' />
                )}
              </button>

              <button className='flex items-center justify-center w-12 h-12 bg-gray-100 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200'>
                <HeartIcon className='w-6 h-6' />
              </button>

              <button className='flex items-center justify-center w-12 h-12 bg-gray-100 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200'>
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
              <button
                onClick={() => setIsAdvertiseModalOpen(true)}
                className='px-8 py-4 bg-gray-100 border border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors duration-200'
              >
                Advertise
              </button>
            </div>

            {/* Social Media Links */}
            <div className='flex items-center gap-4 mt-4'>
              <a
                href='https://www.tiktok.com/@flemoji.music'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors duration-200'
                aria-label='TikTok'
              >
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z' />
                </svg>
              </a>
              <a
                href='https://www.instagram.com/flemoji'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors duration-200'
                aria-label='Instagram'
              >
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                </svg>
              </a>
              <a
                href='https://www.facebook.com/flemoji'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors duration-200'
                aria-label='Facebook'
              >
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                </svg>
              </a>
              <a
                href='https://whatsapp.com/channel/0029Va6stUT7tkjCK9vVOc1A'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors duration-200'
                aria-label='WhatsApp Channel'
              >
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' />
                </svg>
              </a>
              <a
                href='https://wa.me/27683613961'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors duration-200'
                aria-label='Phone Number'
              >
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' />
                </svg>
              </a>
              <a
                href='https://www.youtube.com/@flemoji'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors duration-200'
                aria-label='YouTube'
              >
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
                </svg>
              </a>
              <a
                href='https://open.spotify.com/playlist/2gB0XRMTeNlW55q3k0MZnf?si=ddb8b4fe96e84b80'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors duration-200'
                aria-label='Spotify'
              >
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.359.24-.66.54-.779 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z' />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Side - Visual */}
          <div className='relative'>
            {/* Album Artwork */}
            <div className='relative w-full max-w-md mx-auto'>
              <div className='aspect-square bg-gray-100 rounded-3xl border border-gray-200 p-8 shadow-2xl'>
                {playlist.coverImage ? (
                  <Image
                    src={constructFileUrl(playlist.coverImage)}
                    alt={playlist.name}
                    width={800}
                    height={800}
                    priority
                    className='w-full h-full object-cover rounded-2xl shadow-xl'
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px'
                    quality={85}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <PlaySolidIcon className='w-32 h-32 text-white/40' />
                  </div>
                )}
              </div>
            </div>

            {/* Current Track Info */}
            {currentTrack && (
              <div className='mt-8 text-center text-gray-900'>
                <h3 className='text-xl font-semibold mb-2'>
                  {currentTrack.title}
                </h3>
                <p className='text-gray-600'>{currentTrack.artist}</p>
                <div className='flex items-center justify-center space-x-2 mt-2 text-sm text-gray-500'>
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

      {/* Advertise Modal */}
      <Modal
        isOpen={isAdvertiseModalOpen}
        onClose={() => setIsAdvertiseModalOpen(false)}
        size='2xl'
        scrollBehavior='inside'
        classNames={{
          base: 'bg-white dark:bg-slate-900',
          header: 'border-b border-gray-200 dark:border-slate-800',
          body: 'py-6',
        }}
      >
        <ModalContent>
          <ModalHeader className='flex flex-col gap-1'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Advertise Your Music
            </h2>
            <p className='text-sm font-normal text-gray-600 dark:text-gray-400'>
              Get your tracks featured in our Featured Playlist
            </p>
          </ModalHeader>
          <ModalBody>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  How It Works
                </h3>
                <p className='text-gray-700 dark:text-gray-300 leading-relaxed mb-4'>
                  Artists can submit their tracks to the Featured Playlist for
                  consideration. Our featured section showcases the best music
                  from South African artists.
                </p>
              </div>

              <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                <h4 className='font-semibold text-blue-900 dark:text-blue-300 mb-2'>
                  Featured Playlist Structure
                </h4>
                <ul className='space-y-2 text-sm text-blue-800 dark:text-blue-200'>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>4 tracks</strong> are promoted (paid placements)
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>6 tracks</strong> are curated (editorially
                      selected)
                    </span>
                  </li>
                </ul>
              </div>

              <div className='bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white'>
                <h4 className='font-bold text-lg mb-2'>Pricing</h4>
                <p className='text-white/90 mb-1'>
                  <span className='text-2xl font-bold'>R300</span> per week
                </p>
                <p className='text-sm text-white/80'>
                  Your track will be featured in the promoted section for one
                  week
                </p>
              </div>

              <div className='flex flex-col sm:flex-row gap-3 pt-4'>
                <Button
                  className='bg-blue-600 text-white hover:bg-blue-700'
                  onPress={() => {
                    setIsAdvertiseModalOpen(false);
                    router.push('/dashboard?tab=library');
                  }}
                >
                  Submit Your Track
                </Button>
                <Button
                  variant='light'
                  onPress={() => setIsAdvertiseModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
