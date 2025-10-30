import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import HeroUIProviderWrapper from '@/components/providers/HeroUIProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import ConditionalGlobalMusicPlayer from '@/components/music/ConditionalGlobalMusicPlayer';
import BProgressProvider from '@/components/ui/BProgressProvider';

export const metadata: Metadata = {
  title: 'Flemoji Music Streaming Platform',
  description: 'Listen, upload, and share music with Flemoji.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning className='dark'>
      <body suppressHydrationWarning>
        <a href='#content' className='skip-link'>
          Skip to content
        </a>
        <BProgressProvider />
        <SessionProvider>
          <MusicPlayerProvider>
            <HeroUIProviderWrapper>
              <main id='content'>{children}</main>
              <ConditionalGlobalMusicPlayer />
            </HeroUIProviderWrapper>
          </MusicPlayerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
