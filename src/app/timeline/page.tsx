import type { Metadata } from 'next';
import TimelinePage from '@/components/timeline/TimelinePage';
import { absoluteUrl, SITE_URL } from '@/lib/utils/site-url';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Music Timeline — South African Artist Posts & Updates | Flemoji',
  description:
    'Follow the latest posts, releases, and updates from South African artists on Flemoji. A social feed built for music discovery.',
  alternates: { canonical: absoluteUrl('/timeline') },
  openGraph: {
    title: 'Music Timeline | Flemoji',
    description:
      'Follow the latest posts and updates from South African artists on Flemoji.',
    url: absoluteUrl('/timeline'),
    siteName: 'Flemoji',
    type: 'website',
    images: [
      {
        url: absoluteUrl('/social-card.png'),
        width: 1200,
        height: 630,
        alt: 'Flemoji Music Timeline',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Music Timeline | Flemoji',
    description:
      'Follow the latest posts and updates from South African artists on Flemoji.',
    site: '@flemoji',
    images: [absoluteUrl('/social-card.png')],
  },
};

export default function TimelineRoute() {
  return <TimelinePage />;
}
