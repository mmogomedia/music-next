'use client';

import type { QuickLinkTrackResponse } from '@/types/ai-responses';
import QuickLinkTrackView from '@/components/quick-links/TrackLandingView';
import type { TrackLandingData } from '@/lib/services/quick-link-service';

interface QuickLinkTrackRendererProps {
  response: QuickLinkTrackResponse;
}

const normalizeTrack = (
  track: QuickLinkTrackResponse['data']['track']
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

export function QuickLinkTrackRenderer({
  response,
}: QuickLinkTrackRendererProps) {
  const track = normalizeTrack(response.data.track);

  return (
    <QuickLinkTrackView
      track={track}
      quickLinkSlug={response.data.quickLink.slug}
    />
  );
}
