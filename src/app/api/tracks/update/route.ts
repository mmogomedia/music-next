import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      trackId,
      title,
      artist,
      album,
      genre,
      composer,
      year,
      releaseDate,
      bpm,
      isrc,
      description,
      lyrics,
      isPublic,
      isDownloadable,
      isExplicit,
      copyrightInfo,
      licenseType,
      distributionRights,
      albumArtwork,
    } = body;

    // Validate required fields
    if (!trackId || !title?.trim()) {
      return NextResponse.json(
        { error: 'Track ID and title are required' },
        { status: 400 }
      );
    }

    // Check if track exists and belongs to user
    const existingTrack = await prisma.track.findFirst({
      where: {
        id: trackId,
        userId: session.user.id,
      },
    });

    if (!existingTrack) {
      return NextResponse.json(
        { error: 'Track not found or access denied' },
        { status: 404 }
      );
    }

    // Generate unique URL if title changed
    let uniqueUrl = existingTrack.uniqueUrl;
    if (title !== existingTrack.title) {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check for uniqueness and add suffix if needed
      let slug = baseSlug;
      let counter = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const existing = await prisma.track.findFirst({
          where: { uniqueUrl: slug },
        });
        if (!existing || existing.id === trackId) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      uniqueUrl = slug;
    }

    // Update track
    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: {
        title: title.trim(),
        uniqueUrl,
        artist: artist?.trim() || null,
        album: album?.trim() || null,
        genre: genre?.trim() || null,
        composer: composer?.trim() || null,
        year: year || null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        bpm: bpm || null,
        isrc: isrc?.trim() || null,
        description: description?.trim() || null,
        lyrics: lyrics?.trim() || null,
        isPublic: Boolean(isPublic),
        isDownloadable: Boolean(isDownloadable && isPublic), // Can't be downloadable if not public
        isExplicit: Boolean(isExplicit),
        copyrightInfo: copyrightInfo?.trim() || null,
        licenseType: licenseType?.trim() || null,
        distributionRights: distributionRights?.trim() || null,
        albumArtwork: albumArtwork?.trim() || null,
        updatedAt: new Date(),
      },
      include: {
        artistProfile: {
          select: {
            artistName: true,
            slug: true,
          },
        },
      },
    });

    // Construct full URL from file path
    const trackWithUrl = {
      ...updatedTrack,
      fileUrl: constructFileUrl(updatedTrack.filePath),
    };

    return NextResponse.json({
      success: true,
      track: trackWithUrl,
    });
  } catch (error) {
    console.error('Error updating track:', error);
    return NextResponse.json(
      { error: 'Failed to update track' },
      { status: 500 }
    );
  }
}
