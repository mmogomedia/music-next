/**
 * Recommendation Agent
 *
 * Specialized agent for personalized music recommendations.
 * Uses analytics tools to provide data-driven recommendations.
 *
 * @module RecommendationAgent
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { analyticsTools, discoveryTools } from '@/lib/ai/tools';
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { AIProvider } from '@/types/ai-service';
import type {
  TrackListResponse,
  PlaylistGridResponse,
} from '@/types/ai-responses';
import {
  executeToolCallLoop,
  extractTextContent,
  type ExecutedToolResult,
} from '@/lib/ai/tool-executor';

const RECOMMENDATION_SYSTEM_PROMPT = `You are a music recommendation assistant for Flemoji, a South African music streaming platform.

Your role is to provide personalized music recommendations based on user preferences, listening history, and current trends.

Available data sources:
- TRENDING: Current trending tracks (use get_trending_tracks tool)
- GENRE STATS: Statistics by genre (use get_genre_stats tool)
- PROVINCE STATS: Regional music statistics (use get_province_stats tool)
- TOP CHARTS: Popular tracks (use get_top_charts tool)
- FEATURED PLAYLISTS: Curated playlists (use get_featured_playlists tool)
- USER HISTORY: User's listening patterns (if available)

IMPORTANT - You MUST use tools to gather data:
1. Always call get_trending_tracks or get_top_charts to find popular music
2. Use get_genre_stats or get_province_stats to understand what's popular in specific genres/regions
3. Use search_tracks or get_tracks_by_genre to find specific tracks
4. Use get_featured_playlists or get_playlists_by_genre to find playlists

When responding:
- Be enthusiastic about helping users discover new music
- Base recommendations on REAL DATA from tools - don't make up tracks or artists
- Explain why you're recommending specific tracks/artists (mention play counts, trending scores, genre popularity)
- Provide context about genres and regions
- Keep recommendations diverse and interesting
- Use the tools available to gather real data before responding

You have access to analytics and discovery tools. USE THEM to provide data-driven recommendations based on actual Flemoji data.`;

export class RecommendationAgent extends BaseAgent {
  private model: any;

  constructor(provider: AIProvider = 'azure-openai') {
    super('RecommendationAgent', RECOMMENDATION_SYSTEM_PROMPT);

    // Initialize model based on provider
    switch (provider) {
      case 'azure-openai':
        this.model = new AzureChatOpenAI({
          azureOpenAIApiDeploymentName:
            process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini',
          azureOpenAIApiVersion:
            process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
          temperature: 1,
        });
        break;
      case 'openai':
        this.model = new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: 0.7,
        });
        break;
      case 'anthropic':
        this.model = new ChatAnthropic({
          modelName: 'claude-3-5-sonnet',
          temperature: 0.7,
        });
        break;
      case 'google':
        this.model = new ChatGoogleGenerativeAI({
          model: 'gemini-pro',
          temperature: 0.7,
        });
        break;
      default:
        this.model = new AzureChatOpenAI({
          azureOpenAIApiDeploymentName:
            process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini',
          azureOpenAIApiVersion:
            process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
          temperature: 1,
        });
    }
  }

  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Combine analytics and discovery tools for recommendations
      const recommendationTools = [...analyticsTools, ...discoveryTools];

      // Build context message if filters are provided
      const contextMessage = this.formatContext(context);
      const fullMessage = contextMessage
        ? `${message}${contextMessage ? `\n\nContext: ${contextMessage}` : ''}`
        : message;

      const execution = await executeToolCallLoop({
        model: this.model,
        tools: recommendationTools,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: fullMessage },
        ],
      });

      const responseContent = extractTextContent(
        execution.finalMessage.content
      );

      // Convert tool results to structured response
      const structuredResponse = await this.convertToolResultsToResponse(
        execution.toolResults,
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
          ...structuredResponse,
          message: responseContent || structuredResponse.message,
          metadata,
        };
      }

      // Fallback to text response with tool data
      return {
        message:
          responseContent ||
          'Here are some recommendations based on the latest analytics.',
        metadata,
      };
    } catch (error) {
      console.error('RecommendationAgent error:', error);
      return {
        message:
          'I apologize, but I encountered an error while generating recommendations. Please try again.',
        metadata: {
          agent: this.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Convert tool results to structured AI response format
   */
  private async convertToolResultsToResponse(
    results: ExecutedToolResult[],
    context?: AgentContext,
    userMessage?: string
  ): Promise<AgentResponse | null> {
    if (results.length === 0) return null;

    // Convert tool results to tool data format
    const toolData = results.map(result => ({
      tool: result.name,
      data:
        result.parsedResult ??
        (result.rawResult && typeof result.rawResult === 'string'
          ? JSON.parse(result.rawResult)
          : {}),
    }));

    return this.convertToolDataToResponse(toolData, userMessage);
  }

  /**
   * Extract track names/IDs from user message for filtering
   */
  private extractTrackFromMessage(message: string): {
    trackIds: string[];
    trackTitles: string[];
  } {
    // Simple extraction - look for quoted strings or common patterns
    const trackIds: string[] = [];
    const trackTitles: string[] = [];

    // Extract quoted strings (e.g., "Isela", 'Isela')
    const quotedMatches = message.match(/["']([^"']+)["']/g);
    if (quotedMatches) {
      trackTitles.push(
        ...quotedMatches.map(m => m.replace(/["']/g, '').trim())
      );
    }

    // Extract after "similar to", "like", "similar tracks to"
    const similarPatterns = [
      /similar (?:tracks?|songs?|music) (?:to|for) ["']?([^"'\n]+)["']?/i,
      /(?:tracks?|songs?|music) (?:similar|like) (?:to|as) ["']?([^"'\n]+)["']?/i,
      /similar to ["']?([^"'\n]+)["']?/i,
    ];

    for (const pattern of similarPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        trackTitles.push(match[1].trim());
      }
    }

    return { trackIds, trackTitles };
  }

  /**
   * Convert raw tool data to structured AI response format
   */
  private async convertToolDataToResponse(
    toolData: any[],
    userMessage?: string
  ): Promise<AgentResponse | null> {
    if (toolData.length === 0) return null;

    // Extract track info from user message to filter it out
    const excludeTracks: { ids: Set<string>; titles: Set<string> } = {
      ids: new Set(),
      titles: new Set(),
    };

    if (userMessage) {
      const extracted = this.extractTrackFromMessage(userMessage);
      extracted.trackIds.forEach(id => excludeTracks.ids.add(id));
      extracted.trackTitles.forEach(title =>
        excludeTracks.titles.add(title.toLowerCase())
      );
    }

    // Aggregate across tool outputs
    const aggregated: {
      tracks: any[];
      playlists: any[];
      meta: Record<string, any>;
    } = { tracks: [], playlists: [], meta: {} };

    for (const item of toolData) {
      const toolName = item.tool;
      const data = item.data || {};

      switch (toolName) {
        case 'get_trending_tracks':
        case 'get_top_charts':
        case 'search_tracks':
        case 'get_tracks_by_genre': {
          if (Array.isArray(data.tracks)) {
            aggregated.tracks.push(...data.tracks);
          }
          if (data.genre) aggregated.meta.genre = data.genre;
          if (typeof data.count === 'number') {
            aggregated.meta.totalTracks = data.count;
          }
          break;
        }
        case 'get_featured_playlists':
        case 'get_playlists_by_genre':
        case 'get_playlists_by_province': {
          if (Array.isArray(data.playlists)) {
            aggregated.playlists.push(...data.playlists);
          }
          if (data.genre) aggregated.meta.genre = data.genre;
          if (data.province) aggregated.meta.province = data.province;
          if (typeof data.count === 'number') {
            aggregated.meta.totalPlaylists = data.count;
          }
          break;
        }
        case 'get_playlist': {
          if (data.playlist) {
            aggregated.playlists.push(data.playlist);
          }
          break;
        }
        case 'get_genre_stats':
        case 'get_province_stats': {
          // Analytics stats can inform recommendations but don't directly create responses
          // They're used by the LLM to make better recommendations
          break;
        }
        default: {
          // ignore other tools
          break;
        }
      }
    }

    // De-duplicate aggregated items by id
    const dedupeById = (arr: any[]) => {
      const seen = new Set<string>();
      const out: any[] = [];
      for (const item of arr) {
        const id = (item && item.id) as string | undefined;
        const key = id || JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(item);
        }
      }
      return out;
    };

    aggregated.tracks = dedupeById(aggregated.tracks);
    aggregated.playlists = dedupeById(aggregated.playlists);

    // Filter out tracks mentioned in the query
    if (excludeTracks.ids.size > 0 || excludeTracks.titles.size > 0) {
      aggregated.tracks = aggregated.tracks.filter(track => {
        // Exclude by ID
        if (track.id && excludeTracks.ids.has(track.id)) {
          return false;
        }
        // Exclude by title (case-insensitive)
        if (
          track.title &&
          excludeTracks.titles.has(track.title.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
    }

    // If we have tracks, return track_list
    if (aggregated.tracks.length > 0) {
      // Ensure fileUrl is constructed for tracks
      const { constructFileUrl } = await import('@/lib/url-utils');
      const tracksWithUrls = aggregated.tracks.map(track => ({
        ...track,
        fileUrl:
          track.fileUrl ||
          (track.filePath ? constructFileUrl(track.filePath) : ''),
        isDownloadable: track.isDownloadable ?? false,
      }));

      return {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: tracksWithUrls,
          metadata: {
            genre: aggregated.meta.genre,
            province: aggregated.meta.province,
            total: aggregated.tracks.length,
          },
        },
      } as TrackListResponse;
    }

    // If we have playlists, return playlist_grid
    if (aggregated.playlists.length > 0) {
      return {
        type: 'playlist_grid',
        message: '',
        timestamp: new Date(),
        data: {
          playlists: aggregated.playlists,
          metadata: {
            genre: aggregated.meta.genre,
            province: aggregated.meta.province,
            total: aggregated.playlists.length,
          },
        },
      } as PlaylistGridResponse;
    }

    // No structured data to return
    return null;
  }
}
