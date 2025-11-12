import { Prisma, QuickLinkType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { constructFileUrl } from '@/lib/url-utils';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);

const ensureAbsoluteUrl = (value?: string | null) => {
  if (!value) return null;
  // Already absolute URL - return as-is
  if (value.startsWith('http://') || value.startsWith('https://')) return value;

  // Try to construct URL from file path (handles paths with or without leading slash)
  const constructedUrl = constructFileUrl(value);

  // If constructFileUrl successfully converted it to an absolute URL, use it
  if (
    constructedUrl &&
    (constructedUrl.startsWith('http://') ||
      constructedUrl.startsWith('https://'))
  ) {
    return constructedUrl;
  }

  // If value starts with / and constructFileUrl didn't convert it,
  // it might be a relative URL on the same domain - convert to absolute
  if (value.startsWith('/')) {
    return `https://flemoji.co.za${value}`;
  }

  // Fallback: return constructed URL if available, otherwise return original
  return constructedUrl || value;
};

const QuickLinkEventSchema = z.object({
  event: z.enum(['visit', 'play', 'download', 'share', 'like']),
  referrer: z.string().optional(),
  campaign: z.string().optional(),
});

export type QuickLinkEventPayload = z.infer<typeof QuickLinkEventSchema>;

export interface TrackLandingData {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  albumArtwork: string | null;
  coverImageUrl: string | null;
  duration: number | null;
  description: string | null;
  genre: string | null;
  bpm: number | null;
  releaseDate: Date | null;
  isDownloadable: boolean;
  filePath: string;
  fileUrl: string | null;
  streamingLinks: {
    platform: string;
    url: string;
  }[];
}

export interface ArtistLandingData {
  profile: Awaited<ReturnType<typeof prisma.artistProfile.findUnique>>;
  socialLinks: Record<string, unknown> | null;
  streamingLinks: Record<string, unknown> | null;
  topTracks: TrackLandingData[];
}

export interface AlbumLandingData {
  albumName: string;
  artist: Awaited<ReturnType<typeof prisma.artistProfile.findUnique>> | null;
  tracks: TrackLandingData[];
}

export interface QuickLinkLandingData {
  quickLink: Awaited<ReturnType<typeof getQuickLinkBySlug>>;
  track?: TrackLandingData;
  artist?: ArtistLandingData;
  album?: AlbumLandingData;
}

export async function ensureUniqueSlug(base: string, existingId?: string) {
  const baseSlug = slugify(base) || 'quick-link';
  const maxAttempts = 10_000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    const existing = await prisma.quickLink.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === existingId) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique quick link slug');
}

interface QuickLinkCreateParams {
  type: QuickLinkType;
  trackId?: string;
  artistProfileId?: string;
  albumArtistId?: string;
  albumName?: string;
  title?: string;
  description?: string;
  slug?: string;
  createdByUserId: string;
  isPrerelease?: boolean;
}

export async function createQuickLink(params: QuickLinkCreateParams) {
  const {
    type,
    trackId,
    artistProfileId,
    albumArtistId,
    albumName,
    title,
    description,
    slug,
    createdByUserId,
    isPrerelease = false,
  } = params;

  if (type === QuickLinkType.TRACK && !trackId) {
    throw new Error('Track ID is required for track quick links');
  }

  if (type === QuickLinkType.ARTIST && !artistProfileId) {
    throw new Error('Artist profile ID is required for artist quick links');
  }

  if (type === QuickLinkType.ALBUM && (!albumName || !albumArtistId)) {
    throw new Error('Album quick links require album name and artist');
  }

  let derivedTitle = title;
  let derivedSlugBase = slug;

  if (type === QuickLinkType.TRACK && trackId) {
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        artist: true,
        isPublic: true,
        userId: true,
        album: true,
      },
    });

    if (!track) {
      throw new Error('Track not found');
    }

    if (!track.isPublic) {
      throw new Error('Track must be public to create a quick link');
    }

    derivedTitle = derivedTitle ?? `${track.title}`;
    derivedSlugBase = derivedSlugBase ?? `${track.title}-${track.artist ?? ''}`;
  }

  if (type === QuickLinkType.ARTIST && artistProfileId) {
    const profile = await prisma.artistProfile.findUnique({
      where: { id: artistProfileId },
      select: { artistName: true },
    });

    if (!profile) {
      throw new Error('Artist profile not found');
    }

    derivedTitle = derivedTitle ?? profile.artistName;
    derivedSlugBase = derivedSlugBase ?? profile.artistName;
  }

  if (type === QuickLinkType.ALBUM && albumArtistId && albumName) {
    const artist = await prisma.artistProfile.findUnique({
      where: { id: albumArtistId },
      select: { artistName: true },
    });

    if (!artist) {
      throw new Error('Album artist not found');
    }

    derivedTitle = derivedTitle ?? `${artist.artistName} – ${albumName}`;
    derivedSlugBase = derivedSlugBase ?? `${artist.artistName}-${albumName}`;
  }

  const uniqueSlug = await ensureUniqueSlug(derivedSlugBase ?? 'quick-link');

  return prisma.quickLink.create({
    data: {
      type,
      trackId,
      artistProfileId,
      albumArtistId,
      albumName,
      title: derivedTitle ?? 'Quick Link',
      description,
      slug: uniqueSlug,
      createdByUserId,
      isPrerelease,
    },
  });
}

