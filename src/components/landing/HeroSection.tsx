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
