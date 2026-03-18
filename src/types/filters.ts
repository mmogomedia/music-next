/**
 * Database Filter Types
 *
 * Type-safe filter interfaces for Prisma where clauses.
 * These replace all instances of `const where: any = {}` in API routes.
 */

import type {
  UserRole,
  PlaylistStatus,
  SubmissionStatus,
  TrackSubmissionStatus,
  PostType,
} from '@prisma/client';

// ============================================================================
// USER FILTERS
// ============================================================================

/**
 * Type-safe filter for User queries
 * Used in: /src/app/api/admin/users/route.ts
 */
export interface UserWhereInput {
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    email?: { contains: string; mode: 'insensitive' };
    artistProfile?: {
      artistName?: { contains: string; mode: 'insensitive' };
    };
  }>;
  role?: UserRole;
  isActive?: boolean;
  isPremium?: boolean;
  emailVerified?: {
    not: null;
  } | null;
}

// ============================================================================
// PLAYLIST FILTERS
// ============================================================================

/**
 * Type-safe filter for Playlist queries
 * Used in: /src/app/api/admin/playlists-dynamic/route.ts
 */
export interface PlaylistWhereInput {
  status?: PlaylistStatus;
  submissionStatus?: SubmissionStatus;
  playlistTypeId?: string;
  province?: string;
  name?: {
    contains: string;
    mode: 'insensitive';
  };
  description?: {
    contains: string;
    mode: 'insensitive';
  };
  createdBy?: string;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
  }>;
}

/**
 * Type-safe filter for available playlists
 * Used in: /src/app/api/playlists/available/route.ts
 */
export interface AvailablePlaylistWhereInput {
  status: PlaylistStatus;
  submissionStatus: SubmissionStatus;
  playlistTypeId?: string;
  province?: string;
  OR?: Array<{
    maxTracks?: { gt: any }; // Dynamic comparison
    currentTracks?: { lt: any }; // Dynamic comparison
  }>;
}

// ============================================================================
// PLAYLIST SUBMISSION FILTERS
// ============================================================================

/**
 * Type-safe filter for Playlist Submission queries
 * Used in: /src/app/api/admin/submissions/route.ts
 */
export interface PlaylistSubmissionWhereInput {
  status?: TrackSubmissionStatus;
  playlistId?: string;
  artistId?: string;
  submittedAt?: {
    gte?: Date;
    lte?: Date;
  };
  playlist?: {
    name?: {
      contains: string;
      mode: 'insensitive';
    };
  };
  track?: {
    title?: {
      contains: string;
      mode: 'insensitive';
    };
  };
}

/**
 * Type-safe filter for artist submissions
 * Used in: /src/app/api/playlists/submissions/route.ts
 */
export interface ArtistSubmissionWhereInput {
  artistId: string;
  status?: TrackSubmissionStatus;
  playlistId?: string;
}

// ============================================================================
// TRACK FILTERS
// ============================================================================

/**
 * Type-safe filter for Track queries
 * Used in: /src/app/api/tracks/route.ts
 */
export interface TrackWhereInput {
  userId?: string;
  isPublic?: boolean;
  genreId?: string;
  title?: {
    contains: string;
    mode: 'insensitive';
  };
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    album?: { contains: string; mode: 'insensitive' };
    artist?: { contains: string; mode: 'insensitive' };
  }>;
  primaryArtistIds?: {
    hasSome: string[];
  };
  featuredArtistIds?: {
    hasSome: string[];
  };
  completionPercentage?: {
    gte?: number;
    lte?: number;
  };
}

// ============================================================================
// TIMELINE POST FILTERS
// ============================================================================

/**
 * Type-safe filter for Timeline Post queries
 * Used in: /src/app/api/admin/timeline-posts/route.ts
 */
export interface TimelinePostWhereInput {
  postType?: PostType | string;
  status?: string;
  isActive?: boolean;
  authorId?: string;
  title?: {
    contains: string;
    mode: 'insensitive';
  };
  description?: {
    contains: string;
    mode: 'insensitive';
  };
  content?: any; // JSON field - more flexible
  OR?: Array<{
    title?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
    content?: any;
    author?: {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
    };
  }>;
  AND?: any; // More flexible for complex queries
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

// ============================================================================
// ARTIST PROFILE FILTERS
// ============================================================================

/**
 * Type-safe filter for Artist Profile queries
 * Used in: /src/app/api/artist-profile/route.ts
 */
export interface ArtistProfileWhereInput {
  userId?: string;
  artistName?: {
    contains: string;
    mode: 'insensitive';
  };
  isVerified?: boolean;
  province?: string;
  genres?: {
    hasSome: string[];
  };
}

// ============================================================================
// GENRE FILTERS
// ============================================================================

/**
 * Type-safe filter for Genre queries
 * Used in: /src/app/api/admin/genres/route.ts
 */
export interface GenreWhereInput {
  parentId?: string | null;
  isActive?: boolean;
  name?: {
    contains: string;
    mode: 'insensitive';
  };
}

// ============================================================================
// SMART LINK FILTERS
// ============================================================================

/**
 * Type-safe filter for SmartLink queries
 */
export interface SmartLinkWhereInput {
  userId?: string;
  slug?: string;
  type?: 'TRACK' | 'ARTIST' | 'ALBUM';
  isActive?: boolean;
}

/**
 * Type-safe filter for QuickLink queries
 */
export interface QuickLinkWhereInput {
  userId?: string;
  slug?: string;
  type?: 'TRACK' | 'ARTIST' | 'ALBUM';
  isActive?: boolean;
}

// ============================================================================
// AI CONVERSATION FILTERS
// ============================================================================

/**
 * Type-safe filter for AI Conversation queries
 */
export interface AIConversationWhereInput {
  userId?: string;
  isActive?: boolean;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic Prisma date filter
 */
export interface DateFilter {
  gte?: Date;
  lte?: Date;
  gt?: Date;
  lt?: Date;
  equals?: Date;
  not?: Date;
}

/**
 * Generic Prisma string filter
 */
export interface StringFilter {
  equals?: string;
  not?: string;
  in?: string[];
  notIn?: string[];
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: 'default' | 'insensitive';
}

/**
 * Generic Prisma number filter
 */
export interface NumberFilter {
  equals?: number;
  not?: number;
  in?: number[];
  notIn?: number[];
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
}

/**
 * Generic Prisma boolean filter
 */
export interface BooleanFilter {
  equals?: boolean;
  not?: boolean;
}
