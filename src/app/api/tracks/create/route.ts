import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';
import { calculateTrackCompletion } from '@/lib/utils/track-completion';
import type { TrackEditorValues } from '@/components/track/TrackEditor';

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
      artist, // Legacy field
      primaryArtistIds,
      featuredArtistIds,
      album,
      genre,
      genreId,
      composer,
      year,
      releaseDate,
      bpm,
      isrc,
      description,
      lyrics,
      language,
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

    // Validate at least one primary artist
    if (
      (!primaryArtistIds || primaryArtistIds.length === 0) &&
      !artist?.trim()
    ) {
      return NextResponse.json(
        { error: 'At least one primary artist is required' },
        { status: 400 }
      );
    }

    // Validate no duplicates between primary and featured
    if (primaryArtistIds && featuredArtistIds) {
      const duplicates = primaryArtistIds.filter((id: string) =>
        featuredArtistIds.includes(id)
      );
      if (duplicates.length > 0) {
        return NextResponse.json(
          { error: 'An artist cannot be both primary and featured' },
          { status: 400 }
        );
      }
    }

    // Get user's artist profile (for legacy support)
    const userArtistProfile = await prisma.artistProfile.findFirst({
      where: { userId: session.user.id },
    });

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

    // If genreId is provided, fetch the genre name for backward compatibility
    let genreName = genre?.trim() || null;
    if (genreId) {
      const genreRecord = await prisma.genre.findUnique({
        where: { id: genreId },
        select: { name: true },
      });
      if (genreRecord) {
        genreName = genreRecord.name;
      }
    }

    // Generate legacy artist string from primary artists if not provided
    let legacyArtist = artist?.trim() || null;
    if (primaryArtistIds && primaryArtistIds.length > 0 && !legacyArtist) {
      const primaryArtists = await prisma.artistProfile.findMany({
        where: { id: { in: primaryArtistIds } },
        select: { id: true, artistName: true },
      });
      // Sort to match the order of primaryArtistIds
      const sortedArtists = primaryArtistIds
        .map((id: string) =>
          primaryArtists.find(
            (a: { id: string; artistName: string }) => a.id === id
          )
        )
        .filter(
          (
            a: { id: string; artistName: string } | undefined
          ): a is { id: string; artistName: string } => a !== undefined
        );
      legacyArtist = sortedArtists
        .map((a: { id: string; artistName: string }) => a.artistName)
        .join(', ');
    } else if (!legacyArtist && userArtistProfile) {
      legacyArtist = userArtistProfile.artistName;
    }

    // Use first primary artist as legacy artistProfileId for backward compatibility
    const legacyArtistProfileId =
      primaryArtistIds && primaryArtistIds.length > 0
        ? primaryArtistIds[0]
        : userArtistProfile?.id || null;

    // Calculate completion percentage
    const trackData: TrackEditorValues = {
      title: title.trim(),
      primaryArtistIds: primaryArtistIds || [],
      featuredArtistIds: featuredArtistIds || [],
      album: album?.trim() || undefined,
      genre: genreName || undefined,
      genreId: genreId || undefined,
      composer: composer?.trim() || undefined,
      year: year || undefined,
      releaseDate: releaseDate || undefined,
      bpm: bpm || undefined,
      isrc: isrc?.trim() || undefined,
      description: description?.trim() || undefined,
      lyrics: lyrics?.trim() || undefined,
      language: language || undefined,
      isPublic: Boolean(isPublic),
      isDownloadable: Boolean(isDownloadable && isPublic),
      isExplicit: Boolean(isExplicit),
      copyrightInfo: copyrightInfo?.trim() || undefined,
      licenseType: licenseType?.trim() || 'All Rights Reserved',
      distributionRights: distributionRights?.trim() || undefined,
      albumArtwork: albumArtwork?.trim() || undefined,
    };
    const completion = calculateTrackCompletion(trackData);

    // Create track
    const newTrack = await prisma.track.create({
      data: {
        title: title.trim(),
        filePath,
        uniqueUrl: slug,
        artist: legacyArtist,
        artistProfileId: legacyArtistProfileId,
        primaryArtistIds: primaryArtistIds || [],
        featuredArtistIds: featuredArtistIds || [],
        album: album?.trim() || null,
        genre: genreName,
        genreId: genreId || null,
        composer: composer?.trim() || null,
        year: year || new Date().getFullYear(),
        releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
        bpm: bpm || null,
        isrc: isrc?.trim() || null,
        description: description?.trim() || null,
        lyrics: lyrics?.trim() || null,
        language: language && language !== 'auto' ? language : null,
        completionPercentage: completion.percentage,
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
    });

    // Fetch full ArtistProfile objects for primary and featured artists
    const allArtistIds = [
      ...(newTrack.primaryArtistIds || []),
      ...(newTrack.featuredArtistIds || []),
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
    const primaryArtists = (newTrack.primaryArtistIds || [])
      .map(id => artistProfiles.find(a => a.id === id))
      .filter((a): a is (typeof artistProfiles)[0] => a !== undefined);
    const featuredArtists = (newTrack.featuredArtistIds || [])
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

    // Construct response with full artist profiles
    const trackWithUrl = {
      ...newTrack,
      fileUrl: constructFileUrl(newTrack.filePath),
      // Include full artist profiles
      primaryArtists: primaryArtistsWithUrls,
      featuredArtists: featuredArtistsWithUrls,
      // Legacy fields for backward compatibility
      artist: legacyArtist,
      artistProfile: newTrack.artistProfile
        ? {
            ...newTrack.artistProfile,
            profileImage: newTrack.artistProfile.profileImage
              ? constructFileUrl(newTrack.artistProfile.profileImage)
              : null,
            coverImage: newTrack.artistProfile.coverImage
              ? constructFileUrl(newTrack.artistProfile.coverImage)
              : null,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      track: trackWithUrl,
    });
  } catch (error) {
    console.error('Error creating track:', error);
    return NextResponse.json(
      { error: 'Failed to create track' },
      { status: 500 }
    );
  }
}
