import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/league/tiers/[id]
 * Update a league tier (admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const {
      code,
      name,
      targetSize,
      minScore,
      maxScore,
      refreshIntervalHours,
      isActive,
      sortOrder,
    } = body;

    const tier = await prisma.leagueTier.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(targetSize !== undefined && { targetSize }),
        ...(minScore !== undefined && { minScore }),
        ...(maxScore !== undefined && { maxScore: maxScore ?? null }),
        ...(refreshIntervalHours !== undefined && { refreshIntervalHours }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ tier });
  } catch (error: any) {
    console.error('[Admin League Tier] Error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'League tier not found' },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tier code already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update league tier' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/league/tiers/[id]
 * Delete a league tier (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.leagueTier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin League Tier] Error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'League tier not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete league tier' },
      { status: 500 }
    );
  }
}
