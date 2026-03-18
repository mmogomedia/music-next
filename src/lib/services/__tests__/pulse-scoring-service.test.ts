/**
 * PULSE³ Scoring Service Tests
 * Tests for eligibility score calculations and component scoring
 */

import { PulseScoringService } from '../pulse-scoring-service';
import { prisma } from '@/lib/db';
import { TikTokService } from '../tiktok-service';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    artistProfile: {
      findUnique: jest.fn(),
    },
    pulsePlatformData: {
      findFirst: jest.fn(),
    },
    pulseEligibilityScore: {
      count: jest.fn(),
    },
  },
}));

jest.mock('../tiktok-service', () => ({
  TikTokService: {
    getConnection: jest.fn(),
  },
}));

describe('PulseScoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateEligibilityScore', () => {
    const mockArtistProfile = {
      id: 'artist-1',
      userId: 'user-1',
      user: {
        id: 'user-1',
      },
    };

    const mockTikTokConnection = {
      userInfo: {
        followerCount: 10000,
        videoCount: 50,
        displayName: 'Test Artist',
      },
      tokens: {
        accessToken: 'token',
        scope: ['video.list'],
        openId: 'openid',
      },
    };

    const mockVideos = [
      {
        createTime: Date.now() / 1000 - 86400, // 1 day ago
        viewCount: 5000,
        likeCount: 500,
        commentCount: 50,
        shareCount: 25,
      },
      {
        createTime: Date.now() / 1000 - 172800, // 2 days ago
        viewCount: 4000,
        likeCount: 400,
        commentCount: 40,
        shareCount: 20,
      },
    ];

    const mockPlatformData = {
      data: {
        videos: mockVideos,
      },
    };

    beforeEach(() => {
      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue(
        mockPlatformData
      );
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);
    });

    it('should calculate eligibility score with all components', async () => {
      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('components');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.components).toHaveProperty('followerScore');
      expect(result.components).toHaveProperty('engagementScore');
      expect(result.components).toHaveProperty('consistencyScore');
      expect(result.components).toHaveProperty('platformDiversityScore');
    });

    it('should return zero score when no platforms connected', async () => {
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(null);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      expect(result.score).toBe(0);
      expect(result.components.followerScore).toBe(0);
      expect(result.components.engagementScore).toBe(0);
      expect(result.components.consistencyScore).toBe(0);
      expect(result.components.platformDiversityScore).toBe(0);
    });

    it('should throw error when artist profile not found', async () => {
      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        PulseScoringService.calculateEligibilityScore('artist-1')
      ).rejects.toThrow('Artist profile or user not found');
    });
  });

  describe('Follower Score Calculation', () => {
    // Test follower score calculation logic
    // Note: This tests the private method indirectly through calculateEligibilityScore

    it('should calculate follower score for 100 followers', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 100, videoCount: 10 },
        tokens: { accessToken: 'token', scope: [], openId: 'openid' },
      };

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: [] },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // 100 followers should give approximately 40 points
      // log10(101) / log10(100000) * 100 ≈ 40.086
      expect(result.components.followerScore).toBeGreaterThan(35);
      expect(result.components.followerScore).toBeLessThan(45);
    });

    it('should calculate follower score for 100,000 followers (max)', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 100000, videoCount: 100 },
        tokens: { accessToken: 'token', scope: [], openId: 'openid' },
      };

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: [] },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // 100,000 followers should give 100 points (capped)
      expect(result.components.followerScore).toBeCloseTo(100, 0);
    });

    it('should handle zero followers', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 0, videoCount: 0 },
        tokens: { accessToken: 'token', scope: [], openId: 'openid' },
      };

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: [] },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      expect(result.components.followerScore).toBe(0);
    });
  });

  describe('Engagement Quality Score Calculation', () => {
    it('should calculate engagement score with high engagement rate', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 10000, videoCount: 20 },
        tokens: {
          accessToken: 'token',
          scope: ['video.list'],
          openId: 'openid',
        },
      };

      // High engagement: 10% engagement rate
      const highEngagementVideos = Array.from({ length: 20 }, (_, i) => ({
        createTime: Date.now() / 1000 - i * 86400,
        viewCount: 10000,
        likeCount: 800,
        commentCount: 100,
        shareCount: 100,
      }));

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: highEngagementVideos },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // High engagement should give high score (80-100)
      expect(result.components.engagementScore).toBeGreaterThan(70);
      expect(result.components.engagementScore).toBeLessThanOrEqual(100);
    });

    it('should calculate engagement score with low engagement rate', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 10000, videoCount: 20 },
        tokens: {
          accessToken: 'token',
          scope: ['video.list'],
          openId: 'openid',
        },
      };

      // Low engagement: 0.5% engagement rate
      const lowEngagementVideos = Array.from({ length: 20 }, (_, i) => ({
        createTime: Date.now() / 1000 - i * 86400,
        viewCount: 10000,
        likeCount: 30,
        commentCount: 10,
        shareCount: 10,
      }));

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: lowEngagementVideos },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // Low engagement should give lower score (10-30)
      expect(result.components.engagementScore).toBeGreaterThanOrEqual(10);
      expect(result.components.engagementScore).toBeLessThan(40);
    });

    it('should handle videos with no views', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 1000, videoCount: 5 },
        tokens: {
          accessToken: 'token',
          scope: ['video.list'],
          openId: 'openid',
        },
      };

      const videosWithNoViews = [
        {
          createTime: Date.now() / 1000,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
        },
      ];

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: videosWithNoViews },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // Should handle gracefully without errors
      expect(result.components.engagementScore).toBeGreaterThanOrEqual(0);
      expect(result.components.engagementScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Consistency Score Calculation', () => {
    it('should calculate high consistency score for frequent posting', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 10000, videoCount: 60 },
        tokens: {
          accessToken: 'token',
          scope: ['video.list'],
          openId: 'openid',
        },
      };

      // 60 videos over 30 days = 2 posts/day (high consistency)
      const frequentVideos = Array.from({ length: 60 }, (_, i) => ({
        createTime: Date.now() / 1000 - i * 43200, // Every 12 hours
        viewCount: 1000,
        likeCount: 100,
        commentCount: 10,
        shareCount: 5,
      }));

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: frequentVideos },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // High posting frequency should give high consistency score (90-100)
      expect(result.components.consistencyScore).toBeGreaterThan(80);
      expect(result.components.consistencyScore).toBeLessThanOrEqual(100);
    });

    it('should calculate low consistency score for infrequent posting', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 10000, videoCount: 3 },
        tokens: {
          accessToken: 'token',
          scope: ['video.list'],
          openId: 'openid',
        },
      };

      // 3 videos over 60 days = 0.05 posts/day (low consistency)
      const infrequentVideos = [
        {
          createTime: Date.now() / 1000 - 60 * 86400, // 60 days ago
          viewCount: 1000,
          likeCount: 100,
          commentCount: 10,
          shareCount: 5,
        },
        {
          createTime: Date.now() / 1000 - 30 * 86400, // 30 days ago
          viewCount: 1000,
          likeCount: 100,
          commentCount: 10,
          shareCount: 5,
        },
        {
          createTime: Date.now() / 1000, // Today
          viewCount: 1000,
          likeCount: 100,
          commentCount: 10,
          shareCount: 5,
        },
      ];

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: infrequentVideos },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // Low posting frequency should give lower consistency score (10-30)
      expect(result.components.consistencyScore).toBeGreaterThanOrEqual(10);
      expect(result.components.consistencyScore).toBeLessThan(40);
    });

    it('should return 10 for artist with no videos', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 1000, videoCount: 0 },
        tokens: { accessToken: 'token', scope: [], openId: 'openid' },
      };

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: [] },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // No videos should give 10 points
      expect(result.components.consistencyScore).toBe(10);
    });
  });

  describe('Platform Diversity Score Calculation', () => {
    it('should return 50 for single platform (TikTok only)', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
        socialLinks: {
          tiktok: { connected: true },
        },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 10000, videoCount: 20 },
        tokens: { accessToken: 'token', scope: [], openId: 'openid' },
      };

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: [] },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // Single platform should give 50 points
      expect(result.components.platformDiversityScore).toBe(50);
    });

    it('should return 75 for two platforms', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
        socialLinks: {
          tiktok: { connected: true },
          spotify: { connected: true },
        },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 10000, videoCount: 20 },
        tokens: { accessToken: 'token', scope: [], openId: 'openid' },
      };

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: [] },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // Two platforms should give 75 points
      expect(result.components.platformDiversityScore).toBe(75);
    });

    it('should return 100 for three or more platforms', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
        socialLinks: {
          tiktok: { connected: true },
          spotify: { connected: true },
          youtube: { connected: true },
        },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 10000, videoCount: 20 },
        tokens: { accessToken: 'token', scope: [], openId: 'openid' },
      };

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: [] },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // Three platforms should give 100 points
      expect(result.components.platformDiversityScore).toBe(100);
    });
  });

  describe('Overall Score Calculation', () => {
    it('should apply correct weights to components', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 10000, videoCount: 20 },
        tokens: {
          accessToken: 'token',
          scope: ['video.list'],
          openId: 'openid',
        },
      };

      const mockVideos = Array.from({ length: 20 }, (_, i) => ({
        createTime: Date.now() / 1000 - i * 86400,
        viewCount: 5000,
        likeCount: 500,
        commentCount: 50,
        shareCount: 25,
      }));

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: mockVideos },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // Verify weights are applied correctly
      // Score = followerScore * 0.3 + engagementScore * 0.4 + consistencyScore * 0.2 + platformDiversityScore * 0.1
      const expectedScore =
        result.components.followerScore * 0.3 +
        result.components.engagementScore * 0.4 +
        result.components.consistencyScore * 0.2 +
        result.components.platformDiversityScore * 0.1;

      expect(result.score).toBeCloseTo(expectedScore, 1);
    });

    it('should clamp score to 0-100 range', async () => {
      // Test with extreme values to ensure clamping works
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 1000000, videoCount: 1000 },
        tokens: {
          accessToken: 'token',
          scope: ['video.list'],
          openId: 'openid',
        },
      };

      const extremeVideos = Array.from({ length: 100 }, (_, i) => ({
        createTime: Date.now() / 1000 - i * 3600, // Every hour
        viewCount: 1000000,
        likeCount: 100000,
        commentCount: 10000,
        shareCount: 5000,
      }));

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: extremeVideos },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should round score to 2 decimal places', async () => {
      const mockArtistProfile = {
        id: 'artist-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      };

      const mockTikTokConnection = {
        userInfo: { followerCount: 10000, videoCount: 20 },
        tokens: {
          accessToken: 'token',
          scope: ['video.list'],
          openId: 'openid',
        },
      };

      const mockVideos = Array.from({ length: 20 }, (_, i) => ({
        createTime: Date.now() / 1000 - i * 86400,
        viewCount: 5000,
        likeCount: 500,
        commentCount: 50,
        shareCount: 25,
      }));

      (prisma.artistProfile.findUnique as jest.Mock).mockResolvedValue(
        mockArtistProfile
      );
      (TikTokService.getConnection as jest.Mock).mockResolvedValue(
        mockTikTokConnection
      );
      (prisma.pulsePlatformData.findFirst as jest.Mock).mockResolvedValue({
        data: { videos: mockVideos },
      });
      (prisma.pulseEligibilityScore.count as jest.Mock).mockResolvedValue(0);

      const result =
        await PulseScoringService.calculateEligibilityScore('artist-1');

      // Score should be rounded to 2 decimal places
      const decimalPlaces = (result.score.toString().split('.')[1] || '')
        .length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('saveEligibilityScore', () => {
    it('should save eligibility score with all components', async () => {
      const mockCreate = jest.fn().mockResolvedValue({});
      (prisma.pulseEligibilityScore.create as jest.Mock) = mockCreate;

      const components = {
        followerScore: 70,
        engagementScore: 80,
        consistencyScore: 75,
        platformDiversityScore: 50,
      };

      await PulseScoringService.saveEligibilityScore(
        'artist-1',
        75.5,
        components,
        42
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          artistProfileId: 'artist-1',
          score: 75.5,
          followerScore: 70,
          engagementScore: 80,
          consistencyScore: 75,
          platformDiversityScore: 50,
          rank: 42,
        },
      });
    });
  });
});
