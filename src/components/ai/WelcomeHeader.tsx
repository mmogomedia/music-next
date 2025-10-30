'use client';

import React from 'react';
import { Button } from '@heroui/react';

interface WelcomeHeaderProps {
  onGetStarted?: () => void;
}

export default function WelcomeHeader({ onGetStarted }: WelcomeHeaderProps) {
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
                onPress={onGetStarted}
                className='px-5 py-2 text-xs font-semibold bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400'
              >
                Start Exploring
              </Button>
              <Button
                variant='bordered'
                radius='sm'
                size='sm'
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
    </div>
  );
}
