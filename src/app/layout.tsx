import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import HeroUIProviderWrapper from '@/components/providers/HeroUIProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import ConditionalGlobalMusicPlayer from '@/components/music/ConditionalGlobalMusicPlayer';
import BProgressProvider from '@/components/ui/BProgressProvider';
import { ToastProvider } from '@/components/ui/Toast';

const siteUrl = 'https://flemoji.com';
const shareImage = '/social-card.png';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Flemoji Music Streaming Platform',
  description: 'Listen, upload, and share music with Flemoji.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Flemoji Music Streaming Platform',
    description: 'Listen, upload, and share music with Flemoji.',
    url: siteUrl,
    siteName: 'Flemoji',
    images: [
      {
        url: shareImage,
        width: 1200,
        height: 630,
        alt: 'Flemoji Music Streaming Platform',
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flemoji Music Streaming Platform',
    description: 'Listen, upload, and share music with Flemoji.',
    images: [shareImage],
  },
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
            <ToastProvider>
              <HeroUIProviderWrapper>
                <main id='content'>{children}</main>
                <ConditionalGlobalMusicPlayer />
              </HeroUIProviderWrapper>
            </ToastProvider>
          </MusicPlayerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