interface QuickLinkUpdateParams {
  id: string;
  title?: string;
  description?: string;
  slug?: string;
  isActive?: boolean;
  isPrerelease?: boolean;
}

export async function updateQuickLink({ id, ...data }: QuickLinkUpdateParams) {
  const quickLink = await prisma.quickLink.findUnique({ where: { id } });

  if (!quickLink) {
    throw new Error('Quick link not found');
  }

  let slug = data.slug;
  if (slug && slug !== quickLink.slug) {
    slug = await ensureUniqueSlug(slug, quickLink.id);
  }

  return prisma.quickLink.update({
    where: { id },
    data: {
      title: data.title ?? quickLink.title,
      description: data.description ?? quickLink.description,
      slug: slug ?? quickLink.slug,
      isActive: data.isActive ?? quickLink.isActive,
      isPrerelease: data.isPrerelease ?? quickLink.isPrerelease,
    },
  });
}

export async function listQuickLinks(userId: string) {
  return prisma.quickLink.findMany({
    where: { createdByUserId: userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteQuickLink(id: string, userId: string) {
  const quickLink = await prisma.quickLink.findUnique({
    where: { id },
    select: { createdByUserId: true },
  });

  if (!quickLink) {
    throw new Error('Quick link not found');
  }

  if (quickLink.createdByUserId !== userId) {
    throw new Error('Forbidden');
  }

  await prisma.quickLink.delete({ where: { id } });
}

export async function getQuickLinkBySlug(slug: string) {
  return prisma.quickLink.findUnique({
    where: { slug },
    include: {
      track: {
        include: {
          artistProfile: true,
          smartLinks: {
            include: { platformLinks: true },
          },
        },
      },
      artistProfile: true,
      albumArtist: true,
    },
  });
}

function mapPlatformLinks(platformLinks?: { platform: string; url: string }[]) {
  if (!platformLinks) return [] as { platform: string; url: string }[];
  return platformLinks.map(link => ({
    platform: link.platform,
    url: link.url,
  }));
}

export async function getQuickLinkLandingData(
  slug: string
): Promise<QuickLinkLandingData | null> {
  const quickLink = await getQuickLinkBySlug(slug);

  if (!quickLink) {
    return null;
  }

  if (quickLink.type === QuickLinkType.TRACK && quickLink.track) {
    const primarySmartLink = quickLink.track.smartLinks?.[0];

    const trackData: TrackLandingData = {
      id: quickLink.track.id,
      title: quickLink.track.title,
      artist:
        quickLink.track.artist ??
        quickLink.track.artistProfile?.artistName ??
        null,
      album: quickLink.track.album ?? null,
      albumArtwork: ensureAbsoluteUrl(quickLink.track.albumArtwork),
      coverImageUrl: ensureAbsoluteUrl(quickLink.track.coverImageUrl),
      duration: quickLink.track.duration ?? null,
      description: quickLink.track.description ?? null,
      genre: quickLink.track.genre ?? null,
      bpm: quickLink.track.bpm ?? null,
      releaseDate: quickLink.track.releaseDate ?? null,
      streamingLinks: mapPlatformLinks(primarySmartLink?.platformLinks),
      isDownloadable: quickLink.track.isDownloadable ?? false,
      filePath: quickLink.track.filePath,
      fileUrl: constructFileUrl(quickLink.track.filePath),
    };

    return {
      quickLink,
      track: trackData,
    };
  }

  if (quickLink.type === QuickLinkType.ARTIST && quickLink.artistProfile) {
    const topTracksRaw = await prisma.track.findMany({
      where: {
        artistProfileId: quickLink.artistProfile.id,
        isPublic: true,
      },
      orderBy: [{ playCount: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: {
        smartLinks: {
          include: { platformLinks: true },
        },
      },
    });

    const topTracks: TrackLandingData[] = topTracksRaw.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist ?? quickLink.artistProfile?.artistName ?? null,
      album: track.album ?? null,
      albumArtwork: ensureAbsoluteUrl(track.albumArtwork),
      coverImageUrl: ensureAbsoluteUrl(track.coverImageUrl),
      duration: track.duration ?? null,
      description: track.description ?? null,
      genre: track.genre ?? null,
      bpm: track.bpm ?? null,
      releaseDate: track.releaseDate ?? null,
      streamingLinks: mapPlatformLinks(track.smartLinks?.[0]?.platformLinks),
      isDownloadable: track.isDownloadable ?? false,
      filePath: track.filePath,
      fileUrl: constructFileUrl(track.filePath),
    }));

    return {
      quickLink,
      artist: {
        profile: quickLink.artistProfile
          ? {
              ...quickLink.artistProfile,
              profileImage: ensureAbsoluteUrl(
                quickLink.artistProfile.profileImage
              ),
              coverImage: ensureAbsoluteUrl(quickLink.artistProfile.coverImage),
            }
          : null,
        socialLinks:
          (quickLink.artistProfile.socialLinks as Record<
            string,
            unknown
          > | null) ?? null,
        streamingLinks:
          (quickLink.artistProfile.streamingLinks as Record<
            string,
            unknown
          > | null) ?? null,
        topTracks,
      },
    };
  }

  if (quickLink.type === QuickLinkType.ALBUM) {
    const tracksRaw = await prisma.track.findMany({
      where: {
        artistProfileId: quickLink.albumArtistId ?? undefined,
        album: quickLink.albumName
          ? { equals: quickLink.albumName, mode: 'insensitive' }
          : undefined,
        isPublic: true,
      },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        smartLinks: {
          include: { platformLinks: true },
        },
      },
    });

    const tracks: TrackLandingData[] = tracksRaw.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist ?? quickLink.albumArtist?.artistName ?? null,
      album: track.album ?? quickLink.albumName ?? null,
      albumArtwork: ensureAbsoluteUrl(track.albumArtwork),
      coverImageUrl: ensureAbsoluteUrl(track.coverImageUrl),
      duration: track.duration ?? null,
      description: track.description ?? null,
      genre: track.genre ?? null,
      bpm: track.bpm ?? null,
      releaseDate: track.releaseDate ?? null,
      streamingLinks: mapPlatformLinks(track.smartLinks?.[0]?.platformLinks),
      isDownloadable: track.isDownloadable ?? false,
      filePath: track.filePath,
      fileUrl: constructFileUrl(track.filePath),
    }));

    return {
      quickLink,
      album: {
        albumName: quickLink.albumName ?? 'Album',
        artist: quickLink.albumArtist
          ? {
              ...quickLink.albumArtist,
              profileImage: ensureAbsoluteUrl(
                quickLink.albumArtist.profileImage
              ),
              coverImage: ensureAbsoluteUrl(quickLink.albumArtist.coverImage),
            }
          : null,
        tracks,
      },
    };
  }

  return {
    quickLink,
  };
}

