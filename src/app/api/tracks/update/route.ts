import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';
import { calculateTrackCompletion } from '@/lib/utils/track-completion';
import type { TrackEditorValues } from '@/components/track/TrackEditor';

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
      const duplicates = primaryArtistIds.filter(id =>
        featuredArtistIds.includes(id)
      );
      if (duplicates.length > 0) {
        return NextResponse.json(
          { error: 'An artist cannot be both primary and featured' },
          { status: 400 }
        );
      }
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
    } else if (genreId === null || genreId === '') {
      // Explicitly clear genreId if empty string or null
      genreName = null;
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
          (a): a is { id: string; artistName: string } => a !== undefined
        );
      legacyArtist = sortedArtists
        .map((a: { id: string; artistName: string }) => a.artistName)
        .join(', ');
    }

    // Use first primary artist as legacy artistProfileId for backward compatibility
    const legacyArtistProfileId =
      primaryArtistIds && primaryArtistIds.length > 0
        ? primaryArtistIds[0]
        : existingTrack.artistProfileId;

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
      licenseType: licenseType?.trim() || undefined,
      distributionRights: distributionRights?.trim() || undefined,
      albumArtwork: albumArtwork?.trim() || undefined,
    };
    const completion = calculateTrackCompletion(trackData);

    // Build update data object - only include fields that exist in current schema
    // Note: After migration, language and completionPercentage will be available
    const updateData: any = {
      title: title.trim(),
      uniqueUrl,
      artist: legacyArtist,
      primaryArtistIds: primaryArtistIds || [],
      featuredArtistIds: featuredArtistIds || [],
      album: album?.trim() || null,
      genre: genreName,
      genreId: genreId || null,
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
    };

    // Include artistProfileId for backward compatibility (legacy field)
    // The primaryArtistIds array is the new way to handle artists
    // Only update if it's different from current value
    if (
      legacyArtistProfileId &&
      legacyArtistProfileId !== existingTrack.artistProfileId
    ) {
      updateData.artistProfileId = legacyArtistProfileId;
    } else if (!legacyArtistProfileId && existingTrack.artistProfileId) {
      // Clear it if we don't have a value but it was set before
      updateData.artistProfileId = null;
    }

    // Include new fields (available after migration)
    updateData.language = language && language !== 'auto' ? language : null;
    updateData.completionPercentage = completion.percentage;

    // Update track
    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: updateData,
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
      ...(updatedTrack.primaryArtistIds || []),
      ...(updatedTrack.featuredArtistIds || []),
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
    const primaryArtists = (updatedTrack.primaryArtistIds || [])
      .map(id => artistProfiles.find(a => a.id === id))
      .filter((a): a is (typeof artistProfiles)[0] => a !== undefined);
    const featuredArtists = (updatedTrack.featuredArtistIds || [])
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
      ...updatedTrack,
      fileUrl: constructFileUrl(updatedTrack.filePath),
      // Include full artist profiles
      primaryArtists: primaryArtistsWithUrls,
      featuredArtists: featuredArtistsWithUrls,
      // Legacy fields for backward compatibility
      artist: legacyArtist,
      artistProfile: updatedTrack.artistProfile
        ? {
            ...updatedTrack.artistProfile,
            profileImage: updatedTrack.artistProfile.profileImage
              ? constructFileUrl(updatedTrack.artistProfile.profileImage)
              : null,
            coverImage: updatedTrack.artistProfile.coverImage
              ? constructFileUrl(updatedTrack.artistProfile.coverImage)
              : null,
          }
        : null,
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
