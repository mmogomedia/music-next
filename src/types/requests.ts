/**
 * Request Body Types
 *
 * Type-safe interfaces for API request bodies.
 * These replace all instances of update/create data with `any` types.
 */

import type {
  UserRole,
  PlaylistStatus,
  SubmissionStatus,
  TrackSubmissionStatus,
  PostType,
} from '@prisma/client';

// ============================================================================
// TRACK REQUESTS
// ============================================================================

/**
 * Track update input
 * Used in: /src/app/api/tracks/update/route.ts
 */
export interface TrackUpdateInput {
  title?: string;
  uniqueUrl?: string;
  artist?: string | null;
  album?: string | null;
  description?: string | null;
  genre?: string | null;
  genreId?: string | null;
  primaryArtistIds?: string[];
  featuredArtistIds?: string[];
  composer?: string | null;
  year?: number | null;
  releaseDate?: Date | null;
  bpm?: number | null;
  isrc?: string | null;
  lyrics?: string | null;
  isPublic?: boolean;
  isDownloadable?: boolean;
  isExplicit?: boolean;
  copyrightInfo?: string | null;
  licenseType?: string | null;
  distributionRights?: string | null;
  albumArtwork?: string | null;
  coverImageUrl?: string | null;
  filePath?: string;
  language?: string | null;
  attributes?: string[];
  mood?: string[];
  completionPercentage?: number;
  strength?: number;
  updatedAt?: Date;
  // Legacy fields for backward compatibility
  artistId?: string;
  artistProfileId?: string | null;
}

/**
 * Track create input
 * Used in: /src/app/api/tracks/create/route.ts
 */
export interface TrackCreateInput extends TrackUpdateInput {
  title: string;
  filePath: string;
  userId: string;
  duration?: number;
}

// ============================================================================
// ARTIST PROFILE REQUESTS
// ============================================================================

/**
 * Artist profile update input
 * Used in: /src/app/api/artist-profile/route.ts
 */
export interface ArtistProfileUpdateInput {
  artistName?: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  bannerImage?: string;
  location?: string | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  stageName?: string;
  genre?: string | null;
  genreId?: string | null;
  genres?: string[];
  slug?: string;
  isVerified?: boolean;
  isPublic?: boolean;
  isActive?: boolean;
  socialLinks?: any;
  streamingLinks?: any;
  skills?: any;
}

/**
 * Artist profile create input
 */
export interface ArtistProfileCreateInput {
  artistName: string;
  bio?: string;
  profileImage?: string;
  userId?: string;
  province?: string;
  city?: string;
  genres?: string[];
}

// ============================================================================
// PLAYLIST REQUESTS
// ============================================================================

/**
 * Playlist create input
 * Used in: /src/app/api/admin/playlists-dynamic/route.ts
 */
export interface PlaylistCreateInput {
  name: string;
  description?: string;
  playlistTypeId: string;
  coverImage: string;
  maxTracks: number;
  maxSubmissionsPerArtist: number;
  province?: string;
  status?: PlaylistStatus;
  submissionStatus?: SubmissionStatus;
  order?: number;
  createdBy: string;
}

/**
 * Playlist update input
 */
export interface PlaylistUpdateInput {
  name?: string;
  description?: string;
  coverImage?: string;
  maxTracks?: number;
  maxSubmissionsPerArtist?: number;
  province?: string;
  status?: PlaylistStatus;
  submissionStatus?: SubmissionStatus;
  order?: number;
}

// ============================================================================
// PLAYLIST SUBMISSION REQUESTS
// ============================================================================

/**
 * Submit tracks to playlist
 * Used in: /src/app/api/playlists/[id]/submit/route.ts
 */
export interface PlaylistSubmitInput {
  trackIds: string[];
  message?: string;
}

/**
 * Review submission input
 * Used in: /src/app/api/admin/submissions/[id]/route.ts
 */
export interface SubmissionReviewInput {
  status: TrackSubmissionStatus;
  adminComment?: string;
  reviewedBy: string;
  reviewedAt: Date;
}

