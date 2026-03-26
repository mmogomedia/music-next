/**
 * Platform Audit Agent
 *
 * Reads PulsePlatformData (PULSE³ connections) for TikTok, Spotify, and YouTube.
 * If data is missing or stale (>7 days), the check is marked 'unverified' — score degrades
 * proportionally rather than failing hard.
 *
 * Checks:
 *  - platform_tiktok_connected    TikTok data present in PULSE³
 *  - platform_spotify_connected   Spotify data present
 *  - platform_youtube_connected   YouTube data present
 *  - platform_tiktok_followers    TikTok followers ≥ 100
 *  - platform_spotify_followers   Spotify followers ≥ 50
 *  - platform_youtube_subscribers YouTube subscribers ≥ 50
 *  - platform_posting_cadence     TikTok/YouTube content posted in last 30 days
 */

import type {
  ArtistProfile,
  PulsePlatformData,
  ArtistType,
} from '@prisma/client';
import type {
  AuditCheck,
  AuditGap,
  DimensionResult,
} from '@/types/career-intelligence';

interface PlatformAuditInput {
  profile: ArtistProfile;
  platformData: PulsePlatformData[];
}

// Platforms that are required per artist type
const REQUIRED_PLATFORMS: Record<ArtistType, string[]> = {
  INDEPENDENT: ['tiktok', 'spotify'],
  HYBRID: ['tiktok', 'spotify', 'youtube'],
  PERFORMER: ['spotify', 'youtube'],
  SESSION_PRODUCER: ['spotify'],
  SIGNED_ARTIST: ['spotify'],
  SONGWRITER: ['spotify'],
};

// Stale threshold: data older than 7 days counts as unverified
const STALE_DAYS = 7;

