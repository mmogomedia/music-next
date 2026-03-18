import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createLink,
  getLinksFrom,
  getLinksTo,
} from '@/lib/services/graph-service';
import { z } from 'zod';
import type { ContentType, LinkType } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const linkSchema = z.object({
  fromType: z.enum(['ARTICLE', 'TOOL', 'ARTIST', 'TRACK']),
  fromId: z.string().min(1),
  toType: z.enum(['ARTICLE', 'TOOL', 'ARTIST', 'TRACK']),
  toId: z.string().min(1),
  linkType: z
    .enum(['REFERENCES', 'FEATURES', 'USES_TOOL', 'EXPLAINED_BY', 'RELATED'])
    .optional(),
  order: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromType = searchParams.get('fromType') as ContentType | null;
  const fromId = searchParams.get('fromId');
  const toType = searchParams.get('toType') as ContentType | null;
  const toId = searchParams.get('toId');
  const linkType = searchParams.get('linkType') as LinkType | null;

  try {
    if (fromType && fromId) {
      const links = await getLinksFrom(
        fromType,
        fromId,
        toType ?? undefined,
        linkType ?? undefined
      );
      return NextResponse.json({ links });
    }

    if (toType && toId) {
      const links = await getLinksTo(
        toType,
        toId,
        fromType ?? undefined,
        linkType ?? undefined
      );
      return NextResponse.json({ links });
    }

    return NextResponse.json(
      { error: 'Provide fromType+fromId or toType+toId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching graph links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const link = await createLink(parsed.data);
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error('Error creating graph link:', error);
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  }
}
