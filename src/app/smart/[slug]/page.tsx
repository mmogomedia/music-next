import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { serializeJsonLd } from '@/lib/utils/seo';
import {
  getQuickLinkLandingData,
  recordQuickLinkEvent,
} from '@/lib/services/quick-link-service';
import QuickLinkTrackView from '@/components/quick-links/TrackLandingView';
import QuickLinkAlbumView from '@/components/quick-links/AlbumLandingView';
import QuickLinkArtistView from '@/components/quick-links/ArtistLandingView';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { absoluteUrl, SITE_URL } from '@/lib/utils/site-url';

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

  const quickLink = data.quickLink;
  const pageUrl = absoluteUrl(`/smart/${resolvedParams.slug}`);

  // ── Build title + description per type ─────────────────────────────────────
  let baseTitle = quickLink.title;
  let baseDescription = quickLink.description;
  let imageUrl: string | null = null;
  let ogType: 'music.song' | 'profile' | 'website' = 'website';

  if (quickLink.type === 'TRACK' && data.track) {
    const artistName = data.track.artist || 'Unknown Artist';
    baseTitle = baseTitle || `${data.track.title} by ${artistName}`;
    baseDescription =
      baseDescription ||
      `Listen to "${data.track.title}" by ${artistName}${data.track.genre ? ` • ${data.track.genre}` : ''} on Flemoji.`;
    imageUrl = data.track.coverImageUrl || data.track.albumArtwork || null;
    ogType = 'music.song';
  } else if (quickLink.type === 'ARTIST' && data.artist?.profile) {
    const artistName = data.artist.profile.artistName || 'Artist';
    baseTitle = baseTitle || `${artistName} on Flemoji`;
    const bioExcerpt = data.artist.profile.bio
      ? data.artist.profile.bio.slice(0, 150).replace(/\n/g, ' ')
      : '';
    baseDescription =
      baseDescription ||
      `Discover ${artistName}${data.artist.profile.genre ? ` • ${data.artist.profile.genre}` : ''}${bioExcerpt ? ` • ${bioExcerpt}` : ''} on Flemoji.`;
    imageUrl =
      data.artist.profile.profileImage ||
      (data.artist.profile as { coverImage?: string }).coverImage ||
      null;
    ogType = 'profile';
  } else if (quickLink.type === 'ALBUM' && data.album) {
    const artistName = data.album.artist?.artistName || 'Unknown Artist';
    baseTitle = baseTitle || `${data.album.albumName} by ${artistName}`;
    baseDescription =
      baseDescription ||
      `Explore "${data.album.albumName}" by ${artistName}${data.album.tracks.length > 0 ? ` • ${data.album.tracks.length} track${data.album.tracks.length > 1 ? 's' : ''}` : ''} on Flemoji.`;
    imageUrl =
      data.album.tracks[0]?.albumArtwork ||
      data.album.tracks[0]?.coverImageUrl ||
      null;
  } else {
    baseDescription =
      baseDescription ||
      (quickLink.type === 'TRACK'
        ? 'Listen to this track on Flemoji.'
        : quickLink.type === 'ARTIST'
          ? 'Discover this artist on Flemoji.'
          : 'Explore this album on Flemoji.');
  }

  // Ensure absolute image URL
  const absImage = imageUrl
    ? imageUrl.startsWith('http')
      ? imageUrl
      : absoluteUrl(imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`)
    : null;

  return {
    metadataBase: new URL(SITE_URL),
    title: `${baseTitle} • Flemoji`,
    description: baseDescription ?? undefined,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${baseTitle} • Flemoji`,
      description: baseDescription ?? undefined,
      url: pageUrl,
      type: ogType,
      siteName: 'Flemoji',
      images: absImage
        ? [{ url: absImage, width: 1200, height: 630, alt: baseTitle }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${baseTitle} • Flemoji`,
      description: baseDescription ?? undefined,
      site: '@flemoji',
      images: absImage ? [absImage] : undefined,
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

  // ── JSON-LD structured data ─────────────────────────────────────────────
  const trackImageUrl =
    data.track?.coverImageUrl || data.track?.albumArtwork || undefined;
  const artistImageUrl =
    (data.artist?.profile?.profileImage as string | undefined) || undefined;
  const albumImageUrl =
    data.album?.tracks[0]?.albumArtwork ||
    data.album?.tracks[0]?.coverImageUrl ||
    undefined;

  const jsonLd =
    quickLink.type === 'TRACK' && data.track
      ? {
          '@context': 'https://schema.org',
          '@type': 'MusicRecording',
          name: data.track.title,
          byArtist: {
            '@type': 'MusicGroup',
            name: data.track.artist || 'Unknown Artist',
          },
          ...(data.track.genre ? { genre: data.track.genre } : {}),
          ...(trackImageUrl ? { image: trackImageUrl } : {}),
          url: absoluteUrl(`/smart/${quickLink.slug}`),
          inLanguage: 'en-ZA',
        }
      : quickLink.type === 'ARTIST' && data.artist?.profile
        ? {
            '@context': 'https://schema.org',
            '@type': 'MusicGroup',
            name: data.artist.profile.artistName,
            ...(data.artist.profile.bio
              ? { description: data.artist.profile.bio.slice(0, 200) }
              : {}),
            ...(data.artist.profile.genre
              ? { genre: data.artist.profile.genre }
              : {}),
            ...(artistImageUrl ? { image: artistImageUrl } : {}),
            url: absoluteUrl(`/smart/${quickLink.slug}`),
            inLanguage: 'en-ZA',
          }
        : quickLink.type === 'ALBUM' && data.album
          ? {
              '@context': 'https://schema.org',
              '@type': 'MusicAlbum',
              name: data.album.albumName,
              byArtist: {
                '@type': 'MusicGroup',
                name: data.album.artist?.artistName || 'Unknown Artist',
              },
              numTracks: data.album.tracks.length,
              ...(albumImageUrl ? { image: albumImageUrl } : {}),
              url: absoluteUrl(`/smart/${quickLink.slug}`),
              inLanguage: 'en-ZA',
            }
          : null;

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white'>
      {jsonLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
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
