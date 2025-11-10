import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationStore } from '@/lib/ai/memory/conversation-store';
import { logger } from '@/lib/utils/logger';

export async function GET(_request: NextRequest) {
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

    logger.debug(
      '[API] Calling conversationStore.getUserConversations for userId:',
      session.user.id
    );
    const conversations = await conversationStore.getUserConversations(
      session.user.id
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