/**
 * Bulk review submissions
 */
export interface BulkReviewInput {
  submissionIds: string[];
  status: TrackSubmissionStatus;
  adminComment?: string;
  reviewedBy: string;
}

// ============================================================================
// USER REQUESTS
// ============================================================================

/**
 * User update input
 * Used in: /src/app/api/admin/users/[id]/route.ts
 */
export interface UserUpdateInput {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  isPremium?: boolean;
  image?: string;
  marketingConsent?: boolean;
  canPublishNews?: boolean;
}

/**
 * User create input (registration)
 */
export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  termsAcceptedAt?: Date;
  privacyAcceptedAt?: Date;
  marketingConsent?: boolean;
}

// ============================================================================
// TIMELINE POST REQUESTS
// ============================================================================

/**
 * Timeline post create input
 * Used in: /src/app/api/timeline/posts/route.ts
 */
export interface TimelinePostCreateInput {
  postType: PostType;
  content: string;
  visibility: string;
  authorId: string;
  mediaUrls?: string[];
  trackId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Timeline post update input
 */
export interface TimelinePostUpdateInput {
  content?: string;
  visibility?: string;
  isActive?: boolean;
  mediaUrls?: string[];
}

/**
 * Timeline comment create input
 */
export interface TimelineCommentCreateInput {
  postId: string;
  userId: string;
  content: string;
}

// ============================================================================
// SMART/QUICK LINK REQUESTS
// ============================================================================

/**
 * Link create input (for both smart and quick links)
 * Used in: /src/lib/services/link-service.ts
 */
export interface LinkCreateInput {
  type: 'TRACK' | 'ARTIST' | 'ALBUM';
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  userId: string;
  platformLinks: Array<{
    platform: string;
    url: string;
    icon?: string;
  }>;
  // Type-specific fields
  trackId?: string;
  artistId?: string;
  albumId?: string;
}

/**
 * Link update input
 */
export interface LinkUpdateInput {
  title?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  platformLinks?: Array<{
    id?: string;
    platform: string;
    url: string;
    icon?: string;
  }>;
}

// ============================================================================
// GENRE REQUESTS
// ============================================================================

/**
 * Genre create input
 * Used in: /src/app/api/admin/genres/route.ts
 */
export interface GenreCreateInput {
  name: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  order?: number;
  icon?: string;
  color?: string;
}

/**
 * Genre update input
 */
export interface GenreUpdateInput {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  order?: number;
  icon?: string;
  color?: string;
}

// ============================================================================
// AI CONVERSATION REQUESTS
// ============================================================================

/**
 * AI chat message input
 */
export interface AIChatMessageInput {
  conversationId?: string;
  message: string;
  userId: string;
  context?: Record<string, unknown>;
}

/**
 * AI preferences update input
 */
export interface AIPreferencesUpdateInput {
  userId: string;
  favoriteGenres?: string[];
  favoriteArtists?: string[];
  dislikedGenres?: string[];
  moodPreferences?: string[];
  languagePreferences?: string[];
}

// ============================================================================
// ANALYTICS REQUESTS
// ============================================================================

/**
 * Play event create input
 */
export interface PlayEventCreateInput {
  trackId: string;
  userId?: string;
  source: 'landing' | 'playlist' | 'search' | 'direct' | 'share';
  sourceId?: string;
  completionPercentage?: number;
  playedAt?: Date;
}

/**
 * Like event create input
 */
export interface LikeEventCreateInput {
  trackId: string;
  userId: string;
  likedAt?: Date;
}

/**
 * Share event create input
 */
export interface ShareEventCreateInput {
  trackId: string;
  userId?: string;
  platform: string;
  sharedAt?: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties of T optional and nullable
 */
export type PartialNullable<T> = {
  [P in keyof T]?: T[P] | null;
};

/**
 * Make specific properties of T required
 */
export type RequireProperties<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

/**
 * Omit specific properties and make the rest partial
 */
export type PartialOmit<T, K extends keyof T> = Partial<Omit<T, K>>;
