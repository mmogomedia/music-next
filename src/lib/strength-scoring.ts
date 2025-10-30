/**
 * Artist Strength Scoring Algorithm
 * Calculates comprehensive scores for music scouting and artist discovery
 */

import { prisma } from './db';
import { logger } from '@/lib/utils/logger';

export interface StrengthScoreResult {
  engagementScore: number;
  growthScore: number;
  qualityScore: number;
  potentialScore: number;
  overallScore: number;
  breakdown: {
    engagement: {
      completionRate: number;
      replayRate: number;
      likeRate: number;
      saveRate: number;
      shareRate: number;
    };
    growth: {
      playVelocity: number;
      uniqueListenerGrowth: number;
      geographicExpansion: number;
      timeConsistency: number;
    };
    quality: {
      skipRate: number;
      retentionRate: number;
      crossPlatformScore: number;
      genreFit: number;
    };
    potential: {
      viralCoefficient: number;
      marketPosition: number;
      demographicAppeal: number;
    };
  };
}

export interface ArtistMetrics {
  totalPlays: number;
  uniquePlays: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  totalSaves: number;
  avgCompletionRate: number;
  avgDuration: number;
  skipRate: number;
  replayRate: number;
  growthVelocity: number;
  viralCoefficient: number;
  geographicReach: number;
  crossPlatformScore: number;
  retentionRate: number;
}

