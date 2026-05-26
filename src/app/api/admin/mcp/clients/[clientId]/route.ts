/**
 * Admin endpoint to set / clear an `McpClient`'s author mapping.
 *
 * Articles created via MCP by this client will be attributed to the mapped
 * User. The target user must be ADMIN (role-gated at write-time and again at
 * resolve-time in `articles-service`). DCR cannot self-set this field; only
 * an authenticated Flemoji ADMIN can update it here.
 *
 * PATCH /api/admin/mcp/clients/[clientId]
 *   body: { authorUserId: string | null }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  authorUserId: z.string().min(1).nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { clientId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { authorUserId } = parsed.data;

  if (authorUserId) {
    const user = await prisma.user.findUnique({
      where: { id: authorUserId },
      select: { id: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'authorUserId must reference an ADMIN user' },
        { status: 400 }
      );
    }
  }

  const existing = await prisma.mcpClient.findUnique({
    where: { clientId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'McpClient not found' }, { status: 404 });
  }

  const updated = await prisma.mcpClient.update({
    where: { clientId },
    data: { authorUserId },
    select: {
      id: true,
      clientId: true,
      name: true,
      scopes: true,
      webhookUrl: true,
      revokedAt: true,
      createdAt: true,
      authorUserId: true,
      authorUser: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return NextResponse.json(updated);
}
