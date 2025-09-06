import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import HeroUIProviderWrapper from '@/components/providers/HeroUIProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import GlobalMusicPlayer from '@/components/music/GlobalMusicPlayer';
import AppLayout from '@/components/layout/AppLayout';

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
      <body>
        <a href='#content' className='skip-link'>
          Skip to content
        </a>
        <SessionProvider>
          <MusicPlayerProvider>
            <HeroUIProviderWrapper>
              <AppLayout>
                <main id='content'>{children}</main>
                <GlobalMusicPlayer />
              </AppLayout>
            </HeroUIProviderWrapper>
          </MusicPlayerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
