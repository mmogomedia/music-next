import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai-service';
import { ChatRequest, ChatResponse, AIError, AIProvider } from '@/types/ai';

// System prompt for the music platform context
const SYSTEM_PROMPT = `You are an AI assistant for Flemoji, a South African music streaming platform. You help users discover music, understand artists, and navigate the platform. 

Key information about Flemoji:
- Focus on South African music and artists
- Supports various genres including Amapiano, Afrobeat, Hip Hop, House, and more
- Features playlists organized by genre, province, and curated content
- Artists can upload tracks and build profiles
- Users can discover music through playlists and recommendations

When responding:
- Be helpful and informative about music discovery
- Provide context about South African music culture when relevant
- Keep responses concise but engaging
- If asked about specific features, refer to the platform's capabilities
- Be encouraging about music discovery and artist support

If you don't know something specific about the platform, acknowledge it and offer to help with what you do know.`;

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
    const { message, context, provider } = body;

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

    // Create messages array
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: message },
    ];

    // Add context if provided
    if (context) {
      let contextMessage = '';
      if (context.artistProfile) {
        contextMessage += `\nUser is viewing artist profile: ${context.artistProfile}`;
      }
      if (context.trackInfo) {
        contextMessage += `\nTrack information: ${context.trackInfo}`;
      }
      if (context.playlistInfo) {
        contextMessage += `\nPlaylist information: ${context.playlistInfo}`;
      }
      if (contextMessage) {
        messages.splice(1, 0, {
          role: 'system' as const,
          content: `Context: ${contextMessage}`,
        });
      }
    }

    // Get response from AI service
    const response = await aiService.chat(messages, {
      provider: provider as AIProvider,
      fallback: true,
    });

    // Create response
    const chatResponse: ChatResponse = {
      message: response.content,
      conversationId,
      timestamp: new Date(),
      usage: response.usage,
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
