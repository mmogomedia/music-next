import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      slug,
      description,
      isActive,
      order,
      colorHex,
      icon,
      aliases,
      parentId,
    } = body || {};

    const updated = await prisma.genre.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
        ...(colorHex !== undefined && { colorHex }),
        ...(icon !== undefined && { icon }),
        ...(aliases !== undefined && { aliases }),
        ...(parentId !== undefined && { parentId }),
      },
    });
    return NextResponse.json({ genre: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update genre' },
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
  try {
    const { id } = await params;

    await prisma.genre.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete genre' },
      { status: 500 }
    );
  }
}
