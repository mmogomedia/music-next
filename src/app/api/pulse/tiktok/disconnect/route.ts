import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TikTokService } from '@/lib/services/tiktok-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pulse/tiktok/disconnect
 * Disconnects TikTok account
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await TikTokService.disconnect(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting TikTok:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect TikTok account' },
      { status: 500 }
    );
  }
}
