import { NextRequest, NextResponse } from 'next/server';
import { TikTokService } from '@/lib/services/tiktok-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pulse/tiktok/callback
 * Handles TikTok OAuth callback
 */
export async function GET(req: NextRequest) {
  // Use request origin instead of NEXTAUTH_URL to avoid localhost fallback
  const { origin } = new URL(req.url);
  const baseUrl = origin || process.env.NEXTAUTH_URL || 'https://flemoji.com';

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Log all callback parameters for debugging
    // eslint-disable-next-line no-console
    console.error('TikTok callback received:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      error,
      url: req.url,
    });

    // Check for OAuth errors from TikTok first
    if (error) {
      console.error('TikTok OAuth error from redirect:', error);
      const errorDescription = searchParams.get('error_description');
      return NextResponse.redirect(
        `${baseUrl}/pulse/connect?error=${error}&details=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/pulse/connect?error=no_code`);
    }

    if (!state) {
      return NextResponse.redirect(`${baseUrl}/pulse/connect?error=no_state`);
    }

    // Retrieve OAuth state from database
    const stateRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: `tiktok_oauth_${state}`,
        expires: {
          gt: new Date(), // Not expired
        },
      },
    });

    if (!stateRecord) {
      console.error('OAuth state not found or expired');
      return NextResponse.redirect(
        `${baseUrl}/pulse/connect?error=invalid_state`
      );
    }

    // Parse stored OAuth data
    let oauthData: {
      userId: string;
      codeVerifier: string;
      state: string;
      createdAt: string;
    };
    try {
      oauthData = JSON.parse(stateRecord.token);
    } catch (parseError) {
      console.error('Failed to parse OAuth state data:', parseError);
      return NextResponse.redirect(
        `${baseUrl}/pulse/connect?error=invalid_state`
      );
    }

    // Verify state matches
    if (oauthData.state !== state) {
      console.error('State mismatch');
      return NextResponse.redirect(
        `${baseUrl}/pulse/connect?error=invalid_state`
      );
    }

    const userId = oauthData.userId;
    const codeVerifier = oauthData.codeVerifier;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.redirect(
        `${baseUrl}/pulse/connect?error=user_not_found`
      );
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(
        `${baseUrl}/pulse/connect?error=config_error`
      );
    }

    // Use TIKTOK_REDIRECT_URI if set, otherwise use request origin
    // Must match exactly what was used in the authorization request
    const redirectUri =
      process.env.TIKTOK_REDIRECT_URI || `${baseUrl}/api/pulse/tiktok/callback`;

    // Exchange code for tokens with PKCE
    let tokens;
    try {
      tokens = await TikTokService.exchangeCodeForToken(
        clientKey,
        clientSecret,
        code,
        redirectUri,
        codeVerifier
      );
      console.error('Token exchange successful. Scopes:', tokens.scope);
    } catch (tokenError: any) {
      console.error('Token exchange failed:', tokenError);
      throw tokenError;
    }

    // Get user info with granted scopes
    let userInfo;
    try {
      userInfo = await TikTokService.getUserInfo(
        tokens.accessToken,
        tokens.scope
      );
    } catch (userInfoError: any) {
      console.error('User info fetch failed:', userInfoError);

      // If it's a scope error, try with only basic fields
      if (userInfoError.message?.includes('scope_not_authorized')) {
        try {
          // Try with only basic fields
          userInfo = await TikTokService.getUserInfo(
            tokens.accessToken,
            'user.info.basic'
          );
        } catch (basicError: any) {
          // If even basic fails, create minimal user info
          userInfo = {
            openId: tokens.openId,
            displayName: 'TikTok User', // Placeholder
          };
          console.error('Using minimal user info due to scope error');
        }
      } else {
        throw userInfoError;
      }
    }

    // Get artist profile
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!artistProfile) {
      return NextResponse.redirect(`${baseUrl}/pulse/connect?error=no_profile`);
    }

    // Save connection
    await TikTokService.saveConnection(
      userId,
      artistProfile.id,
      tokens,
      userInfo
    );

    // Fetch video list if video.list scope is granted
    try {
      if (tokens.scope && tokens.scope.includes('video.list')) {
        const videoData = await TikTokService.getVideoList(tokens.accessToken, {
          maxCount: 20, // TikTok API limit is 20 per request
          grantedScopes: tokens.scope,
          openId: tokens.openId,
        });

        // Store video list in PulsePlatformData
        await prisma.pulsePlatformData.create({
          data: {
            artistProfileId: artistProfile.id,
            platform: 'tiktok',
            data: {
              follower_count: userInfo.followerCount,
              following_count: userInfo.followingCount,
              likes_count: userInfo.likesCount,
              video_count: userInfo.videoCount,
              display_name: userInfo.displayName,
              open_id: userInfo.openId,
              bio_description: userInfo.bioDescription,
              profile_deep_link: userInfo.profileDeepLink,
              is_verified: userInfo.isVerified,
              videos: JSON.parse(JSON.stringify(videoData.videos)), // Serialize for JSON storage
              video_list_fetched_at: new Date().toISOString(),
              video_count_in_list: videoData.videos.length,
              has_more_videos: videoData.hasMore,
            },
          },
        });
      } else {
        // Store basic data without videos if scope not granted
        await prisma.pulsePlatformData.create({
          data: {
            artistProfileId: artistProfile.id,
            platform: 'tiktok',
            data: {
              follower_count: userInfo.followerCount,
              following_count: userInfo.followingCount,
              likes_count: userInfo.likesCount,
              video_count: userInfo.videoCount,
              display_name: userInfo.displayName,
              open_id: userInfo.openId,
              bio_description: userInfo.bioDescription,
              profile_deep_link: userInfo.profileDeepLink,
              is_verified: userInfo.isVerified,
              video_list_scope_not_granted: true,
            },
          },
        });
      }
    } catch (videoError: any) {
      console.error('Error fetching video list during connection:', videoError);
      // Still save basic data even if video fetch fails
      await prisma.pulsePlatformData.create({
        data: {
          artistProfileId: artistProfile.id,
          platform: 'tiktok',
          data: {
            follower_count: userInfo.followerCount,
            following_count: userInfo.followingCount,
            likes_count: userInfo.likesCount,
            video_count: userInfo.videoCount,
            display_name: userInfo.displayName,
            open_id: userInfo.openId,
            bio_description: userInfo.bioDescription,
            profile_deep_link: userInfo.profileDeepLink,
            is_verified: userInfo.isVerified,
            video_list_error: videoError.message,
          },
        },
      });
    }

    // Clean up OAuth state record from database
    await prisma.verificationToken
      .delete({
        where: {
          identifier_token: {
            identifier: stateRecord.identifier,
            token: stateRecord.token,
          },
        },
      })
      .catch(() => {
        // Ignore if already deleted
      });

    return NextResponse.redirect(`${baseUrl}/pulse/connect?success=true`);
  } catch (error: any) {
    console.error('Error handling TikTok OAuth callback:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response?.data,
    });

    // Extract more specific error information
    let errorCode = 'callback_error';
    let errorMessage = 'Failed to complete TikTok connection';

    if (error?.message?.includes('token exchange')) {
      errorCode = 'token_exchange_error';
      errorMessage = 'Failed to exchange authorization code for token';
    } else if (error?.message?.includes('user info')) {
      errorCode = 'user_info_error';
      errorMessage = 'Failed to fetch user information from TikTok';
    } else if (error?.response?.data) {
      errorMessage = `TikTok API error: ${JSON.stringify(error.response.data)}`;
    }

    return NextResponse.redirect(
      `${baseUrl}/pulse/connect?error=${errorCode}&details=${encodeURIComponent(errorMessage)}`
    );
  }
}
