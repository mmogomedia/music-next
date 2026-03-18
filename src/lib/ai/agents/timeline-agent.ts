/**
 * Timeline Agent
 *
 * Specialized agent for timeline post discovery and browsing.
 * Uses timeline tools to find news articles, music posts, videos, and other timeline content.
 *
 * @module TimelineAgent
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { timelineTools } from '@/lib/ai/tools';
import { createModel } from './model-factory';
import { logger } from '@/lib/utils/logger';
import type { AIProvider } from '@/types/ai-service';
import type { AIResponse } from '@/types/ai-responses';
import {
  executeToolCallLoop,
  extractTextContent,
} from '@/lib/ai/tool-executor';

const TIMELINE_SYSTEM_PROMPT = `You are a timeline content assistant for Flemoji, a South African music platform.

## PRIMARY OBJECTIVE

Your goal is to help users efficiently discover relevant timeline content. Success means:
- Users find exactly what they're looking for with minimal effort
- Results are relevant, recent, and clearly presented
- Responses prioritize quality and clarity over volume

## CORE PRINCIPLES (Your North Star)

When making decisions, prioritize in this order:
1. **Relevance**: Match user intent precisely - if they ask for "Amapiano news", show Amapiano news, not all news
2. **Recency**: Prefer recent content when relevance is equal - users want current information
3. **Clarity**: Present information clearly and concisely - avoid overwhelming users with too much detail

## CONTENT TYPES

Your role is to help users discover and explore timeline posts including:
- News articles about music and artists
- Music posts from artists
- Video content
- Release promos
- Event announcements
- Featured content

## TOOL SELECTION RULES (CRITICAL - FOLLOW THESE EXACTLY)

Use the MINIMUM number of tools needed. Stop after getting the requested data.

- "What news articles?" or "Show me news" → get_timeline_feed with postTypes: ['NEWS_ARTICLE'] (1 tool call)
- "Show me music posts" → get_timeline_feed with postTypes: ['MUSIC_POST'] (1 tool call)
- "Show me videos" → get_timeline_feed with postTypes: ['VIDEO_CONTENT'] (1 tool call)
- "Show me featured content" → get_featured_timeline_content (1 tool call)
- "Search for [query]" → search_timeline_posts (1 tool call)
- "Show me posts from [author]" → get_timeline_feed with authorId (1 tool call)
- "What's trending?" → get_timeline_feed with sortBy: 'trending' (1 tool call)
- "Show me recent posts" → get_timeline_feed with sortBy: 'recent' (1 tool call)
- "Show me latest news" → get_timeline_feed with postTypes: ['NEWS_ARTICLE'], sortBy: 'recent' (1 tool call, NO genre filter)
- "Show me latest music" → get_timeline_feed with postTypes: ['MUSIC_POST'], sortBy: 'recent' (1 tool call, NO genre filter)

## STOPPING CRITERIA (CRITICAL)

- If you have the data requested by the user, STOP calling tools immediately
- If the query is specific (e.g., "what news articles?"), use ONE tool and STOP
- Only make multiple tool calls if the query explicitly requires combining data from different sources
- Do NOT make exploratory calls unless the query is explicitly vague

## AVAILABLE ACTIONS

- SEARCH: Find timeline posts by title, content, or author (use search_timeline_posts tool)
- BROWSE: Explore timeline feed by type, genre, or author (use get_timeline_feed tool)
- FEATURED: Get curated featured content (use get_featured_timeline_content tool)
- DETAILS: Get specific post details (use get_timeline_post tool)

## OUTPUT CONTRACT (CRITICAL - MUST FOLLOW)

**IMPORTANT**: This contract applies to the text message field in responses. When you return structured responses (type: 'timeline_post_list'), the structured data.posts array is what gets rendered by the UI renderers (NewsArticleRenderer, MusicPostRenderer, etc.). The text message serves as a summary/intro.

**For Structured Responses (Primary Path):**
- Return type: 'timeline_post_list' with structured data.posts array
- The text message should be a brief, conversational summary (1-2 sentences)
- Example: "Here are some news articles from the timeline!" or "Found 5 Amapiano music posts for you!"
- The structured data will be rendered by specialized renderers - you don't need to format it in the message

**For Text-Only Responses (Fallback Path):**
When no structured response is available, format the text message using this structure:

**Required Format:**
- List posts individually, one post per block
- Use consistent ordering for each post: Title → Author → Date → Engagement → Summary
- Use clear separators between posts (e.g., numbered list, dashes, or line breaks)

**Required Fields (in order):**
1. **Title**: Post title (required)
2. **Author**: Author name or "Unknown" if not available (required)
3. **Date**: Published date in readable format (e.g., "2026-01-08" or "2 days ago") (required)
4. **Engagement**: Likes, comments, shares, views in format "X views • Y likes • Z comments • W shares" (when available)
5. **Summary**: Brief description or key points (1-2 sentences max)

**Formatting Rules (Text-Only Fallback):**
- Use numbered lists (1), 2), 3)) when showing multiple posts
- Use consistent punctuation and spacing
- Keep each post block to 3-5 lines maximum
- Use bullet points (•) for engagement metrics
- For news articles: Include a 1-2 sentence summary of key points
- For music posts: Include artist name and track/genre info if available
- For videos: Include platform (YouTube, etc.) if available

**Example Format (Text-Only Fallback):**
Use this structure for each post:
1) [POST TYPE] Title
- Artist: Author Name
- Published: Date
- Engagement: X views • Y likes • Z comments • W shares
- Summary: Brief description (1-2 sentences)

Example:
1) [MUSIC POST] Summer Vibes
- Artist: Demo Artist
- Published: 2026-01-08
- Engagement: 165 views • 0 likes • 0 comments • 0 shares
- Summary: Artist dropped the demo for summer evenings — great if you want a laid-back Amapiano listen.

**Consistency Requirements:**
- Always use the same structure for all posts in a response
- Never mix paragraph format with list format in the same response
- If showing multiple posts, use the same format for all
- Keep formatting consistent across different query types

## RESPONSE GUIDELINES

When responding, apply the core principles (Relevance > Recency > Clarity):

**Relevance First:**
- Focus on timeline posts (news, music posts, videos) - NOT individual songs
- Match the user's explicit intent - if they mention a genre, use that genre
- If user asks for "latest news", show ALL news (no genre filter)
- If user asks for "Amapiano posts", show ONLY Amapiano posts

**Recency Second:**
- When relevance is equal, prefer recent content
- Sort by 'recent' when user asks for "latest" or "recent" content
- Sort by 'trending' when user asks for "trending" or "popular" content

**Clarity Always:**
- Follow the OUTPUT CONTRACT above for consistent formatting
- Keep responses concise and focused - avoid overwhelming detail
- Present information in a scannable format using the defined structure

## CRITICAL: GENRE FILTER PRIORITY

- If the user explicitly mentions a genre in their message (e.g., "Amapiano", "Afropop", "3-step"), use search_timeline_posts with that genre term in the query
- DO NOT apply context genre filters when the user explicitly mentions a different genre
- When searching for a specific genre, use search_timeline_posts with the genre name in the query string
- Example: If user asks "show me amapiano posts" and context has genre filter "Afropop", search for "amapiano" without applying the Afropop filter

## AMBIGUITY & MISSING DATA POLICY (CRITICAL)

**When to Ask Clarifying Questions:**
- Query is vague or underspecified (e.g., "Show me something cool", "What's new?", "Find me stuff")
- Multiple valid interpretations exist (e.g., "Show me music" could mean posts, songs, or playlists)
- User intent is unclear and could lead to irrelevant results

**Clarifying Question Format:**
- Ask ONE focused question that narrows down the intent
- Provide 2-3 specific options when possible
- Example: "Are you looking for news articles, music posts, or videos? Or would you like to see what's trending?"

**When to Default Browse (Don't Ask):**
- Query is specific enough to infer intent (e.g., "Show me news", "Latest music posts", "Trending videos")
- Context from conversation history provides clear direction
- Query matches a common pattern (e.g., "latest", "trending", "popular")

**No Results Handling:**
When no posts are found, ALWAYS:
1. Acknowledge the search explicitly: "I searched for [query/type] but didn't find any matching posts."
2. Suggest specific alternatives:
   - "Try searching for [related topic]"
   - "Check out [alternative post type]"
   - "Browse [broader category] instead"
3. Offer to help refine the search: "Would you like me to search for something else?"
4. Never just say "No results" - always provide next steps

**Example No Results Response:**
"I searched for Amapiano news articles but didn't find any matching posts right now. Would you like me to:
- Show you Amapiano music posts instead?
- Search for news in a different genre?
- Browse all recent news articles?"

**Vague Query Handling:**
For queries like "Show me something cool" or "What's interesting?":
1. First, try a reasonable default: get_timeline_feed with sortBy: 'trending' (shows popular content)
2. If that returns results, present them with context: "Here's what's trending on the timeline right now!"
3. If no results, ask a clarifying question: "I'd love to help! Are you looking for trending posts, latest news, or featured content?"

**Missing Data Handling:**
- If a post is missing author info: Use "Unknown Author" (never omit the field)
- If a post is missing date: Use "Recently published" or omit date gracefully
- If engagement metrics are unavailable: Omit that line (don't show "0 views • 0 likes")
- If description is missing: Use title only, or "No description available"

**Error Recovery:**
- If a tool call fails: Acknowledge the error and suggest an alternative approach
- If partial results are returned: Present what you have and mention if more might be available
- Never fail silently - always communicate what happened

## NON-GOALS (CRITICAL - DO NOT DO THESE)

**Content Scope:**
- DO NOT recommend individual songs, tracks, or albums that are NOT timeline posts
- DO NOT provide music discovery beyond what's published on the timeline
- DO NOT suggest playlists unless they appear as timeline posts
- DO NOT recommend artists unless they have timeline posts

**Knowledge Boundaries:**
- DO NOT use external knowledge or information not present in timeline post data
- DO NOT make up facts, dates, or details about posts
- DO NOT provide opinions, predictions, or speculation about future events
- DO NOT reference events, news, or information not found in the timeline database

**Link Handling:**
- DO NOT provide external links unless they are explicitly present in the post data (videoUrl, songUrl, etc.)
- DO NOT create or suggest links to external platforms (YouTube, Spotify, etc.) unless the post contains those links
- DO NOT link to artist profiles or tracks unless they are part of the timeline post content

**Response Limitations:**
- DO NOT generate content that doesn't exist in the timeline
- DO NOT create fake or placeholder posts
- DO NOT summarize or paraphrase post content in ways that change the meaning
- DO NOT provide recommendations for content types not available on the timeline

**Tool Usage:**
- DO NOT call tools unnecessarily or make exploratory calls without clear user intent
- DO NOT combine data from timeline tools with external knowledge
- DO NOT make assumptions about post content beyond what the tools return

**What to Do Instead:**
- If asked about something not on the timeline: Acknowledge it's not available and suggest searching for related timeline content
- If asked for external information: Redirect to timeline content or explain that you only have access to timeline posts
- If asked for predictions or opinions: Decline politely and focus on what's currently available on the timeline
- If asked for links not in post data: Explain that you can only provide links that are part of the timeline post data

You have access to comprehensive timeline tools. Use them efficiently to help users discover content published on the timeline.`;

export class TimelineAgent extends BaseAgent {
  private model: any;

  /**
   * Create a new TimelineAgent instance
   * @param provider - AI provider to use (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    super('TimelineAgent', TIMELINE_SYSTEM_PROMPT);
    this.model = createModel(provider);
  }

  /**
   * Process a user message and return a timeline response
   * @param message - User's query message
   * @param context - Optional agent context (userId, filters, etc.)
   * @returns Agent response with timeline posts
   */
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    logger.info('[TimelineAgent] ===== PROCESSING REQUEST =====');
    logger.info('[TimelineAgent] Message:', message);
    logger.info('[TimelineAgent] Context:', {
      userId: context?.userId,
      conversationId: context?.conversationId,
      hasHistory: !!context?.conversationHistory?.length,
      filters: context?.filters,
      metadata: context?.metadata,
    });

    try {
      // Detect explicit genre mentions in the message (e.g., "amapiano", "afropop", "3-step")
      const explicitGenre = this.extractExplicitGenre(message);

      // Check if query is genre-agnostic (e.g., "latest news", "show me news", "trending posts")
      const isGenreAgnostic = this.isGenreAgnosticQuery(message);

      // Override context genre filter if:
      // 1. User explicitly mentions a different genre, OR
      // 2. Query is genre-agnostic (should show all genres)
      let effectiveContext = context;
      if (isGenreAgnostic && context?.filters?.genre) {
        // Remove genre filter for genre-agnostic queries
        logger.info(
          '[TimelineAgent] Removing genre filter for genre-agnostic query',
          {
            message,
            removedGenre: context.filters.genre,
          }
        );

        effectiveContext = {
          ...context,
          filters: {
            ...context.filters,
            genre: undefined, // Remove genre filter for genre-agnostic queries
          },
        };
      } else if (explicitGenre && context?.filters?.genre) {
        const contextGenre = context.filters.genre.toLowerCase();
        const explicitGenreLower = explicitGenre.toLowerCase();

        // Only override if genres are different
        if (
          contextGenre !== explicitGenreLower &&
          !contextGenre.includes(explicitGenreLower) &&
          !explicitGenreLower.includes(contextGenre)
        ) {
          logger.info('[TimelineAgent] Genre conflict detected and resolved', {
            explicitGenre,
            contextGenre: context.filters.genre,
            message,
          });

          effectiveContext = {
            ...context,
            filters: {
              ...context.filters,
              genre: undefined, // Remove genre filter when explicit genre is mentioned
            },
          };
        }
      } else if (explicitGenre && !context?.filters?.genre) {
        // Set genre filter if explicit genre found but no context filter exists
        effectiveContext = {
          ...context,
          filters: {
            ...context?.filters,
            genre: explicitGenre,
          },
        };
      }

      // Build context message if filters are provided (after genre override)
      const contextMessage = this.formatContext(effectiveContext);
      const fullMessage = contextMessage
        ? `${message}${contextMessage ? `\n\nContext: ${contextMessage}` : ''}`
        : message;

      // Execute tool calls with proper signature
      const execution = await executeToolCallLoop({
        model: this.model,
        tools: timelineTools,
        messages: [
          { role: 'system', content: this.systemPrompt },
          ...(context?.conversationHistory || []).map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: 'user', content: fullMessage },
        ],
        emitEvent: context?.emitEvent,
        originalMessage: message,
        runConfig: context?.runConfig,
      });

      const responseContent = extractTextContent(
        execution.finalMessage.content
      );

      // Convert tool results to structured response
      // Map ExecutedToolResult[] to the format expected by convertToolDataToResponse
      const toolData = execution.toolResults.map(result => ({
        tool: result.name,
        data: result.parsedResult ?? result.rawResult,
      }));

      const structuredResponse = await this.convertToolDataToResponse(
        toolData,
        context,
        message
      );

      const metadata = {
        agent: this.name,
        iterations: execution.iterations,
        toolCalls: execution.toolResults.map(tool => ({
          name: tool.name,
          args: tool.args,
          error: tool.error,
        })),
        toolExecutionTruncated: execution.toolExecutionTruncated || undefined,
      };

      // If we have a structured response, return it with the message
      if (structuredResponse) {
        return {
          message:
            structuredResponse.message ||
            responseContent ||
            'Here are some timeline posts for you!',
          data: structuredResponse,
          metadata,
        };
      }

      // Fallback to text response if no structured response
      return {
        message:
          responseContent ||
          "I couldn't find any timeline posts matching your query. Try searching for news articles, music posts, or videos!",
        metadata,
      };
    } catch (error) {
      logger.error('[TimelineAgent] Error:', error);
      throw error;
    }
  }

  /**
   * Convert raw tool data to structured AI response format
   */
  private async convertToolDataToResponse(
    toolData: Array<{ tool: string; data: unknown }>,
    _context?: AgentContext,
    _userMessage?: string
  ): Promise<AIResponse | null> {
    if (toolData.length === 0) {
      return null;
    }

    // Aggregate across tool outputs
    const aggregated: {
      posts: any[];
      meta: Record<string, any>;
    } = { posts: [], meta: {} };

    for (const item of toolData) {
      const toolName = item.tool;
      const data = item.data;

      switch (toolName) {
        case 'search_timeline_posts':
        case 'get_timeline_feed':
        case 'get_featured_timeline_content': {
          let postsData = data;
          if (typeof data === 'string') {
            try {
              postsData = JSON.parse(data);
            } catch {
              // If parsing fails, use data as is
            }
          }

          if (Array.isArray(postsData)) {
            aggregated.posts.push(...postsData);
          } else if (
            postsData &&
            typeof postsData === 'object' &&
            Array.isArray((postsData as any).posts)
          ) {
            aggregated.posts.push(...(postsData as any).posts);
          } else if (
            postsData &&
            typeof postsData === 'object' &&
            Array.isArray((postsData as any).featured)
          ) {
            aggregated.posts.push(...(postsData as any).featured);
          }

          if (
            postsData &&
            typeof postsData === 'object' &&
            typeof (postsData as any).total === 'number'
          ) {
            aggregated.meta.totalPosts = (postsData as any).total;
          }
          break;
        }
        case 'get_timeline_post': {
          let postData = data;
          if (typeof data === 'string') {
            try {
              postData = JSON.parse(data);
            } catch {
              // If parsing fails, use data as is
            }
          }

          if (
            postData &&
            typeof postData === 'object' &&
            !(postData as any).error
          ) {
            aggregated.posts.push(postData);
          }
          break;
        }
      }
    }

    if (aggregated.posts.length === 0) {
      return null;
    }

    // Determine response type based on content
    const hasNews = aggregated.posts.some(p => p.postType === 'NEWS_ARTICLE');
    const hasMusic = aggregated.posts.some(
      p => p.postType === 'MUSIC_POST' || p.postType === 'SONG'
    );
    const hasVideos = aggregated.posts.some(
      p => p.postType === 'VIDEO_CONTENT'
    );

    // Create response message
    let message = 'Here are some timeline posts for you!';
    if (hasNews && !hasMusic && !hasVideos) {
      message = 'Here are some news articles from the timeline!';
    } else if (hasMusic && !hasNews && !hasVideos) {
      message = 'Here are some music posts from artists!';
    } else if (hasVideos && !hasNews && !hasMusic) {
      message = 'Here are some videos from the timeline!';
    }

    // Convert posts to TimelinePostWithAuthor format
    // The posts from tools are already in the correct format, but we need to ensure
    // they match the TimelinePostWithAuthor interface
    const formattedPosts = aggregated.posts.map((post: any) => ({
      id: post.id,
      postType: post.postType,
      authorId: post.author.id,
      authorType: 'ARTIST' as const, // Default, could be enhanced
      title: post.title || null,
      description: post.description || null,
      content: post.content || {},
      coverImageUrl: post.coverImageUrl || null,
      videoUrl: post.videoUrl || null,
      songUrl: post.songUrl || null,
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      shareCount: post.shareCount || 0,
      viewCount: post.viewCount || 0,
      status: 'PUBLISHED' as const,
      isPinned: false,
      isFeatured: false,
      featuredUntil: null,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
      scheduledFor: null,
      expiresAt: null,
      priority: 0,
      relevanceScore: 0, // Default relevance score
      timelineAdId: null, // No ad association
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: post.author.id,
        name: post.author.name || post.author.email || 'Unknown',
        email: post.author.email || '',
        image: post.author.image || null,
      },
      _count: {
        likes: post.likeCount || 0,
        comments: post.commentCount || 0,
        shares: post.shareCount || 0,
      },
      userLiked: false,
      userFollowsAuthor: false,
    })) as any; // Type assertion to avoid strict type checking on partial data

    // Return as timeline_post_list response type
    return {
      type: 'timeline_post_list',
      message,
      timestamp: new Date(),
      data: {
        posts: formattedPosts,
        metadata: {
          total: formattedPosts.length,
          ...aggregated.meta,
        },
      },
    };
  }

  /**
   * Check if query is genre-agnostic (should show all genres, not filtered)
   * Examples: "latest news", "show me news", "trending posts", "recent posts"
   */
  private isGenreAgnosticQuery(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Patterns that indicate genre-agnostic queries
    const genreAgnosticPatterns = [
      'latest news',
      'show me news',
      'what news',
      'news articles',
      'recent news',
      'trending news',
      'latest posts',
      'recent posts',
      'trending posts',
      'show me posts',
      'what posts',
      'latest videos',
      'recent videos',
      'trending videos',
      'show me videos',
      'what videos',
      'all news',
      'all posts',
      'all videos',
      'any news',
      'any posts',
    ];

    return genreAgnosticPatterns.some(pattern =>
      lowerMessage.includes(pattern)
    );
  }

  /**
   * Extract explicit genre mention from user message
   * Detects common South African music genres mentioned in the query
   */
  private extractExplicitGenre(message: string): string | null {
    const lowerMessage = message.toLowerCase();

    // Common South African music genres
    const genres = [
      'amapiano',
      'afropop',
      'afrobeat',
      'afro house',
      'gqom',
      'kwaito',
      'house',
      'deep house',
      'tech house',
      '3-step',
      '3 step',
      'amapiano house',
      'piano',
      'afro',
      'soul',
      'r&b',
      'rnb',
      'hip hop',
      'hiphop',
      'rap',
      'jazz',
      'gospel',
      'maskandi',
      'isicathamiya',
      'mbaqanga',
    ];

    for (const genre of genres) {
      if (lowerMessage.includes(genre)) {
        // Return the original case from the message if possible
        const genreIndex = lowerMessage.indexOf(genre);
        const originalGenre = message.substring(
          genreIndex,
          genreIndex + genre.length
        );
        return originalGenre;
      }
    }

    return null;
  }
}
