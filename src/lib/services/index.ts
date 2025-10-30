/**
 * Services
 *
 * Central export for all service modules.
 * Services provide direct database access to be used by both API routes and AI agents.
 *
 * @module services
 */

export {
  MusicService,
  type TrackWithArtist,
  type SearchTracksOptions,
  type TrackMetadata,
} from './music-service';
export {
  PlaylistService,
  type PlaylistWithTracks,
  type PlaylistInfo,
} from './playlist-service';
export {
  ArtistService,
  type ArtistWithTracks,
  type ArtistProfileComplete,
} from './artist-service';
export {
  AnalyticsService,
  type TrendingTrack,
  type GenreStats,
  type ProvinceStats,
} from './analytics-service';
