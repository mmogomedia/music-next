'use client';

import { useState, useEffect, useCallback } from 'react';

export interface EligibilityScoreComponents {
  followerScore: number;
  engagementScore: number;
  consistencyScore: number;
  platformDiversityScore: number;
}

export interface PulseData {
  eligibilityScore: number | null;
  eligibilityComponents: EligibilityScoreComponents | null;
  momentumScore: number | null;
  position: number | null; // 1-100 if actively tracked
  isActivelyMonitored: boolean;
  hasConnection: boolean; // Has TikTok/Spotify connected
}

export function usePulseData() {
  const [pulseData, setPulseData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pulse/scores');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to fetch PULSE³ data: ${response.statusText}`
        );
      }

      const data = await response.json();

      // API returns data directly with hasConnection, eligibilityScore, etc.
      // Ensure hasConnection is explicitly set
      setPulseData({
        eligibilityScore: data.eligibilityScore ?? null,
        eligibilityComponents: data.eligibilityComponents ?? null,
        momentumScore: data.momentumScore ?? null,
        position: data.position ?? null,
        isActivelyMonitored: data.isActivelyMonitored ?? false,
        hasConnection: data.hasConnection === true, // Explicit boolean check
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set default state if API fails (no connection)
      setPulseData({
        eligibilityScore: null,
        eligibilityComponents: null,
        momentumScore: null,
        position: null,
        isActivelyMonitored: false,
        hasConnection: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pulseData, loading, error, refresh };
}
