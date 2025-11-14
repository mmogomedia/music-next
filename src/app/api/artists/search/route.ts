import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/artists/search
 * Search for artist profiles by name or slug
 * Returns artists with profile images and up to 3 tracks for identification
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ artists: [] });
    }

    // Search by artist name or slug (case-insensitive)
    const artists = await prisma.artistProfile.findMany({
      where: {
        isActive: true,
        OR: [
          { artistName: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        tracks: {
          where: {
            isPublic: true,
          },
          take: 3,
          orderBy: {
            playCount: 'desc',
          },
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            albumArtwork: true,
            playCount: true,
          },
        },
      },
      take: 20,
      orderBy: {
        totalPlays: 'desc',
      },
    });

    // Transform results to include full URLs and track previews
    const results = artists.map(artist => ({
      id: artist.id,
      name: artist.artistName,
      slug: artist.slug,
      profileImage: artist.profileImage
        ? constructFileUrl(artist.profileImage)
        : null,
      coverImage: artist.coverImage
        ? constructFileUrl(artist.coverImage)
        : null,
      isUnclaimed: artist.isUnclaimed,
      tracks: artist.tracks.map(track => ({
        id: track.id,
        title: track.title,
        coverImage: track.coverImageUrl
          ? constructFileUrl(track.coverImageUrl)
          : track.albumArtwork
            ? constructFileUrl(track.albumArtwork)
            : null,
        playCount: track.playCount,
      })),
    }));

    return NextResponse.json({ artists: results });
  } catch (error) {
    console.error('Error searching artists:', error);
    return NextResponse.json(
      { error: 'Failed to search artists' },
      { status: 500 }
    );
  }
}
