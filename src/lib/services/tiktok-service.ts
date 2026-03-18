/**
 * TikTok OAuth and Data Service
 * Handles TikTok OAuth flow and data fetching for PULSE³
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';

export interface TikTokOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  openId: string;
  scope?: string;
}

export interface TikTokUserInfo {
  openId: string;
  displayName: string;
  avatarUrl?: string;
  followerCount?: number;
  followingCount?: number;
  likesCount?: number;
  videoCount?: number;
  bioDescription?: string;
  profileDeepLink?: string;
  isVerified?: boolean;
}

export interface TikTokVideo {
  videoId: string;
  title?: string;
  coverImageUrl?: string;
  createTime: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
}

export class TikTokService {
  private static readonly AUTH_URL =
    'https://www.tiktok.com/v2/auth/authorize/';
  private static readonly TOKEN_URL =
    'https://open.tiktokapis.com/v2/oauth/token/';
  private static readonly USER_INFO_URL =
    'https://open.tiktokapis.com/v2/user/info/';
  private static readonly VIDEO_LIST_URL =
    'https://open.tiktokapis.com/v2/video/list/';

  /**
   * Generate PKCE code verifier and challenge
   */
  static generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    // Generate code verifier (43-128 characters, URL-safe)
    const codeVerifier = crypto
      .randomBytes(32)
      .toString('base64url')
      .slice(0, 128);

    // Generate code challenge (SHA256 hash of verifier, base64url encoded)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate OAuth authorization URL with PKCE
   */
  static getAuthorizationUrl(
    clientKey: string,
    redirectUri: string,
    state: string,
    codeChallenge: string
  ): string {
    const params = new URLSearchParams({
      client_key: clientKey,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'user.info.basic,user.info.stats,user.info.profile,video.list',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token with PKCE
   */
  static async exchangeCodeForToken(
    clientKey: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<TikTokOAuthTokens> {
    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error_description: errorText || response.statusText };
      }

      console.error('TikTok token exchange error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      throw new Error(
        `TikTok token exchange failed: ${errorData.error_description || errorData.error || response.statusText}`
      );
    }

    const data = await response.json();

    // TikTok returns error object even on success - check if error.code is 'ok'
    if (data.error && data.error.code !== 'ok') {
      console.error('TikTok API error in token exchange response:', data);
      const errorMessage =
        data.error?.message ||
        data.error_description ||
        data.error?.code ||
        'Unknown error';
      throw new Error(`TikTok API error: ${errorMessage}`);
    }

    const tokenData = data.data || data;

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined,
      openId: tokenData.open_id,
      scope: tokenData.scope,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(
    clientKey: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<TikTokOAuthTokens> {
    const response = await fetch(this.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `TikTok token refresh failed: ${error.error_description || response.statusText}`
      );
    }

    const data = await response.json();

    // TikTok returns error object even on success - check if error.code is 'ok'
    if (data.error && data.error.code !== 'ok') {
      const errorMessage =
        data.error?.message ||
        data.error_description ||
        data.error?.code ||
        'Unknown error';
      throw new Error(`TikTok API error: ${errorMessage}`);
    }

    const tokenData = data.data || data;

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined,
      openId: tokenData.open_id,
      scope: tokenData.scope,
    };
  }

  /**
   * Get user information from TikTok
   * Requests fields based on available scopes
   */
  static async getUserInfo(
    accessToken: string,
    grantedScopes?: string
  ): Promise<TikTokUserInfo> {
    // Build fields list based on granted scopes
    // Always request basic fields (open_id, avatar_url, display_name)
    const fields = ['open_id', 'avatar_url', 'display_name'];

    // Add stats fields if user.info.stats scope is granted
    if (
      grantedScopes &&
      (grantedScopes.includes('user.info.stats') ||
        grantedScopes.includes('user.info.basic'))
    ) {
      fields.push(
        'follower_count',
        'following_count',
        'likes_count',
        'video_count'
      );
    }

    // Add profile fields if user.info.profile scope is granted
    if (grantedScopes && grantedScopes.includes('user.info.profile')) {
      fields.push('bio_description', 'profile_deep_link', 'is_verified');
    }

    const response = await fetch(
      `${this.USER_INFO_URL}?fields=${fields.join(',')}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error_description: errorText || response.statusText };
      }

      console.error('TikTok user info error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // Extract error message from TikTok's error structure
      const errorMessage =
        errorData?.error?.message ||
        errorData?.error_description ||
        errorData?.error?.code ||
        errorData?.error ||
        response.statusText;

      throw new Error(`TikTok user info failed: ${errorMessage}`);
    }

    const data = await response.json();

    // TikTok returns error object even on success - check if error.code is 'ok'
    if (data.error && data.error.code !== 'ok') {
      console.error('TikTok API error in user info response:', data);
      const errorMessage =
        data.error?.message ||
        data.error_description ||
        data.error?.code ||
        'Unknown error';
      throw new Error(`TikTok API error: ${errorMessage}`);
    }

    // TikTok user info response logged for debugging

    const user = data.data?.user || data.data;

    return {
      openId: user.open_id,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      likesCount: user.likes_count,
      videoCount: user.video_count,
      bioDescription: user.bio_description,
      profileDeepLink: user.profile_deep_link,
      isVerified: user.is_verified,
    };
  }

  /**
   * Get user's video list
   * Requires video.list scope
   */
  static async getVideoList(
    accessToken: string,
    options?: {
      maxCount?: number;
      cursor?: number;
      grantedScopes?: string;
      openId?: string;
    }
  ): Promise<{ videos: TikTokVideo[]; hasMore: boolean; cursor?: number }> {
    // Check if video.list scope is granted
    if (
      options?.grantedScopes &&
      !options.grantedScopes.includes('video.list')
    ) {
      throw new Error(
        'video.list scope not granted. Please reconnect TikTok with video.list permission.'
      );
    }

    // TikTok API v2 requires fields as a query parameter, not in body
    const fields = [
      'id',
      'title',
      'cover_image_url',
      'create_time',
      'view_count',
      'like_count',
      'comment_count',
      'share_count',
    ].join(',');

    // Build URL with fields as query parameter
    const url = new URL(this.VIDEO_LIST_URL);
    url.searchParams.set('fields', fields);

    // Build request body - only max_count and cursor go in body
    // TikTok API limits max_count to 20
    const maxCount = Math.min(options?.maxCount || 20, 20);
    const requestBody: any = {
      max_count: maxCount,
    };

    // Add cursor if provided
    if (options?.cursor !== undefined) {
      requestBody.cursor = options.cursor;
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error_description: errorText || response.statusText };
      }

      console.error('TikTok video list error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      const errorMessage =
        errorData?.error?.message ||
        errorData?.error_description ||
        errorData?.error?.code ||
        response.statusText;

      throw new Error(`TikTok video list failed: ${errorMessage}`);
    }

    const data = await response.json();

    // TikTok returns error object even on success - check if error.code is 'ok'
    if (data.error && data.error.code !== 'ok') {
      const errorMessage =
        data.error?.message ||
        data.error_description ||
        data.error?.code ||
        'Unknown error';
      throw new Error(`TikTok API error: ${errorMessage}`);
    }

    const videoData = data.data || data;
    const videos: TikTokVideo[] = (videoData.videos || []).map(
      (video: any) => ({
        videoId: video.video_id,
        title: video.title,
        coverImageUrl: video.cover_image_url,
        createTime: video.create_time,
        viewCount: video.view_count,
        likeCount: video.like_count,
        commentCount: video.comment_count,
        shareCount: video.share_count,
      })
    );

    return {
      videos,
      hasMore: videoData.has_more || false,
      cursor: videoData.cursor,
    };
  }

  /**
   * Save TikTok connection to database
   */
  static async saveConnection(
    userId: string,
    artistProfileId: string,
    tokens: TikTokOAuthTokens,
    userInfo: TikTokUserInfo
  ): Promise<void> {
    // Update artist profile's socialLinks with TikTok info
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { id: artistProfileId },
      select: { socialLinks: true },
    });

    const socialLinks = (artistProfile?.socialLinks as any) || {};
    socialLinks.tiktok = {
      username: userInfo.displayName,
      openId: userInfo.openId,
      connected: true,
      connectedAt: new Date().toISOString(),
    };

    await prisma.artistProfile.update({
      where: { id: artistProfileId },
      data: { socialLinks },
    });

    // Store OAuth tokens in Account table (reusing NextAuth's Account model)
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'tiktok',
          providerAccountId: userInfo.openId,
        },
      },
      create: {
        userId,
        type: 'oauth',
        provider: 'tiktok',
        providerAccountId: userInfo.openId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt
          ? Math.floor(tokens.expiresAt.getTime() / 1000)
          : null,
        token_type: 'Bearer',
        scope: tokens.scope,
      },
      update: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt
          ? Math.floor(tokens.expiresAt.getTime() / 1000)
          : null,
        scope: tokens.scope,
      },
    });
  }

  /**
   * Get stored TikTok connection for a user
   */
  static async getConnection(userId: string): Promise<{
    tokens: TikTokOAuthTokens;
    userInfo: TikTokUserInfo;
  } | null> {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'tiktok',
      },
    });

    if (!account || !account.access_token) {
      return null;
    }

    // Check if token is expired and refresh if needed
    let accessToken = account.access_token;
    let refreshToken = account.refresh_token;

    if (
      account.expires_at &&
      account.expires_at < Math.floor(Date.now() / 1000)
    ) {
      if (!refreshToken) {
        return null; // Token expired and no refresh token
      }

      // Refresh token
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

      if (!clientKey || !clientSecret) {
        throw new Error('TikTok credentials not configured');
      }

      const refreshed = await this.refreshAccessToken(
        clientKey,
        clientSecret,
        refreshToken
      );

      // Update stored tokens
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: refreshed.accessToken,
          refresh_token: refreshed.refreshToken,
          expires_at: refreshed.expiresAt
            ? Math.floor(refreshed.expiresAt.getTime() / 1000)
            : null,
        },
      });

      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken || refreshToken;
    }

    // Fetch current user info with granted scopes
    const userInfo = await this.getUserInfo(
      accessToken,
      account.scope || undefined
    );

    return {
      tokens: {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresAt: account.expires_at
          ? new Date(account.expires_at * 1000)
          : undefined,
        openId: account.providerAccountId,
        scope: account.scope || undefined,
      },
      userInfo,
    };
  }

  /**
   * Disconnect TikTok account
   */
  static async disconnect(userId: string): Promise<void> {
    // Remove account
    await prisma.account.deleteMany({
      where: {
        userId,
        provider: 'tiktok',
      },
    });

    // Update artist profile
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId },
      select: { id: true, socialLinks: true },
    });

    if (artistProfile) {
      const socialLinks = (artistProfile.socialLinks as any) || {};
      if (socialLinks.tiktok) {
        socialLinks.tiktok = {
          ...socialLinks.tiktok,
          connected: false,
        };
      }

      await prisma.artistProfile.update({
        where: { id: artistProfile.id },
        data: { socialLinks },
      });
    }
  }
}
