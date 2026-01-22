/**
 * PULSE³ League Service
 * Manages tier-based league rankings with config-driven refresh intervals
 */

import { prisma } from '@/lib/db';

export type LeagueRunType = 'SCHEDULED' | 'MANUAL';
export type LeagueBandState = 'SECURE' | 'BELOW_RANGE' | 'ABOVE_RANGE';
export type LeagueStatusChange =
  | 'NEW'
  | 'UP'
  | 'DOWN'
  | 'UNCHANGED'
  | 'PROMOTED'
  | 'DEMOTED'
  | 'EXITED';

interface LatestEligibilityScore {
  artistProfileId: string;
  score: number;
  followerScore: number | null;
  engagementScore: number | null;
  consistencyScore: number | null;
  platformDiversityScore: number | null;
}

interface LeagueEntryData {
  artistProfileId: string;
  rank: number;
  score: number;
  bandState: LeagueBandState;
  isAtRisk: boolean;
  previousRank: number | null;
  rankDelta: number | null;
  statusChange: LeagueStatusChange;
  highlight: boolean;
}

export class PulseLeagueService {
  /**
   * Get all active tiers ordered by sortOrder
   */
  static async getActiveTiers() {
    return await prisma.leagueTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get tier by code
   */
  static async getTierByCode(code: string) {
    return await prisma.leagueTier.findUnique({
      where: { code },
    });
  }

  /**
   * Check if tier needs refresh based on refreshIntervalHours and last run
   */
  static async shouldRefreshTier(tier: {
    id: string;
    refreshIntervalHours: number;
  }): Promise<boolean> {
    const lastRun = await this.getLatestLeagueRun(tier.id);

    if (!lastRun) {
      return true; // No previous run, needs initial run
    }

    const hoursSinceLastRun =
      (Date.now() - lastRun.runAt.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastRun >= tier.refreshIntervalHours;
  }

  /**
   * Get latest league run for a tier
   */
  static async getLatestLeagueRun(tierId: string) {
    return await prisma.leagueRun.findFirst({
      where: { tierId },
      orderBy: { runAt: 'desc' },
    });
  }

  /**
   * Get current league entries for a tier (from latest run)
   */
  static async getCurrentLeagueEntries(tierId: string) {
    const latestRun = await this.getLatestLeagueRun(tierId);
    if (!latestRun) {
      return [];
    }

    return await prisma.leagueEntry.findMany({
      where: { leagueRunId: latestRun.id },
      orderBy: { rank: 'asc' },
      include: {
        artistProfile: {
          select: {
            id: true,
            artistName: true,
            slug: true,
            profileImage: true,
          },
        },
      },
    });
  }

  /**
   * Get previous league entries for comparison
   */
  static async getPreviousLeagueEntries(tierId: string, beforeRunId: string) {
    const previousRun = await prisma.leagueRun.findFirst({
      where: {
        tierId,
        id: { not: beforeRunId },
      },
      orderBy: { runAt: 'desc' },
    });

    if (!previousRun) {
      return [];
    }

    return await prisma.leagueEntry.findMany({
      where: { leagueRunId: previousRun.id },
      orderBy: { rank: 'asc' },
    });
  }

  /**
   * Get latest eligibility score per artist (with components)
   */
  private static async getLatestEligibilityScores(): Promise<
    LatestEligibilityScore[]
  > {
    // Get the most recent score per artist
    const latestScores = await prisma.pulseEligibilityScore.groupBy({
      by: ['artistProfileId'],
      _max: {
        calculatedAt: true,
      },
    });

    // Fetch full score records for each artist's latest calculation
    const scores: LatestEligibilityScore[] = [];

    for (const group of latestScores) {
      if (!group._max.calculatedAt) continue;

      const scoreRecord = await prisma.pulseEligibilityScore.findFirst({
        where: {
          artistProfileId: group.artistProfileId,
          calculatedAt: group._max.calculatedAt,
        },
        select: {
          artistProfileId: true,
          score: true,
          followerScore: true,
          engagementScore: true,
          consistencyScore: true,
          platformDiversityScore: true,
        },
      });

      if (scoreRecord) {
        scores.push({
          artistProfileId: scoreRecord.artistProfileId,
          score: scoreRecord.score,
          followerScore: scoreRecord.followerScore,
          engagementScore: scoreRecord.engagementScore,
          consistencyScore: scoreRecord.consistencyScore,
          platformDiversityScore: scoreRecord.platformDiversityScore,
        });
      }
    }

    return scores;
  }

  /**
   * Calculate band state based on tier config and score
   */
  private static calculateBandState(
    score: number,
    minScore: number,
    maxScore: number | null
  ): LeagueBandState {
    if (score < minScore) {
      return 'BELOW_RANGE';
    }
    if (maxScore !== null && score > maxScore) {
      return 'ABOVE_RANGE';
    }
    return 'SECURE';
  }

  /**
   * Calculate status change by comparing to previous run
   */
  private static calculateStatusChange(
    artistProfileId: string,
    currentRank: number,
    previousEntries: Array<{ artistProfileId: string; rank: number }>
  ): LeagueStatusChange {
    const previousEntry = previousEntries.find(
      e => e.artistProfileId === artistProfileId
    );

    if (!previousEntry) {
      return 'NEW';
    }

    if (currentRank < previousEntry.rank) {
      return 'UP';
    }
    if (currentRank > previousEntry.rank) {
      return 'DOWN';
    }
    return 'UNCHANGED';
  }

  /**
   * Run league for a specific tier
   */
  static async runLeagueForTier(
    tier: {
      id: string;
      code: string;
      name: string;
      targetSize: number;
      minScore: number;
      maxScore: number | null;
    },
    runType: LeagueRunType,
    options?: { excludeArtistProfileIds?: string[] }
  ): Promise<{ runId: string; entriesCreated: number }> {
    // 1. Get latest eligibility scores
    const allScores = await this.getLatestEligibilityScores();

    if (allScores.length === 0) {
      throw new Error('No eligibility scores found');
    }

    // 2. Sort by: score DESC, engagementScore DESC, consistencyScore DESC, followerScore DESC, artistProfileId ASC
    const excluded = new Set(options?.excludeArtistProfileIds ?? []);

    const sorted = allScores
      .filter(s => !excluded.has(s.artistProfileId))
      .sort((a, b) => {
        // Primary: score
        if (a.score !== b.score) {
          return b.score - a.score;
        }

        // Secondary: engagementScore
        const aEng = a.engagementScore ?? 0;
        const bEng = b.engagementScore ?? 0;
        if (aEng !== bEng) {
          return bEng - aEng;
        }

        // Tertiary: consistencyScore
        const aCons = a.consistencyScore ?? 0;
        const bCons = b.consistencyScore ?? 0;
        if (aCons !== bCons) {
          return bCons - aCons;
        }

        // Quaternary: followerScore
        const aFol = a.followerScore ?? 0;
        const bFol = b.followerScore ?? 0;
        if (aFol !== bFol) {
          return bFol - aFol;
        }

        // Quinary: artistProfileId (ascending for stability)
        return a.artistProfileId.localeCompare(b.artistProfileId);
      });

    // 3. Select top targetSize
    const topArtists = sorted.slice(0, tier.targetSize);

    // 4. Get previous run entries for comparison
    const previousRun = await this.getLatestLeagueRun(tier.id);
    const previousEntries = previousRun
      ? await this.getPreviousLeagueEntries(tier.id, previousRun.id)
      : [];

    // 5. Build entry data
    const entryData: LeagueEntryData[] = topArtists.map((artist, index) => {
      const rank = index + 1;
      const bandState = this.calculateBandState(
        artist.score,
        tier.minScore,
        tier.maxScore
      );
      const isAtRisk = bandState !== 'SECURE';
      const highlight = rank <= 3;

      const previousEntry = previousEntries.find(
        e => e.artistProfileId === artist.artistProfileId
      );
      const previousRank = previousEntry?.rank ?? null;
      const rankDelta = previousRank !== null ? previousRank - rank : null;
      const statusChange = this.calculateStatusChange(
        artist.artistProfileId,
        rank,
        previousEntries
      );

      return {
        artistProfileId: artist.artistProfileId,
        rank,
        score: artist.score,
        bandState,
        isAtRisk,
        previousRank,
        rankDelta,
        statusChange,
        highlight,
      };
    });

    // 6. Create league run and entries atomically
    const result = await prisma.$transaction(async tx => {
      // Create league run
      const leagueRun = await tx.leagueRun.create({
        data: {
          tierId: tier.id,
          runType,
          runAt: new Date(),
        },
      });

      // Create all entries
      await tx.leagueEntry.createMany({
        data: entryData.map(entry => ({
          leagueRunId: leagueRun.id,
          artistProfileId: entry.artistProfileId,
          rank: entry.rank,
          score: entry.score,
          bandState: entry.bandState,
          isAtRisk: entry.isAtRisk,
          previousRank: entry.previousRank,
          rankDelta: entry.rankDelta,
          statusChange: entry.statusChange,
          highlight: entry.highlight,
        })),
      });

      return { runId: leagueRun.id, entriesCreated: entryData.length };
    });

    return result;
  }

  /**
   * Process promotions and demotions after daily runs
   * Compares current tier membership vs previous day
   */
  static async processPromotionsAndDemotions(): Promise<void> {
    const activeTiers = await this.getActiveTiers();

    // Get yesterday's runs (SCHEDULED only)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const tier of activeTiers) {
      // Get today's run
      const todayRun = await prisma.leagueRun.findFirst({
        where: {
          tierId: tier.id,
          runType: 'SCHEDULED',
          runAt: {
            gte: today,
          },
        },
        orderBy: { runAt: 'desc' },
      });

      if (!todayRun) continue;

      // Get yesterday's run
      const yesterdayRun = await prisma.leagueRun.findFirst({
        where: {
          tierId: tier.id,
          runType: 'SCHEDULED',
          runAt: {
            gte: yesterday,
            lt: today,
          },
        },
        orderBy: { runAt: 'desc' },
      });

      if (!yesterdayRun) continue;

      // Get entries from both runs
      const todayEntries = await prisma.leagueEntry.findMany({
        where: { leagueRunId: todayRun.id },
      });

      const yesterdayEntries = await prisma.leagueEntry.findMany({
        where: { leagueRunId: yesterdayRun.id },
      });

      const yesterdayArtistIds = new Set(
        yesterdayEntries.map(e => e.artistProfileId)
      );

      // Check for promotions/demotions
      for (const todayEntry of todayEntries) {
        const wasInYesterday = yesterdayArtistIds.has(
          todayEntry.artistProfileId
        );

        // Check if artist was in a different tier yesterday
        // (This requires checking other tiers - simplified for now)
        // For now, we'll only update if statusChange is UP/DOWN
        // Full cross-tier promotion/demotion would require checking all tiers

        // Update statusChange to PROMOTED if rank improved significantly
        // or DEMOTED if rank dropped significantly
        // For simplicity, we'll mark as PROMOTED/DEMOTED if they weren't in this tier yesterday
        // and are now, or vice versa
        if (!wasInYesterday && todayEntry.statusChange === 'NEW') {
          // Could be a promotion from lower tier (would need to check other tiers)
          // For now, keep as NEW
        }
      }
    }
  }
}
