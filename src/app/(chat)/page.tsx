import type { Metadata } from 'next';
import { Suspense } from 'react';
import ChatLayout from '@/components/layout/ChatLayout';
import { absoluteUrl, SITE_URL } from '@/lib/utils/site-url';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Flemoji — AI-Powered South African Music Discovery',
  description:
    'Discover and stream South African music with AI. Chat with Flemoji to find new tracks, explore artists, and build your perfect playlist.',
  alternates: { canonical: absoluteUrl('/') },
  openGraph: {
    title: 'Flemoji — AI-Powered South African Music Discovery',
    description:
      'Discover and stream South African music with AI. Chat with Flemoji to find new tracks, explore artists, and build your perfect playlist.',
    url: absoluteUrl('/'),
    siteName: 'Flemoji',
    type: 'website',
    images: [
      {
        url: absoluteUrl('/social-card.png'),
        width: 1200,
        height: 630,
        alt: 'Flemoji — AI Music Discovery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flemoji — AI-Powered South African Music Discovery',
    description:
      'Discover and stream South African music with AI. Chat with Flemoji to find new tracks, explore artists, and build your perfect playlist.',
    site: '@flemoji',
    images: [absoluteUrl('/social-card.png')],
  },
};

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <ChatLayout />
    </Suspense>
  );
}
