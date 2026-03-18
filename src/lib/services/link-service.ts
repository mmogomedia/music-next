/**
 * Unified Link Service
 *
 * Consolidates quick-link and smart-link services into a single implementation.
 * Eliminates ~900 lines of duplicate code.
 *
 * Replaces:
 * - /src/lib/services/quick-link-service.ts
 * - /src/lib/services/smart-link-service.ts
 */

import { Prisma, QuickLinkType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { constructFileUrl } from '@/lib/url-utils';
import { slugify } from '@/lib/utils/string';
import { config } from '@/lib/config';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

const LinkEventSchema = z.object({
  event: z.enum(['visit', 'play', 'download', 'share', 'like']),
  referrer: z.string().optional(),
  campaign: z.string().optional(),
});

export type LinkEventPayload = z.infer<typeof LinkEventSchema>;

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

export interface LinkLandingData {
  quickLink: Awaited<ReturnType<typeof getLinkBySlug>>;
  track?: TrackLandingData;
  artist?: ArtistLandingData;
  album?: AlbumLandingData;
}

interface LinkCreateParams {
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

interface LinkUpdateParams {
  id: string;
  title?: string;
  description?: string;
  slug?: string;
  isActive?: boolean;
  isPrerelease?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure a URL is absolute
 *
 * Converts file paths and relative URLs to absolute URLs
 *
 * @param value - URL or file path
 * @returns Absolute URL or null
 */
function ensureAbsoluteUrl(value?: string | null): string | null {
  if (!value) return null;

  // Already absolute URL - return as-is
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // Try to construct URL from file path
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
    return `${config.app.domain}${value}`;
  }

  // Fallback: return constructed URL if available, otherwise return original
  return constructedUrl || value;
}

/**
 * Map platform links to standardized format
 *
 * @param platformLinks - Platform links array
 * @returns Mapped platform links
 */
function mapPlatformLinks(
  platformLinks?: { platform: string; url: string }[]
): { platform: string; url: string }[] {
  if (!platformLinks) return [];
  return platformLinks.map(link => ({
    platform: link.platform,
    url: link.url,
  }));
}

/**
 * Ensure slug is unique
 *
 * @param base - Base slug string
 * @param existingId - Optional existing link ID (for updates)
 * @returns Unique slug
 */
export async function ensureUniqueSlug(
  base: string,
  existingId?: string
): Promise<string> {
  const baseSlug = slugify(base) || 'link';
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

  throw new Error('Unable to generate unique link slug');
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new link (quick or smart)
 *
 * @param params - Link creation parameters
 * @returns Created link
 */
export async function createLink(params: LinkCreateParams) {
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

  // Validation
  if (type === QuickLinkType.TRACK && !trackId) {
    throw new Error('Track ID is required for track links');
  }

  if (type === QuickLinkType.ARTIST && !artistProfileId) {
    throw new Error('Artist profile ID is required for artist links');
  }

  if (type === QuickLinkType.ALBUM && (!albumName || !albumArtistId)) {
    throw new Error('Album links require album name and artist');
  }

  let derivedTitle = title;
  let derivedSlugBase = slug;

  // Derive title and slug from track
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
      throw new Error('Track must be public to create a link');
    }

    derivedTitle = derivedTitle ?? track.title;
    derivedSlugBase = derivedSlugBase ?? `${track.title}-${track.artist ?? ''}`;
  }

  // Derive title and slug from artist
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

  // Derive title and slug from album
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

  const uniqueSlug = await ensureUniqueSlug(derivedSlugBase ?? 'link');

  return prisma.quickLink.create({
    data: {
      type,
      trackId,
      artistProfileId,
      albumArtistId,
      albumName,
      title: derivedTitle ?? 'Link',
      description,
      slug: uniqueSlug,
      createdByUserId,
      isPrerelease,
    },
  });
}

/**
 * Update an existing link
 *
 * @param params - Link update parameters
 * @returns Updated link
 */
export async function updateLink(params: LinkUpdateParams) {
  const { id, ...data } = params;

  const link = await prisma.quickLink.findUnique({ where: { id } });

  if (!link) {
    throw new Error('Link not found');
  }

  let slug = data.slug;
  if (slug && slug !== link.slug) {
    slug = await ensureUniqueSlug(slug, link.id);
  }

  return prisma.quickLink.update({
    where: { id },
    data: {
      title: data.title ?? link.title,
      description: data.description ?? link.description,
      slug: slug ?? link.slug,
      isActive: data.isActive ?? link.isActive,
      isPrerelease: data.isPrerelease ?? link.isPrerelease,
    },
  });
}

/**
 * List links for a user
 *
 * @param userId - User ID
 * @returns Array of links
 */
export async function listLinks(userId: string) {
  return prisma.quickLink.findMany({
    where: { createdByUserId: userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete a link
 *
 * @param id - Link ID
 * @param userId - User ID (for authorization)
 */
export async function deleteLink(id: string, userId: string) {
  const link = await prisma.quickLink.findUnique({
    where: { id },
    select: { createdByUserId: true },
  });

  if (!link) {
    throw new Error('Link not found');
  }

  if (link.createdByUserId !== userId) {
    throw new Error('Forbidden');
  }

  await prisma.quickLink.delete({ where: { id } });
}

/**
 * Get a link by slug
 *
 * @param slug - Link slug
 * @returns Link with relations
 */
export async function getLinkBySlug(slug: string) {
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

// ============================================================================
// LANDING PAGE DATA
// ============================================================================

/**
 * Get complete landing page data for a link
 *
 * @param slug - Link slug
 * @returns Landing page data or null
 */
export async function getLinkLandingData(
  slug: string
): Promise<LinkLandingData | null> {
  const link = await getLinkBySlug(slug);

  if (!link) {
    return null;
  }

  // Track landing data
  if (link.type === QuickLinkType.TRACK && link.track) {
    const primarySmartLink = link.track.smartLinks?.[0];

    const trackData: TrackLandingData = {
      id: link.track.id,
      title: link.track.title,
      artist: link.track.artist ?? link.track.artistProfile?.artistName ?? null,
      album: link.track.album ?? null,
      albumArtwork: ensureAbsoluteUrl(link.track.albumArtwork),
      coverImageUrl: ensureAbsoluteUrl(link.track.coverImageUrl),
      duration: link.track.duration ?? null,
      description: link.track.description ?? null,
      genre: link.track.genre ?? null,
      bpm: link.track.bpm ?? null,
      releaseDate: link.track.releaseDate ?? null,
      streamingLinks: mapPlatformLinks(primarySmartLink?.platformLinks),
      isDownloadable: link.track.isDownloadable ?? false,
      filePath: link.track.filePath,
      fileUrl: constructFileUrl(link.track.filePath),
    };

    return {
      quickLink: link,
      track: trackData,
    };
  }

  // Artist landing data
  if (link.type === QuickLinkType.ARTIST && link.artistProfile) {
    const topTracksRaw = await prisma.track.findMany({
      where: {
        artistProfileId: link.artistProfile.id,
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
      artist: track.artist ?? link.artistProfile?.artistName ?? null,
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
      quickLink: link,
      artist: {
        profile: link.artistProfile
          ? {
              ...link.artistProfile,
              profileImage: ensureAbsoluteUrl(link.artistProfile.profileImage),
              coverImage: ensureAbsoluteUrl(link.artistProfile.coverImage),
            }
          : null,
        socialLinks:
          (link.artistProfile.socialLinks as Record<string, unknown> | null) ??
          null,
        streamingLinks:
          (link.artistProfile.streamingLinks as Record<
            string,
            unknown
          > | null) ?? null,
        topTracks,
      },
    };
  }

  // Album landing data
  if (link.type === QuickLinkType.ALBUM) {
    const tracksRaw = await prisma.track.findMany({
      where: {
        artistProfileId: link.albumArtistId ?? undefined,
        album: link.albumName
          ? { equals: link.albumName, mode: 'insensitive' }
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
      artist: track.artist ?? link.albumArtist?.artistName ?? null,
      album: track.album ?? link.albumName ?? null,
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
      quickLink: link,
      album: {
        albumName: link.albumName ?? 'Album',
        artist: link.albumArtist
          ? {
              ...link.albumArtist,
              profileImage: ensureAbsoluteUrl(link.albumArtist.profileImage),
              coverImage: ensureAbsoluteUrl(link.albumArtist.coverImage),
            }
          : null,
        tracks,
      },
    };
  }

  return {
    quickLink: link,
  };
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Record a link event (visit, play, download, etc.)
 *
 * @param slug - Link slug
 * @param payload - Event payload
 */
export async function recordLinkEvent(slug: string, payload: LinkEventPayload) {
  const { event, referrer, campaign } = LinkEventSchema.parse(payload);

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
    throw new Error('Link not found');
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

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Quick Link Service (backward compatibility)
 * @deprecated Use unified link service functions instead
 */
export const quickLinkService = {
  create: createLink,
  update: updateLink,
  list: listLinks,
  delete: deleteLink,
  getBySlug: getLinkBySlug,
  getLandingData: getLinkLandingData,
  recordEvent: recordLinkEvent,
};

/**
 * Smart Link Service (backward compatibility)
 * @deprecated Use unified link service functions instead
 */
export const smartLinkService = {
  create: createLink,
  update: updateLink,
  list: listLinks,
  delete: deleteLink,
  getBySlug: getLinkBySlug,
  getLandingData: getLinkLandingData,
  recordEvent: recordLinkEvent,
};

// Re-export types for backward compatibility
export type {
  LinkCreateParams as QuickLinkCreateParams,
  LinkUpdateParams as QuickLinkUpdateParams,
  LinkLandingData as QuickLinkLandingData,
};
