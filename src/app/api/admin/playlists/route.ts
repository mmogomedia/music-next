import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  PlaylistType,
  PlaylistStatus,
  SubmissionStatus,
} from '@/types/playlist';

// GET /api/admin/playlists - List all playlists with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as PlaylistType | null;
    const status = searchParams.get('status') as PlaylistStatus | null;
    const submissionStatus = searchParams.get(
      'submissionStatus'
    ) as SubmissionStatus | null;
    const province = searchParams.get('province');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (type) where.type = type;
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
        orderBy: [{ status: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
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
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

// POST /api/admin/playlists - Create new playlist
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
      type,
      coverImage,
      maxTracks,
      maxSubmissionsPerArtist,
      province,
    } = body;

    // Validate required fields
    if (
      !name ||
      !type ||
      !coverImage ||
      !maxTracks ||
      !maxSubmissionsPerArtist
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate playlist type limits
    if (type === 'FEATURED') {
      const existingFeatured = await prisma.playlist.findFirst({
        where: { type: 'FEATURED', status: 'ACTIVE' },
      });
      if (existingFeatured) {
        return NextResponse.json(
          { error: 'Only one featured playlist can be active at a time' },
          { status: 400 }
        );
      }
    }

    if (type === 'TOP_TEN') {
      const existingTopTen = await prisma.playlist.findFirst({
        where: { type: 'TOP_TEN', status: 'ACTIVE' },
      });
      if (existingTopTen) {
        return NextResponse.json(
          { error: 'Only one top ten playlist can be active at a time' },
          { status: 400 }
        );
      }
    }

    if (type === 'PROVINCE' && province) {
      const existingProvince = await prisma.playlist.findFirst({
        where: { type: 'PROVINCE', province, status: 'ACTIVE' },
      });
      if (existingProvince) {
        return NextResponse.json(
          { error: `Only one ${province} playlist can be active at a time` },
          { status: 400 }
        );
      }
    }

    // Get next order number
    const lastPlaylist = await prisma.playlist.findFirst({
      where: { type },
      orderBy: { order: 'desc' },
    });
    const order = (lastPlaylist?.order || 0) + 1;

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description,
        type,
        coverImage,
        maxTracks,
        maxSubmissionsPerArtist,
        province: type === 'PROVINCE' ? province : null,
        createdBy: session.user.id,
        order,
      },
      include: {
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
