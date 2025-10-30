import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        artistProfile: {
          select: {
            id: true,
            artistName: true,
            isVerified: true,
            bio: true,
            location: true,
            genre: true,
          },
        },
        _count: {
          select: {
            tracks: true,
            playEvents: true,
            likeEvents: true,
            saveEvents: true,
            shareEvents: true,
            downloadEvents: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action, ...updateData } = await request.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updatedUser;

    switch (action) {
      case 'activate':
        updatedUser = await prisma.user.update({
          where: { id },
          data: { isActive: true },
          include: {
            artistProfile: {
              select: {
                id: true,
                artistName: true,
                isVerified: true,
              },
            },
          },
        });
        break;

      case 'deactivate':
        updatedUser = await prisma.user.update({
          where: { id },
          data: { isActive: false },
          include: {
            artistProfile: {
              select: {
                id: true,
                artistName: true,
                isVerified: true,
              },
            },
          },
        });
        break;

      case 'update':
        updatedUser = await prisma.user.update({
          where: { id },
          data: updateData,
          include: {
            artistProfile: {
              select: {
                id: true,
                artistName: true,
                isVerified: true,
              },
            },
          },
        });
        break;

      case 'delete':
        // Delete user and all related data
        await prisma.user.delete({
          where: { id },
        });
        return NextResponse.json({ message: 'User deleted successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
