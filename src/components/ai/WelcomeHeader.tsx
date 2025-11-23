'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@heroui/react';

interface WelcomeHeaderProps {
  onGetStarted?: () => void;
}

export default function WelcomeHeader({ onGetStarted }: WelcomeHeaderProps) {
  const router = useRouter();
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [isLearnMoreModalOpen, setIsLearnMoreModalOpen] = useState(false);
  return (
    <div className='w-full bg-gradient-to-r from-blue-50/60 via-purple-50/30 to-green-50/60 dark:from-blue-950/40 dark:via-purple-950/20 dark:to-green-950/40 border-b border-gray-200/50 dark:border-slate-700/50'>
      <div className='w-full px-6 py-4 md:py-5'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          {/* Left side - Branding */}
          <div className='flex-1 text-left'>
            <div className='inline-flex items-center gap-2 mb-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-300/30 dark:border-blue-700/30'>
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-60'></span>
                <span className='relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400'></span>
              </span>
              <span className='text-[10px] font-bold tracking-wider text-blue-700 dark:text-blue-300 uppercase'>
                AI Streaming
              </span>
            </div>
            <h1 className='text-2xl md:text-3xl font-black mb-1.5 leading-tight'>
              <span className='bg-gradient-to-r from-blue-600 via-purple-500 to-green-600 dark:from-blue-400 dark:via-purple-400 dark:to-green-400 bg-clip-text text-transparent'>
                Flemoji AI Chat Streaming
              </span>
            </h1>
            <p className='text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-2xl'>
              Discover South African music through{' '}
              <span className='font-semibold text-gray-900 dark:text-white'>
                AI-powered conversation
              </span>
              . Ask for any song, artist, mood or playlist.
            </p>
          </div>

          {/* Right side - Actions and Features */}
          <div className='flex flex-col items-start md:items-end gap-3'>
            <div className='flex items-center gap-2'>
              <Button
                color='primary'
                radius='sm'
                size='sm'
                className='px-5 py-2 text-xs font-semibold bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400'
                onPress={() => setIsAdvertiseModalOpen(true)}
              >
                Advertise
              </Button>
              <Button
                variant='bordered'
                radius='sm'
                size='sm'
                onPress={() => setIsLearnMoreModalOpen(true)}
                className='px-4 py-2 text-xs font-medium border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              >
                Learn More
              </Button>
            </div>

            {/* Flat feature badges */}
            <div className='flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400'>
              <div className='flex items-center gap-1.5'>
                <svg
                  className='w-3.5 h-3.5 text-blue-500'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
                </svg>
                <span>Powered by AI</span>
              </div>
              <div className='w-1 h-1 rounded-full bg-gray-400'></div>
              <div className='flex items-center gap-1.5'>
                <svg
                  className='w-3.5 h-3.5 text-green-500'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
                </svg>
                <span>Live Streaming</span>
              </div>
              <div className='w-1 h-1 rounded-full bg-gray-400'></div>
              <span>South African Music</span>
            </div>
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

      {/* Learn More Modal */}
      <Modal
        isOpen={isLearnMoreModalOpen}
        onClose={() => setIsLearnMoreModalOpen(false)}
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
              About Flemoji
            </h2>
            <p className='text-sm font-normal text-gray-600 dark:text-gray-400'>
              Discover South African music through AI-powered streaming
            </p>
          </ModalHeader>
          <ModalBody>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  What is Flemoji?
                </h3>
                <p className='text-gray-700 dark:text-gray-300 leading-relaxed mb-4'>
                  Flemoji is a cutting-edge music streaming platform designed to
                  showcase and celebrate South African music. We combine the
                  power of artificial intelligence with a curated music
                  experience to help you discover amazing tracks from talented
                  artists across South Africa.
                </p>
              </div>

              <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                <h4 className='font-semibold text-blue-900 dark:text-blue-300 mb-3'>
                  Key Features
                </h4>
                <ul className='space-y-2 text-sm text-blue-800 dark:text-blue-200'>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>AI-Powered Chat Streaming:</strong> Discover music
                      through natural conversation. Ask for songs by mood,
                      genre, artist, or any description.
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>Curated Playlists:</strong> Explore handpicked
                      collections featuring the best South African music across
                      genres, provinces, and themes.
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>Artist Support:</strong> A platform built for
                      artists to upload, manage, and promote their music while
                      building their fanbase.
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>Featured Playlist:</strong> Get your music
                      featured in our prominent playlist with both curated and
                      promotional opportunities.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                  For Music Lovers
                </h4>
                <p className='text-gray-700 dark:text-gray-300 leading-relaxed text-sm'>
                  Whether you&apos;re looking for the latest Amapiano hits,
                  classic South African jazz, or discovering new independent
                  artists, Flemoji makes it easy to find exactly what you want
                  to hear. Our AI chat interface understands natural language,
                  so you can simply describe what you&apos;re in the mood for
                  and let us curate the perfect listening experience.
                </p>
              </div>

              <div>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                  For Artists
                </h4>
                <p className='text-gray-700 dark:text-gray-300 leading-relaxed text-sm'>
                  Flemoji provides artists with powerful tools to manage their
                  music library, track performance analytics, submit tracks to
                  playlists, and grow their audience. Upload your tracks, create
                  smart links, and connect with fans across South Africa and
                  beyond.
                </p>
              </div>

              <div className='flex flex-col sm:flex-row gap-3 pt-4'>
                <Button
                  className='bg-blue-600 text-white hover:bg-blue-700'
                  onPress={() => {
                    setIsLearnMoreModalOpen(false);
                    onGetStarted?.();
                  }}
                >
                  Start Exploring
                </Button>
                <Button
                  variant='light'
                  onPress={() => setIsLearnMoreModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Learn More Modal */}
      <Modal
        isOpen={isLearnMoreModalOpen}
        onClose={() => setIsLearnMoreModalOpen(false)}
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
              About Flemoji
            </h2>
            <p className='text-sm font-normal text-gray-600 dark:text-gray-400'>
              Discover South African music through AI-powered streaming
            </p>
          </ModalHeader>
          <ModalBody>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  What is Flemoji?
                </h3>
                <p className='text-gray-700 dark:text-gray-300 leading-relaxed mb-4'>
                  Flemoji is a cutting-edge music streaming platform designed to
                  showcase and celebrate South African music. We combine the
                  power of artificial intelligence with a curated music
                  experience to help you discover amazing tracks from talented
                  artists across South Africa.
                </p>
              </div>

              <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                <h4 className='font-semibold text-blue-900 dark:text-blue-300 mb-3'>
                  Key Features
                </h4>
                <ul className='space-y-2 text-sm text-blue-800 dark:text-blue-200'>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>AI-Powered Chat Streaming:</strong> Discover music
                      through natural conversation. Ask for songs by mood,
                      genre, artist, or any description.
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>Curated Playlists:</strong> Explore handpicked
                      collections featuring the best South African music across
                      genres, provinces, and themes.
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>Artist Support:</strong> A platform built for
                      artists to upload, manage, and promote their music while
                      building their fanbase.
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='font-semibold'>•</span>
                    <span>
                      <strong>Featured Playlist:</strong> Get your music
                      featured in our prominent playlist with both curated and
                      promotional opportunities.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                  For Music Lovers
                </h4>
                <p className='text-gray-700 dark:text-gray-300 leading-relaxed text-sm'>
                  Whether you&apos;re looking for the latest Amapiano hits,
                  classic South African jazz, or discovering new independent
                  artists, Flemoji makes it easy to find exactly what you want
                  to hear. Our AI chat interface understands natural language,
                  so you can simply describe what you&apos;re in the mood for
                  and let us curate the perfect listening experience.
                </p>
              </div>

              <div>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                  For Artists
                </h4>
                <p className='text-gray-700 dark:text-gray-300 leading-relaxed text-sm'>
                  Flemoji provides artists with powerful tools to manage their
                  music library, track performance analytics, submit tracks to
                  playlists, and grow their audience. Upload your tracks, create
                  smart links, and connect with fans across South Africa and
                  beyond.
                </p>
              </div>

              <div className='flex flex-col sm:flex-row gap-3 pt-4'>
                <Button
                  className='bg-blue-600 text-white hover:bg-blue-700'
                  onPress={() => {
                    setIsLearnMoreModalOpen(false);
                    onGetStarted?.();
                  }}
                >
                  Start Exploring
                </Button>
                <Button
                  variant='light'
                  onPress={() => setIsLearnMoreModalOpen(false)}
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
