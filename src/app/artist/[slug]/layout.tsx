import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';
import { absoluteUrl } from '@/lib/utils/site-url';

/**
 * Metadata for public artist profiles.
 *
 * `page.tsx` is a Client Component (it drives the music player), and a Client
 * Component cannot export `metadata`. Without this layout every artist page
 * inherited the site-wide title and shipped with no description and no
 * canonical — while still being submitted to Google via sitemap.ts. That reads
 * as duplicate-title boilerplate across every artist URL.
 *
 * Deliberately does NOT use `ArtistService.getArtistBySlug`: that helper
 * increments `profileViews` as a side effect, so calling it here would count a
 * second view for every render and inflate the numbers on every crawl.
 */
async function getArtistForMetadata(slug: string) {
  return prisma.artistProfile.findFirst({
    where: {
      OR: [{ slug }, { artistName: slug }],
      isPublic: true,
      isActive: true,
    },
    select: {
      artistName: true,
      bio: true,
      profileImage: true,
      city: true,
      province: true,
      slug: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistForMetadata(slug);

  if (!artist) {
    // Unknown slug — let the client page render its not-found state, but keep
    // the URL out of the index rather than serving a boilerplate title.
    return { title: 'Artist not found | Flemoji', robots: { index: false } };
  }

  const location = [artist.city, artist.province].filter(Boolean).join(', ');
  const title = `${artist.artistName} — Music, Streams & Profile | Flemoji`;
  const description =
    artist.bio?.trim() ||
    `Listen to ${artist.artistName}${location ? ` from ${location}` : ''} on Flemoji — stream their music and follow their releases.`;

  const canonical = absoluteUrl(`/artist/${artist.slug ?? slug}`);
  const image = constructFileUrl(artist.profileImage);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Flemoji',
      type: 'profile',
      ...(image ? { images: [{ url: image, alt: artist.artistName }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@flemoji',
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function ArtistLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
