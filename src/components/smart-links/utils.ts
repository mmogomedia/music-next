import type { Track } from '@/types/track';
import type { TrackLandingData } from '@/lib/services/quick-link-service';

export const mapLandingTrackToPlayerTrack = (
  track: TrackLandingData
): Track => {
  const releaseDateString = track.releaseDate
    ? track.releaseDate instanceof Date
      ? track.releaseDate.toISOString()
      : String(track.releaseDate)
    : undefined;

  return {
    id: track.id,
    title: track.title,
    filePath: track.filePath,
    fileUrl: track.fileUrl ?? '',
    coverImageUrl: track.coverImageUrl ?? track.albumArtwork ?? undefined,
    albumArtwork: track.albumArtwork ?? undefined,
    genre: track.genre ?? undefined,
    album: track.album ?? undefined,
    description: track.description ?? undefined,
    duration: track.duration ?? undefined,
    playCount: 0,
    likeCount: 0,
    artistId: track.id,
    artistProfileId: undefined,
    userId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    artist: track.artist ?? undefined,
    composer: undefined,
    year: undefined,
    releaseDate: releaseDateString,
    bpm: track.bpm ?? undefined,
    isrc: undefined,
    lyrics: undefined,
    isPublic: true,
    isDownloadable: track.isDownloadable,
    isExplicit: false,
    watermarkId: undefined,
    copyrightInfo: undefined,
    licenseType: undefined,
    distributionRights: undefined,
    downloadCount: undefined,
    shareCount: undefined,
  } as Track;
};
