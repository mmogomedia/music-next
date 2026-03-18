/**
 * Output Schemas for AI Tools
 *
 * Zod schemas for validating tool output before returning to agents.
 * These are the canonical types for the AI response pipeline.
 *
 * Usage:
 *   const validated = SearchTracksOutputSchema.parse(result);
 *   return JSON.stringify(validated);
 *
 * @module output-schemas
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Base entity schemas
// ---------------------------------------------------------------------------

/**
 * Artist profile embedded inside a track — lightweight subset for the info panel.
 */
export const EmbeddedArtistProfileSchema = z.object({
  id: z.string(),
  artistName: z.string(),
  bio: z.string().nullable().optional(),
  isVerified: z.boolean().default(false),
  location: z.string().nullable().optional(),
  profileImage: z.string().nullable().optional(),
  /** Raw JSON — kept as unknown because the shape varies per platform */
  socialLinks: z.unknown().nullable().optional(),
  streamingLinks: z.unknown().nullable().optional(),
});

export type EmbeddedArtistProfile = z.infer<typeof EmbeddedArtistProfileSchema>;

/**
 * Track as returned by discovery tools and consumed by renderers.
 * Uses `.default()` so Zod fills in missing optional fields automatically.
 */
export const TrackItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string().default('Unknown Artist'),

  // File references — Prisma nullable fields use nullish() to accept null | undefined
  filePath: z.string().nullish(),
  fileUrl: z.string().nullish(),
  coverImageUrl: z.string().nullish(),
  albumArtwork: z.string().nullish(),
  uniqueUrl: z.string().nullish(),

  // Core metadata
  genre: z.string().nullish(),
  duration: z.number().nullish(),
  album: z.string().nullish(),
  description: z.string().nullish(),

  // Extended metadata (previously missing from most tools)
  bpm: z.number().nullish(),
  year: z.number().nullish(),
  language: z.string().nullish(),
  lyrics: z.string().nullish(),
  composer: z.string().nullish(),
  isrc: z.string().nullish(),
  copyrightInfo: z.string().nullish(),

  // Flags — nullable().default() accepts null|undefined, fills undefined with default
  isExplicit: z.boolean().nullable().default(false),
  isPublic: z.boolean().nullable().default(true),
  isDownloadable: z.boolean().nullable().default(false),

  // Analytics
  playCount: z.number().nullable().default(0),
  likeCount: z.number().nullable().default(0),
  downloadCount: z.number().nullable().default(0),
  shareCount: z.number().nullish(),
  strength: z.number().nullable().default(0),

  // Arrays — coerce null to empty array
  mood: z
    .array(z.string())
    .nullable()
    .default([])
    .transform(v => v ?? []),
  attributes: z
    .array(z.string())
    .nullable()
    .default([])
    .transform(v => v ?? []),

  // Relations
  artistId: z.string().nullish(),
  artistProfileId: z.string().nullish(),
  userId: z.string().nullish(),

  // Dates (stored as ISO strings in tool output)
  createdAt: z.union([z.string(), z.date()]).nullish(),
  updatedAt: z.union([z.string(), z.date()]).nullish(),

  // AI / recommendation
  reason: z.string().nullish(),

  // Streaming platform links (Spotify, Apple Music, YouTube, etc.)
  streamingLinks: z
    .array(z.object({ platform: z.string(), url: z.string() }))
    .nullable()
    .default([])
    .transform(v => v ?? []),

  // Embedded artist profile — enables the Artist tab in TrackInfoPanel
  artistProfile: EmbeddedArtistProfileSchema.nullish(),
});

export type TrackItem = z.infer<typeof TrackItemSchema>;

/**
 * Playlist as returned by discovery tools.
 */
export const PlaylistItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  coverImage: z.string().nullish(),
  coverImageUrl: z.string().nullish(),
  genre: z.string().nullish(),
  province: z.string().nullish(),
  trackCount: z.number().nullable().default(0),
  tags: z
    .array(z.string())
    .nullable()
    .default([])
    .transform(v => v ?? []),
  createdAt: z.union([z.string(), z.date()]).nullish(),
  updatedAt: z.union([z.string(), z.date()]).nullish(),
});

