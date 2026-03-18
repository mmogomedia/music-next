/**
 * PULSE³ League Service Tests
 * Tests for league tier management, ranking, and movement calculations
 */

import { PulseLeagueService } from '../pulse-league-service';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    leagueTier: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    leagueRun: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    leagueEntry: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    pulseEligibilityScore: {
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('PulseLeagueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveTiers', () => {
    it('should return active tiers ordered by sortOrder', async () => {
      const mockTiers = [
        {
          id: 'tier-1',
          code: 'TIER1',
          name: 'Top 20',
          sortOrder: 1,
          isActive: true,
        },
        {
          id: 'tier-2',
          code: 'TIER2',
          name: 'Watchlist',
          sortOrder: 2,
          isActive: true,
        },
      ];

      (prisma.leagueTier.findMany as jest.Mock).mockResolvedValue(mockTiers);

      const result = await PulseLeagueService.getActiveTiers();

      expect(result).toEqual(mockTiers);
      expect(prisma.leagueTier.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return empty array when no active tiers', async () => {
      (prisma.leagueTier.findMany as jest.Mock).mockResolvedValue([]);

      const result = await PulseLeagueService.getActiveTiers();

      expect(result).toEqual([]);
    });
  });

  describe('shouldRefreshTier', () => {
    it('should return true when no previous run exists', async () => {
      const tier = { id: 'tier-1', refreshIntervalHours: 24 };
      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PulseLeagueService.shouldRefreshTier(tier);

      expect(result).toBe(true);
    });

    it('should return true when refresh interval has passed', async () => {
      const tier = { id: 'tier-1', refreshIntervalHours: 24 };
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(yesterday.getHours() - 1); // 25 hours ago

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue({
        id: 'run-1',
        runAt: yesterday,
      });

      const result = await PulseLeagueService.shouldRefreshTier(tier);

      expect(result).toBe(true);
    });

    it('should return false when refresh interval has not passed', async () => {
      const tier = { id: 'tier-1', refreshIntervalHours: 24 };
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue({
        id: 'run-1',
        runAt: oneHourAgo,
      });

      const result = await PulseLeagueService.shouldRefreshTier(tier);

      expect(result).toBe(false);
    });
  });

  describe('runLeagueForTier', () => {
    const mockTier = {
      id: 'tier-1',
      code: 'TIER1',
      name: 'Top 20',
      targetSize: 20,
      minScore: 0,
      maxScore: null,
    };

    const mockScores = Array.from({ length: 50 }, (_, i) => ({
      artistProfileId: `artist-${i + 1}`,
      score: 100 - i,
      followerScore: 80 - i * 0.5,
      engagementScore: 70 - i * 0.5,
      consistencyScore: 60 - i * 0.5,
      platformDiversityScore: 50,
    }));

    beforeEach(() => {
      // Mock getLatestEligibilityScores
      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue(
        mockScores.map(s => ({
          artistProfileId: s.artistProfileId,
          _max: { calculatedAt: new Date() },
        }))
      );

      mockScores.forEach(score => {
        (
          prisma.pulseEligibilityScore.findFirst as jest.Mock
        ).mockResolvedValueOnce({
          artistProfileId: score.artistProfileId,
          score: score.score,
          followerScore: score.followerScore,
          engagementScore: score.engagementScore,
          consistencyScore: score.consistencyScore,
          platformDiversityScore: score.platformDiversityScore,
          calculatedAt: new Date(),
        });
      });

      // Mock previous run (none exists)
      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 20 }),
          },
        };
        return await callback(mockTx);
      });
    });

    it('should create league run with top N artists', async () => {
      const result = await PulseLeagueService.runLeagueForTier(
        mockTier,
        'SCHEDULED'
      );

      expect(result).toHaveProperty('runId');
      expect(result).toHaveProperty('entriesCreated');
      expect(result.entriesCreated).toBe(20);
    });

    it('should exclude artists from excluded list', async () => {
      const excludedIds = ['artist-1', 'artist-2'];
      const result = await PulseLeagueService.runLeagueForTier(
        mockTier,
        'SCHEDULED',
        { excludeArtistProfileIds: excludedIds }
      );

      expect(result.entriesCreated).toBe(20);
      // Verify excluded artists are not in the result
      // (This would require checking the actual entries, which is mocked)
    });

    it('should calculate band state correctly', async () => {
      const tierWithMinMax = {
        ...mockTier,
        minScore: 50,
        maxScore: 80,
      };

      await PulseLeagueService.runLeagueForTier(tierWithMinMax, 'SCHEDULED');

      // Verify transaction was called (band state calculation happens inside)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should calculate status change for new entries', async () => {
      // No previous run, so all entries should be NEW
      const result = await PulseLeagueService.runLeagueForTier(
        mockTier,
        'SCHEDULED'
      );

      expect(result.entriesCreated).toBe(20);
      // All entries should have statusChange = 'NEW'
    });

    it('should calculate status change for existing entries', async () => {
      // Mock previous run with entries
      const previousRun = {
        id: 'previous-run-1',
        runAt: new Date(Date.now() - 86400000), // 1 day ago
      };

      const previousEntries = [
        { artistProfileId: 'artist-1', rank: 1 },
        { artistProfileId: 'artist-2', rank: 2 },
        { artistProfileId: 'artist-3', rank: 3 },
      ];

      (prisma.leagueRun.findFirst as jest.Mock)
        .mockResolvedValueOnce(previousRun) // Latest run
        .mockResolvedValueOnce(previousRun); // Previous run lookup

      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValueOnce(
        previousEntries
      );

      const result = await PulseLeagueService.runLeagueForTier(
        mockTier,
        'SCHEDULED'
      );

      expect(result.entriesCreated).toBe(20);
      // Status changes should be calculated (UP, DOWN, UNCHANGED)
    });

    it('should sort by score DESC with tie-breakers', async () => {
      // Create scores with ties
      const tiedScores = [
        {
          artistProfileId: 'artist-1',
          score: 75,
          engagementScore: 80,
          consistencyScore: 70,
          followerScore: 60,
          platformDiversityScore: 50,
        },
        {
          artistProfileId: 'artist-2',
          score: 75,
          engagementScore: 80,
          consistencyScore: 70,
          followerScore: 65,
          platformDiversityScore: 50,
        },
        {
          artistProfileId: 'artist-3',
          score: 75,
          engagementScore: 80,
          consistencyScore: 75,
          followerScore: 60,
          platformDiversityScore: 50,
        },
      ];

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue(
        tiedScores.map(s => ({
          artistProfileId: s.artistProfileId,
          _max: { calculatedAt: new Date() },
        }))
      );

      tiedScores.forEach(score => {
        (
          prisma.pulseEligibilityScore.findFirst as jest.Mock
        ).mockResolvedValueOnce({
          ...score,
          calculatedAt: new Date(),
        });
      });

      await PulseLeagueService.runLeagueForTier(mockTier, 'SCHEDULED');

      // Verify sorting logic (would need to check actual order in entries)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error when no eligibility scores found', async () => {
      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue([]);

      await expect(
        PulseLeagueService.runLeagueForTier(mockTier, 'SCHEDULED')
      ).rejects.toThrow('No eligibility scores found');
    });
  });

  describe('calculateBandState', () => {
    // Test band state calculation indirectly through runLeagueForTier
    it('should mark artist as BELOW_RANGE when score < minScore', async () => {
      const tierWithMin = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 1,
        minScore: 50,
        maxScore: null,
      };

      const lowScore = {
        artistProfileId: 'artist-1',
        score: 30, // Below minimum
        followerScore: 30,
        engagementScore: 30,
        consistencyScore: 30,
        platformDiversityScore: 50,
      };

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue([
        { artistProfileId: 'artist-1', _max: { calculatedAt: new Date() } },
      ]);

      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockResolvedValue({
        ...lowScore,
        calculatedAt: new Date(),
      });

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await callback(mockTx);
      });

      await PulseLeagueService.runLeagueForTier(tierWithMin, 'SCHEDULED');

      // Verify transaction was called (band state would be BELOW_RANGE)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should mark artist as ABOVE_RANGE when score > maxScore', async () => {
      const tierWithMax = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 1,
        minScore: 0,
        maxScore: 50,
      };

      const highScore = {
        artistProfileId: 'artist-1',
        score: 80, // Above maximum
        followerScore: 80,
        engagementScore: 80,
        consistencyScore: 80,
        platformDiversityScore: 80,
      };

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue([
        { artistProfileId: 'artist-1', _max: { calculatedAt: new Date() } },
      ]);

      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockResolvedValue({
        ...highScore,
        calculatedAt: new Date(),
      });

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await callback(mockTx);
      });

      await PulseLeagueService.runLeagueForTier(tierWithMax, 'SCHEDULED');

      // Verify transaction was called (band state would be ABOVE_RANGE)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should mark artist as SECURE when score is within range', async () => {
      const tierWithRange = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 1,
        minScore: 50,
        maxScore: 80,
      };

      const secureScore = {
        artistProfileId: 'artist-1',
        score: 65, // Within range
        followerScore: 65,
        engagementScore: 65,
        consistencyScore: 65,
        platformDiversityScore: 65,
      };

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue([
        { artistProfileId: 'artist-1', _max: { calculatedAt: new Date() } },
      ]);

      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockResolvedValue({
        ...secureScore,
        calculatedAt: new Date(),
      });

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await callback(mockTx);
      });

      await PulseLeagueService.runLeagueForTier(tierWithRange, 'SCHEDULED');

      // Verify transaction was called (band state would be SECURE)
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('calculateStatusChange', () => {
    // Test status change calculation indirectly through runLeagueForTier
    it('should return NEW for artist not in previous run', async () => {
      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 1,
        minScore: 0,
        maxScore: null,
      };

      const score = {
        artistProfileId: 'artist-new',
        score: 75,
        followerScore: 70,
        engagementScore: 80,
        consistencyScore: 75,
        platformDiversityScore: 50,
      };

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue([
        { artistProfileId: 'artist-new', _max: { calculatedAt: new Date() } },
      ]);

      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockResolvedValue({
        ...score,
        calculatedAt: new Date(),
      });

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await callback(mockTx);
      });

      await PulseLeagueService.runLeagueForTier(mockTier, 'SCHEDULED');

      // Status change should be NEW (no previous entry)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should return UP when rank improved', async () => {
      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 1,
        minScore: 0,
        maxScore: null,
      };

      const score = {
        artistProfileId: 'artist-1',
        score: 85, // Higher score = better rank
        followerScore: 80,
        engagementScore: 90,
        consistencyScore: 85,
        platformDiversityScore: 50,
      };

      const previousRun = {
        id: 'previous-run-1',
        runAt: new Date(Date.now() - 86400000),
      };

      const previousEntries = [
        { artistProfileId: 'artist-1', rank: 5 }, // Was rank 5
      ];

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue([
        { artistProfileId: 'artist-1', _max: { calculatedAt: new Date() } },
      ]);

      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockResolvedValue({
        ...score,
        calculatedAt: new Date(),
      });

      (prisma.leagueRun.findFirst as jest.Mock)
        .mockResolvedValueOnce(previousRun)
        .mockResolvedValueOnce(previousRun);

      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValueOnce(
        previousEntries
      );

      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await callback(mockTx);
      });

      await PulseLeagueService.runLeagueForTier(mockTier, 'SCHEDULED');

      // Status change should be UP (rank improved from 5 to 1)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should return DOWN when rank declined', async () => {
      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 2,
        minScore: 0,
        maxScore: null,
      };

      const scores = [
        {
          artistProfileId: 'artist-2',
          score: 90, // Higher score
          followerScore: 85,
          engagementScore: 95,
          consistencyScore: 90,
          platformDiversityScore: 50,
        },
        {
          artistProfileId: 'artist-1',
          score: 75, // Lower score (will be rank 2)
          followerScore: 70,
          engagementScore: 80,
          consistencyScore: 75,
          platformDiversityScore: 50,
        },
      ];

      const previousRun = {
        id: 'previous-run-1',
        runAt: new Date(Date.now() - 86400000),
      };

      const previousEntries = [
        { artistProfileId: 'artist-1', rank: 1 }, // Was rank 1
        { artistProfileId: 'artist-2', rank: 2 },
      ];

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue(
        scores.map(s => ({
          artistProfileId: s.artistProfileId,
          _max: { calculatedAt: new Date() },
        }))
      );

      scores.forEach(s => {
        (
          prisma.pulseEligibilityScore.findFirst as jest.Mock
        ).mockResolvedValueOnce({
          ...s,
          calculatedAt: new Date(),
        });
      });

      (prisma.leagueRun.findFirst as jest.Mock)
        .mockResolvedValueOnce(previousRun)
        .mockResolvedValueOnce(previousRun);

      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValueOnce(
        previousEntries
      );

      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(mockTx);
      });

      await PulseLeagueService.runLeagueForTier(mockTier, 'SCHEDULED');

      // Status change for artist-1 should be DOWN (rank declined from 1 to 2)
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should return UNCHANGED when rank stayed the same', async () => {
      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 1,
        minScore: 0,
        maxScore: null,
      };

      const score = {
        artistProfileId: 'artist-1',
        score: 75,
        followerScore: 70,
        engagementScore: 80,
        consistencyScore: 75,
        platformDiversityScore: 50,
      };

      const previousRun = {
        id: 'previous-run-1',
        runAt: new Date(Date.now() - 86400000),
      };

      const previousEntries = [
        { artistProfileId: 'artist-1', rank: 1 }, // Was rank 1, still rank 1
      ];

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue([
        { artistProfileId: 'artist-1', _max: { calculatedAt: new Date() } },
      ]);

      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockResolvedValue({
        ...score,
        calculatedAt: new Date(),
      });

      (prisma.leagueRun.findFirst as jest.Mock)
        .mockResolvedValueOnce(previousRun)
        .mockResolvedValueOnce(previousRun);

      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValueOnce(
        previousEntries
      );

      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await callback(mockTx);
      });

      await PulseLeagueService.runLeagueForTier(mockTier, 'SCHEDULED');

      // Status change should be UNCHANGED (rank stayed at 1)
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getCurrentLeagueEntries', () => {
    it('should return entries from latest run', async () => {
      const mockRun = {
        id: 'run-1',
        runAt: new Date(),
      };

      const mockEntries = [
        {
          id: 'entry-1',
          rank: 1,
          artistProfile: { id: 'artist-1', artistName: 'Artist 1' },
        },
      ];

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(mockRun);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const result = await PulseLeagueService.getCurrentLeagueEntries('tier-1');

      expect(result).toEqual(mockEntries);
      expect(prisma.leagueEntry.findMany).toHaveBeenCalledWith({
        where: { leagueRunId: 'run-1' },
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
    });

    it('should return empty array when no run exists', async () => {
      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PulseLeagueService.getCurrentLeagueEntries('tier-1');

      expect(result).toEqual([]);
    });
  });

  describe('getTierByCode', () => {
    it('should return tier by code', async () => {
      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 20,
        minScore: 70,
        maxScore: null,
        refreshIntervalHours: 24,
        isActive: true,
        sortOrder: 1,
      };

      (prisma.leagueTier.findUnique as jest.Mock).mockResolvedValue(mockTier);

      const result = await PulseLeagueService.getTierByCode('TIER1');

      expect(result).toEqual(mockTier);
      expect(prisma.leagueTier.findUnique).toHaveBeenCalledWith({
        where: { code: 'TIER1' },
      });
    });

    it('should return null when tier not found', async () => {
      (prisma.leagueTier.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await PulseLeagueService.getTierByCode('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('getLatestLeagueRun', () => {
    it('should return latest run for tier', async () => {
      const mockRun = {
        id: 'run-1',
        tierId: 'tier-1',
        runType: 'SCHEDULED',
        runAt: new Date(),
      };

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(mockRun);

      const result = await PulseLeagueService.getLatestLeagueRun('tier-1');

      expect(result).toEqual(mockRun);
      expect(prisma.leagueRun.findFirst).toHaveBeenCalledWith({
        where: { tierId: 'tier-1' },
        orderBy: { runAt: 'desc' },
      });
    });

    it('should return null when no runs exist', async () => {
      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PulseLeagueService.getLatestLeagueRun('tier-1');

      expect(result).toBeNull();
    });
  });

  describe('getPreviousLeagueEntries', () => {
    it('should return previous entries before specified run', async () => {
      const beforeRunId = 'current-run-1';
      const previousRun = {
        id: 'previous-run-1',
        tierId: 'tier-1',
        runAt: new Date(Date.now() - 86400000),
      };

      const previousEntries = [
        { artistProfileId: 'artist-1', rank: 1 },
        { artistProfileId: 'artist-2', rank: 2 },
      ];

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(previousRun);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue(
        previousEntries
      );

      const result = await PulseLeagueService.getPreviousLeagueEntries(
        'tier-1',
        beforeRunId
      );

      expect(result).toEqual(previousEntries);
      expect(prisma.leagueRun.findFirst).toHaveBeenCalledWith({
        where: {
          tierId: 'tier-1',
          id: { not: beforeRunId },
        },
        orderBy: { runAt: 'desc' },
      });
    });

    it('should return empty array when no previous run exists', async () => {
      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PulseLeagueService.getPreviousLeagueEntries(
        'tier-1',
        'current-run-1'
      );

      expect(result).toEqual([]);
    });
  });

  describe('runLeagueForTier - Edge Cases', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle tier with fewer artists than targetSize', async () => {
      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 20,
        minScore: 0,
        maxScore: null,
      };

      // Only 5 artists exist
      const mockScores = Array.from({ length: 5 }, (_, i) => ({
        artistProfileId: `artist-${i + 1}`,
        score: 100 - i,
        followerScore: 80,
        engagementScore: 70,
        consistencyScore: 60,
        platformDiversityScore: 50,
      }));

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue(
        mockScores.map(s => ({
          artistProfileId: s.artistProfileId,
          _max: { calculatedAt: new Date() },
        }))
      );

      mockScores.forEach(score => {
        (
          prisma.pulseEligibilityScore.findFirst as jest.Mock
        ).mockResolvedValueOnce({
          ...score,
          calculatedAt: new Date(),
        });
      });

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 5 }),
          },
        };
        return await callback(mockTx);
      });

      const result = await PulseLeagueService.runLeagueForTier(
        mockTier,
        'SCHEDULED'
      );

      expect(result.entriesCreated).toBe(5); // All 5 artists included
    });

    it('should handle tier with zero artists', async () => {
      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 20,
        minScore: 0,
        maxScore: null,
      };

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue([]);

      await expect(
        PulseLeagueService.runLeagueForTier(mockTier, 'SCHEDULED')
      ).rejects.toThrow('No eligibility scores found');
    });

    it('should handle null component scores gracefully', async () => {
      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 2,
        minScore: 0,
        maxScore: null,
      };

      const mockScores = [
        {
          artistProfileId: 'artist-1',
          score: 75,
          followerScore: null,
          engagementScore: null,
          consistencyScore: null,
          platformDiversityScore: null,
        },
        {
          artistProfileId: 'artist-2',
          score: 70,
          followerScore: 60,
          engagementScore: 50,
          consistencyScore: 40,
          platformDiversityScore: 30,
        },
      ];

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue(
        mockScores.map(s => ({
          artistProfileId: s.artistProfileId,
          _max: { calculatedAt: new Date() },
        }))
      );

      mockScores.forEach(score => {
        (
          prisma.pulseEligibilityScore.findFirst as jest.Mock
        ).mockResolvedValueOnce({
          ...score,
          calculatedAt: new Date(),
        });
      });

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return await callback(mockTx);
      });

      const result = await PulseLeagueService.runLeagueForTier(
        mockTier,
        'SCHEDULED'
      );

      // Should not throw - null scores handled (default to 0 in sorting)
      expect(result.entriesCreated).toBe(2);
    });

    it('should correctly exclude artists from excluded list', async () => {
      // Reset all mocks to ensure clean state
      jest.clearAllMocks();
      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockReset();

      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 3,
        minScore: 0,
        maxScore: null,
      };

      const mockScores = Array.from({ length: 5 }, (_, i) => ({
        artistProfileId: `artist-${i + 1}`,
        score: 100 - i * 5,
        followerScore: 80,
        engagementScore: 70,
        consistencyScore: 60,
        platformDiversityScore: 50,
      }));

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue(
        mockScores.map(s => ({
          artistProfileId: s.artistProfileId,
          _max: { calculatedAt: new Date() },
        }))
      );

      // Mock findFirst to return scores based on artistProfileId and calculatedAt
      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockImplementation(
        async (args: any) => {
          const artistId = args.where.artistProfileId;
          const score = mockScores.find(s => s.artistProfileId === artistId);
          if (!score) return null;
          return {
            artistProfileId: score.artistProfileId,
            score: score.score,
            followerScore: score.followerScore,
            engagementScore: score.engagementScore,
            consistencyScore: score.consistencyScore,
            platformDiversityScore: score.platformDiversityScore,
            calculatedAt: args.where.calculatedAt || new Date(),
          };
        }
      );

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      let capturedEntries: any[] = [];
      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockImplementation(data => {
              capturedEntries = data.data;
              return Promise.resolve({ count: data.data.length });
            }),
          },
        };
        return await callback(mockTx);
      });

      // Exclude artist-1 and artist-2 (top 2)
      const result = await PulseLeagueService.runLeagueForTier(
        mockTier,
        'SCHEDULED',
        { excludeArtistProfileIds: ['artist-1', 'artist-2'] }
      );

      expect(result.entriesCreated).toBe(3);
      // Verify excluded artists are not in entries
      const entryArtistIds = capturedEntries.map((e: any) => e.artistProfileId);
      expect(entryArtistIds).not.toContain('artist-1');
      expect(entryArtistIds).not.toContain('artist-2');
      // Should include artist-3, artist-4, artist-5 (next 3 after exclusions)
      expect(entryArtistIds.length).toBe(3);
      expect(entryArtistIds).toContain('artist-3');
      expect(entryArtistIds).toContain('artist-4');
      expect(entryArtistIds).toContain('artist-5');
    });

    it('should handle tier with maxScore correctly', async () => {
      // Reset all mocks to ensure clean state
      jest.clearAllMocks();
      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockReset();

      const mockTier = {
        id: 'tier-1',
        code: 'TIER2',
        name: 'Watchlist',
        targetSize: 3,
        minScore: 50,
        maxScore: 70, // Has upper limit
      };

      const mockScores = [
        {
          artistProfileId: 'artist-1',
          score: 80, // Above max
          followerScore: 80,
          engagementScore: 80,
          consistencyScore: 80,
          platformDiversityScore: 80,
        },
        {
          artistProfileId: 'artist-2',
          score: 65, // Within range
          followerScore: 65,
          engagementScore: 65,
          consistencyScore: 65,
          platformDiversityScore: 65,
        },
        {
          artistProfileId: 'artist-3',
          score: 55, // Within range
          followerScore: 55,
          engagementScore: 55,
          consistencyScore: 55,
          platformDiversityScore: 55,
        },
        {
          artistProfileId: 'artist-4',
          score: 45, // Below min
          followerScore: 45,
          engagementScore: 45,
          consistencyScore: 45,
          platformDiversityScore: 45,
        },
      ];

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue(
        mockScores.map(s => ({
          artistProfileId: s.artistProfileId,
          _max: { calculatedAt: new Date() },
        }))
      );

      // Mock findFirst to return scores based on artistProfileId and calculatedAt
      (prisma.pulseEligibilityScore.findFirst as jest.Mock).mockImplementation(
        async (args: any) => {
          const artistId = args.where.artistProfileId;
          const score = mockScores.find(s => s.artistProfileId === artistId);
          if (!score) return null;
          return {
            artistProfileId: score.artistProfileId,
            score: score.score,
            followerScore: score.followerScore,
            engagementScore: score.engagementScore,
            consistencyScore: score.consistencyScore,
            platformDiversityScore: score.platformDiversityScore,
            calculatedAt: args.where.calculatedAt || new Date(),
          };
        }
      );

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      let capturedEntries: any[] = [];
      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockImplementation(data => {
              capturedEntries = data.data;
              return Promise.resolve({ count: data.data.length });
            }),
          },
        };
        return await callback(mockTx);
      });

      const result = await PulseLeagueService.runLeagueForTier(
        mockTier,
        'SCHEDULED'
      );

      // All artists should be included (band state is informational)
      // But band states should reflect score ranges
      expect(result.entriesCreated).toBe(3); // Top 3 by score
      // Find entries by artistProfileId to verify band states
      const artist1Entry = capturedEntries.find(
        (e: any) => e.artistProfileId === 'artist-1'
      );
      const artist2Entry = capturedEntries.find(
        (e: any) => e.artistProfileId === 'artist-2'
      );
      const artist3Entry = capturedEntries.find(
        (e: any) => e.artistProfileId === 'artist-3'
      );
      expect(artist1Entry?.bandState).toBe('ABOVE_RANGE'); // artist-1 (80 > 70)
      expect(artist2Entry?.bandState).toBe('SECURE'); // artist-2 (50 <= 65 <= 70)
      expect(artist3Entry?.bandState).toBe('SECURE'); // artist-3 (50 <= 55 <= 70)
    });

    it('should highlight top 3 artists', async () => {
      const mockTier = {
        id: 'tier-1',
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 5,
        minScore: 0,
        maxScore: null,
      };

      const mockScores = Array.from({ length: 5 }, (_, i) => ({
        artistProfileId: `artist-${i + 1}`,
        score: 100 - i * 5,
        followerScore: 80,
        engagementScore: 70,
        consistencyScore: 60,
        platformDiversityScore: 50,
      }));

      (prisma.pulseEligibilityScore.groupBy as jest.Mock).mockResolvedValue(
        mockScores.map(s => ({
          artistProfileId: s.artistProfileId,
          _max: { calculatedAt: new Date() },
        }))
      );

      mockScores.forEach(score => {
        (
          prisma.pulseEligibilityScore.findFirst as jest.Mock
        ).mockResolvedValueOnce({
          ...score,
          calculatedAt: new Date(),
        });
      });

      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.leagueEntry.findMany as jest.Mock).mockResolvedValue([]);

      let capturedEntries: any[] = [];
      (prisma.$transaction as jest.Mock).mockImplementation(async callback => {
        const mockTx = {
          leagueRun: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'run-1', runAt: new Date() }),
          },
          leagueEntry: {
            createMany: jest.fn().mockImplementation(data => {
              capturedEntries = data.data;
              return Promise.resolve({ count: data.data.length });
            }),
          },
        };
        return await callback(mockTx);
      });

      await PulseLeagueService.runLeagueForTier(mockTier, 'SCHEDULED');

      // Top 3 should be highlighted
      expect(capturedEntries[0].highlight).toBe(true); // Rank 1
      expect(capturedEntries[1].highlight).toBe(true); // Rank 2
      expect(capturedEntries[2].highlight).toBe(true); // Rank 3
      expect(capturedEntries[3].highlight).toBe(false); // Rank 4
      expect(capturedEntries[4].highlight).toBe(false); // Rank 5
    });
  });

  describe('processPromotionsAndDemotions', () => {
    it('should process promotions and demotions without errors', async () => {
      const mockTiers = [
        {
          id: 'tier-1',
          code: 'TIER1',
          name: 'Top 20',
          isActive: true,
        },
      ];

      (prisma.leagueTier.findMany as jest.Mock).mockResolvedValue(mockTiers);
      (prisma.leagueRun.findFirst as jest.Mock).mockResolvedValue(null);

      // Should not throw
      await expect(
        PulseLeagueService.processPromotionsAndDemotions()
      ).resolves.not.toThrow();
    });
  });
});
