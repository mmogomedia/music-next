import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/admin/playlists-dynamic - List all playlists with dynamic types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playlistTypeId = searchParams.get('playlistTypeId');
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | null;
    const submissionStatus = searchParams.get('submissionStatus') as
      | 'OPEN'
      | 'CLOSED'
      | null;
    const province = searchParams.get('province');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (playlistTypeId) where.playlistTypeId = playlistTypeId;
    if (status) where.status = status;
    if (submissionStatus) where.submissionStatus = submissionStatus;
    if (province) where.province = province;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where,
        include: {
          playlistType: true,
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              submissions: {
                where: { status: 'PENDING' },
              },
              tracks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.playlist.count({ where }),
    ]);

    return NextResponse.json({
      playlists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/playlists-dynamic - Create new playlist with dynamic type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      playlistTypeId,
      coverImage,
      maxTracks,
      maxSubmissionsPerArtist,
      province,
    } = body;

    // Validate required fields
    if (
      !name ||
      !playlistTypeId ||
      !coverImage ||
      !maxTracks ||
      !maxSubmissionsPerArtist
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get playlist type to validate constraints
    const playlistType = await prisma.playlistTypeDefinition.findUnique({
      where: { id: playlistTypeId },
    });

    if (!playlistType) {
      return NextResponse.json(
        { error: 'Invalid playlist type' },
        { status: 400 }
      );
    }

    if (!playlistType.isActive) {
      return NextResponse.json(
        { error: 'Cannot create playlist with inactive type' },
        { status: 400 }
      );
    }

    // Validate playlist type limits
    if (playlistType.maxInstances !== -1) {
      const existingCount = await prisma.playlist.count({
        where: {
          playlistTypeId,
          status: 'ACTIVE',
        },
      });

      if (existingCount >= playlistType.maxInstances) {
        return NextResponse.json(
          {
            error: `Maximum ${playlistType.maxInstances} active ${playlistType.name} playlist(s) allowed`,
          },
          { status: 400 }
        );
      }
    }

    // Validate province requirement
    if (playlistType.requiresProvince && !province) {
      return NextResponse.json(
        { error: `Province is required for ${playlistType.name} playlists` },
        { status: 400 }
      );
    }

    // Validate province uniqueness for province playlists
    if (playlistType.requiresProvince && province) {
      const existingProvince = await prisma.playlist.findFirst({
        where: {
          playlistTypeId,
          province,
          status: 'ACTIVE',
        },
      });

      if (existingProvince) {
        return NextResponse.json(
          {
            error: `Only one ${province} ${playlistType.name} playlist can be active at a time`,
          },
          { status: 400 }
        );
      }
    }

    // Get next order number for this type
    const lastPlaylist = await prisma.playlist.findFirst({
      where: { playlistTypeId },
      orderBy: { order: 'desc' },
    });
    const order = (lastPlaylist?.order || 0) + 1;

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description,
        playlistTypeId,
        coverImage,
        maxTracks,
        maxSubmissionsPerArtist,
        province: playlistType.requiresProvince ? province : null,
        createdBy: session.user.id,
        order,
      },
      include: {
        playlistType: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            submissions: {
              where: { status: 'PENDING' },
            },
            tracks: true,
          },
        },
      },
    });

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
