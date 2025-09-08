import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      filePath,
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
      isPublic = true,
      isDownloadable = false,
      isExplicit = false,
      copyrightInfo,
      licenseType = 'All Rights Reserved',
      distributionRights,
      albumArtwork,
      duration,
      fileSize,
      bitrate,
      sampleRate,
      channels,
    } = body;

    // Validate required fields
    if (!title?.trim() || !filePath) {
      return NextResponse.json(
        { error: 'Title and file path are required' },
        { status: 400 }
      );
    }

    // Get user's artist profile
    const artistProfile = await prisma.artistProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile required to create tracks' },
        { status: 400 }
      );
    }

    // Generate unique URL
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.track.findFirst({
        where: { uniqueUrl: slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create track
    const newTrack = await prisma.track.create({
      data: {
        title: title.trim(),
        filePath,
        uniqueUrl: slug,
        artist: artist?.trim() || artistProfile.artistName,
        album: album?.trim() || null,
        genre: genre?.trim() || null,
        composer: composer?.trim() || null,
        year: year || new Date().getFullYear(),
        releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
        bpm: bpm || null,
        isrc: isrc?.trim() || null,
        description: description?.trim() || null,
        lyrics: lyrics?.trim() || null,
        isPublic: Boolean(isPublic),
        isDownloadable: Boolean(isDownloadable && isPublic),
        isExplicit: Boolean(isExplicit),
        copyrightInfo: copyrightInfo?.trim() || null,
        licenseType: licenseType?.trim() || 'All Rights Reserved',
        distributionRights: distributionRights?.trim() || null,
        albumArtwork: albumArtwork?.trim() || null,
        duration: duration || null,
        fileSize: fileSize || null,
        bitrate: bitrate || null,
        sampleRate: sampleRate || null,
        channels: channels || null,
        artistProfileId: artistProfile.id,
        userId: session.user.id,
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

    return NextResponse.json({
      success: true,
      track: newTrack,
    });
  } catch (error) {
    console.error('Error creating track:', error);
    return NextResponse.json(
      { error: 'Failed to create track' },
      { status: 500 }
    );
  }
}
