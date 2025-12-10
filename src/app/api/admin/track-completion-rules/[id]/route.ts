import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH - Update a specific completion rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      label,
      category,
      weight,
      description,
      group,
      isRequired,
      order,
      isActive,
    } = body;

    // Validate category if provided
    if (category) {
      const validCategories = ['required', 'high', 'medium', 'low'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Category must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate weight if provided
    if (weight !== undefined && (weight < 0 || weight > 100)) {
      return NextResponse.json(
        { error: 'Weight must be between 0 and 100' },
        { status: 400 }
      );
    }

    const rule = await prisma.trackCompletionRule.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(category !== undefined && { category }),
        ...(weight !== undefined && { weight }),
        ...(description !== undefined && { description: description || null }),
        ...(group !== undefined && { group: group || null }),
        ...(isRequired !== undefined && { isRequired }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ rule });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    console.error('Error updating completion rule:', error);
    return NextResponse.json(
      { error: 'Failed to update completion rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a completion rule
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.trackCompletionRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    console.error('Error deleting completion rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete completion rule' },
      { status: 500 }
    );
  }
}
