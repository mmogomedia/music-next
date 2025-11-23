/**
 * Discovery Agent
 *
 * Specialized agent for music discovery, search, and browsing operations.
 * Uses discovery tools to find tracks, playlists, and artists.
 *
 * @module DiscoveryAgent
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { discoveryTools } from '@/lib/ai/tools';
import { createModel } from './model-factory';
import { DISCOVERY_SYSTEM_PROMPT } from './agent-prompts';
import {
  MIN_TRACK_STRENGTH,
  MAX_RELATED_TRACKS,
  MAX_TRACKS_PER_RESPONSE,
} from './agent-config';
import { logger } from '@/lib/utils/logger';
import type { AIProvider } from '@/types/ai-service';
import type {
  AIResponse,
  TrackListResponse,
  PlaylistGridResponse,
  PlaylistResponse,
  ArtistResponse,
  SearchResultsResponse,
} from '@/types/ai-responses';
import {
  executeToolCallLoop,
  extractTextContent,
  type ExecutedToolResult,
} from '@/lib/ai/tool-executor';

export class DiscoveryAgent extends BaseAgent {
  private model: any;

  /**
   * Create a new DiscoveryAgent instance
   * @param provider - AI provider to use (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    super('DiscoveryAgent', DISCOVERY_SYSTEM_PROMPT);
    this.model = createModel(provider);
  }

  /**
   * Process a user message and return a discovery response
   * @param message - User's query message
   * @param context - Optional agent context (userId, filters, etc.)
   * @returns Agent response with discovered tracks, playlists, or artists
   */
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    logger.info('[DiscoveryAgent] ===== PROCESSING REQUEST =====');
    logger.info('[DiscoveryAgent] Message:', message);
    logger.info('[DiscoveryAgent] Context:', {
      userId: context?.userId,
      conversationId: context?.conversationId,
      hasHistory: !!context?.conversationHistory?.length,
      filters: context?.filters,
      metadata: context?.metadata,
    });
    try {
      // Detect explicit genre mention in user message
      const explicitGenre = await this.extractGenreFromMessage(message);

      // Override context filter if explicit genre differs from context filter
      // This prevents conflicts when user explicitly mentions a different genre
      let effectiveContext = context;
      if (explicitGenre && context?.filters?.genre) {
        const contextGenre = context.filters.genre.toLowerCase();
        const explicitGenreLower = explicitGenre.toLowerCase();

        // Only override if genres are different (allowing for aliases/variations)
        if (
          contextGenre !== explicitGenreLower &&
          !contextGenre.includes(explicitGenreLower) &&
          !explicitGenreLower.includes(contextGenre)
        ) {
          logger.info('Genre conflict detected and resolved', {
            explicitGenre,
            contextGenre: context.filters.genre,
            message,
          });

          effectiveContext = {
            ...context,
            filters: {
              ...context.filters,
              genre: explicitGenre, // Override with explicit genre
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

      // Build context message if filters are provided
      const contextMessage = this.formatContext(effectiveContext);
      const fullMessage = contextMessage
        ? `${message}${contextMessage ? `\n\nContext: ${contextMessage}` : ''}`
        : message;

      // Emit event when LLM is deciding which tools to call
      context?.emitEvent?.({
        type: 'agent_processing',
        agent: 'DiscoveryAgent',
        message: 'Determining which tools to use...',
        stage: 'tool_selection',
        timestamp: new Date().toISOString(),
      });

      const execution = await executeToolCallLoop({
        model: this.model,
        tools: discoveryTools,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: fullMessage },
        ],
        emitEvent: context?.emitEvent,
      });

      logger.info('[DiscoveryAgent] Tool execution completed:', {
        iterations: execution.iterations,
        toolCallsCount: execution.toolResults.length,
        toolCalls: execution.toolResults.map(t => ({
          name: t.name,
          args: t.args,
          hasError: !!t.error,
        })),
        truncated: execution.toolExecutionTruncated,
      });

      const textContent = extractTextContent(execution.finalMessage.content);
      const messageText =
        textContent ||
        (execution.toolResults.length > 0
          ? this.buildFallbackMessage(execution.toolResults)
          : 'I found some information for you. Let me help you explore that!');

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

      if (execution.toolResults.length === 0) {
        return {
          message: messageText,
          metadata,
        };
      }

      // Emit processing_results event with more detail
      context?.emitEvent?.({
        type: 'processing_results',
        message: `Processing ${execution.toolResults.length} tool result${execution.toolResults.length !== 1 ? 's' : ''}...`,
        stage: 'result_processing',
        timestamp: new Date().toISOString(),
      });

      const structuredData = await this.convertToolResultsToResponse(
        execution.toolResults,
        effectiveContext, // Use effective context (with genre override if applicable)
        message // Pass original message to detect compile intent
      );

      // Emit finalizing event
      context?.emitEvent?.({
        type: 'finalizing',
        message: 'Preparing your response...',
        stage: 'finalization',
        timestamp: new Date().toISOString(),
      });

      return {
        message: messageText,
        data: structuredData || undefined,
        metadata,
      };
    } catch (error) {
      console.error('DiscoveryAgent error:', error);
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      const baseMessage =
        'I apologize, but I encountered an error while searching for music. Please try again.';
      return {
        message:
          process.env.NODE_ENV !== 'production'
            ? `${baseMessage} (debug: ${errorMessage})`
            : baseMessage,
        metadata: {
          agent: this.name,
          error: errorMessage,
        },
      };
    }
  }

  /**
   * Build a fallback message when tool results are available but no structured response
   * @param toolResults - Results from tool execution
   * @returns Fallback message string
   */
  private buildFallbackMessage(toolResults: ExecutedToolResult[]): string {
    const toolNames = Array.from(
      new Set(toolResults.map(result => result.name))
    ).join(', ');
    return `I found results using ${toolNames || 'the available tools'}! Here's what I discovered:`;
  }

  /**
   * Convert tool execution results to structured AI response
   * @param results - Tool execution results
   * @param context - Optional agent context
   * @param userMessage - Original user message (for compile intent detection)
   * @returns Structured AI response or null
   */
  private async convertToolResultsToResponse(
    results: ExecutedToolResult[],
    context?: AgentContext,
    userMessage?: string
  ): Promise<AIResponse | null> {
    const toolData = results.map(result => ({
      tool: result.name,
      data: result.parsedResult ?? result.rawResult,
    }));

    return this.convertToolDataToResponse(toolData, context, userMessage);
  }

  /**
   * Detect if user wants to compile/create a playlist
   */
  private detectCompileIntent(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const compileKeywords = [
      'compile',
      'create',
      'make',
      'build',
      'put together',
      'assemble',
      'curate',
      'generate',
    ];
    return compileKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Convert raw tool data to structured AI response format
   */
  private async convertToolDataToResponse(
    toolData: any[],
    context?: AgentContext,
    userMessage?: string
  ): Promise<AIResponse | null> {
    if (toolData.length === 0) {
      return null;
    }

    // Aggregate across tool outputs
    const aggregated: {
      tracks: any[];
      artists: any[];
      playlists: any[];
      meta: Record<string, any>;
    } = { tracks: [], artists: [], playlists: [], meta: {} };

    for (const item of toolData) {
      const toolName = item.tool;
      const data = item.data || {};

      switch (toolName) {
        case 'search_tracks':
        case 'get_tracks_by_genre':
        case 'get_trending_tracks': {
          // Handle both parsed JSON objects and string JSON
          let tracksData = data;
          if (typeof data === 'string') {
            try {
              tracksData = JSON.parse(data);
            } catch {
              // If parsing fails, use data as is
            }
          }

          // Handle different response structures
          if (Array.isArray(tracksData)) {
            aggregated.tracks.push(...tracksData);
          } else if (tracksData && Array.isArray(tracksData.tracks)) {
            aggregated.tracks.push(...tracksData.tracks);
          }

          if (tracksData?.genre) {
            aggregated.meta.genre = tracksData.genre;
          }
          if (typeof tracksData?.count === 'number') {
            aggregated.meta.totalTracks = tracksData.count;
          }
          break;
        }
        case 'get_top_charts':
        case 'get_featured_playlists':
        case 'get_playlists_by_genre':
        case 'get_playlists_by_province': {
          if (Array.isArray(data.playlists))
            aggregated.playlists.push(...data.playlists);
          if (data.genre) aggregated.meta.genre = data.genre;
          if (data.province) aggregated.meta.province = data.province;
          if (typeof data.count === 'number')
            aggregated.meta.totalPlaylists = data.count;
          break;
        }
        case 'get_playlist': {
          if (data) aggregated.playlists.push(data);
          break;
        }
        case 'get_artist': {
          // Tools may return { artist: {...} }
          const artistObj = data.artist ? data.artist : data;
          if (artistObj) aggregated.artists.push(artistObj);
          break;
        }
        case 'search_artists': {
          if (Array.isArray(data.artists))
            aggregated.artists.push(...data.artists);
          break;
        }
        case 'get_genres': {
          // Handle genre list separately - return immediately
          if (Array.isArray(data.genres)) {
            return {
              type: 'genre_list',
              message: '',
              timestamp: new Date(),
              data: {
                genres: data.genres,
                metadata: {
                  total: data.count || data.genres.length,
                },
              },
            } as any;
          }
          break;
        }
        default: {
          // ignore
          break;
        }
      }
    }

    // De-duplicate aggregated items by id where available
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

    aggregated.artists = dedupeById(aggregated.artists);
    aggregated.playlists = dedupeById(aggregated.playlists);

    aggregated.tracks = aggregated.tracks.filter(
      track => this.getTrackStrength(track) >= MIN_TRACK_STRENGTH
    );

    // HARD LIMIT: Never process more than MAX_TRACKS_PER_RESPONSE tracks total
    // Apply limit BEFORE genre filtering to ensure consistent behavior
    aggregated.tracks = aggregated.tracks.slice(0, MAX_TRACKS_PER_RESPONSE);

    const resolvedGenreCluster = await this.getGenreCluster(
      aggregated.meta.genre,
      aggregated.tracks
    );

    if (resolvedGenreCluster.length > 0) {
      const normalizedGenres = new Set(
        resolvedGenreCluster.map(genre => genre.toLowerCase())
      );
      aggregated.tracks = aggregated.tracks.filter(track => {
        if (!track?.genre) {
          return true;
        }
        return normalizedGenres.has(String(track.genre).toLowerCase());
      });
      // Re-apply limit after genre filtering to ensure we never exceed MAX_TRACKS_PER_RESPONSE
      aggregated.tracks = aggregated.tracks.slice(0, MAX_TRACKS_PER_RESPONSE);
    }

    // Check if user wants to compile a playlist
    const wantsToCompile = userMessage && this.detectCompileIntent(userMessage);
    const hasTracks = aggregated.tracks.length > 0;

    // If user wants to compile, create a compiled playlist (even if empty)
    // This takes priority over returning a track_list, even if there are existing playlists
    if (wantsToCompile) {
      // If no tracks found, try to get some tracks by genre from the user message
      if (!hasTracks && userMessage) {
        const genre = await this.extractGenreFromMessage(userMessage);
        if (genre) {
          // Try to fetch tracks by genre one more time
          try {
            const { MusicService } = await import('@/lib/services');
            const genreTracks = await MusicService.getTracksByGenre(genre, 50, {
              minStrength: 70,
            });
            if (genreTracks && genreTracks.length > 0) {
              const mappedTracks = genreTracks
                .slice(0, MAX_TRACKS_PER_RESPONSE) // Limit to MAX_TRACKS_PER_RESPONSE
                .map(track => ({
                  id: track.id,
                  title: track.title,
                  artist:
                    track.artist ||
                    track.artistProfile?.artistName ||
                    'Unknown Artist',
                  genre: track.genre,
                  duration: track.duration,
                  playCount: track.playCount,
                  likeCount: track.likeCount,
                  coverImageUrl: track.coverImageUrl,
                  filePath: track.filePath,
                  artistId: track.artistProfileId,
                  userId: track.userId,
                  createdAt: track.createdAt,
                  updatedAt: track.updatedAt,
                  albumArtwork: track.albumArtwork,
                  isDownloadable: track.isDownloadable,
                }));
              aggregated.tracks.push(...mappedTracks);
              // Re-apply limit after adding tracks
              aggregated.tracks = aggregated.tracks.slice(
                0,
                MAX_TRACKS_PER_RESPONSE
              );
              aggregated.meta.genre = genre;
            }
          } catch (error) {
            // If genre fetch fails, continue with empty tracks
          }
        }
      }

      return await this.compilePlaylistFromTracks(
        aggregated.tracks,
        aggregated.meta,
        userMessage
      );
    }

    // If we have both tracks and artists, return mixed search results
    if (aggregated.tracks.length > 0 && aggregated.artists.length > 0) {
      return {
        type: 'search_results',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: aggregated.tracks,
          artists: aggregated.artists,
          metadata: {
            ...aggregated.meta,
            total:
              (aggregated.tracks?.length || 0) +
              (aggregated.artists?.length || 0),
          },
        },
      } as SearchResultsResponse;
    }

    // If only tracks
    if (aggregated.tracks.length > 0) {
      const { constructFileUrl } = await import('@/lib/url-utils');

      // HARD LIMIT: Never exceed MAX_TRACKS_PER_RESPONSE tracks total
      // Re-apply limit here to ensure it's enforced even if tracks were added elsewhere
      const limitedTracks = aggregated.tracks.slice(0, MAX_TRACKS_PER_RESPONSE);

      const tracksWithSummaries = limitedTracks.map(track => {
        const fileUrl =
          track.fileUrl ||
          (track.filePath ? constructFileUrl(track.filePath) : '');
        const description =
          typeof track.description === 'string'
            ? track.description.trim()
            : undefined;

        // Summary should be the description field itself (as per requirements)
        // Always use description as summary if it exists
        const summary = description || undefined;

        // Build result object - summary comes from description field
        const result: any = {
          ...track,
          description,
          fileUrl,
          summary, // Set summary directly - it's the description field itself
          artistId: track.artistId || track.artistProfileId,
          attributes: Array.isArray(track.attributes) ? track.attributes : [],
          mood: Array.isArray(track.mood) ? track.mood : [],
          strength: this.getTrackStrength(track),
          isDownloadable: track.isDownloadable ?? false,
        };

        return result;
      });

      const genreCluster = resolvedGenreCluster;
      const mainTrackIds = new Set(
        tracksWithSummaries.map(track => track.id).filter(Boolean)
      );

      // Calculate how many "other" tracks we can include (max MAX_TRACKS_PER_RESPONSE total)
      const remainingSlots = Math.max(
        0,
        MAX_TRACKS_PER_RESPONSE - tracksWithSummaries.length
      );
      const otherTracksLimit =
        remainingSlots > 0 ? Math.min(remainingSlots, MAX_RELATED_TRACKS) : 0;

      const otherTracks =
        otherTracksLimit > 0
          ? await this.getCuratedOtherTracks({
              genreCluster,
              excludeIds: mainTrackIds,
              limit: otherTracksLimit,
            })
          : [];

      // Track AI search events for tracks in "other" field
      if (otherTracks && otherTracks.length > 0) {
        try {
          const { processAISearchEvents } = await import('@/lib/stats-server');

          // Deduplicate tracks within the same response (count once per track)
          const uniqueTrackIds = new Set<string>();
          const events: Array<{
            eventType: 'ai_search';
            trackId: string;
            userId?: string;
            sessionId: string;
            conversationId?: string;
            resultType: string;
          }> = [];

          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          for (const track of otherTracks) {
            if (track.id && !uniqueTrackIds.has(track.id)) {
              uniqueTrackIds.add(track.id);
              events.push({
                eventType: 'ai_search',
                trackId: track.id,
                userId: context?.userId,
                sessionId: sessionId,
                conversationId: context?.conversationId,
                resultType: 'track_list',
              });
            }
          }

          // Process events directly on server (non-blocking)
          if (events.length > 0) {
            processAISearchEvents(events).catch(error => {
              // Non-blocking: log error but continue
              logger.error('Failed to track AI search events:', error);
            });
          }
        } catch (error) {
          // Non-blocking: log error but continue
          logger.error('Failed to track AI search events:', error);
        }
      }

      // Ensure total never exceeds MAX_TRACKS_PER_RESPONSE
      const totalTracks =
        tracksWithSummaries.length + (otherTracks?.length || 0);

      const finalResponse = {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: tracksWithSummaries,
          ...(otherTracks && otherTracks.length > 0 && { other: otherTracks }),
          metadata: {
            genre: aggregated.meta.genre,
            total: Math.min(totalTracks, MAX_TRACKS_PER_RESPONSE), // Never exceed MAX_TRACKS_PER_RESPONSE
          },
        },
      } as TrackListResponse;

      return finalResponse;
    }

    // If only artists
    if (aggregated.artists.length > 0) {
      // If single artist, return artist; otherwise mixed search with artists only
      if (aggregated.artists.length === 1) {
        return {
          type: 'artist',
          message: '',
          timestamp: new Date(),
          data: aggregated.artists[0],
        } as ArtistResponse;
      }
      return {
        type: 'search_results',
        message: '',
        timestamp: new Date(),
        data: {
          artists: aggregated.artists,
          metadata: { total: aggregated.artists.length },
        },
      } as SearchResultsResponse;
    }

    // If only playlists/grid
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

    // Fallback to first tool's raw data
    const first = toolData[0];
    return (first?.data as AIResponse) ?? null;
  }

  /**
   * Get genre cluster (related genres) for a given base genre
   * @param baseGenre - Base genre name or slug
   * @param tracks - Optional tracks to extract genre from
   * @returns Array of related genre slugs/names
   */
  private async getGenreCluster(
    baseGenre?: string,
    tracks?: any[]
  ): Promise<string[]> {
    const cluster = new Set<string>();
    const fallbackGenre =
      baseGenre ||
      tracks?.find(track => typeof track?.genre === 'string')?.genre ||
      '';

    if (fallbackGenre) {
      cluster.add(fallbackGenre.toLowerCase());
    }

    try {
      if (!fallbackGenre) {
        return Array.from(cluster);
      }

      const { prisma } = await import('@/lib/db');
      const normalized = fallbackGenre.toLowerCase().trim();
      const genreRecord = await prisma.genre.findFirst({
        where: {
          OR: [
            { slug: { equals: normalized, mode: 'insensitive' } },
            { name: { equals: fallbackGenre, mode: 'insensitive' } },
          ],
        },
        include: {
          parent: true,
          subGenres: true,
        },
      });

      if (genreRecord) {
        cluster.add(genreRecord.slug.toLowerCase());
        cluster.add(genreRecord.name.toLowerCase());
        if (Array.isArray(genreRecord.aliases)) {
          genreRecord.aliases.forEach(alias => {
            if (typeof alias === 'string' && alias.trim().length > 0) {
              cluster.add(alias.toLowerCase());
            }
          });
        }
        if (genreRecord.parent) {
          if (genreRecord.parent.slug) {
            cluster.add(genreRecord.parent.slug.toLowerCase());
          }
          if (genreRecord.parent.name) {
            cluster.add(genreRecord.parent.name.toLowerCase());
          }
        }
        if (Array.isArray(genreRecord.subGenres)) {
          genreRecord.subGenres.forEach(sub => {
            if (sub.slug) cluster.add(sub.slug.toLowerCase());
            if (sub.name) cluster.add(sub.name.toLowerCase());
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to resolve genre cluster', error as Error);
    }

    return Array.from(cluster).filter(Boolean);
  }

  /**
   * Get curated "other tracks" from genre-specific playlists
   * @param genreCluster - Array of genre slugs/names to search
   * @param excludeIds - Set of track IDs to exclude (main results)
   * @param limit - Maximum number of tracks to return (default: MAX_RELATED_TRACKS)
   * @returns Array of curated tracks matching the genre cluster
   */
  private async getCuratedOtherTracks({
    genreCluster,
    excludeIds,
    limit = MAX_RELATED_TRACKS,
  }: {
    genreCluster: string[];
    excludeIds: Set<string>;
    limit?: number;
  }): Promise<any[]> {
    try {
      const { PlaylistService } = await import('@/lib/services');
      const { constructFileUrl } = await import('@/lib/url-utils');
      const candidates: any[] = [];
      const playlistIds = new Set<string>();

      const normalizedCluster = genreCluster.map(genre =>
        this.slugifyGenre(genre)
      );

      for (const genreSlug of normalizedCluster) {
        if (!genreSlug) continue;
        const playlists = await PlaylistService.getPlaylistsByGenre(
          genreSlug,
          2
        );

        for (const playlist of playlists) {
          if (playlistIds.has(playlist.id)) continue;
          playlistIds.add(playlist.id);

          const playlistWithTracks = await PlaylistService.getPlaylistById(
            playlist.id
          );
          if (!playlistWithTracks) continue;

          playlistWithTracks.tracks.forEach(pt => {
            const track = pt.track;
            if (!track || !track.id || excludeIds.has(track.id)) return;
            const strength = this.getTrackStrength(track);
            if (strength < MIN_TRACK_STRENGTH) return;

            // Filter by genre cluster - track must match one of the genres in cluster
            if (genreCluster.length > 0) {
              const trackGenre = track.genre?.toLowerCase();
              if (!trackGenre) return; // Skip tracks without genre

              const normalizedCluster = genreCluster.map(g => g.toLowerCase());
              const matchesGenre = normalizedCluster.some(clusterGenre => {
                // Check exact match or if track genre contains/equals cluster genre
                return (
                  trackGenre === clusterGenre ||
                  trackGenre.includes(clusterGenre) ||
                  clusterGenre.includes(trackGenre)
                );
              });

              if (!matchesGenre) return; // Skip tracks that don't match genre cluster
            }

            candidates.push({
              ...track,
              strength,
            });
          });

          if (candidates.length >= limit * 2) break;
        }

        if (candidates.length >= limit * 2) break;
      }

      if (candidates.length === 0) {
        const featuredPlaylists = await PlaylistService.getFeaturedPlaylists(3);
        for (const playlist of featuredPlaylists) {
          const playlistWithTracks = await PlaylistService.getPlaylistById(
            playlist.id
          );
          if (!playlistWithTracks) continue;

          playlistWithTracks.tracks.forEach(pt => {
            const track = pt.track;
            if (!track || !track.id || excludeIds.has(track.id)) return;
            const strength = this.getTrackStrength(track);
            if (strength < MIN_TRACK_STRENGTH) return;

            // Filter by genre cluster - track must match one of the genres in cluster
            if (genreCluster.length > 0) {
              const trackGenre = track.genre?.toLowerCase();
              if (!trackGenre) return; // Skip tracks without genre

              const normalizedCluster = genreCluster.map(g => g.toLowerCase());
              const matchesGenre = normalizedCluster.some(clusterGenre => {
                // Check exact match or if track genre contains/equals cluster genre
                return (
                  trackGenre === clusterGenre ||
                  trackGenre.includes(clusterGenre) ||
                  clusterGenre.includes(trackGenre)
                );
              });

              if (!matchesGenre) return; // Skip tracks that don't match genre cluster
            }

            candidates.push({
              ...track,
              strength,
            });
          });

          if (candidates.length >= limit * 2) break;
        }
      }

      if (candidates.length === 0) {
        return [];
      }

      const sampled = this.weightedSampleTracks(candidates, limit);
      return sampled.map(track => {
        const fileUrl =
          track.fileUrl ||
          (track.filePath ? constructFileUrl(track.filePath) : '');
        const coverImageUrl = track.coverImageUrl
          ? track.coverImageUrl.startsWith('http')
            ? track.coverImageUrl
            : constructFileUrl(track.coverImageUrl)
          : track.albumArtwork
            ? track.albumArtwork.startsWith('http')
              ? track.albumArtwork
              : constructFileUrl(track.albumArtwork)
            : null;

        return {
          id: track.id,
          title: track.title,
          artist:
            track.artist || track.artistProfile?.artistName || 'Unknown Artist',
          genre: track.genre,
          duration: track.duration,
          playCount: track.playCount ?? 0,
          likeCount: track.likeCount ?? 0,
          coverImageUrl,
          uniqueUrl: track.uniqueUrl,
          filePath: track.filePath,
          fileUrl,
          artistId: track.artistProfileId,
          userId: track.userId,
          createdAt: track.createdAt,
          updatedAt: track.updatedAt,
          albumArtwork: track.albumArtwork,
          isDownloadable: track.isDownloadable ?? false,
          attributes: Array.isArray(track.attributes) ? track.attributes : [],
          mood: Array.isArray(track.mood) ? track.mood : [],
        };
      });
    } catch (error) {
      logger.error('Failed to load curated tracks:', error);
      return [];
    }
  }

  /**
   * Weighted random sampling of tracks based on play/download counts
   * @param tracks - Array of tracks to sample from
   * @param count - Number of tracks to sample
   * @returns Sampled tracks array
   */
  private weightedSampleTracks(tracks: any[], count: number): any[] {
    if (tracks.length <= count) {
      return tracks.slice(0, count);
    }

    const pool = tracks.map(track => ({
      track,
      weight: Math.max(
        1,
        (track.playCount || 0) + (track.downloadCount || 0) + 1
      ),
    }));

    const selected: any[] = [];

    while (pool.length > 0 && selected.length < count) {
      const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
      let threshold = Math.random() * totalWeight;
      let index = 0;

      for (; index < pool.length; index++) {
        threshold -= pool[index].weight;
        if (threshold <= 0) {
          break;
        }
      }

      const [choice] = pool.splice(Math.min(index, pool.length - 1), 1);
      selected.push(choice.track);
    }

    return selected;
  }

  /**
   * Convert genre name to URL-friendly slug
   * @param value - Genre name to slugify
   * @returns Slugified genre string
   */
  private slugifyGenre(value?: string): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Compile a virtual playlist from tracks
   * @param tracks - Array of tracks to include in playlist
   * @param meta - Metadata (genre, province, etc.)
   * @param userMessage - Original user message for context
   * @returns Playlist response with compiled tracks
   */
  private async compilePlaylistFromTracks(
    tracks: any[],
    meta: Record<string, any>,
    userMessage?: string
  ): Promise<PlaylistResponse> {
    const { constructFileUrl } = await import('@/lib/url-utils');

    // Extract genre from meta or user message
    const genre = meta.genre || this.extractGenreFromMessage(userMessage || '');
    const playlistName = genre ? `${genre} Playlist` : 'Curated Playlist';

    // Prepare tracks with proper structure
    // Limit to MAX_TRACKS_PER_RESPONSE to ensure consistency
    const playlistTracks = tracks
      .slice(0, MAX_TRACKS_PER_RESPONSE)
      .map((track, index) => {
        const coverImageUrl =
          track.coverImageUrl || track.albumArtwork
            ? constructFileUrl(track.coverImageUrl || track.albumArtwork)
            : null;

        return {
          track: {
            ...track,
            fileUrl: track.fileUrl || constructFileUrl(track.filePath),
            coverImageUrl,
            artistProfile: track.artistProfile || null,
          },
          order: index + 1,
        };
      });

    // Get cover image from first track or use a default
    const coverImage =
      playlistTracks[0]?.track?.coverImageUrl ||
      playlistTracks[0]?.track?.albumArtwork ||
      '';

    // Create virtual playlist object
    const compiledPlaylist = {
      id: `compiled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: playlistName,
      description: `A curated ${genre ? genre.toLowerCase() : ''} playlist compiled just for you.`,
      coverImage: coverImage || '',
      maxTracks: 50,
      currentTracks: playlistTracks.length,
      status: 'ACTIVE' as const,
      submissionStatus: 'CLOSED' as const,
      maxSubmissionsPerArtist: 1,
      province: meta.province || null,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0,
      playlistTypeId: '', // Virtual playlist, no type
      tracks: playlistTracks,
    };

    return {
      type: 'playlist',
      message: `I've compiled a ${genre ? genre.toLowerCase() : ''} playlist with ${playlistTracks.length} tracks for you!`,
      timestamp: new Date(),
      data: compiledPlaylist,
    } as PlaylistResponse;
  }

  /**
   * Get track strength score (quality/completeness indicator)
   * @param track - Track object
   * @returns Strength score (0-100) or 0 if not available
   */
  private getTrackStrength(track: any): number {
    if (!track) return 0;
    if (typeof track.strength === 'number') {
      return track.strength;
    }
    if (typeof track.completionPercentage === 'number') {
      return track.completionPercentage;
    }
    return 0;
  }

  /**
   * Build narrative/summary text for a track using description, attributes, mood, and performance
   * @param track - Track object with description, attributes, mood, playCount, downloadCount
   * @returns Formatted narrative string or undefined
   */
  private buildTrackNarrative(track: any): string | undefined {
    const description =
      track && typeof track.description === 'string'
        ? track.description.trim()
        : '';

    const extras: string[] = [];
    const attributes = Array.isArray(track?.attributes)
      ? track.attributes.filter((attr: string) => typeof attr === 'string')
      : [];
    if (attributes.length > 0) {
      extras.push(`Themes: ${attributes.slice(0, 2).join(', ')}`);
    }

    const mood = Array.isArray(track?.mood)
      ? track.mood.filter((m: string) => typeof m === 'string')
      : [];
    if (mood.length > 0) {
      extras.push(`Mood: ${mood.slice(0, 2).join(', ')}`);
    }

    const performanceTotal =
      (track?.playCount || 0) + (track?.downloadCount || 0);
    if (performanceTotal > 0) {
      const descriptor =
        performanceTotal > 10000
          ? 'Audience favourite'
          : performanceTotal > 3000
            ? 'Gaining traction'
            : 'Emerging pick';
      extras.push(
        `${descriptor} on Flemoji (${performanceTotal.toLocaleString()} plays + downloads)`
      );
    }

    if (!description && extras.length === 0) {
      return undefined;
    }

    if (extras.length === 0) {
      return description;
    }

    if (!description) {
      return extras.join(' • ');
    }

    return `${description}\n\n${extras.join(' • ')}`;
  }

  /**
   * Extract explicit genre from user message
   * Uses database genres with aliases for accurate matching
   * Returns normalized genre name if found, null otherwise
   */
  private async extractGenreFromMessage(
    message: string
  ): Promise<string | null> {
    const lowerMessage = message.toLowerCase().trim();

    try {
      const { prisma } = await import('@/lib/db');
      const genres = await prisma.genre.findMany({
        where: { isActive: true },
        select: {
          name: true,
          slug: true,
          aliases: true,
        },
      });

      // Check for exact matches (name, slug, aliases)
      for (const genre of genres) {
        const normalizedName = genre.name.toLowerCase();
        const normalizedSlug = genre.slug.toLowerCase();

        // Check name
        if (lowerMessage.includes(normalizedName)) {
          return genre.name; // Return canonical name
        }

        // Check slug
        if (lowerMessage.includes(normalizedSlug)) {
          return genre.name; // Return canonical name
        }

        // Check aliases
        if (Array.isArray(genre.aliases)) {
          for (const alias of genre.aliases) {
            if (
              typeof alias === 'string' &&
              lowerMessage.includes(alias.toLowerCase())
            ) {
              return genre.name; // Return canonical name
            }
          }
        }
      }

      // Fallback: Check common variations that might not be in DB
      const commonVariations: Record<string, string> = {
        '3 step': '3 Step',
        '3-step': '3 Step',
        '3step': '3 Step',
        'hip hop': 'Hip Hop',
        hiphop: 'Hip Hop',
        'afro house': 'Afro House',
        afrobeat: 'Afrobeat',
        'afro beat': 'Afrobeat',
      };

      for (const [variation, canonical] of Object.entries(commonVariations)) {
        if (lowerMessage.includes(variation)) {
          return canonical;
        }
      }
    } catch (error) {
      logger.warn('Failed to extract genre from message', error as Error);
    }

    return null;
  }
}
