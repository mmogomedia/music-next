import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/league/tiers
 * Get all league tiers (admin only)
 */
export async function GET() {
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

    const tiers = await prisma.leagueTier.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('[Admin League Tiers] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league tiers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/league/tiers
 * Create a new league tier (admin only)
 */
export async function POST(req: NextRequest) {
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

    // Validate required fields
    if (
      !code ||
      !name ||
      !targetSize ||
      minScore === undefined ||
      !refreshIntervalHours
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const tier = await prisma.leagueTier.create({
      data: {
        code,
        name,
        targetSize,
        minScore,
        maxScore: maxScore ?? null,
        refreshIntervalHours,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin League Tiers] Error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tier code already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create league tier' },
      { status: 500 }
    );
  }
}
