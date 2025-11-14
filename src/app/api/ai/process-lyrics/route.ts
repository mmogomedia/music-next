import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LyricsProcessingAgent } from '@/lib/ai/agents/lyrics-processing-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory rate limiting (use Redis in production for multi-instance deployments)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = {
  maxRequests: 10, // 10 requests
  windowMs: 60 * 60 * 1000, // per hour
};

/**
 * Check rate limit for a user
 */
function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    // Reset or initialize
    const resetAt = now + RATE_LIMIT.windowMs;
    rateLimitMap.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetAt };
  }

  if (userLimit.count >= RATE_LIMIT.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: userLimit.resetAt,
    };
  }

  // Increment count
  userLimit.count++;
  rateLimitMap.set(userId, userLimit);
  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - userLimit.count,
    resetAt: userLimit.resetAt,
  };
}

/**
 * POST /api/ai/process-lyrics
 * Process lyrics: detect language, translate if needed, and generate summary
 * Rate limited to 10 requests per hour per user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    const rateLimit = checkRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message:
            'You have exceeded the rate limit of 10 requests per hour. Please try again later.',
          retryAfter,
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { lyrics, language } = body;

    if (!lyrics || typeof lyrics !== 'string' || lyrics.trim().length === 0) {
      return NextResponse.json(
        { error: 'Lyrics are required' },
        { status: 400 }
      );
    }

    // Validate lyrics length (reasonable limit)
    if (lyrics.length > 50000) {
      return NextResponse.json(
        { error: 'Lyrics are too long. Maximum 50,000 characters.' },
        { status: 400 }
      );
    }

    // Process lyrics using the agent
    const agent = new LyricsProcessingAgent('azure-openai');
    const result = await agent.processLyrics(lyrics, language);

    return NextResponse.json(
      {
        success: true,
        ...result,
        rateLimit: {
          remaining: rateLimit.remaining,
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error processing lyrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to process lyrics',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
