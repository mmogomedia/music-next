import { NextRequest, NextResponse } from 'next/server';
import { ArtistService } from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/artist-profile/[slug] - Get public artist profile by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const artistProfile = await ArtistService.getArtistBySlug(slug);

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    // Transform to API response format (already includes URLs from service)
    return NextResponse.json({ artistProfile });
  } catch (error) {
    console.error('Error fetching public artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist profile' },
      { status: 500 }
    );
  }
}
