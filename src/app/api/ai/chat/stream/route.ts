import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai-service';
import { routerAgent } from '@/lib/ai/agents';
import { ChatRequest, ChatResponse } from '@/types/ai';
import {
  conversationStore,
  semanticMemoryManager,
  contextBuilder,
  memoryOrchestrator,
} from '@/lib/ai/memory/bootstrap';
import { logger } from '@/lib/utils/logger';
import type { SSEEvent, SSEEventEmitter } from '@/lib/ai/sse-event-emitter';
import type { RunnableConfig } from '@langchain/core/runnables';
import { uuid7 as uuidv7 } from 'langsmith';
import { traceable } from 'langsmith/traceable';

export const dynamic = 'force-dynamic';

/**
 * SSE endpoint for AI chat with real-time status updates
 * Accepts POST request and streams events as processing happens
 */
export async function POST(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;

      // Helper to send SSE events
      const sendEvent: SSEEventEmitter = (event: SSEEvent) => {
        if (!isActive) return;
        try {
          const message = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          logger.error('Error sending SSE event:', error);
        }
      };

      // Generate trace ID immediately so it's available in the first event
      const traceId = uuidv7();

      // Send initial connection confirmation (includes traceId for DevTools visibility)
      sendEvent({
        type: 'connected',
        timestamp: new Date().toISOString(),
        traceId,
      });

      try {
        // Check if any AI provider is available
        const availableProviders = aiService.getAvailableProviders();
        if (availableProviders.length === 0) {
          sendEvent({
            type: 'error',
            timestamp: new Date().toISOString(),
            error: {
              message: 'No AI providers configured',
              code: 'MISSING_API_KEY',
            },
          });
          controller.close();
          return;
        }

        // Parse the request body
        const body: ChatRequest = await request.json();
        const { message, context, chatType } = body;

        if (!message || typeof message !== 'string') {
          sendEvent({
            type: 'error',
            timestamp: new Date().toISOString(),
            error: {
              message: 'Invalid request: message is required',
              code: 'INVALID_REQUEST',
            },
          });
          controller.close();
          return;
        }

        // Generate conversation ID if not provided
        const conversationId =
          body.conversationId ||
          `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Build a LangChain config that tags every LLM call for this message
        // with traceId — one filter URL per message in LangSmith.
        const runConfig: RunnableConfig = {
          tags: [traceId, `conv:${conversationId.slice(-8)}`],
          metadata: {
            traceId,
            conversationId,
            userId: context?.userId ?? 'anonymous',
            chatType: chatType ?? 'default',
          },
          runName: 'flemoji_chat',
        };

        // Log a single line to the server console that you can copy and paste
        // into LangSmith's tag filter to see every trace for this message.
        const project = process.env.LANGCHAIN_PROJECT ?? 'default';
        logger.error(
          `[LangSmith] ▶ msg="${message.slice(0, 60)}" tag=${traceId} project=${project}`
        );

        // Get conversation history for context-aware routing
        const conversationHistory = context?.userId
          ? await conversationStore.getConversation(
              context.userId,
              conversationId,
              6
            )
          : [];

        // Build enhanced context using Memory Orchestrator
        const enhancedContext = await memoryOrchestrator.buildEnhancedContext({
          userId: context?.userId,
          conversationId: conversationId,
          currentMessage: message,
          recentMessages: conversationHistory,
          maxTokens: 2000,
        });

        // Build legacy context for backward compatibility
        const built = await contextBuilder.buildContext(
          context?.userId,
          conversationId
        );

        const agentContext = {
          userId: context?.userId,
          conversationId: conversationId,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          filters: {
            ...built.filters,
            // NOTE: Do NOT inject user's top genre preference here as a hard filter.
            // Genre preferences are available in metadata.preferences and the LLM can
            // decide when to apply them. Injecting as a filter causes genre bleeding
            // (e.g. thematic queries like "music about love" get filtered to one genre).
            // Add province from request context if provided
            ...(context?.province && { province: context.province }),
          },
          // Add chatType and enhanced memory to metadata
          metadata: {
            chatType: chatType,
            previousIntent: built.metadata?.previousIntent,
            // Enhanced memory data
            preferences: enhancedContext.preferences,
            relevantMemories: enhancedContext.relevantMemories,
            memoryTokenCount: enhancedContext.tokenCount,
          },
          // Add SSE event emitter to context
          emitEvent: sendEvent,
          // LangSmith trace config — tags every LLM call with traceId
          runConfig,
        };

        // Store user message
        if (context?.userId) {
          await conversationStore.storeMessage(
            context.userId,
            conversationId,
            {
              role: 'user',
              content: message,
              timestamp: new Date(),
            },
            undefined,
            chatType
          );
          semanticMemoryManager
            .extractPreferencesFromText({
              userId: context.userId,
              text: message,
            })
            .catch(() => {});
        }

        // Wrap the entire agent pipeline in a traceable parent run so that
        // LangSmith shows ONE root trace with all child runs (intent classifier,
        // tool loops, model calls) nested inside it — not separate root runs.
        const runChat = traceable(
          async () => routerAgent.route(message, agentContext),
          {
            name: 'flemoji_chat',
            run_type: 'chain',
            tags: [traceId],
            metadata: {
              traceId,
              conversationId,
              userId: context?.userId ?? 'anonymous',
              chatType: chatType ?? 'default',
              message: message.slice(0, 120),
            },
          }
        );
        const agentResponse = await runChat();

        // Ensure we have a message (fallback if empty)
        const responseMessage =
          agentResponse.message ||
          'I understand you want to explore music. Let me help you with that!';

        // Create response with structured data if available
        const responseData = agentResponse.data;
        const hasStructuredType =
          responseData &&
          typeof responseData === 'object' &&
          'type' in responseData &&
          'data' in responseData;

        // Ensure proper structure
        let finalData: any;
        if (hasStructuredType) {
          finalData = responseData;
        } else if (
          responseData &&
          typeof responseData === 'object' &&
          'tracks' in responseData
        ) {
          finalData = {
            type: 'track_list',
            message: '',
            timestamp: new Date(),
            data: {
              tracks: responseData.tracks,
              ...(responseData.other && { other: responseData.other }),
              metadata: {
                ...(responseData.metadata || {}),
                total: responseData.count || responseData.tracks?.length || 0,
              },
            },
          };
        } else if (
          responseData &&
          typeof responseData === 'object' &&
          'type' in responseData
        ) {
          // Response has type field but no nested data (e.g., text responses)
          // Use it as-is - it's already a valid AIResponse structure
          finalData = responseData;
        } else {
          finalData = responseData;
        }

        const chatResponse: ChatResponse = {
          message: responseMessage,
          conversationId,
          timestamp: new Date(),
          data: finalData,
        };

        // Store assistant response and update preferences
        if (context?.userId) {
          await conversationStore.storeMessage(
            context.userId,
            conversationId,
            {
              role: 'assistant',
              content: responseMessage,
              timestamp: new Date(),
              data: agentResponse.data,
            },
            undefined,
            chatType
          );
          if (agentResponse?.data) {
            semanticMemoryManager
              .updateFromResults(context.userId, agentResponse.data)
              .catch(() => {});
          }

          // Store conversation in enhanced memory system (non-blocking)
          memoryOrchestrator
            .storeConversation({
              userId: context.userId,
              conversationId,
              messages: [
                ...conversationHistory.map((m, index) => ({
                  id: `msg_${conversationId}_${index}_${m.timestamp.getTime()}`,
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp || new Date(),
                })),
                {
                  id: `msg_${conversationId}_user_${Date.now()}`,
                  role: 'user',
                  content: message,
                  timestamp: new Date(),
                },
                {
                  id: `msg_${conversationId}_assistant_${Date.now()}`,
                  role: 'assistant',
                  content: responseMessage,
                  timestamp: new Date(),
                },
              ],
              userMessage: message,
            })
            .catch(err =>
              logger.error('[Memory] Failed to store conversation:', err)
            );
        }

        // Send final response
        sendEvent({
          type: 'complete',
          timestamp: new Date().toISOString(),
          data: chatResponse,
        });

        // Close stream
        controller.close();
      } catch (error) {
        logger.error('AI Chat SSE Error:', error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Unknown error occurred';

        sendEvent({
          type: 'error',
          timestamp: new Date().toISOString(),
          error: {
            message: errorMessage,
            code: 'INTERNAL_ERROR',
          },
        });

        controller.close();
      } finally {
        isActive = false;
      }
    },
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx
    },
  });
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
