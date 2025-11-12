import { useState, useEffect } from 'react';

interface DashboardStats {
  overview: {
    totalTracks: number;
    totalPlays: number;
    totalLikes: number;
    totalShares: number;
    totalDownloads: number;
    totalSaves: number;
    uniqueListeners: number;
    avgDuration: number;
    avgCompletionRate: number;
  };
  artistProfile: {
    id: string;
    artistName: string;
    isVerified: boolean;
  } | null;
  recentActivity: {
    plays: Array<{
      type: string;
      track: {
        id: string;
        title: string;
        artist: string;
      };
      timestamp: string;
      source: string;
    }>;
    likes: Array<{
      type: string;
      track: {
        id: string;
        title: string;
        artist: string;
      };
      timestamp: string;
    }>;
    downloads: Array<{
      type: string;
      track: {
        id: string;
        title: string;
        artist: string;
      };
      timestamp: string;
    }>;
    pageVisits: Array<{
      type: string;
      track: {
        id: string;
        title: string;
        artist: string;
      };
      timestamp: string;
      slug: string;
    }>;
  };
  topTracks: Array<{
    trackId: string;
    _count: { id: number };
    track: {
      id: string;
      title: string;
      artist: string;
      playCount: number;
      coverImageUrl: string;
    } | null;
  }>;
  engagementMetrics: {
    likeRate: number;
    shareRate: number;
    saveRate: number;
    downloadRate: number;
    completionRate: number;
  };
  playlistStats: {
    playlists: Array<{
      id: string;
      name: string;
      currentTracks: number;
      status: string;
      analytics: Array<{
        views: number;
        plays: number;
        likes: number;
        shares: number;
        uniqueListeners: number;
      }>;
    }>;
    submissions: Array<{
      id: string;
      status: string;
      submittedAt: string;
      playlist: {
        id: string;
        name: string;
      };
      track: {
        id: string;
        title: string;
      };
    }>;
  };
  growthMetrics: {
    playsGrowth: number;
    likesGrowth: number;
    sharesGrowth: number;
  };
  timeRange: string;
}

export function useDashboardStats(timeRange: string = '7d') {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/dashboard/stats?timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  return { stats, loading, error, refetch: fetchStats };
}