export type PlaylistItem = z.infer<typeof PlaylistItemSchema>;

/**
 * Artist profile as returned by the get_artist tool.
 */
export const ArtistItemSchema = z.object({
  id: z.string(),
  artistName: z.string(),
  bio: z.string().nullish(),
  genre: z.string().nullish(),
  location: z.string().nullish(),
  profileImageUrl: z.string().nullish(),
  isVerified: z.boolean().nullable().default(false),
  totalPlays: z.number().nullable().default(0),
  totalLikes: z.number().nullable().default(0),
  profileViews: z.number().nullable().default(0),
  trackCount: z.number().nullable().default(0),
  socialLinks: z.unknown().nullish(),
  streamingLinks: z.unknown().nullish(),
  tracks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        genre: z.string().nullish(),
        playCount: z.number().nullable().default(0),
      })
    )
    .nullable()
    .default([])
    .transform(v => v ?? []),
});

export type ArtistItem = z.infer<typeof ArtistItemSchema>;

/**
 * Genre as returned by the get_genres tool.
 */
export const GenreItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  trackCount: z.number().default(0),
  colorHex: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export type GenreItem = z.infer<typeof GenreItemSchema>;

/**
 * Timeline post as returned by timeline tools.
 */
export const TimelinePostAuthorSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().optional(),
  image: z.string().nullable().optional(),
});

export const TimelinePostItemSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  postType: z.string(),
  description: z.string().nullable().optional(),
  content: z.unknown().optional(),
  coverImageUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  songUrl: z.string().nullable().optional(),
  author: TimelinePostAuthorSchema,
  publishedAt: z.union([z.string(), z.date()]).optional(),
  likeCount: z.number().default(0),
  commentCount: z.number().default(0),
  shareCount: z.number().default(0),
  viewCount: z.number().default(0),
});

export type TimelinePostItem = z.infer<typeof TimelinePostItemSchema>;

// ---------------------------------------------------------------------------
// Per-tool output schemas
// ---------------------------------------------------------------------------

export const SearchTracksOutputSchema = z.object({
  tracks: z.array(TrackItemSchema),
  count: z.number(),
});

export const SearchTracksByThemeOutputSchema = z.object({
  tracks: z.array(TrackItemSchema),
  count: z.number(),
  searchedMoods: z.array(z.string()).default([]),
  searchedAttributes: z.array(z.string()).default([]),
});

export const GetTracksByGenreOutputSchema = z.object({
  tracks: z.array(TrackItemSchema),
  genre: z.string().optional(),
  count: z.number(),
});

export const GetTrendingTracksOutputSchema = z.object({
  tracks: z.array(TrackItemSchema),
  count: z.number(),
});

export const GetTrackOutputSchema = z.object({
  track: TrackItemSchema.nullable(),
});

export const GetPlaylistsByGenreOutputSchema = z.object({
  playlists: z.array(PlaylistItemSchema),
  genre: z.string().optional(),
  count: z.number(),
});

export const GetPlaylistsByProvinceOutputSchema = z.object({
  playlists: z.array(PlaylistItemSchema),
  province: z.string().optional(),
  count: z.number(),
});

export const GetTopChartsOutputSchema = z.object({
  playlists: z.array(PlaylistItemSchema),
  count: z.number(),
});

export const GetFeaturedPlaylistsOutputSchema = z.object({
  playlists: z.array(PlaylistItemSchema),
  count: z.number(),
});

export const GetArtistOutputSchema = z.object({
  artist: ArtistItemSchema.nullable(),
});

export const SearchArtistsOutputSchema = z.object({
  artists: z.array(ArtistItemSchema),
  count: z.number(),
});

export const GetGenresOutputSchema = z.object({
  genres: z.array(GenreItemSchema),
  count: z.number(),
});

export const SearchTimelinePostsOutputSchema = z.object({
  posts: z.array(TimelinePostItemSchema),
  total: z.number(),
});

export const GetTimelineFeedOutputSchema = z.object({
  posts: z.array(TimelinePostItemSchema),
  total: z.number(),
  hasMore: z.boolean().default(false),
});
