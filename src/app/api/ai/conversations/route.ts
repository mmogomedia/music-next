import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationStore } from '@/lib/ai/memory/conversation-store';
import { logger } from '@/lib/utils/logger';

export async function GET(_request: NextRequest) {
  // eslint-disable-next-line no-console
  console.log('[API] GET /api/ai/conversations - Request received');
  
  try {
    // eslint-disable-next-line no-console
    console.log('[API] Getting server session...');
    const session = await getServerSession(authOptions);

    // eslint-disable-next-line no-console
    console.log('[API] Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    });

    if (!session?.user?.id) {
      // eslint-disable-next-line no-console
      console.log('[API] ❌ Unauthorized - No session or userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line no-console
    console.log('[API] Calling conversationStore.getUserConversations for userId:', session.user.id);
    const conversations = await conversationStore.getUserConversations(
      session.user.id
    );

    // eslint-disable-next-line no-console
    console.log('[API] ✅ Conversations fetched:', {
      count: conversations.length,
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
      })),
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[API] ❌ Error fetching conversations:', error);
    logger.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
