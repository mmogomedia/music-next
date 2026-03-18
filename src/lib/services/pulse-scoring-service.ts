/**
 * PULSE³ Scoring Service
 * Calculates eligibility and momentum scores for artists
 */

import { prisma } from '@/lib/db';
import { TikTokService } from './tiktok-service';

/**
 * Platform-specific contribution to eligibility score
 * Each platform (TikTok, Spotify, YouTube) contributes these components
 */
export interface PlatformEligibilityContribution {
  platform: 'tiktok' | 'spotify' | 'youtube';
  followerScore: number; // 0-100 based on follower/listener count
  engagementScore: number; // 0-100 based on engagement rate
  consistencyScore: number; // 0-100 based on posting/activity consistency
  weight: number; // Platform weight (e.g., TikTok=1.0, Spotify=0.8, YouTube=0.7)
}

/**
 * Final eligibility score components (aggregated across all platforms)
 */
export interface EligibilityScoreComponents {
  followerScore: number; // 0-100 weighted average across platforms (30% weight)
  engagementScore: number; // 0-100 weighted average across platforms (40% weight)
  consistencyScore: number; // 0-100 weighted average across platforms (20% weight)
  platformDiversityScore: number; // 0-100 based on connected platforms (10% weight)
  // Note: Trend Score removed from Eligibility - now part of Momentum Score only
  // Platform contributions are stored separately for future multi-platform support
  platformContributions?: PlatformEligibilityContribution[];
}

export interface MomentumScoreComponents {
  growthVelocity: number; // 0-100 based on follower growth rate
  engagementAcceleration: number; // 0-100 based on increasing engagement
  viralPotential: number; // 0-100 based on recent video performance
  crossPlatformMomentum: number; // 0-100 based on multi-platform growth
}

