/**
 * Timeline Service
 *
 * Provides access to timeline post data through direct database queries.
 * This service handles feed generation, ranking, engagement, and content management.
 *
 * @module TimelineService
 */

import { prisma } from '@/lib/db';
import { timelineEvents } from '@/lib/events/timeline-events';
import type {
  TimelinePost,
  TimelinePostComment,
  User,
  PostType,
  PostStatus,
  AuthorType,
} from '@prisma/client';

/**
 * Timeline post with author and engagement data
 */
export interface TimelinePostWithAuthor extends TimelinePost {
  author: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  tags?: Array<{ tag: string }>;
  _count?: {
    likes: number;
    comments: number;
    shares: number;
  };
  userLiked?: boolean;
  userFollowsAuthor?: boolean;
}

/**
 * Timeline feed options
 */
export interface TimelineFeedOptions {
  userId?: string; // Current user ID for personalization
  limit?: number; // Number of posts to return (default: 20)
  cursor?: string; // Cursor for pagination
  postTypes?: PostType[]; // Filter by post types
  sortBy?: 'relevance' | 'recent' | 'trending'; // Sort order
  genreId?: string; // Filter by genre (for music posts)
  authorId?: string; // Filter by author
  following?: boolean; // Filter to only show posts from followed users
  searchQuery?: string; // Search query for title, description, or content
}

/**
 * Timeline feed response with pagination
 */
export interface TimelineFeedResponse {
  posts: TimelinePostWithAuthor[];
  nextCursor: string | null; // Base64 encoded JSON: { publishedAt: string, id: string }
  hasMore: boolean;
}

/**
 * Featured content item
 */
export interface FeaturedContent {
  id: string;
  postType: PostType;
  title: string | null;
  description: string | null;
  coverImageUrl: string | null;
  videoUrl: string | null;
  songUrl: string | null;
  author: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  content: any; // JSON content
  featuredUntil: Date | null;
  publishedAt?: Date | null;
}

/**
 * Service for timeline operations
 */
export class TimelineService {
  /**
   * Get timeline feed with pagination and filtering
   */
  static async getTimelineFeed(
    options: TimelineFeedOptions = {}
  ): Promise<TimelineFeedResponse> {
    const {
      userId,
      limit = 20,
      cursor,
      postTypes,
      sortBy = 'relevance',
      genreId,
      authorId,
      following = false,
      searchQuery,
    } = options;

    // Build where clause
    const whereConditions: any[] = [
      { status: 'PUBLISHED' },
      {
        OR: [
          { publishedAt: { lte: new Date() } },
          { publishedAt: null }, // Allow posts without publishedAt for backward compatibility
        ],
      },
      {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    ];

    // Add post type filter
    if (postTypes && postTypes.length > 0) {
      whereConditions.push({ postType: { in: postTypes } });
    }

    // Add author filter
    if (authorId) {
      whereConditions.push({ authorId });
    }

    // Add genre filter
    if (genreId) {
      whereConditions.push({
        OR: [
          { tags: { some: { tag: genreId } } },
          {
            content: {
              path: ['genreId'],
              equals: genreId,
            },
          },
        ],
      });
    }

    // Add following filter - only show posts from followed users
    if (following && userId) {
      const userFollows = await prisma.timelineFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followedAuthorIds = userFollows.map(f => f.followingId);
      if (followedAuthorIds.length > 0) {
        whereConditions.push({ authorId: { in: followedAuthorIds } });
      } else {
        // User follows no one, return empty feed
        return {
          posts: [],
          nextCursor: null,
          hasMore: false,
        };
      }
    }

    // Add search query filter
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      const searchConditions: any[] = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];

      // Search in author name/email
      searchConditions.push({
        author: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      });

      // Search in JSON content fields (for PostgreSQL, using path-based queries)
      // This searches common content fields that might contain the search term
      // Note: Prisma's JSON filtering for PostgreSQL supports path queries with string_contains
      const jsonPaths = [
        'artist',
        'artistName',
        'trackTitle',
        'title',
        'body',
        'content',
        'text',
        'summary',
      ];

      // For PostgreSQL, we can use string_contains with JSON path
      // This searches in common JSON field paths within the content object
      const jsonSearchConditions = jsonPaths.map(path => ({
        content: {
          path: [path],
          string_contains: searchTerm,
        },
      }));

      // Add JSON search conditions to the main search conditions
      searchConditions.push(...jsonSearchConditions);

      whereConditions.push({ OR: searchConditions });
    }

