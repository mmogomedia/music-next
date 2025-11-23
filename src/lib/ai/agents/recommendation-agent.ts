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
import { createModel } from './model-factory';
import { RECOMMENDATION_SYSTEM_PROMPT } from './agent-prompts';
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

export class RecommendationAgent extends BaseAgent {
  private model: any;

  /**
   * Create a new RecommendationAgent instance
   * @param provider - AI provider to use (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    super('RecommendationAgent', RECOMMENDATION_SYSTEM_PROMPT);
    this.model = createModel(provider);
  }

  /**
   * Process a user message and return personalized recommendations
   * @param message - User's recommendation request message
   * @param context - Optional agent context (userId, filters, etc.)
   * @returns Agent response with recommended tracks or playlists
   */
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
        message,
        responseContent // Pass response content to extract reasons
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
      // The structuredResponse is an AIResponse (has type, data, etc.)
      // We need to wrap it in AgentResponse format
      if (structuredResponse) {
        return {
          message: responseContent || structuredResponse.message || '',
          data: structuredResponse, // Put the full AIResponse in data field
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
   * Extract track recommendation reasons from AI response message
   * @param message - AI-generated response message
   * @param tracks - Array of tracks to match reasons to
   * @returns Map of track ID to reason string
   */
  private extractTrackReasons(
    message: string,
    tracks: any[]
  ): Map<string, string> {
    const reasons = new Map<string, string>();

    if (!message || tracks.length === 0) return reasons;

    // Pattern 1: "Track Name — Artist - Why: reason"
    // Pattern 2: "1) Track Name — Artist - Why: reason"
    // Pattern 3: "- Track Name — Artist\n  - Why: reason"
    const patterns = [
      // Numbered list with dash
      /(?:^\d+[).]?\s*[-–—]?\s*)([^—–-]+?)\s*[—–-]\s*([^—–-]+?)\s*[-–—]\s*[Ww]hy:\s*([^\n]+)/gm,
      // Dash list with Why
      /(?:^[-•]\s*)([^—–-]+?)\s*[—–-]\s*([^—–-]+?)\s*[-–—]\s*[Ww]hy:\s*([^\n]+)/gm,
      // Just track name with Why on next line
      /([A-Za-z0-9\s'"]+?)\s*[—–-]\s*([A-Za-z0-9\s&x]+?)\s*\n\s*[-–—]\s*[Ww]hy:\s*([^\n]+)/gm,
    ];

    for (const pattern of patterns) {
      const matches = [...message.matchAll(pattern)];
      for (const match of matches) {
        const trackTitle = match[1]?.trim();
        const reason = match[3]?.trim();

        if (trackTitle && reason) {
          // Find matching track (case-insensitive, partial match)
          const matchingTrack = tracks.find(
            t =>
              t.title &&
              t.title.toLowerCase().includes(trackTitle.toLowerCase())
          );

          if (matchingTrack && !reasons.has(matchingTrack.id)) {
            reasons.set(matchingTrack.id, reason);
          }
        }
      }
    }

    // Also try to extract reasons from structured sections
    // Look for "Why:" or "reason:" followed by text before next track
    const whySections = message.split(/\n\s*(?:[-•]\s*)?[A-Z]/);
    for (const section of whySections) {
      const whyMatch = section.match(/[Ww]hy:\s*([^\n]+)/);
      if (whyMatch) {
        const reason = whyMatch[1].trim();
        // Try to find the track mentioned before this "Why"
        const linesBeforeWhy = section.split(/[Ww]hy:/)[0];
        const trackMatch = linesBeforeWhy.match(
          /([A-Za-z0-9\s'"]+?)\s*[—–-]\s*([A-Za-z0-9\s&x]+)/
        );

        if (trackMatch) {
          const trackTitle = trackMatch[1]?.trim();
          const matchingTrack = tracks.find(
            t =>
              t.title &&
              t.title.toLowerCase().includes(trackTitle.toLowerCase())
          );

          if (matchingTrack && !reasons.has(matchingTrack.id)) {
            reasons.set(matchingTrack.id, reason);
          }
        }
      }
    }

    return reasons;
  }

  /**
   * Convert tool execution results to structured AI response format
   * @param results - Tool execution results
   * @param context - Optional agent context
   * @param userMessage - Original user message
   * @param aiMessage - AI-generated response message
   * @returns Structured agent response or null
   */
  private async convertToolResultsToResponse(
    results: ExecutedToolResult[],
    context?: AgentContext,
    userMessage?: string,
    aiMessage?: string
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

    return this.convertToolDataToResponse(toolData, userMessage, aiMessage);
  }

  /**
   * Extract track names/IDs from user message for filtering recommendations
   * @param message - User message to extract from
   * @returns Object with trackIds and trackTitles arrays
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
   * @param toolData - Array of tool results with tool name and data
   * @param userMessage - Original user message for filtering
   * @param aiMessage - AI-generated response message for extracting reasons
   * @returns Structured agent response or null
   */
  private async convertToolDataToResponse(
    toolData: any[],
    userMessage?: string,
    aiMessage?: string
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
      // Extract reasons from AI message if this is a recommendation
      const isRecommendation =
        userMessage &&
        (userMessage.toLowerCase().includes('recommend') ||
          userMessage.toLowerCase().includes('suggest') ||
          userMessage.toLowerCase().includes('similar'));

      const trackReasons =
        isRecommendation && aiMessage
          ? this.extractTrackReasons(aiMessage, aggregated.tracks)
          : new Map<string, string>();

      // Ensure fileUrl is constructed for tracks and attach reasons
      const { constructFileUrl } = await import('@/lib/url-utils');
      const tracksWithUrls = aggregated.tracks.map(track => ({
        ...track,
        fileUrl:
          track.fileUrl ||
          (track.filePath ? constructFileUrl(track.filePath) : ''),
        isDownloadable: track.isDownloadable ?? false,
        reason: trackReasons.get(track.id) || undefined, // Attach reason if available
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
