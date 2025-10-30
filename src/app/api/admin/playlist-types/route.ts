import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/admin/playlist-types - Get all playlist types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const sortBy = searchParams.get('sortBy') || 'displayOrder';

    const playlistTypes = await prisma.playlistTypeDefinition.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { [sortBy]: sortBy === 'displayOrder' ? 'asc' : 'desc' },
    });

    return NextResponse.json({ playlistTypes });
  } catch (error) {
    console.error('Error fetching playlist types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/playlist-types - Create new playlist type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      icon,
      color,
      maxInstances,
      requiresProvince,
      defaultMaxTracks,
      displayOrder,
    } = body;

    // Validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingType = await prisma.playlistTypeDefinition.findUnique({
      where: { slug },
    });

    if (existingType) {
      return NextResponse.json(
        { error: 'A playlist type with this slug already exists' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        {
          error:
            'Slug must contain only lowercase letters, numbers, and hyphens',
        },
        { status: 400 }
      );
    }

    // Validate maxInstances
    if (maxInstances < -1) {
      return NextResponse.json(
        { error: 'Max instances must be -1 (unlimited) or a positive number' },
        { status: 400 }
      );
    }

    // Validate defaultMaxTracks
    if (defaultMaxTracks < 1) {
      return NextResponse.json(
        { error: 'Default max tracks must be at least 1' },
        { status: 400 }
      );
    }

    // Validate color format
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json(
        { error: 'Color must be a valid hex color (e.g., #3B82F6)' },
        { status: 400 }
      );
    }

    // Create playlist type
    const playlistType = await prisma.playlistTypeDefinition.create({
      data: {
        name,
        slug,
        description,
        icon,
        color,
        maxInstances: maxInstances || -1,
        requiresProvince: requiresProvince || false,
        defaultMaxTracks: defaultMaxTracks || 20,
        displayOrder: displayOrder || 0,
      },
    });

    return NextResponse.json({ playlistType }, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
