/**
 * Timeline Tools
 *
 * LangChain tools for timeline post operations using the service layer.
 * These tools enable AI agents to search and browse timeline posts (news, music posts, videos, etc.).
 *
 * @module TimelineTools
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { TimelineService } from '@/lib/services';
import { logger } from '@/lib/utils/logger';
import type { PostType } from '@prisma/client';

/**
 * Search timeline posts by query
 */
export const searchTimelinePostsTool = new DynamicStructuredTool({
  name: 'search_timeline_posts',
  description:
    'Search for timeline posts (news articles, music posts, videos, etc.) by title, content, or author. Returns published posts matching the search query.',
  schema: z.object({
    query: z
      .string()
      .describe('Search query string (post title, content, or author name)'),
    postTypes: z
      .array(
        z.enum([
          'MUSIC_POST',
          'SONG',
          'NEWS_ARTICLE',
          'VIDEO_CONTENT',
          'RELEASE_PROMO',
          'EVENT_ANNOUNCEMENT',
        ])
      )
      .optional()
      .describe('Filter by post types (e.g., NEWS_ARTICLE, MUSIC_POST)'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Maximum number of posts to return (default: 20)'),
    sortBy: z
      .enum(['relevance', 'recent', 'trending'])
      .optional()
      .default('relevance')
      .describe('Sort order: relevance, recent, or trending'),
  }),
  func: async ({ query, postTypes, limit = 20, sortBy = 'relevance' }) => {
    logger.info('[search_timeline_posts Tool] ===== TOOL CALLED =====');
    logger.info('[search_timeline_posts Tool] Parameters:', {
      query,
      postTypes,
      limit,
      sortBy,
    });

    try {
      // Use TimelineService with searchQuery for efficient database-level search
      const feed = await TimelineService.getTimelineFeed({
        limit,
        postTypes: postTypes as PostType[],
        sortBy,
        searchQuery: query, // Pass search query to service for database-level filtering
      });

      logger.info('[search_timeline_posts Tool] Results:', {
        postsFound: feed.posts.length,
        totalPosts: feed.posts.length,
        query,
      });

      return JSON.stringify({
        posts: feed.posts.map(post => ({
          id: post.id,
          title: post.title,
          postType: post.postType,
          description: post.description,
          content: post.content,
          coverImageUrl: post.coverImageUrl,
          videoUrl: post.videoUrl,
          songUrl: post.songUrl,
          author: {
            id: post.author.id,
            name: post.author.name || post.author.email,
            email: post.author.email,
            image: post.author.image,
          },
          publishedAt: post.publishedAt?.toISOString(),
          likeCount: post._count?.likes || 0,
          commentCount: post._count?.comments || 0,
          shareCount: post._count?.shares || 0,
          viewCount: post.viewCount || 0,
        })),
        total: feed.posts.length,
      });
    } catch (error) {
      logger.error('[search_timeline_posts Tool] Error:', error);
      return JSON.stringify({ posts: [], total: 0, error: 'Search failed' });
    }
  },
});

/**
 * Get timeline feed with filters
 */
export const getTimelineFeedTool = new DynamicStructuredTool({
  name: 'get_timeline_feed',
  description:
    'Get timeline feed posts filtered by type, genre, or author. Returns published posts from the timeline.',
  schema: z.object({
    postTypes: z
      .array(
        z.enum([
          'MUSIC_POST',
          'SONG',
          'NEWS_ARTICLE',
          'VIDEO_CONTENT',
          'RELEASE_PROMO',
          'EVENT_ANNOUNCEMENT',
        ])
      )
      .optional()
      .describe('Filter by post types (e.g., NEWS_ARTICLE, MUSIC_POST)'),
    genreId: z
      .string()
      .optional()
      .describe('Filter by genre ID (for music posts)'),
    authorId: z.string().optional().describe('Filter by author/user ID'),
    following: z
      .boolean()
      .optional()
      .describe('Only show posts from followed users'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Maximum number of posts to return (default: 20)'),
    sortBy: z
      .enum(['relevance', 'recent', 'trending'])
      .optional()
      .default('relevance')
      .describe('Sort order: relevance, recent, or trending'),
  }),
  func: async ({
    postTypes,
    genreId,
    authorId,
    following,
    limit = 20,
    sortBy = 'relevance',
  }) => {
    logger.info('[get_timeline_feed Tool] ===== TOOL CALLED =====');
    logger.info('[get_timeline_feed Tool] Parameters:', {
      postTypes,
      genreId,
      authorId,
      following,
      limit,
      sortBy,
    });

    try {
      const feed = await TimelineService.getTimelineFeed({
        postTypes: postTypes as PostType[],
        genreId,
        authorId,
        following,
        limit,
        sortBy,
      });

      logger.info('[get_timeline_feed Tool] Results:', {
        postsFound: feed.posts.length,
        hasMore: feed.hasMore,
      });

      return JSON.stringify({
        posts: feed.posts.map(post => ({
          id: post.id,
          title: post.title,
          postType: post.postType,
          description: post.description,
          content: post.content,
          coverImageUrl: post.coverImageUrl,
          videoUrl: post.videoUrl,
          songUrl: post.songUrl,
          author: {
            id: post.author.id,
            name: post.author.name || post.author.email,
            email: post.author.email,
            image: post.author.image,
          },
          publishedAt: post.publishedAt?.toISOString(),
          likeCount: post._count?.likes || 0,
          commentCount: post._count?.comments || 0,
          shareCount: post._count?.shares || 0,
          viewCount: post.viewCount || 0,
        })),
        total: feed.posts.length,
        hasMore: feed.hasMore,
      });
    } catch (error) {
      logger.error('[get_timeline_feed Tool] Error:', error);
      return JSON.stringify({
        posts: [],
        total: 0,
        error: 'Failed to fetch feed',
      });
    }
  },
});

/**
 * Get featured timeline content
 */
export const getFeaturedTimelineContentTool = new DynamicStructuredTool({
  name: 'get_featured_timeline_content',
  description:
    'Get featured timeline content (videos, songs, articles, etc.). Returns curated featured posts.',
  schema: z.object({
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum number of featured items to return (default: 10)'),
  }),
  func: async ({ limit = 10 }) => {
    logger.info('[get_featured_timeline_content Tool] ===== TOOL CALLED =====');
    logger.info('[get_featured_timeline_content Tool] Parameters:', { limit });

    try {
      const featured = await TimelineService.getFeaturedContent(limit);

      logger.info('[get_featured_timeline_content Tool] Results:', {
        itemsFound: featured.length,
      });

      return JSON.stringify({
        featured: featured.map(item => ({
          id: item.id,
          title: item.title,
          postType: item.postType,
          description: item.description,
          content: item.content,
          coverImageUrl: item.coverImageUrl,
          videoUrl: item.videoUrl,
          songUrl: item.songUrl,
          author: {
            id: item.author.id,
            name: item.author.name || item.author.email,
            email: item.author.email,
            image: item.author.image,
          },
          publishedAt:
            item.publishedAt?.toISOString() || new Date().toISOString(),
        })),
        total: featured.length,
      });
    } catch (error) {
      logger.error('[get_featured_timeline_content Tool] Error:', error);
      return JSON.stringify({
        featured: [],
        total: 0,
        error: 'Failed to fetch featured content',
      });
    }
  },
});

/**
 * Get a specific timeline post by ID
 */
export const getTimelinePostTool = new DynamicStructuredTool({
  name: 'get_timeline_post',
  description:
    'Get a specific timeline post by its ID. Returns full post details including content, author, and engagement metrics.',
  schema: z.object({
    postId: z.string().describe('The ID of the timeline post to retrieve'),
  }),
  func: async ({ postId }) => {
    logger.info('[get_timeline_post Tool] ===== TOOL CALLED =====');
    logger.info('[get_timeline_post Tool] Parameters:', { postId });

    try {
      const post = await TimelineService.getPostById(postId);

      if (!post) {
        return JSON.stringify({ error: 'Post not found' });
      }

      logger.info('[get_timeline_post Tool] Results:', {
        postId: post.id,
        title: post.title,
        postType: post.postType,
      });

      return JSON.stringify({
        id: post.id,
        title: post.title,
        postType: post.postType,
        description: post.description,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        videoUrl: post.videoUrl,
        songUrl: post.songUrl,
        author: {
          id: post.author.id,
          name: post.author.name || post.author.email,
          email: post.author.email,
          image: post.author.image,
        },
        publishedAt: post.publishedAt?.toISOString(),
        likeCount: post._count?.likes || 0,
        commentCount: post._count?.comments || 0,
        shareCount: post._count?.shares || 0,
        viewCount: post.viewCount || 0,
      });
    } catch (error) {
      logger.error('[get_timeline_post Tool] Error:', error);
      return JSON.stringify({ error: 'Failed to fetch post' });
    }
  },
});

/**
 * Export all timeline tools
 */
export const timelineTools = [
  searchTimelinePostsTool,
  getTimelineFeedTool,
  getFeaturedTimelineContentTool,
  getTimelinePostTool,
];
