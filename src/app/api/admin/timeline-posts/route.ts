import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/timeline-posts
 * Get all timeline posts for admin (including drafts)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('searchQuery') || undefined;
    const status = searchParams.get('status') || undefined;
    const postType = searchParams.get('postType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Build where clause
    const where: any = {};

    // Status filter - default to PUBLISHED if not specified, exclude DELETED unless explicitly requested
    if (status && status !== 'ALL') {
      // Use the specified status (including DELETED if explicitly requested)
      where.status = status;
    } else {
      // Default: only show published posts (exclude deleted)
      where.status = 'PUBLISHED';
    }

    // Post type filter
    if (postType && postType !== 'ALL') {
      where.postType = postType;
    }

    // Search query
    if (searchQuery) {
      const searchConditions = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ];

      // If we already have an OR condition, combine them
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Order by publishedAt (latest first), fallback to createdAt
    const posts = await prisma.timelinePost.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      posts,
      total: posts.length,
    });
  } catch (error) {
    console.error('Error fetching timeline posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline posts' },
      { status: 500 }
    );
  }
}