export class PulseScoringService {
  /**
   * Calculate eligibility score for an artist
   * Score range: 0-100
   *
   * Architecture:
   * - Each platform (TikTok, Spotify, YouTube) contributes its own scores
   * - Platform contributions are weighted and combined
   * - Final formula: Follower (30%) + Engagement (40%) + Consistency (20%) + Platform Diversity (10%)
   *
   * Currently: Only TikTok is implemented. Future platforms will be added here.
   */
  static async calculateEligibilityScore(artistProfileId: string): Promise<{
    score: number;
    components: EligibilityScoreComponents;
    rank?: number;
  }> {
    // Get artist profile
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { id: artistProfileId },
      include: { user: true },
    });

    if (!artistProfile?.user?.id) {
      throw new Error('Artist profile or user not found');
    }

    // Collect platform contributions
    const platformContributions: PlatformEligibilityContribution[] = [];

    // 1. Calculate TikTok contribution
    const tiktokContribution = await this.calculateTikTokContribution(
      artistProfile.user.id,
      artistProfileId
    );
    if (tiktokContribution) {
      platformContributions.push(tiktokContribution);
    }

    // 2. TODO: Calculate Spotify contribution (when implemented)
    // const spotifyContribution = await this.calculateSpotifyContribution(...);
    // if (spotifyContribution) platformContributions.push(spotifyContribution);

    // 3. TODO: Calculate YouTube contribution (when implemented)
    // const youtubeContribution = await this.calculateYouTubeContribution(...);
    // if (youtubeContribution) platformContributions.push(youtubeContribution);

    // If no platforms connected, return zero score
    if (platformContributions.length === 0) {
      return {
        score: 0,
        components: {
          followerScore: 0,
          engagementScore: 0,
          consistencyScore: 0,
          platformDiversityScore: 0,
          platformContributions: [],
        },
      };
    }

    // Combine platform contributions (weighted average)
    const combinedComponents = this.combinePlatformContributions(
      platformContributions
    );

    // Calculate platform diversity score
    const platformDiversityScore =
      await this.calculatePlatformDiversityScore(artistProfileId);

    // Final components
    const components: EligibilityScoreComponents = {
      ...combinedComponents,
      platformDiversityScore,
      platformContributions, // Store for debugging/future use
    };

    // Calculate weighted overall score
    // Weights: Follower 30%, Engagement 40%, Consistency 20%, Platform Diversity 10%
    const score =
      components.followerScore * 0.3 +
      components.engagementScore * 0.4 +
      components.consistencyScore * 0.2 +
      components.platformDiversityScore * 0.1;

    // Clamp to 0-100
    const clampedScore = Math.max(0, Math.min(100, score));

    // Calculate rank (will be updated after all scores are calculated)
    const rank = await this.calculateRank(clampedScore);

    return {
      score: Math.round(clampedScore * 100) / 100, // Round to 2 decimal places
      components,
      rank,
    };
  }

  /**
   * Calculate TikTok's contribution to eligibility score
   * Returns null if TikTok is not connected
   */
  private static async calculateTikTokContribution(
    userId: string,
    artistProfileId: string
  ): Promise<PlatformEligibilityContribution | null> {
    // Get TikTok connection
    const tiktokConnection = await TikTokService.getConnection(userId);
    if (!tiktokConnection) {
      return null;
    }

    const userInfo = tiktokConnection.userInfo;
    const followerCount = userInfo.followerCount || 0;

    // Get most recent platform data snapshot (for videos)
    const latestPlatformData = await prisma.pulsePlatformData.findFirst({
      where: {
        artistProfileId,
        platform: 'tiktok',
      },
      orderBy: { fetchedAt: 'desc' },
    });

    // Extract videos from latest platform data (up to 20 videos)
    const platformData = latestPlatformData?.data as any;
    const videos = (platformData?.videos || []).slice(0, 20);

    // Calculate TikTok-specific component scores
    return {
      platform: 'tiktok',
      followerScore: this.calculateFollowerScore(followerCount),
      engagementScore: this.calculateEngagementQualityScore(
        followerCount,
        videos
      ),
      consistencyScore: this.calculateConsistencyScore(
        userInfo.videoCount || 0,
        videos
      ),
      weight: 1.0, // TikTok is primary platform, full weight
    };
  }

  /**
   * Combine multiple platform contributions into final components
   * Uses weighted average based on platform weights
   */
  private static combinePlatformContributions(
    contributions: PlatformEligibilityContribution[]
  ): Omit<
    EligibilityScoreComponents,
    'platformDiversityScore' | 'platformContributions'
  > {
    if (contributions.length === 0) {
      return {
        followerScore: 0,
        engagementScore: 0,
        consistencyScore: 0,
      };
    }

    // Calculate weighted averages
    let totalWeight = 0;
    let weightedFollower = 0;
    let weightedEngagement = 0;
    let weightedConsistency = 0;

    for (const contrib of contributions) {
      totalWeight += contrib.weight;
      weightedFollower += contrib.followerScore * contrib.weight;
      weightedEngagement += contrib.engagementScore * contrib.weight;
      weightedConsistency += contrib.consistencyScore * contrib.weight;
    }

    return {
      followerScore: totalWeight > 0 ? weightedFollower / totalWeight : 0,
      engagementScore: totalWeight > 0 ? weightedEngagement / totalWeight : 0,
      consistencyScore: totalWeight > 0 ? weightedConsistency / totalWeight : 0,
    };
  }

  /**
   * Calculate follower score (0-100)
   * Uses logarithmic scale: 100,000 followers = 100 points
   * Formula: log10(follower_count + 1) / log10(100000) * 100
   */
  private static calculateFollowerScore(followerCount: number): number {
    if (followerCount === 0) return 0;

    // Logarithmic scale relative to 100,000 followers = 100 points
    const raw = Math.log10(followerCount + 1) / Math.log10(100000);
    const subscore = raw * 100;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, subscore));
  }

  /**
   * Calculate engagement quality score (0-100)
   * Two-part formula:
   * - 60% Engagement Rate component (per video engagement rate)
   * - 40% Average Performance component (view_count relative to follower_count)
   * Requires video.list data (last 20-50 videos)
   */
  private static calculateEngagementQualityScore(
    followerCount: number,
    videos: any[]
  ): number {
    if (followerCount === 0 || !videos || videos.length === 0) return 0;

    // Use last 20-50 videos (or all if less than 20)
    const recentVideos = videos.slice(0, Math.min(50, videos.length));
    if (recentVideos.length === 0) return 0;

    // A. Engagement Rate Component (60%)
    const engagementRates: number[] = [];
    for (const video of recentVideos) {
      const viewCount = video.viewCount || 0;
      const likeCount = video.likeCount || 0;
      const commentCount = video.commentCount || 0;
      const shareCount = video.shareCount || 0;

      const engagement = likeCount + commentCount + shareCount;
      const denominator = Math.max(viewCount, followerCount, 100);
      const engagementRate = denominator > 0 ? engagement / denominator : 0;

      engagementRates.push(engagementRate);
    }

    const avgEngagementRate =
      engagementRates.reduce((sum, rate) => sum + rate, 0) /
      engagementRates.length;

    // Normalize engagement rate into 0-100 using tiered interpretation
    let engagementRateScore: number;
    if (avgEngagementRate <= 0.01) {
      // ≤ 1% → 10-30
      engagementRateScore = 10 + (avgEngagementRate / 0.01) * 20;
    } else if (avgEngagementRate <= 0.04) {
      // 1%-4% → 30-60
      engagementRateScore = 30 + ((avgEngagementRate - 0.01) / 0.03) * 30;
    } else if (avgEngagementRate <= 0.1) {
      // 4%-10% → 60-85
      engagementRateScore = 60 + ((avgEngagementRate - 0.04) / 0.06) * 25;
    } else {
      // ≥ 10% → 85-100
      engagementRateScore = Math.min(100, 85 + (avgEngagementRate - 0.1) * 150);
    }

    // B. Average Performance Component (40%)
    const performanceRatios: number[] = [];
    for (const video of recentVideos) {
      const viewCount = video.viewCount || 0;
      const denominator = Math.max(followerCount, 100);
      const performanceRatio = denominator > 0 ? viewCount / denominator : 0;
      performanceRatios.push(performanceRatio);
    }

    const avgPerformanceRatio =
      performanceRatios.reduce((sum, ratio) => sum + ratio, 0) /
      performanceRatios.length;

    // Normalize performance ratio into 0-100
    let performanceScore: number;
    if (avgPerformanceRatio < 0.5) {
      // < 0.5× followers → 20-40
      performanceScore = 20 + (avgPerformanceRatio / 0.5) * 20;
    } else if (avgPerformanceRatio < 1.0) {
      // 0.5×-1× → 40-60
      performanceScore = 40 + ((avgPerformanceRatio - 0.5) / 0.5) * 20;
    } else if (avgPerformanceRatio < 3.0) {
      // 1×-3× → 60-80
      performanceScore = 60 + ((avgPerformanceRatio - 1.0) / 2.0) * 20;
    } else {
      // 3×+ → 80-100
      performanceScore = Math.min(100, 80 + (avgPerformanceRatio - 3.0) * 5);
    }

    // Final Engagement Quality Score
    const engagementQuality =
      engagementRateScore * 0.6 + performanceScore * 0.4;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, engagementQuality));
  }

  /**
   * Calculate consistency score (0-100)
   * Based on posting frequency across all available videos
   * Uses create_time from video.list data
   */
  private static calculateConsistencyScore(
    videoCount: number,
    videos: any[]
  ): number {
    // 1. If profile has no videos, return low score
    if (videoCount === 0) {
      return 10; // "you don't post"
    }

    // 2. If we can't read videos properly (no video list data), return moderate score
    if (!videos || videos.length === 0) {
      return 40; // "we can't read your posts properly"
    }

    // 3. Normal consistency algorithm using timestamps

    // Sort videos by createTime DESC (newest first)
    const sortedVideos = [...videos].sort((a, b) => {
      const timeA = a.createTime || 0;
      const timeB = b.createTime || 0;
      return timeB - timeA; // DESC order (newest first)
    });

    const newest = sortedVideos[0].createTime || 0;
    const oldest = sortedVideos[sortedVideos.length - 1].createTime || 0;

    // Compute span_days
    const spanSeconds = Math.max(1, newest - oldest);
    let spanDays = spanSeconds / 86400; // Convert seconds to days

    // Stabilize the window
    if (spanDays < 7) {
      spanDays = 7; // Avoid crazy high rates from tiny windows
    }
    if (spanDays > 60) {
      spanDays = 60; // Don't over-penalize old accounts
    }

    // Compute posts_per_day
    const postsPerDay = sortedVideos.length / spanDays;

    // Map posts_per_day → Consistency subscore (0–100)
    let score: number;
    if (postsPerDay < 0.1) {
      // < 0.1 → score between 10 and 30
      score = 10 + (postsPerDay / 0.1) * 20;
    } else if (postsPerDay < 0.5) {
      // 0.1 ≤ posts_per_day < 0.5 → score between 30 and 60
      score = 30 + ((postsPerDay - 0.1) / 0.4) * 30;
    } else if (postsPerDay <= 1.5) {
      // 0.5 ≤ posts_per_day ≤ 1.5 → score between 60 and 90
      score = 60 + ((postsPerDay - 0.5) / 1.0) * 30;
    } else {
      // posts_per_day > 1.5 → score between 90 and 100 (cap at 100)
      score = Math.min(100, 90 + (postsPerDay - 1.5) * 10);
    }

    // 7. Clamp subscore to [0, 100]
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate trend score (0-100)
   * Only computed if baseline >= 100 followers
   * Uses growth rate: (current - baseline) / baseline
   * Clamped to -50% to +200% growth rate
   */
  private static calculateTrendScore(
    currentFollowerCount: number,
    recentPlatformData: any[]
  ): number {
    // Need at least 2 data points for trend calculation
    if (recentPlatformData.length < 2) return 50; // Neutral if no history

    // Get baseline (oldest data point) and current (newest)
    const baseline = recentPlatformData[recentPlatformData.length - 1]
      ?.data as any;
    const current = recentPlatformData[0]?.data as any;

    if (!baseline || !current) return 50;

    const baselineFollowers = baseline.follower_count || 0;
    const currentFollowers =
      current.follower_count || currentFollowerCount || 0;

    // Only compute trend if baseline >= 100
    if (baselineFollowers < 100) {
      return 50; // Neutral score
    }

    // Calculate growth rate
    let growthRate = (currentFollowers - baselineFollowers) / baselineFollowers;

    // Clamp growth rate to valid range: -0.5 (-50%) to 2.0 (+200%)
    growthRate = Math.max(-0.5, Math.min(2.0, growthRate));

    // Normalize into 0-100 score
    let score: number;
    if (growthRate < -0.1) {
      // Declining (< -10%) → 0-40
      score = 40 + ((growthRate + 0.1) / -0.4) * 40;
    } else if (growthRate < 0.1) {
      // Flat (-10% to +10%) → 40-60
      score = 40 + ((growthRate + 0.1) / 0.2) * 20;
    } else if (growthRate < 0.5) {
      // Growing (+10% to +50%) → 60-85
      score = 60 + ((growthRate - 0.1) / 0.4) * 25;
    } else {
      // Explosive (> +50%) → 85-100
      score = Math.min(100, 85 + ((growthRate - 0.5) / 1.5) * 15);
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate platform diversity score (0-100)
   * Simple rule: 1 platform = 50, 2 platforms = 75, 3+ = 100
   */
  private static async calculatePlatformDiversityScore(
    artistProfileId: string
  ): Promise<number> {
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { id: artistProfileId },
      select: { socialLinks: true },
    });

    if (!artistProfile?.socialLinks) return 50; // Default to 1 platform (TikTok required)

    const socialLinks = artistProfile.socialLinks as any;
    let connectedPlatforms = 0;

    // TikTok is required, so count starts at 1
    if (socialLinks.tiktok?.connected) connectedPlatforms = 1;
    if (socialLinks.spotify?.connected) connectedPlatforms++;
    if (socialLinks.youtube?.connected) connectedPlatforms++;

    // Simple rule: 1 platform = 50, 2 = 75, 3+ = 100
    if (connectedPlatforms === 1) return 50;
    if (connectedPlatforms === 2) return 75;
    return 100; // 3 or more
  }

  /**
   * Calculate rank based on score
   * Rank 1 = highest score
   */
  private static async calculateRank(score: number): Promise<number> {
    const higherScores = await prisma.pulseEligibilityScore.count({
      where: {
        score: { gt: score },
      },
    });

    return higherScores + 1;
  }

  /**
   * Calculate momentum score for an artist
   * Only calculated for artists in Top 100
   * Score range: 0-100
   *
   * NOTE: This is not yet implemented. Momentum calculation will be added in a future update.
   */
  static async calculateMomentumScore(_artistProfileId: string): Promise<{
    score: number;
    components: MomentumScoreComponents;
    position?: number;
  }> {
    // Momentum calculation not yet implemented
    return {
      score: 0,
      components: {
        growthVelocity: 0,
        engagementAcceleration: 0,
        viralPotential: 0,
        crossPlatformMomentum: 0,
      },
      position: undefined,
    };
  }

  /**
   * Save eligibility score to database
   */
  static async saveEligibilityScore(
    artistProfileId: string,
    score: number,
    components: EligibilityScoreComponents,
    rank?: number
  ): Promise<void> {
    // Ensure all component scores are defined (default to 0 if undefined)
    // This prevents null/undefined values from being saved
    const followerScore = components?.followerScore ?? 0;
    const engagementScore = components?.engagementScore ?? 0;
    const consistencyScore = components?.consistencyScore ?? 0;
    const platformDiversityScore = components?.platformDiversityScore ?? 0;

    await prisma.pulseEligibilityScore.create({
      data: {
        artistProfileId,
        score,
        followerScore,
        engagementScore,
        consistencyScore,
        platformDiversityScore,
        rank,
      },
    });
  }

  /**
   * Save momentum score to database
   *
   * NOTE: This is not yet implemented. Momentum calculation will be added in a future update.
   */
  static async saveMomentumScore(
    _artistProfileId: string,
    _score: number,
    _position?: number
  ): Promise<void> {
    // Momentum calculation not yet implemented - do nothing
    return;
  }

  /**
   * Update monitoring status
   */
  static async updateMonitoringStatus(
    artistProfileId: string,
    isActivelyMonitored: boolean
  ): Promise<void> {
    await prisma.pulseMonitoringStatus.upsert({
      where: { artistProfileId },
      create: {
        artistProfileId,
        isActivelyMonitored,
      },
      update: {
        isActivelyMonitored,
        lastCalculatedAt: new Date(),
      },
    });
  }

  /**
   * Save platform data snapshot
   */
  static async savePlatformData(
    artistProfileId: string,
    platform: 'tiktok' | 'spotify' | 'youtube',
    data: any
  ): Promise<void> {
    await prisma.pulsePlatformData.create({
      data: {
        artistProfileId,
        platform,
        data,
      },
    });
  }
}
