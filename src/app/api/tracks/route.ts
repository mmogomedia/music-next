import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tracks = await prisma.track.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        artistProfile: {
          select: {
            id: true,
            artistName: true,
            slug: true,
            profileImage: true,
            coverImage: true,
            isUnclaimed: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Collect all unique artist IDs
    const allArtistIds = new Set<string>();
    tracks.forEach(track => {
      track.primaryArtistIds?.forEach(id => allArtistIds.add(id));
      track.featuredArtistIds?.forEach(id => allArtistIds.add(id));
    });

    // Fetch all artist profiles in one query
    const artistProfiles =
      Array.from(allArtistIds).length > 0
        ? await prisma.artistProfile.findMany({
            where: { id: { in: Array.from(allArtistIds) } },
            select: {
              id: true,
              artistName: true,
              slug: true,
              profileImage: true,
              coverImage: true,
              isUnclaimed: true,
              bio: true,
              location: true,
              website: true,
              genre: true,
              isVerified: true,
              totalPlays: true,
              totalLikes: true,
              totalFollowers: true,
            },
          })
        : [];

    // Enrich tracks with artist data
    const tracksWithUrls = tracks.map(track => {
      const primaryArtists = (track.primaryArtistIds || [])
        .map(id => artistProfiles.find(a => a.id === id))
        .filter((a): a is (typeof artistProfiles)[0] => a !== undefined)
        .map(artist => ({
          ...artist,
          profileImage: artist.profileImage
            ? constructFileUrl(artist.profileImage)
            : null,
          coverImage: artist.coverImage
            ? constructFileUrl(artist.coverImage)
            : null,
        }));

      const featuredArtists = (track.featuredArtistIds || [])
        .map(id => artistProfiles.find(a => a.id === id))
        .filter((a): a is (typeof artistProfiles)[0] => a !== undefined)
        .map(artist => ({
          ...artist,
          profileImage: artist.profileImage
            ? constructFileUrl(artist.profileImage)
            : null,
          coverImage: artist.coverImage
            ? constructFileUrl(artist.coverImage)
            : null,
        }));

      return {
        ...track,
        fileUrl: constructFileUrl(track.filePath),
        primaryArtists,
        featuredArtists,
        // Legacy fields for backward compatibility
        artistProfile: track.artistProfile
          ? {
              ...track.artistProfile,
              profileImage: track.artistProfile.profileImage
                ? constructFileUrl(track.artistProfile.profileImage)
                : null,
              coverImage: track.artistProfile.coverImage
                ? constructFileUrl(track.artistProfile.coverImage)
                : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      tracks: tracksWithUrls,
      count: tracksWithUrls.length,
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
