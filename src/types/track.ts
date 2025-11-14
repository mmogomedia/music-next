export interface Track {
  id: string;
  title: string;
  filePath: string;
  fileUrl?: string; // Optional for backward compatibility
  coverImageUrl?: string;
  genre?: string;
  album?: string;
  description?: string;
  duration?: number;
  playCount: number;
  likeCount?: number;
  artistId: string; // Unified field name
  artistProfileId?: string; // Keep for backward compatibility
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Additional metadata
  artist?: string; // Legacy field - kept for backward compatibility
  primaryArtistIds?: string[]; // Array of ArtistProfile IDs (ordered)
  featuredArtistIds?: string[]; // Array of ArtistProfile IDs
  composer?: string;
  year?: number;
  releaseDate?: string;
  bpm?: number;
  isrc?: string;
  lyrics?: string;
  genreId?: string; // Genre reference ID

  // Privacy & Access Control
  isPublic?: boolean;
  isDownloadable?: boolean;
  isExplicit?: boolean;

  // File Protection
  watermarkId?: string;
  copyrightInfo?: string;
  licenseType?: string;
  distributionRights?: string;
  albumArtwork?: string;

  // Analytics
  downloadCount?: number;
  shareCount?: number;

  // Recommendation reasons (for AI recommendations)
  reason?: string;

  // Completion & Language
  completionPercentage?: number; // 0-100
  language?: string; // ISO 639-1 code
}
