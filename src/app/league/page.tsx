import type { Metadata } from 'next';
import { Suspense } from 'react';
import ChatLayout from '@/components/layout/ChatLayout';
import { absoluteUrl, SITE_URL } from '@/lib/utils/site-url';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'League — Discover & Stream South African Music | Flemoji',
  description:
    'Explore the Flemoji League — a curated music discovery experience powered by AI. Find your next favourite South African artist.',
  alternates: { canonical: absoluteUrl('/league') },
  openGraph: {
    title: 'League — Discover South African Music | Flemoji',
    description:
      'A curated music discovery experience powered by AI. Find your next favourite South African artist.',
    url: absoluteUrl('/league'),
    siteName: 'Flemoji',
    type: 'website',
    images: [
      {
        url: absoluteUrl('/social-card.png'),
        width: 1200,
        height: 630,
        alt: 'Flemoji League',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'League | Flemoji',
    description:
      'A curated music discovery experience powered by AI. Find your next favourite South African artist.',
    site: '@flemoji',
    images: [absoluteUrl('/social-card.png')],
  },
};

export default function LeagueRoute() {
  return (
    <Suspense fallback={null}>
      <ChatLayout />
    </Suspense>
  );
}
