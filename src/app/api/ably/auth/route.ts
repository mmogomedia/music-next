import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Ably from 'ably';

const ably = new Ably.Rest({
  key: process.env.ABLY_API_KEY!,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    // Verify the job belongs to the user
    const uploadJob = await prisma.uploadJob.findFirst({
      where: {
        id: jobId,
        userId: session.user.id,
      },
    });

    if (!uploadJob) {
      return NextResponse.json(
        { error: 'Upload job not found' },
        { status: 404 }
      );
    }

    // Generate Ably token
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: session.user.id,
      capability: {
        [`upload:${jobId}`]: ['subscribe', 'publish'],
      },
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('Ably auth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Ably' },
      { status: 500 }
    );
  }
}