    const where = { AND: whereConditions };

    // Build orderBy based on sortBy
    let orderBy: any;
    switch (sortBy) {
      case 'recent':
        orderBy = { publishedAt: 'desc' };
        break;
      case 'trending':
        // Combine engagement and recency
        orderBy = [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }];
        break;
      case 'relevance':
      default:
        orderBy = [
          { isPinned: 'desc' },
          { relevanceScore: 'desc' },
          { publishedAt: 'desc' },
        ];
        break;
    }

    // Handle cursor-based pagination
    // Best approach: Use publishedAt as cursor (stable, sortable field)
    // For relevance/trending, we still use publishedAt but apply relevance in orderBy
    const take = limit + 1; // Fetch one extra to determine if there's more

    let cursorWhere: any = {};

    if (cursor) {
      try {
        // Decode cursor (base64 JSON: { publishedAt: string, id: string })
        const cursorData = JSON.parse(
          Buffer.from(cursor, 'base64').toString('utf-8')
        );
        const cursorDate = new Date(cursorData.publishedAt);
        const cursorId = cursorData.id;

        // Add cursor filter to where clause
        // Posts where publishedAt < cursor OR (publishedAt = cursor AND id < cursorId)
        cursorWhere = {
          OR: [
            { publishedAt: { lt: cursorDate } },
            {
              publishedAt: cursorDate,
              id: { lt: cursorId },
            },
          ],
        };
      } catch (error) {
        // Invalid cursor, start from beginning
        console.warn('Invalid cursor, starting from beginning:', error);
      }
    }

    // Merge cursor filter with existing where clause
    const finalWhere = {
      ...where,
      ...(Object.keys(cursorWhere).length > 0 ? cursorWhere : {}),
    };

    // Ensure id is always in orderBy for deterministic ordering (tie-breaker)
    const finalOrderBy = Array.isArray(orderBy)
      ? [...orderBy, { id: 'desc' }]
      : [{ ...orderBy }, { id: 'desc' }];

    // Fetch posts
    const posts = await prisma.timelinePost.findMany({
      where: finalWhere,
      take,
      orderBy: finalOrderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: {
          select: {
            tag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    // Check if there are more posts
    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    // Get next cursor (composite: publishedAt + id)
    let nextCursor: string | null = null;
    if (hasMore && postsToReturn.length > 0) {
      const lastPost = postsToReturn[postsToReturn.length - 1];
      const cursorData = {
        publishedAt:
          lastPost.publishedAt?.toISOString() ||
          lastPost.createdAt.toISOString(),
        id: lastPost.id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }

    // Enrich with user-specific data if userId provided
    let enrichedPosts: TimelinePostWithAuthor[] = postsToReturn;
    if (userId) {
      enrichedPosts = await this.enrichPostsWithUserData(postsToReturn, userId);
    }

    return {
      posts: enrichedPosts,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get featured content
   */
  static async getFeaturedContent(
    limit: number = 10
  ): Promise<FeaturedContent[]> {
    const now = new Date();

    const posts = await prisma.timelinePost.findMany({
      where: {
        status: 'PUBLISHED',
        isFeatured: true,
        OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }],
        publishedAt: {
          lte: now,
        },
      },
      take: limit,
      orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: {
          select: {
            tag: true,
          },
        },
      },
    });

    return posts.map(post => ({
      id: post.id,
      postType: post.postType,
      title: post.title,
      description: post.description,
      coverImageUrl: post.coverImageUrl,
      videoUrl: post.videoUrl,
      songUrl: post.songUrl,
      author: post.author,
      content: post.content,
      featuredUntil: post.featuredUntil,
    }));
  }

  /**
   * Get a single timeline post by ID
   */
  static async getPostById(
    postId: string,
    userId?: string
  ): Promise<TimelinePostWithAuthor | null> {
    const post = await prisma.timelinePost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: {
          select: {
            tag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    // Enrich with user data if userId provided
    if (userId) {
      const enriched = await this.enrichPostsWithUserData([post], userId);
      return enriched[0];
    }

    return post;
  }

  /**
   * Create a new timeline post
   */
  static async createPost(data: {
    postType: PostType;
    authorId: string;
    authorType: AuthorType;
    content: any;
    title?: string;
    description?: string;
    coverImageUrl?: string;
    videoUrl?: string;
    songUrl?: string;
    status?: PostStatus;
    publishedAt?: Date;
    scheduledFor?: Date;
    tags?: string[];
    isFeatured?: boolean;
    featuredUntil?: Date;
  }): Promise<TimelinePost> {
    const {
      postType,
      authorId,
      authorType,
      content,
      title,
      description,
      coverImageUrl,
      videoUrl,
      songUrl,
      status = 'DRAFT',
      publishedAt,
      scheduledFor,
      tags,
      isFeatured = false,
      featuredUntil,
    } = data;

    // Calculate initial relevance score
    const relevanceScore = await this.calculateRelevanceScore(
      {
        postType,
        authorId,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        viewCount: 0,
        createdAt: new Date(),
        publishedAt: publishedAt || null,
      } as TimelinePost,
      authorId
    );

    // Create post
    const post = await prisma.timelinePost.create({
      data: {
        postType,
        authorId,
        authorType,
        content,
        title,
        description,
        coverImageUrl,
        videoUrl,
        songUrl,
        status,
        publishedAt:
          publishedAt || (status === 'PUBLISHED' ? new Date() : null),
        scheduledFor,
        isFeatured,
        featuredUntil,
        relevanceScore,
        tags: tags
          ? {
              create: tags.map(tag => ({ tag })),
            }
          : undefined,
      },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    // Emit event if post is published
    if (status === 'PUBLISHED') {
      // Fetch full post with relations for event
      const fullPost = await prisma.timelinePost.findUnique({
        where: { id: post.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          tags: {
            select: {
              tag: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
            },
          },
        },
      });

      if (fullPost) {
        // Enrich post with user data for event
        const enrichedPost = await this.enrichPostsWithUserData(
          [fullPost],
          authorId
        );
        if (enrichedPost[0]) {
          timelineEvents.emitPostPublished(enrichedPost[0]);
        }
      }
    }

    return post;
  }

  /**
   * Update a timeline post
   */
  static async updatePost(
    postId: string,
    authorId: string,
    data: {
      title?: string;
      description?: string;
      content?: any;
      coverImageUrl?: string;
      videoUrl?: string;
      songUrl?: string;
      status?: PostStatus;
      publishedAt?: Date;
      tags?: string[];
      isFeatured?: boolean;
      featuredUntil?: Date;
    }
  ): Promise<TimelinePost> {
    // Verify ownership
    const existingPost = await prisma.timelinePost.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      throw new Error('Post not found');
    }

    if (existingPost.authorId !== authorId) {
      throw new Error('Unauthorized: You can only update your own posts');
    }

    // Update tags if provided
    if (data.tags) {
      // Delete existing tags
      await prisma.timelinePostTag.deleteMany({
        where: { postId },
      });

      // Create new tags
      await prisma.timelinePostTag.createMany({
        data: data.tags.map(tag => ({ postId, tag })),
      });
    }

    // Check if status is changing to PUBLISHED
    const wasPublished = existingPost.status === 'PUBLISHED';
    const willBePublished = data.status === 'PUBLISHED';

    // Update post
    const post = await prisma.timelinePost.update({
      where: { id: postId },
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        coverImageUrl: data.coverImageUrl,
        videoUrl: data.videoUrl,
        songUrl: data.songUrl,
        status: data.status,
        publishedAt:
          data.publishedAt ||
          (willBePublished && !wasPublished
            ? new Date()
            : existingPost.publishedAt),
        isFeatured: data.isFeatured,
        featuredUntil: data.featuredUntil,
      },
      include: {
        tags: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    // Recalculate relevance score if engagement changed
    if (willBePublished) {
      const newScore = await this.calculateRelevanceScore(post, authorId);
      await prisma.timelinePost.update({
        where: { id: postId },
        data: { relevanceScore: newScore },
      });
    }

    // Emit event if post is being published (newly published or status changed to PUBLISHED)
    if (willBePublished && (!wasPublished || data.status === 'PUBLISHED')) {
      // Post already has relations from the update query above
      // Enrich post with user data for event
      const enrichedPost = await this.enrichPostsWithUserData([post], authorId);
      if (enrichedPost[0]) {
        timelineEvents.emitPostPublished(enrichedPost[0]);
      }
    }

    return post;
  }

  /**
   * Delete a timeline post
   */
  static async deletePost(
    postId: string,
    userId: string,
    isAdmin: boolean = false
  ): Promise<boolean> {
    // Verify ownership or admin status
    const post = await prisma.timelinePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Allow deletion if user is the author OR if user is an admin
    if (post.authorId !== userId && !isAdmin) {
      throw new Error('Unauthorized: You can only delete your own posts');
    }

    // Soft delete by setting status to DELETED
    await prisma.timelinePost.update({
      where: { id: postId },
      data: { status: 'DELETED' },
    });

    // Emit delete event
    timelineEvents.emitPostDeleted(postId);

    return true;
  }

  /**
   * Like or unlike a post
   */
  static async toggleLike(
    postId: string,
    userId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    // Check if already liked
    const existingLike = await prisma.timelinePostLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.timelinePostLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      // Decrement like count
      await prisma.timelinePost.update({
        where: { id: postId },
        data: {
          likeCount: { decrement: 1 },
        },
      });

      const post = await prisma.timelinePost.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });

      return {
        liked: false,
        likeCount: post?.likeCount || 0,
      };
    } else {
      // Like
      await prisma.timelinePostLike.create({
        data: {
          postId,
          userId,
        },
      });

      // Increment like count
      await prisma.timelinePost.update({
        where: { id: postId },
        data: {
          likeCount: { increment: 1 },
        },
      });

      const post = await prisma.timelinePost.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });

      return {
        liked: true,
        likeCount: post?.likeCount || 0,
      };
    }
  }

  /**
   * Add a comment to a post
   */
  static async addComment(
    postId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<TimelinePostComment> {
    // Create comment
    const comment = await prisma.timelinePostComment.create({
      data: {
        postId,
        userId,
        content,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Increment comment count
    await prisma.timelinePost.update({
      where: { id: postId },
      data: {
        commentCount: { increment: 1 },
      },
    });

    return comment;
  }

  /**
   * Get comments for a post
   */
  static async getComments(
    postId: string,
    limit: number = 20,
    cursor?: string,
    userId?: string
  ): Promise<{
    comments: TimelinePostComment[];
    nextCursor: string | null;
  }> {
    const take = limit + 1;
    const skip = cursor ? 1 : 0;
    const cursorObj = cursor ? { id: cursor } : undefined;

    const comments = await prisma.timelinePostComment.findMany({
      where: {
        postId,
        parentId: null, // Only top-level comments
      },
      take,
      skip,
      cursor: cursorObj,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    const hasMore = comments.length > limit;
    const commentsToReturn = hasMore ? comments.slice(0, limit) : comments;

    // Enrich with user's like status if userId provided
    if (userId) {
      const commentIds = commentsToReturn.flatMap(c => [
        c.id,
        ...c.replies.map(r => r.id),
      ]);
      const userLikes = await prisma.timelineCommentLike.findMany({
        where: {
          commentId: { in: commentIds },
          userId,
        },
        select: { commentId: true },
      });
      const likedCommentIds = new Set(userLikes.map(l => l.commentId));

      return {
        comments: commentsToReturn.map(comment => ({
          ...comment,
          isLikedByCurrentUser: likedCommentIds.has(comment.id),
          replies: comment.replies.map(reply => ({
            ...reply,
            isLikedByCurrentUser: likedCommentIds.has(reply.id),
          })),
        })),
        nextCursor: hasMore
          ? commentsToReturn[commentsToReturn.length - 1].id
          : null,
      };
    }

    return {
      comments: commentsToReturn,
      nextCursor: hasMore
        ? commentsToReturn[commentsToReturn.length - 1].id
        : null,
    };
  }

  /**
   * Toggle like on a comment
   */
  static async toggleCommentLike(
    commentId: string,
    userId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    // Check if already liked
    const existingLike = await prisma.timelineCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.timelineCommentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });

      // Decrement like count
      await prisma.timelinePostComment.update({
        where: { id: commentId },
        data: {
          likeCount: { decrement: 1 },
        },
      });

      const comment = await prisma.timelinePostComment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      });

      return {
        liked: false,
        likeCount: comment?.likeCount || 0,
      };
    } else {
      // Like
      await prisma.timelineCommentLike.create({
        data: {
          commentId,
          userId,
        },
      });

      // Increment like count
      await prisma.timelinePostComment.update({
        where: { id: commentId },
        data: {
          likeCount: { increment: 1 },
        },
      });

      const comment = await prisma.timelinePostComment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      });

      return {
        liked: true,
        likeCount: comment?.likeCount || 0,
      };
    }
  }

  /**
   * Share a post
   */
  static async sharePost(
    postId: string,
    userId: string,
    platform?: string
  ): Promise<{ success: boolean; shareCount: number }> {
    // Create share record
    await prisma.timelinePostShare.create({
      data: {
        postId,
        userId,
        platform,
      },
    });

    // Increment share count
    await prisma.timelinePost.update({
      where: { id: postId },
      data: {
        shareCount: { increment: 1 },
      },
    });

    const post = await prisma.timelinePost.findUnique({
      where: { id: postId },
      select: { shareCount: true },
    });

    return {
      success: true,
      shareCount: post?.shareCount || 0,
    };
  }

  /**
   * Track a post view
   */
  static async trackView(
    postId: string,
    userId?: string
  ): Promise<{ success: boolean }> {
    // Create view record
    await prisma.timelinePostView.create({
      data: {
        postId,
        userId: userId || null,
      },
    });

    // Increment view count (debounced - only update every N views)
    // For now, update immediately
    await prisma.timelinePost.update({
      where: { id: postId },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return { success: true };
  }

  /**
   * Get new posts since a given post ID (for real-time updates)
   * Returns empty array if sincePostId is not provided (can't determine what's "new" without a baseline)
   */
  static async getNewPosts(
    userId: string,
    sincePostId?: string
  ): Promise<TimelinePostWithAuthor[]> {
    // Require sincePostId to determine what's "new" - return empty if not provided
    if (!sincePostId) {
      return [];
    }

    // Get posts published after the given post
    const sincePost = await prisma.timelinePost.findUnique({
      where: { id: sincePostId },
      select: { publishedAt: true, createdAt: true, status: true },
    });

    if (!sincePost) {
      return [];
    }

    // Use publishedAt if available, otherwise fall back to createdAt
    const baselineDate = sincePost.publishedAt || sincePost.createdAt;
    const now = new Date();

    // Build where clause: status PUBLISHED, publishedAt <= now, and newer than baseline
    const where: any = {
      status: 'PUBLISHED',
      AND: [
        {
          OR: [
            { publishedAt: { lte: now } },
            // Also include posts without publishedAt but with createdAt (for backward compatibility)
            { publishedAt: null, createdAt: { lte: now } },
          ],
        },
      ],
    };

    if (baselineDate) {
      // Get posts published after the baseline date
      // Include posts with same publishedAt but newer ID to catch posts published at the exact same time
      where.AND.push({
        OR: [
          {
            publishedAt: {
              gt: baselineDate,
            },
          },
          {
            // Also catch posts with same publishedAt but newer ID (lexicographically greater)
            AND: [{ publishedAt: baselineDate }, { id: { gt: sincePostId } }],
          },
          // Handle posts without publishedAt - use createdAt comparison
          {
            AND: [{ publishedAt: null }, { createdAt: { gt: baselineDate } }],
          },
        ],
      });
    } else {
      // Fallback: use ID comparison if no date available
      where.AND.push({
        id: { gt: sincePostId },
      });
    }

    const posts = await prisma.timelinePost.findMany({
      where,
      take: 20,
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
        tags: {
          select: {
            tag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    return this.enrichPostsWithUserData(posts, userId);
  }

  /**
   * Calculate relevance score for a post
   */
  static async calculateRelevanceScore(
    post: Pick<
      TimelinePost,
      | 'postType'
      | 'authorId'
      | 'likeCount'
      | 'commentCount'
      | 'shareCount'
      | 'viewCount'
      | 'createdAt'
      | 'publishedAt'
    >,
    userId?: string
  ): Promise<number> {
    let score = 0;

    // Base engagement score (weighted)
    const engagementScore =
      post.likeCount * 2 + post.commentCount * 3 + post.shareCount * 4;

    // Recency score (decay over time)
    const now = new Date();
    const publishedAt = post.publishedAt || post.createdAt;
    const hoursSincePublished =
      (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
    const recencyMultiplier = Math.max(0, 1 - hoursSincePublished / 168); // Decay over 1 week

    // Base score
    score = engagementScore * (0.5 + recencyMultiplier * 0.5);

    // Boost for followed authors
    if (userId) {
      const follows = await prisma.timelineFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: post.authorId,
          },
        },
      });

      if (follows) {
        score *= 1.5; // 50% boost for followed authors
      }
    }

    // Boost for featured content
    // (This would be set separately, but we can add a small boost here)

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Enrich posts with user-specific data (likes, follows)
   */
  private static async enrichPostsWithUserData(
    posts: TimelinePost[],
    userId: string
  ): Promise<TimelinePostWithAuthor[]> {
    if (posts.length === 0) {
      return [];
    }

    const postIds = posts.map(p => p.id);
    const authorIds = Array.from(new Set(posts.map(p => p.authorId)));

    // Get user likes
    const userLikes = await prisma.timelinePostLike.findMany({
      where: {
        postId: { in: postIds },
        userId,
      },
      select: { postId: true },
    });
    const likedPostIds = new Set(userLikes.map(l => l.postId));

    // Get user follows
    const userFollows = await prisma.timelineFollow.findMany({
      where: {
        followerId: userId,
        followingId: { in: authorIds },
      },
      select: { followingId: true },
    });
    const followedAuthorIds = new Set(userFollows.map(f => f.followingId));

    // Enrich posts
    return posts.map(post => ({
      ...post,
      userLiked: likedPostIds.has(post.id),
      userFollowsAuthor: followedAuthorIds.has(post.authorId),
    })) as TimelinePostWithAuthor[];
  }

  /**
   * Recalculate relevance scores for all published posts
   * (Can be run as a background job)
   */
  static async recalculateAllRelevanceScores(): Promise<number> {
    const posts = await prisma.timelinePost.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        postType: true,
        authorId: true,
        likeCount: true,
        commentCount: true,
        shareCount: true,
        viewCount: true,
        createdAt: true,
        publishedAt: true,
      },
    });

    let updated = 0;
    for (const post of posts) {
      const score = await this.calculateRelevanceScore(post);
      await prisma.timelinePost.update({
        where: { id: post.id },
        data: { relevanceScore: score },
      });
      updated++;
    }

    return updated;
  }
}
