import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/artists/by-ids
 * Fetch multiple artist profiles by their IDs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ artists: [] });
    }

    const ids = idsParam.split(',').filter(id => id.trim().length > 0);

    if (ids.length === 0) {
      return NextResponse.json({ artists: [] });
    }

    const artists = await prisma.artistProfile.findMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
      select: {
        id: true,
        artistName: true,
        slug: true,
        profileImage: true,
        coverImage: true,
        isUnclaimed: true,
      },
    });

    // Transform to match ArtistOption interface
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
      tracks: [], // Not needed for selected artists display
    }));

    // Maintain order based on input IDs
    const orderedResults = ids
      .map(id => results.find(a => a.id === id))
      .filter((a): a is (typeof results)[0] => a !== undefined);

    return NextResponse.json({ artists: orderedResults });
  } catch (error) {
    console.error('Error fetching artists by IDs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}
