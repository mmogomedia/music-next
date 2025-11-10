import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // Verify prisma.genre exists (defensive check)
    if (!prisma.genre) {
      console.error(
        'Prisma genre model not available. Prisma client:',
        Object.keys(prisma)
      );
      return NextResponse.json(
        { error: 'Genre model not available. Please restart the server.' },
        { status: 500 }
      );
    }

    const genres = await prisma.genre.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ genres });
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch genres',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      isActive = true,
      order = 0,
      colorHex,
      icon,
      aliases = [],
      parentId,
    } = body || {};

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const created = await prisma.genre.create({
      data: {
        name,
        slug,
        description,
        isActive,
        order,
        colorHex,
        icon,
        aliases,
        parentId: parentId || null,
      },
    });
    return NextResponse.json({ genre: created });
  } catch (error) {
    console.error('Error creating genre:', error);
    return NextResponse.json(
      {
        error: 'Failed to create genre',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
