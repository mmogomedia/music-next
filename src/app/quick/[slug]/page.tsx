import { headers, cookies } from 'next/headers';
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

const backgroundShapes = [
  'top-[-18%] left-[-10%] w-[420px] h-[420px] bg-blue-300/20',
  'bottom-[-20%] right-[-15%] w-[520px] h-[520px] bg-purple-300/20',
  'top-[35%] right-[8%] w-[320px] h-[320px] bg-pink-300/20',
  'bottom-[8%] left-[12%] w-[260px] h-[260px] bg-cyan-300/15',
];

const floatingNotes = [
  { left: '14%', top: '20%', delay: '0s' },
  { left: '76%', top: '18%', delay: '1.2s' },
  { left: '24%', top: '62%', delay: '0.6s' },
  { left: '68%', top: '70%', delay: '1.6s' },
  { left: '88%', top: '44%', delay: '2s' },
  { left: '6%', top: '48%', delay: '2.4s' },
];

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
      url: `https://flemoji.co.za/quick/${resolvedParams.slug}`,
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

  const quickLink = data.quickLink;

  const cookieStore = cookies();
  const visitCookieKey = `ql_visit_${quickLink.slug}`;
  const lastVisitCookie = cookieStore.get(visitCookieKey);
  const now = Date.now();
  const VISIT_DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  let shouldRecordVisit = true;
  if (lastVisitCookie) {
    const lastVisitTime = Number(lastVisitCookie.value);
    if (
      !Number.isNaN(lastVisitTime) &&
      now - lastVisitTime < VISIT_DEDUP_WINDOW_MS
    ) {
      shouldRecordVisit = false;
    }
  }

  if (!quickLink.isActive) {
    return (
      <div className='relative flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 text-center text-slate-700'>
        <div className='max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.25)]'>
          <div className='inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-red-500'>
            Quick link disabled
          </div>
          <div className='space-y-3'>
            <h1 className='text-3xl font-bold text-slate-900'>
              This quick link is no longer available
            </h1>
            <p className='text-sm text-slate-600'>
              The creator has disabled this link. Please contact the artist or
              visit the Flemoji homepage to keep exploring music.
            </p>
          </div>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center'>
            <Link
              href='/'
              className='inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-50'
            >
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const headersList = await headers();
  const referrer = headersList.get('referer') ?? undefined;
  const campaign =
    typeof resolvedSearchParams?.utm_campaign === 'string'
      ? resolvedSearchParams.utm_campaign
      : undefined;

  try {
    if (shouldRecordVisit) {
      await recordQuickLinkEvent(resolvedParams.slug, {
        event: 'visit',
        referrer,
        campaign,
      });

      cookieStore.set(visitCookieKey, String(now), {
        httpOnly: false,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 60 * 60 * 24, // keep marker for a day
      });
    }
  } catch (error) {
    console.error('Failed to record quick link visit', error);
  }

  const viewInChatHref = `/?quickLinkSlug=${quickLink.slug}`;

  return (
    <div className='relative min-h-screen bg-white text-slate-900'>
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(63,131,248,0.12),_transparent_45%),_radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.12),_transparent_40%)]' />
        {backgroundShapes.map((shape, idx) => (
          <div
            key={idx}
            className={`absolute rounded-full blur-3xl opacity-70 animate-pulse ${shape}`}
          />
        ))}
        {floatingNotes.map((note, idx) => (
          <div
            key={`note-${idx}`}
            className='absolute text-slate-300 text-4xl animate-float'
            style={{
              left: note.left,
              top: note.top,
              animationDelay: note.delay,
              animationDuration: '4s',
            }}
          >
            ♪
          </div>
        ))}
      </div>

      <div className='relative z-10 px-4 sm:px-6 lg:px-10 py-10 sm:py-14'>
        <div className='mx-auto max-w-6xl space-y-6'>
          <header className='space-y-5'>
            <div className='inline-flex items-center px-4 py-2 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] rounded-full border border-slate-100 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600'>
              {quickLink.type === 'TRACK'
                ? 'Track Spotlight'
                : quickLink.type === 'ARTIST'
                  ? 'Artist Profile'
                  : 'Album Feature'}
            </div>

            <div className='space-y-4 max-w-3xl'>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-["Poppins"] text-slate-900 break-words line-clamp-3'>
                {quickLink.title}
              </h1>
              {quickLink.description && (
                <p className='text-lg sm:text-xl text-slate-600 leading-relaxed font-["Poppins"]'>
                  {quickLink.description}
                </p>
              )}
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
              <Link
                href={viewInChatHref}
                className='inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-purple-500 transition-all duration-200'
              >
                View in Chat
                <ArrowRightIcon className='w-5 h-5' />
              </Link>
              <Link
                href='/'
                className='inline-flex items-center justify-center rounded-full px-8 py-3 bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors duration-200 shadow-sm'
              >
                Return to homepage
              </Link>
              {!quickLink.isActive && (
                <span className='inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-400'>
                  Currently disabled
                </span>
              )}
            </div>
          </header>

          <section className='relative'>
            <div className='w-full'>
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
                          profileImage:
                            data.artist.profile.profileImage ?? null,
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
                <div className='flex h-full items-center justify-center rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.2)]'>
                  Content is not available right now.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
