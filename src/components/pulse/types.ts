export interface LeagueEntry {
  followerScore?: number | null;
  engagementScore?: number | null;
  consistencyScore?: number | null;
  platformDiversityScore?: number | null;
  scoreDelta?: number | null;
  followerScoreDelta?: number | null;
  engagementScoreDelta?: number | null;
  consistencyScoreDelta?: number | null;
  platformDiversityScoreDelta?: number | null;
  run_score?: number | null;
  run_followerScore?: number | null;
  run_engagementScore?: number | null;
  run_consistencyScore?: number | null;
  run_platformDiversityScore?: number | null;
  run_calculatedAt?: string | null;
  previous_run_score?: number | null;
  previous_run_followerScore?: number | null;
  previous_run_engagementScore?: number | null;
  previous_run_consistencyScore?: number | null;
  previous_run_platformDiversityScore?: number | null;
  previous_run_calculatedAt?: string | null;
  previous_run_rank?: number | null;
  previous_run_entry_score?: number | null;
  artist_id: string;
  artist_name: string;
  artist_slug: string | null;
  artist_image: string | null;
  rank: number;
  score: number;
  band_state: 'SECURE' | 'BELOW_RANGE' | 'ABOVE_RANGE';
  is_at_risk: boolean;
  previous_rank: number | null;
  rank_delta: number | null;
  status_change:
    | 'NEW'
    | 'UP'
    | 'DOWN'
    | 'UNCHANGED'
    | 'PROMOTED'
    | 'DEMOTED'
    | 'EXITED';
  highlight: boolean;
}

export interface LeagueTier {
  code: string;
  name: string;
  run_at: string | null;
  previous_run_at?: string | null;
  entries: LeagueEntry[];
}

export interface LeagueData {
  tiers: LeagueTier[];
}

export type SubscoreType =
  | 'audience'
  | 'engagement'
  | 'consistency'
  | 'presence';