export async function recordQuickLinkEvent(
  slug: string,
  payload: QuickLinkEventPayload
) {
  const { event, referrer, campaign } = QuickLinkEventSchema.parse(payload);

  const result = await prisma.quickLink.findUnique({
    where: { slug },
    select: {
      id: true,
      totalVisits: true,
      playCount: true,
      downloadCount: true,
      likeCount: true,
      shareCount: true,
      referrerCounts: true,
      campaignCounts: true,
      firstVisitedAt: true,
    },
  });

  if (!result) {
    throw new Error('Quick link not found');
  }

  const updates: Prisma.QuickLinkUpdateInput = {
    lastVisitedAt: new Date(),
    updatedAt: new Date(),
  };

  if (event === 'visit') {
    updates.totalVisits = { increment: 1 };
    if (!result.firstVisitedAt) {
      updates.firstVisitedAt = new Date();
    }
  }

  if (event === 'play') {
    updates.playCount = { increment: 1 };
  }

  if (event === 'download') {
    updates.downloadCount = { increment: 1 };
  }

  if (event === 'share') {
    updates.shareCount = { increment: 1 };
  }

  if (event === 'like') {
    updates.likeCount = { increment: 1 };
  }

  if (referrer) {
    const map = (result.referrerCounts as Record<string, number>) ?? {};
    const updated = { ...map, [referrer]: (map[referrer] ?? 0) + 1 };
    updates.referrerCounts = updated as Prisma.JsonObject;
  }

  if (campaign) {
    const map = (result.campaignCounts as Record<string, number>) ?? {};
    const updated = { ...map, [campaign]: (map[campaign] ?? 0) + 1 };
    updates.campaignCounts = updated as Prisma.JsonObject;
  }

  await prisma.quickLink.update({
    where: { slug },
    data: updates,
  });
}
