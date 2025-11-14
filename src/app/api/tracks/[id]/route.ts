import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const track = await prisma.track.findUnique({
      where: { id },
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
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Fetch full ArtistProfile objects for primary and featured artists
    const allArtistIds = [
      ...(track.primaryArtistIds || []),
      ...(track.featuredArtistIds || []),
    ];
    const artistProfiles =
      allArtistIds.length > 0
        ? await prisma.artistProfile.findMany({
            where: { id: { in: allArtistIds } },
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

    // Separate into primary and featured
    const primaryArtists = (track.primaryArtistIds || [])
      .map(id => artistProfiles.find(a => a.id === id))
      .filter((a): a is (typeof artistProfiles)[0] => a !== undefined);
    const featuredArtists = (track.featuredArtistIds || [])
      .map(id => artistProfiles.find(a => a.id === id))
      .filter((a): a is (typeof artistProfiles)[0] => a !== undefined);

    // Construct full URLs for images
    const primaryArtistsWithUrls = primaryArtists.map(artist => ({
      ...artist,
      profileImage: artist.profileImage
        ? constructFileUrl(artist.profileImage)
        : null,
      coverImage: artist.coverImage
        ? constructFileUrl(artist.coverImage)
        : null,
    }));

    const featuredArtistsWithUrls = featuredArtists.map(artist => ({
      ...artist,
      profileImage: artist.profileImage
        ? constructFileUrl(artist.profileImage)
        : null,
      coverImage: artist.coverImage
        ? constructFileUrl(artist.coverImage)
        : null,
    }));

    // Construct full URL from file path
    const trackWithUrl = {
      ...track,
      fileUrl: constructFileUrl(track.filePath),
      // Include full artist profiles
      primaryArtists: primaryArtistsWithUrls,
      featuredArtists: featuredArtistsWithUrls,
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

    return NextResponse.json({
      track: trackWithUrl,
    });
  } catch (error) {
    console.error('Error fetching track:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track' },
      { status: 500 }
    );
  }
}
