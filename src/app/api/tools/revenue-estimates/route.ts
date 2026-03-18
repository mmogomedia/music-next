import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const saveSchema = z.object({
  name: z.string().default('Untitled'),
  streams: z.record(z.string(), z.string()).default({}),
  zarRate: z.number().default(18.5),
  splitSheetId: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const estimates = await prisma.revenueEstimate.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        streams: true,
        zarRate: true,
        splitSheetId: true,
        updatedAt: true,
        splitSheet: {
          select: {
            id: true,
            name: true,
            songTitle: true,
            masterSplits: true,
          },
        },
      },
    });
    return NextResponse.json({ estimates });
  } catch (error) {
    console.error('Error fetching revenue estimates:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const { name, streams, zarRate, splitSheetId } = parsed.data;

    const existing = await prisma.revenueEstimate.findFirst({
      where: { userId: session.user.id, name },
    });

    const estimate = existing
      ? await prisma.revenueEstimate.update({
          where: { id: existing.id },
          data: {
            streams,
            zarRate,
            splitSheetId: splitSheetId ?? null,
            updatedAt: new Date(),
          },
        })
      : await prisma.revenueEstimate.create({
          data: {
            userId: session.user.id,
            name,
            streams,
            zarRate,
            splitSheetId: splitSheetId ?? null,
          },
        });

    return NextResponse.json({ estimate });
  } catch (error) {
    console.error('Error saving revenue estimate:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
