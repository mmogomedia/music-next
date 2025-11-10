'use client';

import type { QuickLinkAlbumResponse } from '@/types/ai-responses';
import QuickLinkAlbumView from '@/components/quick-links/AlbumLandingView';
import type { TrackLandingData } from '@/lib/services/quick-link-service';

interface QuickLinkAlbumRendererProps {
  response: QuickLinkAlbumResponse;
}

const normalizeTrack = (
  track: QuickLinkAlbumResponse['data']['album']['tracks'][number]
): TrackLandingData => ({
  id: track.id,
  title: track.title,
  artist: track.artist ?? null,
  album: track.album ?? null,
  albumArtwork: track.albumArtwork ?? null,
  coverImageUrl: track.coverImageUrl ?? null,
  duration: track.duration ?? null,
  description: track.description ?? null,
  genre: track.genre ?? null,
  bpm: track.bpm ?? null,
  releaseDate: track.releaseDate ? new Date(track.releaseDate) : null,
  isDownloadable: track.isDownloadable ?? false,
  filePath: track.filePath,
  fileUrl: track.fileUrl ?? null,
  streamingLinks: track.streamingLinks,
});

export function QuickLinkAlbumRenderer({
  response,
}: QuickLinkAlbumRendererProps) {
  const albumData = {
    albumName: response.data.album.albumName,
    artist: response.data.album.artistName
      ? {
          artistName: response.data.album.artistName,
          slug: response.data.album.artistSlug ?? null,
        }
      : null,
    tracks: response.data.album.tracks.map(normalizeTrack),
  };

  return (
    <QuickLinkAlbumView
      album={albumData}
      quickLinkSlug={response.data.quickLink.slug}
    />
  );
}
