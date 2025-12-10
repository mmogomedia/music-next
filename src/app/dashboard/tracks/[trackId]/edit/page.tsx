import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';
import TrackEditPageClient from '@/components/dashboard/artist/TrackEditPageClient';
import type { TrackEditorValues } from '@/components/track/TrackEditor';

interface EditTrackPageProps {
  params: Promise<{
    trackId: string;
  }>;
}

export default async function EditTrackPage({ params }: EditTrackPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { trackId } = await params;

  const profile = await prisma.artistProfile.findFirst({
    where: { userId: session.user.id },
  });

  if (!profile) {
    redirect('/profile/select');
  }

  const track = await prisma.track.findFirst({
    where: {
      id: trackId,
      userId: session.user.id,
    },
  });

  if (!track) {
    notFound();
  }

  const initialValues: TrackEditorValues = {
    id: track.id,
    title: track.title ?? '',
    artist: track.artist ?? profile.artistName ?? '',
    primaryArtistIds: track.primaryArtistIds ?? [],
    featuredArtistIds: track.featuredArtistIds ?? [],
    album: track.album ?? '',
    genre: track.genre ?? '',
    genreId: track.genreId ?? undefined,
    composer: track.composer ?? '',
    year: track.year ?? undefined,
    releaseDate:
      track.releaseDate instanceof Date
        ? track.releaseDate.toISOString().split('T')[0]
        : (track.releaseDate ?? ''),
    bpm: track.bpm ?? undefined,
    isrc: track.isrc ?? '',
    description: track.description ?? '',
    lyrics: track.lyrics ?? '',
    language: track.language ?? 'auto',
    isPublic: track.isPublic ?? true,
    isDownloadable: track.isDownloadable ?? false,
    isExplicit: track.isExplicit ?? false,
    copyrightInfo: track.copyrightInfo ?? '',
    licenseType: track.licenseType ?? 'All Rights Reserved',
    distributionRights: track.distributionRights ?? '',
    albumArtwork: track.albumArtwork
      ? constructFileUrl(track.albumArtwork)
      : '',
    attributes: Array.isArray(track.attributes) ? track.attributes : [],
    mood: Array.isArray(track.mood) ? track.mood : [],
  };

  return (
    <TrackEditPageClient
      trackId={track.id}
      initialValues={initialValues}
      trackTitle={track.title ?? 'Untitled Track'}
    />
  );
}
