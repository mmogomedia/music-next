import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  getClusterById,
  updateCluster,
  deleteCluster,
} from '@/lib/services/article-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  about: z.string().optional(),
  goal: z.string().optional(),
  coverImageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform(v => v || undefined),
  targetKeywords: z.array(z.string()).optional(),
  primaryKeywords: z.array(z.string()).optional(),
  secondaryKeywords: z.array(z.string()).optional(),
  longTailKeywords: z.array(z.string()).optional(),
  audience: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const cluster = await getClusterById(id);
    return NextResponse.json({ cluster });
  } catch (error) {
    console.error('Error fetching cluster:', error);
    return NextResponse.json({ error: 'Cluster not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const cluster = await updateCluster(id, parsed.data);
    return NextResponse.json({ cluster });
  } catch (error) {
    console.error('Error updating cluster:', error);
    return NextResponse.json(
      { error: 'Failed to update cluster' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteCluster(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    const statusCode = err.statusCode ?? 500;
    console.error('Error deleting cluster:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to delete cluster' },
      { status: statusCode }
    );
  }
}
