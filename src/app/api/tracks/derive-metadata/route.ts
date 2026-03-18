import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrackMetadataAgent } from '@/lib/ai/agents/track-metadata-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
};

const sanitizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : [];

function checkRateLimit(userId: string) {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);

  if (!limit || now > limit.resetAt) {
    const resetAt = now + RATE_LIMIT.windowMs;
    rateLimitMap.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetAt };
  }

  if (limit.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: limit.resetAt };
  }

  limit.count += 1;
  rateLimitMap.set(userId, limit);
  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - limit.count,
    resetAt: limit.resetAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message:
            'You have exceeded the metadata generation limit. Please try again later.',
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
    const lyrics = typeof body?.lyrics === 'string' ? body.lyrics.trim() : '';
    const language =
      typeof body?.language === 'string' ? body.language.trim() : undefined;
    const description =
      typeof body?.description === 'string' ? body.description : undefined;
    const attributes = sanitizeStringArray(body?.attributes);
    const mood = sanitizeStringArray(body?.mood);

    if (!lyrics) {
      return NextResponse.json(
        { error: 'Lyrics are required to generate metadata.' },
        { status: 400 }
      );
    }

    if (lyrics.length > 50000) {
      return NextResponse.json(
        { error: 'Lyrics are too long. Maximum 50,000 characters.' },
        { status: 400 }
      );
    }

    const agent = new TrackMetadataAgent('azure-openai');
    const result = await agent.deriveMetadata({
      lyrics,
      language,
      description,
      attributes,
      mood,
    });

    return NextResponse.json(
      {
        success: true,
        description: result.description,
        attributes: result.attributes,
        mood: result.mood,
        detectedLanguage: result.detectedLanguage,
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
    console.error('Error deriving metadata:', error);
    return NextResponse.json(
      {
        error: 'Failed to derive metadata',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
