import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/skills
 * Get all active skills
 */
export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
      },
    });
    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}