export function runPlatformAudit({
  profile,
  platformData,
}: PlatformAuditInput): DimensionResult {
  const artistType = profile.artistType as ArtistType;
  const requiredPlatforms = REQUIRED_PLATFORMS[artistType] ?? ['spotify'];
  const now = new Date();

  const tiktok = findFreshData(platformData, 'tiktok', now);
  const spotify = findFreshData(platformData, 'spotify', now);
  const youtube = findFreshData(platformData, 'youtube', now);

  const isTiktokRequired = requiredPlatforms.includes('tiktok');
  const isSpotifyRequired = requiredPlatforms.includes('spotify');
  const isYoutubeRequired = requiredPlatforms.includes('youtube');

  const checks: AuditCheck[] = [
    // ── Connection checks ────────────────────────────────────────────────────
    check(
      'platform_tiktok_connected',
      'TikTok connected to PULSE³',
      Boolean(tiktok),
      isTiktokRequired ? 15 : 6,
      tiktok
        ? 'TikTok is connected.'
        : isTiktokRequired
          ? 'Connect TikTok in PULSE³ to track your content performance and reach.'
          : 'TikTok is optional for your artist type — connect it when ready.'
    ),
    check(
      'platform_spotify_connected',
      'Spotify connected to PULSE³',
      Boolean(spotify),
      isSpotifyRequired ? 15 : 6,
      spotify
        ? 'Spotify is connected.'
        : 'Connect Spotify in PULSE³ to monitor your streaming performance.'
    ),
    check(
      'platform_youtube_connected',
      'YouTube connected to PULSE³',
      Boolean(youtube),
      isYoutubeRequired ? 12 : 5,
      youtube
        ? 'YouTube is connected.'
        : isYoutubeRequired
          ? 'Connect YouTube in PULSE³ — video content drives discovery for your artist type.'
          : 'YouTube is optional for your artist type — connect it when ready.'
    ),

    // ── Audience size checks ──────────────────────────────────────────────────
    check(
      'platform_tiktok_followers',
      'TikTok followers ≥ 100',
      getMetric(tiktok, 'follower_count', 'followers') >= 100,
      isTiktokRequired ? 12 : 4,
      tiktok
        ? formatFollowerDetail(
            'TikTok',
            getMetric(tiktok, 'follower_count', 'followers'),
            100
          )
        : 'Connect TikTok first to check follower count.'
    ),
    check(
      'platform_spotify_followers',
      'Spotify followers ≥ 50',
      getMetric(spotify, 'followers') >= 50,
      isSpotifyRequired ? 12 : 4,
      spotify
        ? formatFollowerDetail('Spotify', getMetric(spotify, 'followers'), 50)
        : 'Connect Spotify first to check follower count.'
    ),
    check(
      'platform_youtube_subscribers',
      'YouTube subscribers ≥ 50',
      getMetric(youtube, 'subscriber_count', 'subscribers') >= 50,
      isYoutubeRequired ? 10 : 4,
      youtube
        ? formatFollowerDetail(
            'YouTube',
            getMetric(youtube, 'subscriber_count', 'subscribers'),
            50
          )
        : 'Connect YouTube first to check subscriber count.'
    ),

    // ── Activity check ────────────────────────────────────────────────────────
    check(
      'platform_posting_cadence',
      'Content posted in the last 30 days',
      hasRecentActivity(tiktok, youtube),
      isTiktokRequired || isYoutubeRequired ? 14 : 5,
      hasRecentActivity(tiktok, youtube)
        ? 'Recent activity detected on connected platforms.'
        : 'No content detected in the last 30 days — consistent posting is key to algorithm visibility.'
    ),
  ];

  return buildDimensionResult('platform', checks);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function findFreshData(
  data: PulsePlatformData[],
  platform: string,
  now: Date
): PulsePlatformData | undefined {
  return data.find(d => {
    if (d.platform !== platform) return false;
    const ageMs = now.getTime() - new Date(d.fetchedAt).getTime();
    return ageMs < STALE_DAYS * 24 * 60 * 60 * 1000;
  });
}

function getMetric(
  platformData: PulsePlatformData | undefined,
  ...keys: string[]
): number {
  if (!platformData) return 0;
  const data = platformData.data as Record<string, unknown>;
  for (const key of keys) {
    const val = data[key];
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
  }
  return 0;
}

function hasRecentActivity(
  tiktok: PulsePlatformData | undefined,
  youtube: PulsePlatformData | undefined
): boolean {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (const platform of [tiktok, youtube]) {
    if (!platform) continue;
    const data = platform.data as Record<string, unknown>;
    const lastPost =
      data.last_post_date ?? data.last_video_date ?? data.updated_at;
    if (
      typeof lastPost === 'string' &&
      new Date(lastPost).getTime() >= thirtyDaysAgo
    ) {
      return true;
    }
  }
  return false;
}

function formatFollowerDetail(
  platform: string,
  count: number,
  threshold: number
): string {
  if (count >= threshold) {
    return `${platform} has ${count.toLocaleString()} followers — above the ${threshold} threshold.`;
  }
  return `${platform} has ${count.toLocaleString()} followers — grow to ${threshold}+ to pass this check.`;
}

function check(
  checkId: string,
  label: string,
  passed: boolean,
  impact: number,
  details: string
): AuditCheck {
  return { checkId, label, passed, impact, details };
}

function buildDimensionResult(
  dimension: 'profile' | 'platform' | 'release' | 'business',
  checks: AuditCheck[]
): DimensionResult {
  const totalImpact = checks.reduce((sum, c) => sum + c.impact, 0);
  const earnedImpact = checks
    .filter(c => c.passed)
    .reduce((sum, c) => sum + c.impact, 0);
  const score =
    totalImpact > 0 ? Math.round((earnedImpact / totalImpact) * 100) : 0;

  const gaps: AuditGap[] = checks
    .filter(c => !c.passed)
    .map(c => ({
      checkId: c.checkId,
      label: c.label,
      impact: c.impact,
      dimension,
      details: c.details,
    }));

  return { dimension, score, checks, gaps };
}
