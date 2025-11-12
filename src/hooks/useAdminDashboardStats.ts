import { useState, useEffect } from 'react';

interface AdminActivityTrack {
  id: string;
  title: string;
  artist: string;
}

interface AdminActivityItem {
  type: string;
  track: AdminActivityTrack;
  timestamp: string;
  source?: string;
  slug?: string;
}

interface AdminDashboardStats {
  systemMetrics: {
    totalUsers: number;
    totalArtists: number;
    totalTracks: number;
    totalPlays: number;
    totalDownloads?: number;
    totalPageViews?: number;
    totalRevenue: number;
    platformHealth: 'healthy' | 'warning' | 'critical';
  };
  recentActivity: {
    plays: AdminActivityItem[];
    likes: AdminActivityItem[];
    downloads: AdminActivityItem[];
    pageVisits: AdminActivityItem[];
  };
  recentActivityFeed: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    icon: string;
    color: string;
  }>;
  pendingActions: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    count: number;
  }>;
  totalPlaylists: number;
  totalSubmissions: number;
}

export function useAdminDashboardStats() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/dashboard-stats');

      if (!response.ok) {
        throw new Error('Failed to fetch admin dashboard stats');
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}
