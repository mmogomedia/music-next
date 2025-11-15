import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  getQuickLinkLandingData,
  recordQuickLinkEvent,
} from '@/lib/services/quick-link-service';
import QuickLinkTrackView from '@/components/quick-links/TrackLandingView';
import QuickLinkAlbumView from '@/components/quick-links/AlbumLandingView';
import QuickLinkArtistView from '@/components/quick-links/ArtistLandingView';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PageParams = { slug: string };
type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getQuickLinkLandingData(resolvedParams.slug);
  if (!data?.quickLink) {
    return {};
  }

  const baseTitle = data.quickLink.title;
  const baseDescription =
    data.quickLink.description ||
    (data.quickLink.type === 'TRACK'
      ? 'Listen to this track on Flemoji.'
      : data.quickLink.type === 'ARTIST'
        ? 'Discover this artist on Flemoji.'
        : 'Explore this album on Flemoji.');

  const image =
    data.track?.coverImageUrl ||
    data.track?.albumArtwork ||
    (data.album?.tracks[0]?.albumArtwork ?? null);

  return {
    title: `${baseTitle} • Flemoji`,
    description: baseDescription,
    openGraph: {
      title: `${baseTitle} • Flemoji`,
      description: baseDescription,
      url: `https://flemoji.co.za/smart/${resolvedParams.slug}`,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${baseTitle} • Flemoji`,
      description: baseDescription,
      images: image ? [image] : undefined,
    },
  };
}

export default async function QuickLinkPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getQuickLinkLandingData(resolvedParams.slug);

  if (!data?.quickLink) {
    notFound();
  }

  const headersList = await headers();
  const referrer = headersList.get('referer') ?? undefined;
  const campaign =
    typeof resolvedSearchParams?.utm_campaign === 'string'
      ? resolvedSearchParams.utm_campaign
      : undefined;

  try {
    await recordQuickLinkEvent(resolvedParams.slug, {
      event: 'visit',
      referrer,
      campaign,
    });
  } catch (error) {
    console.error('Failed to record quick link visit', error);
  }

  const quickLink = data.quickLink;
  const viewInChatHref = `/?quickLinkSlug=${quickLink.slug}`;

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white'>
      <div className='mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-10 py-16 space-y-10'>
        <header className='space-y-4 text-center sm:text-left'>
          <div className='inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300'>
            {quickLink.type === 'TRACK'
              ? 'Track Spotlight'
              : quickLink.type === 'ARTIST'
                ? 'Artist Profile'
                : 'Album Feature'}
          </div>
          <h1 className='text-4xl sm:text-5xl font-bold leading-tight text-white'>
            {quickLink.title}
          </h1>
          {quickLink.description && (
            <p className='text-base sm:text-lg text-slate-300 max-w-3xl'>
              {quickLink.description}
            </p>
          )}
          <div className='flex flex-wrap items-center gap-3'>
            <Link
              href={viewInChatHref}
              className='inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-5 py-2 text-sm font-semibold shadow-lg hover:bg-slate-100 transition-colors'
            >
              View in Chat
              <ArrowRightIcon className='w-4 h-4' />
            </Link>
            <Link
              href='/'
              className='text-sm text-slate-300 hover:text-white underline-offset-4 hover:underline'
            >
              Go to homepage
            </Link>
            {!quickLink.isActive && (
              <span className='rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300'>
                This link is currently disabled
              </span>
            )}
          </div>
        </header>

        <section>
          {quickLink.type === 'TRACK' && data.track ? (
            <QuickLinkTrackView
              track={data.track}
              quickLinkSlug={quickLink.slug}
            />
          ) : quickLink.type === 'ARTIST' && data.artist ? (
            <QuickLinkArtistView
              artist={{
                profile: data.artist.profile
                  ? {
                      artistName: data.artist.profile.artistName,
                      bio: data.artist.profile.bio ?? null,
                      profileImage: data.artist.profile.profileImage ?? null,
                      location: data.artist.profile.location ?? null,
                      genre: data.artist.profile.genre ?? null,
                      slug: data.artist.profile.slug ?? null,
                    }
                  : null,
                socialLinks: data.artist.socialLinks ?? null,
                streamingLinks: data.artist.streamingLinks ?? null,
                topTracks: data.artist.topTracks,
              }}
              quickLinkSlug={quickLink.slug}
            />
          ) : quickLink.type === 'ALBUM' && data.album ? (
            <QuickLinkAlbumView
              album={{
                albumName: data.album.albumName,
                artist: data.album.artist
                  ? {
                      artistName: data.album.artist.artistName ?? null,
                      profileImage: data.album.artist.profileImage ?? null,
                      slug: data.album.artist.slug ?? null,
                    }
                  : null,
                tracks: data.album.tracks,
              }}
              quickLinkSlug={quickLink.slug}
            />
          ) : (
            <div className='rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center text-slate-300'>
              Content is not available right now.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
