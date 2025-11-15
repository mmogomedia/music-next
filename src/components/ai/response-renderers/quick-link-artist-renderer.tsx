'use client';

import type { QuickLinkArtistResponse } from '@/types/ai-responses';
import QuickLinkArtistView from '@/components/quick-links/ArtistLandingView';
import type { TrackLandingData } from '@/lib/services/quick-link-service';

interface QuickLinkArtistRendererProps {
  response: QuickLinkArtistResponse;
}

const normalizeTrack = (
  track: QuickLinkArtistResponse['data']['artist']['topTracks'][number]
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

export function QuickLinkArtistRenderer({
  response,
}: QuickLinkArtistRendererProps) {
  const artistData = {
    profile: {
      artistName: response.data.artist.artistName,
      bio: response.data.artist.bio ?? null,
      profileImage: response.data.artist.profileImage ?? null,
      location: response.data.artist.location ?? null,
      genre: response.data.artist.genre ?? null,
      slug: response.data.artist.slug ?? null,
    },
    socialLinks: response.data.artist.socialLinks ?? null,
    streamingLinks: response.data.artist.streamingLinks ?? null,
    topTracks: response.data.artist.topTracks.map(normalizeTrack),
  };

  return (
    <QuickLinkArtistView
      artist={artistData}
      quickLinkSlug={response.data.quickLink.slug}
    />
  );
}
