import React from 'react';
import type { Metadata } from 'next';
import { Inter, Poppins, JetBrains_Mono } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import HeroUIProviderWrapper from '@/components/providers/HeroUIProvider';
import SessionProvider from '@/components/providers/SessionProvider';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import BProgressProvider from '@/components/ui/BProgressProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SITE_URL } from '@/lib/utils/site-url';

// Optimize font loading - only essential weights for faster FCP
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: false, // Load after Inter
  variable: '--font-poppins',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  preload: false, // Load last
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Flemoji — AI-Powered South African Music Discovery',
  description:
    'Discover and stream South African music with AI. Chat with Flemoji to find new tracks, explore artists, and build your perfect playlist.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'Flemoji — AI-Powered South African Music Discovery',
    description:
      'Discover and stream South African music with AI. Chat with Flemoji to find new tracks, explore artists, and build your perfect playlist.',
    url: SITE_URL,
    siteName: 'Flemoji',
    // OG image is auto-discovered from src/app/opengraph-image.tsx
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flemoji — AI-Powered South African Music Discovery',
    description:
      'Discover and stream South African music with AI. Chat with Flemoji to find new tracks, explore artists, and build your perfect playlist.',
    site: '@flemoji',
  },
  appleWebApp: {
    capable: true,
    title: 'Flemoji',
  },
  other: {
    // Resource hints for performance
    'dns-prefetch':
      'https://asset.flemoji.com, https://audio.flemoji.com, https://profile-images.flemoji.com',
    'apple-mobile-web-app-title': 'Flemoji',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`dark ${inter.variable} ${poppins.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning className={inter.className}>
        <a href='#content' className='skip-link'>
          Skip to content
        </a>
        <BProgressProvider />
        <SessionProvider>
          <MusicPlayerProvider>
            <ToastProvider>
              <HeroUIProviderWrapper>
                <main id='content'>{children}</main>
              </HeroUIProviderWrapper>
            </ToastProvider>
          </MusicPlayerProvider>
        </SessionProvider>
        {/* Analytics moved to bottom - loaded after page content with defer */}
        <SpeedInsights />
        <Analytics />
        <GoogleAnalytics gaId='G-19MJR1SM8W' />
      </body>
    </html>
  );
}