export class ArtistStrengthCalculator {
  /**
   * Calculate comprehensive strength score for an artist
   */
  async calculateArtistStrengthScore(
    artistId: string,
    timeRange: string
  ): Promise<StrengthScoreResult> {
    logger.log(
      `Calculating strength score for artist ${artistId} (${timeRange})`
    );

    try {
      // Get artist metrics
      const metrics = await this.calculateArtistMetrics(artistId, timeRange);

      // Calculate individual component scores
      const engagementScore = await this.calculateEngagementScore(
        metrics,
        timeRange
      );
      const growthScore = await this.calculateGrowthScore(
        artistId,
        metrics,
        timeRange
      );
      const qualityScore = await this.calculateQualityScore(metrics, timeRange);
      const potentialScore = await this.calculatePotentialScore(
        artistId,
        metrics,
        timeRange
      );

      // Calculate overall score with weights
      const overallScore = this.calculateOverallScore({
        engagementScore,
        growthScore,
        qualityScore,
        potentialScore,
      });

      // Create breakdown for transparency
      const breakdown = this.createScoreBreakdown(metrics);

      const result: StrengthScoreResult = {
        engagementScore,
        growthScore,
        qualityScore,
        potentialScore,
        overallScore,
        breakdown,
      };

      // Store the score in database
      await this.storeStrengthScore(artistId, timeRange, result);

      logger.log(`Strength score calculated: ${overallScore.toFixed(2)}`);
      return result;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error calculating strength score:', error);
      }
      throw error;
    }
  }

  /**
   * Calculate comprehensive artist metrics
   */
  async calculateArtistMetrics(
    artistId: string,
    timeRange: string
  ): Promise<ArtistMetrics> {
    // Get all tracks by artist
    const tracks = await prisma.track.findMany({
      where: {
        artistProfileId: artistId,
      },
      select: { id: true },
    });

    const trackIds = tracks.map(track => track.id);
    if (trackIds.length === 0) {
      return this.getEmptyMetrics();
    }

    // Calculate date range
    const { startDate, endDate } = this.getDateRange(timeRange);

    // Get aggregated data if available, otherwise calculate from raw events
    let metrics: ArtistMetrics;

    if (
      timeRange === '7d' ||
      timeRange === '30d' ||
      timeRange === '90d' ||
      timeRange === '1y'
    ) {
      metrics = await this.getAggregatedMetrics(
        trackIds,
        startDate,
        endDate,
        timeRange
      );
    } else {
      metrics = await this.getRawMetrics(trackIds, startDate, endDate);
    }

    // Calculate additional metrics
    metrics.growthVelocity = await this.calculateGrowthVelocity(
      artistId,
      timeRange
    );
    metrics.viralCoefficient = await this.calculateViralCoefficient(
      artistId,
      timeRange
    );
    metrics.geographicReach = await this.calculateGeographicReach(
      trackIds,
      startDate,
      endDate
    );
    metrics.crossPlatformScore = await this.calculateCrossPlatformScore(
      trackIds,
      startDate,
      endDate
    );
    metrics.retentionRate = await this.calculateRetentionRate(
      artistId,
      timeRange
    );

    return metrics;
  }

  /**
   * Calculate Engagement Score (40% weight)
   */
  private async calculateEngagementScore(
    metrics: ArtistMetrics,
    _timeRange: string
  ): Promise<number> {
    // Normalize completion rate (0-100% -> 0-1)
    const completionRateScore = Math.min(metrics.avgCompletionRate / 100, 1);

    // Normalize replay rate (0-100% -> 0-1)
    const replayRateScore = Math.min(metrics.replayRate / 100, 1);

    // Calculate like rate (likes per play)
    const likeRate =
      metrics.totalPlays > 0 ? metrics.totalLikes / metrics.totalPlays : 0;
    const likeRateScore = Math.min(likeRate * 10, 1); // Scale: 10% like rate = 1.0 score

    // Calculate save rate (saves per play)
    const saveRate =
      metrics.totalPlays > 0 ? metrics.totalSaves / metrics.totalPlays : 0;
    const saveRateScore = Math.min(saveRate * 20, 1); // Scale: 5% save rate = 1.0 score

    // Calculate share rate (shares per play)
    const shareRate =
      metrics.totalPlays > 0 ? metrics.totalShares / metrics.totalPlays : 0;
    const shareRateScore = Math.min(shareRate * 50, 1); // Scale: 2% share rate = 1.0 score

    // Weighted engagement score
    const engagementScore =
      completionRateScore * 0.3 +
      replayRateScore * 0.25 +
      likeRateScore * 0.2 +
      saveRateScore * 0.15 +
      shareRateScore * 0.1;

    return Math.min(engagementScore * 100, 100);
  }

  /**
   * Calculate Growth Score (30% weight)
   */
  private async calculateGrowthScore(
    artistId: string,
    metrics: ArtistMetrics,
    timeRange: string
  ): Promise<number> {
    // Play velocity score (plays per day)
    const daysInRange = this.getDaysInRange(timeRange);
    const playVelocity = daysInRange > 0 ? metrics.totalPlays / daysInRange : 0;
    const playVelocityScore = Math.min(playVelocity / 100, 1); // Scale: 100 plays/day = 1.0

    // Unique listener growth
    const uniqueListenerRatio =
      metrics.totalPlays > 0 ? metrics.uniquePlays / metrics.totalPlays : 0;
    const uniqueListenerScore = Math.min(uniqueListenerRatio, 1);

    // Geographic expansion
    const geographicScore = Math.min(metrics.geographicReach / 10, 1); // Scale: 10 countries = 1.0

    // Time-based consistency
    const consistencyScore = Math.min(metrics.growthVelocity, 1);

    // Weighted growth score
    const growthScore =
      playVelocityScore * 0.4 +
      uniqueListenerScore * 0.3 +
      geographicScore * 0.2 +
      consistencyScore * 0.1;

    return Math.min(growthScore * 100, 100);
  }

  /**
   * Calculate Quality Score (20% weight)
   */
  private async calculateQualityScore(
    metrics: ArtistMetrics,
    _timeRange: string
  ): Promise<number> {
    // Skip rate (inverted - lower skip rate = higher score)
    const skipRateScore = Math.max(1 - metrics.skipRate / 100, 0);

    // Retention rate
    const retentionScore = Math.min(metrics.retentionRate / 100, 1);

    // Cross-platform performance
    const crossPlatformScore = Math.min(metrics.crossPlatformScore / 100, 1);

    // Genre fit (placeholder - would need genre performance data)
    const genreFitScore = 0.8; // Default good score

    // Weighted quality score
    const qualityScore =
      skipRateScore * 0.4 +
      retentionScore * 0.3 +
      crossPlatformScore * 0.2 +
      genreFitScore * 0.1;

    return Math.min(qualityScore * 100, 100);
  }

  /**
   * Calculate Potential Score (10% weight)
   */
  private async calculatePotentialScore(
    _artistId: string,
    metrics: ArtistMetrics,
    _timeRange: string
  ): Promise<number> {
    // Viral coefficient
    const viralScore = Math.min(metrics.viralCoefficient, 1);

    // Market position (compared to similar artists)
    const marketPositionScore = await this.calculateMarketPosition(
      _artistId,
      _timeRange
    );

    // Demographic appeal (placeholder)
    const demographicScore = 0.7; // Default moderate score

    // Weighted potential score
    const potentialScore =
      viralScore * 0.5 + marketPositionScore * 0.3 + demographicScore * 0.2;

    return Math.min(potentialScore * 100, 100);
  }

  /**
   * Calculate overall score from components
   */
  private calculateOverallScore(components: {
    engagementScore: number;
    growthScore: number;
    qualityScore: number;
    potentialScore: number;
  }): number {
    return (
      components.engagementScore * 0.4 +
      components.growthScore * 0.3 +
      components.qualityScore * 0.2 +
      components.potentialScore * 0.1
    );
  }

  /**
   * Create detailed breakdown of scores
   */
  private createScoreBreakdown(metrics: ArtistMetrics) {
    return {
      engagement: {
        completionRate: metrics.avgCompletionRate,
        replayRate: metrics.replayRate,
        likeRate:
          metrics.totalPlays > 0
            ? (metrics.totalLikes / metrics.totalPlays) * 100
            : 0,
        saveRate:
          metrics.totalPlays > 0
            ? (metrics.totalSaves / metrics.totalPlays) * 100
            : 0,
        shareRate:
          metrics.totalPlays > 0
            ? (metrics.totalShares / metrics.totalPlays) * 100
            : 0,
      },
      growth: {
        playVelocity: metrics.growthVelocity,
        uniqueListenerGrowth:
          metrics.totalPlays > 0
            ? (metrics.uniquePlays / metrics.totalPlays) * 100
            : 0,
        geographicExpansion: metrics.geographicReach,
        timeConsistency: metrics.growthVelocity,
      },
      quality: {
        skipRate: metrics.skipRate,
        retentionRate: metrics.retentionRate,
        crossPlatformScore: metrics.crossPlatformScore,
        genreFit: 80, // Placeholder
      },
      potential: {
        viralCoefficient: metrics.viralCoefficient,
        marketPosition: 75, // Placeholder
        demographicAppeal: 70, // Placeholder
      },
    };
  }

  /**
   * Store strength score in database
   */
  private async storeStrengthScore(
    artistId: string,
    timeRange: string,
    result: StrengthScoreResult
  ): Promise<void> {
    await prisma.artistStrengthScore.upsert({
      where: {
        artistId_timeRange: {
          artistId,
          timeRange,
        },
      },
      update: {
        engagementScore: result.engagementScore,
        growthScore: result.growthScore,
        qualityScore: result.qualityScore,
        potentialScore: result.potentialScore,
        overallScore: result.overallScore,
        updatedAt: new Date(),
      },
      create: {
        artistId,
        timeRange,
        engagementScore: result.engagementScore,
        growthScore: result.growthScore,
        qualityScore: result.qualityScore,
        potentialScore: result.potentialScore,
        overallScore: result.overallScore,
      },
    });
  }

  /**
   * Helper methods for metric calculations
   */
  private getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2020); // Arbitrary start date
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    return { startDate, endDate };
  }

  private getDaysInRange(timeRange: string): number {
    switch (timeRange) {
      case '24h':
        return 1;
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '3m':
        return 90;
      case '1y':
        return 365;
      case 'all':
        return 365 * 3; // 3 years
      default:
        return 7;
    }
  }

  private getEmptyMetrics(): ArtistMetrics {
    return {
      totalPlays: 0,
      uniquePlays: 0,
      totalLikes: 0,
      totalShares: 0,
      totalDownloads: 0,
      totalSaves: 0,
      avgCompletionRate: 0,
      avgDuration: 0,
      skipRate: 0,
      replayRate: 0,
      growthVelocity: 0,
      viralCoefficient: 0,
      geographicReach: 0,
      crossPlatformScore: 0,
      retentionRate: 0,
    };
  }

  private async getAggregatedMetrics(
    trackIds: string[],
    startDate: Date,
    endDate: Date,
    _timeRange: string
  ): Promise<ArtistMetrics> {
    // Implementation would query aggregated tables based on timeRange
    // For now, fall back to raw data
    return this.getRawMetrics(trackIds, startDate, endDate);
  }

  private async getRawMetrics(
    trackIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<ArtistMetrics> {
    const whereClause = {
      trackId: { in: trackIds },
      timestamp: { gte: startDate, lte: endDate },
    };

    // Get play events
    const playEvents = await prisma.playEvent.findMany({
      where: whereClause,
    });

    // Get other events
    const likeEvents = await prisma.likeEvent.findMany({
      where: { ...whereClause, action: 'like' },
    });

    const shareEvents = await prisma.shareEvent.findMany({
      where: whereClause,
    });

    const downloadEvents = await prisma.downloadEvent.findMany({
      where: whereClause,
    });

    const saveEvents = await prisma.saveEvent.findMany({
      where: { ...whereClause, action: 'save' },
    });

    // Calculate metrics
    const totalPlays = playEvents.length;
    const uniquePlays = new Set(playEvents.map(e => e.sessionId)).size;
    const totalLikes = likeEvents.length;
    const totalShares = shareEvents.length;
    const totalDownloads = downloadEvents.length;
    const totalSaves = saveEvents.length;

    // Calculate averages
    const durations = playEvents.filter(e => e.duration).map(e => e.duration!);
    const completionRates = playEvents
      .filter(e => e.completionRate)
      .map(e => e.completionRate!);

    const avgDuration =
      durations.length > 0
        ? durations.reduce((sum, duration) => sum + duration, 0) /
          durations.length
        : 0;

    const avgCompletionRate =
      completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) /
          completionRates.length
        : 0;

    // Calculate rates
    const skipRate =
      totalPlays > 0
        ? (playEvents.filter(e => e.skipped).length / totalPlays) * 100
        : 0;
    const replayRate =
      totalPlays > 0
        ? (playEvents.filter(e => e.replayed).length / totalPlays) * 100
        : 0;

    return {
      totalPlays,
      uniquePlays,
      totalLikes,
      totalShares,
      totalDownloads,
      totalSaves,
      avgCompletionRate,
      avgDuration,
      skipRate,
      replayRate,
      growthVelocity: 0, // Will be calculated separately
      viralCoefficient: 0, // Will be calculated separately
      geographicReach: 0, // Will be calculated separately
      crossPlatformScore: 0, // Will be calculated separately
      retentionRate: 0, // Will be calculated separately
    };
  }

  private async calculateGrowthVelocity(
    artistId: string,
    timeRange: string
  ): Promise<number> {
    // Calculate growth velocity by comparing current period with previous period
    const { startDate, endDate } = this.getDateRange(timeRange);
    const previousPeriod = this.getPreviousPeriod(
      startDate,
      endDate,
      timeRange
    );

    const currentPlays = await this.getArtistPlayCount(
      artistId,
      startDate,
      endDate
    );
    const previousPlays = await this.getArtistPlayCount(
      artistId,
      previousPeriod.startDate,
      previousPeriod.endDate
    );

    if (previousPlays === 0) return currentPlays > 0 ? 1 : 0;
    return (currentPlays - previousPlays) / previousPlays;
  }

  private async calculateViralCoefficient(
    artistId: string,
    timeRange: string
  ): Promise<number> {
    // Calculate how many new listeners each existing listener brings
    const { startDate, endDate } = this.getDateRange(timeRange);

    const playEvents = await prisma.playEvent.findMany({
      where: {
        track: {
          artistProfileId: artistId,
        },
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    const uniqueSessions = new Set(playEvents.map(e => e.sessionId));
    const totalPlays = playEvents.length;

    if (uniqueSessions.size === 0) return 0;
    return totalPlays / uniqueSessions.size;
  }

  private async calculateGeographicReach(
    trackIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Count unique countries/IP ranges (simplified)
    const playEvents = await prisma.playEvent.findMany({
      where: {
        trackId: { in: trackIds },
        timestamp: { gte: startDate, lte: endDate },
        ip: { not: null },
      },
      select: { ip: true },
      distinct: ['ip'],
    });

    return playEvents.length;
  }

  private async calculateCrossPlatformScore(
    trackIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Calculate performance across different sources/platforms
    const sourceStats = await prisma.playEvent.groupBy({
      by: ['source'],
      where: {
        trackId: { in: trackIds },
        timestamp: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    // Score based on diversity of sources
    const sourceCount = sourceStats.length;
    const totalPlays = sourceStats.reduce(
      (sum, stat) => sum + stat._count.id,
      0
    );
    const avgPlaysPerSource = totalPlays / sourceCount;

    // Higher score for more diverse and balanced distribution
    return Math.min(sourceCount * 10 + avgPlaysPerSource / 10, 100);
  }

  private async calculateRetentionRate(
    artistId: string,
    timeRange: string
  ): Promise<number> {
    // Calculate how many users return to listen to the artist
    const { startDate, endDate } = this.getDateRange(timeRange);

    // Count sessions with multiple plays (indicating retention)
    const sessionPlayCounts = await prisma.playEvent.groupBy({
      by: ['sessionId'],
      where: {
        track: {
          artistProfileId: artistId,
        },
        timestamp: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    const multiPlaySessions = sessionPlayCounts.filter(
      stat => stat._count.id > 1
    ).length;
    const totalSessions = sessionPlayCounts.length;

    return totalSessions > 0 ? (multiPlaySessions / totalSessions) * 100 : 0;
  }

  private async calculateMarketPosition(
    _artistId: string,
    _timeRange: string
  ): Promise<number> {
    // Compare artist performance to similar artists in the same genre
    // This is a placeholder implementation
    return 75; // Default moderate score
  }

  private async getArtistPlayCount(
    artistId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const tracks = await prisma.track.findMany({
      where: { artistProfileId: artistId },
      select: { id: true },
    });

    const trackIds = tracks.map(track => track.id);
    if (trackIds.length === 0) return 0;

    return await prisma.playEvent.count({
      where: {
        trackId: { in: trackIds },
        timestamp: { gte: startDate, lte: endDate },
      },
    });
  }

  private getPreviousPeriod(
    startDate: Date,
    endDate: Date,
    _timeRange: string
  ): {
    startDate: Date;
    endDate: Date;
  } {
    const duration = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime());
    const previousStartDate = new Date(startDate.getTime() - duration);

    return { startDate: previousStartDate, endDate: previousEndDate };
  }

  /**
   * Get top artists by strength score
   */
  async getTopArtists(
    timeRange: string,
    limit: number = 50
  ): Promise<
    Array<{
      artistId: string;
      artistName: string;
      overallScore: number;
      engagementScore: number;
      growthScore: number;
      qualityScore: number;
      potentialScore: number;
    }>
  > {
    const scores = await prisma.artistStrengthScore.findMany({
      where: { timeRange },
      include: {
        artist: {
          select: { artistName: true },
        },
      },
      orderBy: { overallScore: 'desc' },
      take: limit,
    });

    return scores.map(score => ({
      artistId: score.artistId,
      artistName: score.artist.artistName,
      overallScore: score.overallScore,
      engagementScore: score.engagementScore,
      growthScore: score.growthScore,
      qualityScore: score.qualityScore,
      potentialScore: score.potentialScore,
    }));
  }

  /**
   * Batch calculate scores for all artists
   */
  async batchCalculateScores(timeRange: string): Promise<void> {
    logger.log(`Starting batch calculation for ${timeRange}`);

    const artists = await prisma.artistProfile.findMany({
      where: { isActive: true },
      select: { id: true, artistName: true },
    });

    logger.log(`Calculating scores for ${artists.length} artists`);

    for (const artist of artists) {
      try {
        await this.calculateArtistStrengthScore(artist.id, timeRange);
        logger.log(`✅ Calculated score for ${artist.artistName}`);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(
            `❌ Failed to calculate score for ${artist.artistName}:`,
            error
          );
        }
      }
    }

    logger.log(`Batch calculation completed for ${timeRange}`);
  }
}

// Export singleton instance
export const artistStrengthCalculator = new ArtistStrengthCalculator();
