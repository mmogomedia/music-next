import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/admin/playlist-types/[id] - Get specific playlist type
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const playlistType = await prisma.playlistTypeDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { playlists: true },
        },
      },
    });

    if (!playlistType) {
      return NextResponse.json(
        { error: 'Playlist type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ playlistType });
  } catch (error) {
    console.error('Error fetching playlist type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/playlist-types/[id] - Update playlist type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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
      isActive,
    } = body;

    // Check if playlist type exists
    const existingType = await prisma.playlistTypeDefinition.findUnique({
      where: { id },
    });

    if (!existingType) {
      return NextResponse.json(
        { error: 'Playlist type not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if new slug exists
    if (slug && slug !== existingType.slug) {
      const slugExists = await prisma.playlistTypeDefinition.findUnique({
        where: { slug },
      });

      if (slugExists) {
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
    }

    // Validate maxInstances
    if (maxInstances !== undefined && maxInstances < -1) {
      return NextResponse.json(
        { error: 'Max instances must be -1 (unlimited) or a positive number' },
        { status: 400 }
      );
    }

    // Validate defaultMaxTracks
    if (defaultMaxTracks !== undefined && defaultMaxTracks < 1) {
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

    // Update playlist type
    const playlistType = await prisma.playlistTypeDefinition.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(maxInstances !== undefined && { maxInstances }),
        ...(requiresProvince !== undefined && { requiresProvince }),
        ...(defaultMaxTracks !== undefined && { defaultMaxTracks }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ playlistType });
  } catch (error) {
    console.error('Error updating playlist type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/playlist-types/[id] - Delete playlist type
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if playlist type exists
    const existingType = await prisma.playlistTypeDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { playlists: true },
        },
      },
    });

    if (!existingType) {
      return NextResponse.json(
        { error: 'Playlist type not found' },
        { status: 404 }
      );
    }

    // Check if there are playlists using this type
    if (existingType._count.playlists > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete playlist type. It is being used by ${existingType._count.playlists} playlist(s). Please reassign or delete those playlists first.`,
        },
        { status: 400 }
      );
    }

    // Delete playlist type
    await prisma.playlistTypeDefinition.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Playlist type deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist type:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
