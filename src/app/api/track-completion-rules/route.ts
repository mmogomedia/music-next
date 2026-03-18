import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Public endpoint to fetch active completion rules (for TrackEditor)
export async function GET() {
  try {
    const rules = await prisma.trackCompletionRule.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { field: 'asc' }],
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching completion rules:', error);
    // Fallback to default rules if DB fails
    return NextResponse.json({ rules: [] });
  }
}
