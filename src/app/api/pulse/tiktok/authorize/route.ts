import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TikTokService } from '@/lib/services/tiktok-service';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pulse/tiktok/authorize
 * Initiates TikTok OAuth flow with PKCE
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      return NextResponse.json(
        { error: 'TikTok credentials not configured' },
        { status: 500 }
      );
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Generate PKCE code verifier and challenge
    const { codeVerifier, codeChallenge } = TikTokService.generatePKCE();

    // Use TIKTOK_REDIRECT_URI if set, otherwise use request origin
    const { origin } = new URL(req.url);
    const baseUrl = origin || process.env.NEXTAUTH_URL || 'https://flemoji.com';
    const redirectUri =
      process.env.TIKTOK_REDIRECT_URI || `${baseUrl}/api/pulse/tiktok/callback`;

    const authUrl = TikTokService.getAuthorizationUrl(
      clientKey,
      redirectUri,
      state,
      codeChallenge
    );

    // Store OAuth state in database (more reliable than cookies across redirects)
    // This includes user ID, code verifier, and state for verification
    await prisma.verificationToken.create({
      data: {
        identifier: `tiktok_oauth_${state}`,
        token: JSON.stringify({
          userId: session.user.id,
          codeVerifier,
          state,
          createdAt: new Date().toISOString(),
        }),
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating TikTok OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate TikTok OAuth' },
      { status: 500 }
    );
  }
}
