import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai-service';
import { routerAgent } from '@/lib/ai/agents';
import { ChatRequest, ChatResponse, AIError } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    // Check if any AI provider is available
    const availableProviders = aiService.getAvailableProviders();
    if (availableProviders.length === 0) {
      const error: AIError = {
        error: 'No AI providers configured',
        code: 'MISSING_API_KEY',
        details:
          'Please configure at least one AI provider API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Parse the request body
    const body: ChatRequest = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      const error: AIError = {
        error: 'Invalid request: message is required',
        code: 'INVALID_REQUEST',
        details: 'Please provide a valid message string',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Generate conversation ID if not provided
    const conversationId =
      body.conversationId ||
      `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build agent context from request context
    const agentContext = {
      userId: context?.userId,
      filters: {} as any,
    };

    // Map context to filters if needed
    if (context?.artistProfile || context?.trackInfo || context?.playlistInfo) {
      // Context information can be parsed here if needed
    }

    // Use Router Agent to get the appropriate response
    const agentResponse = await routerAgent.route(message, agentContext);

    // Create response
    const chatResponse: ChatResponse = {
      message: agentResponse.message,
      conversationId,
      timestamp: new Date(),
      // Note: Agent responses may include data and actions
      // These can be extended in the future for structured responses
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('AI Chat API Error:', error);

    const aiError: AIError = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(aiError, { status: 500 });
  }
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
