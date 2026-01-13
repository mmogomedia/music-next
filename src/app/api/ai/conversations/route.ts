import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationStore } from '@/lib/ai/memory/conversation-store';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  logger.info('[API] GET /api/ai/conversations - Request received');

  try {
    logger.debug('[API] Getting server session...');
    const session = await getServerSession(authOptions);

    logger.debug('[API] Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    });

    if (!session?.user?.id) {
      logger.warn('[API] ❌ Unauthorized - No session or userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chatType from query params
    const { searchParams } = new URL(request.url);
    const chatType = searchParams.get('chatType') as
      | 'STREAMING'
      | 'TIMELINE'
      | 'DASHBOARD'
      | 'OTHER'
      | null;

    logger.debug(
      '[API] Calling conversationStore.getUserConversations for userId:',
      session.user.id,
      'chatType:',
      chatType
    );
    const conversations = await conversationStore.getUserConversations(
      session.user.id,
      chatType || undefined
    );

    logger.info('[API] ✅ Conversations fetched:', {
      count: conversations.length,
      conversations: conversations.map(c => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
      })),
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    logger.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
