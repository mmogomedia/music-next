/**
 * Platform Audit Agent
 *
 * Evaluates an artist's platform presence using Azure OpenAI.
 * The LLM receives actual follower counts, connection status, and cadence
 * data and makes contextual judgements based on artist type and career stage.
 *
 * Falls back to deterministic rule evaluation if the LLM call fails.
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
import {
  evaluateChecksWithLLM,
  type LLMCheckInput,
} from './llm-audit-evaluator';

// ── Constants ─────────────────────────────────────────────────────────────────

const REQUIRED_PLATFORMS: Record<ArtistType, string[]> = {
  INDEPENDENT: ['tiktok', 'spotify'],
  HYBRID: ['tiktok', 'spotify', 'youtube'],
  PERFORMER: ['spotify', 'youtube'],
  SESSION_PRODUCER: ['spotify'],
  SIGNED_ARTIST: ['spotify'],
  SONGWRITER: ['spotify'],
};

const STALE_DAYS = 7;

const SYSTEM_PROMPT = `You are an A&R consultant evaluating an artist's platform presence for a career audit.
Assess each check using the actual data provided.

Consider artist type context: a PERFORMER with 45 Spotify followers playing weekly differs from
an INDEPENDENT artist with 45 followers and no live presence. A SESSION_PRODUCER doesn't
need TikTok; a HYBRID artist does. Is the follower count meaningful for this career stage?
Is the posting cadence realistic for their artist type?

For passed checks: 1 sentence confirming the strength.
For failed checks: 1–2 sentences on the real-world cost — what it means for their DSP
discovery, editorial consideration, or audience building. Direct industry language. No filler.`;

// ── Main export ───────────────────────────────────────────────────────────────

interface PlatformAuditInput {
  profile: ArtistProfile;
  platformData: PulsePlatformData[];
}

export async function runPlatformAudit({
  profile,
  platformData,
}: PlatformAuditInput): Promise<DimensionResult> {
  const artistType = profile.artistType as ArtistType;
  const requiredPlatforms = REQUIRED_PLATFORMS[artistType] ?? ['spotify'];
  const now = new Date();

  const tiktok = findFreshData(platformData, 'tiktok', now);
  const spotify = findFreshData(platformData, 'spotify', now);
  const youtube = findFreshData(platformData, 'youtube', now);

  const isTiktokRequired = requiredPlatforms.includes('tiktok');
  const isSpotifyRequired = requiredPlatforms.includes('spotify');
  const isYoutubeRequired = requiredPlatforms.includes('youtube');

  const tiktokFollowers = getMetric(tiktok, 'follower_count', 'followers');
  const spotifyFollowers = getMetric(spotify, 'followers');
  const youtubeSubscribers = getMetric(
    youtube,
    'subscriber_count',
    'subscribers'
  );
  const recentActivity = hasRecentActivity(tiktok, youtube);
  const lastPostDate = getLastPostDate(tiktok, youtube);

  const checkInputs: LLMCheckInput[] = [
    {
      checkId: 'platform_tiktok_connected',
      label: 'TikTok connected to PULSE³',
      impact: isTiktokRequired ? 15 : 6,
      rulePassedHint: Boolean(tiktok),
      ruleDetail: tiktok
        ? `TikTok connected, data fetched ${daysSince(tiktok.fetchedAt)} days ago.`
        : isTiktokRequired
          ? 'TikTok not connected (required for this artist type).'
          : 'TikTok not connected (optional for this artist type).',
    },
    {
      checkId: 'platform_spotify_connected',
      label: 'Spotify connected to PULSE³',
      impact: isSpotifyRequired ? 15 : 6,
      rulePassedHint: Boolean(spotify),
      ruleDetail: spotify
        ? `Spotify connected, data fetched ${daysSince(spotify.fetchedAt)} days ago.`
        : 'Spotify not connected.',
    },
    {
      checkId: 'platform_youtube_connected',
      label: 'YouTube connected to PULSE³',
      impact: isYoutubeRequired ? 12 : 5,
      rulePassedHint: Boolean(youtube),
      ruleDetail: youtube
        ? `YouTube connected, data fetched ${daysSince(youtube.fetchedAt)} days ago.`
        : isYoutubeRequired
          ? 'YouTube not connected (required for this artist type).'
          : 'YouTube not connected (optional for this artist type).',
    },
    {
      checkId: 'platform_tiktok_followers',
      label: 'TikTok followers ≥ 100',
      impact: isTiktokRequired ? 12 : 4,
      rulePassedHint: tiktokFollowers >= 100,
      ruleDetail: tiktok
        ? `TikTok followers: ${tiktokFollowers.toLocaleString()} (threshold: 100)`
        : 'TikTok not connected — follower count unavailable.',
    },
    {
      checkId: 'platform_spotify_followers',
      label: 'Spotify followers ≥ 50',
      impact: isSpotifyRequired ? 12 : 4,
      rulePassedHint: spotifyFollowers >= 50,
      ruleDetail: spotify
        ? `Spotify followers: ${spotifyFollowers.toLocaleString()} (threshold: 50)`
        : 'Spotify not connected — follower count unavailable.',
    },
    {
      checkId: 'platform_youtube_subscribers',
      label: 'YouTube subscribers ≥ 50',
      impact: isYoutubeRequired ? 10 : 4,
      rulePassedHint: youtubeSubscribers >= 50,
      ruleDetail: youtube
        ? `YouTube subscribers: ${youtubeSubscribers.toLocaleString()} (threshold: 50)`
        : 'YouTube not connected — subscriber count unavailable.',
    },
    {
      checkId: 'platform_posting_cadence',
      label: 'Content posted in the last 30 days',
      impact: isTiktokRequired || isYoutubeRequired ? 14 : 5,
      rulePassedHint: recentActivity,
      ruleDetail: recentActivity
        ? `Recent content detected${lastPostDate ? ` (last post: ${lastPostDate})` : ''}.`
        : 'No content detected in the last 30 days.',
    },
  ];

  const artistContext = `Artist type: ${artistType}
Required platforms for ${artistType}: ${requiredPlatforms.join(', ')}
Career stage: ${profile.careerStage ?? 'unknown'}

Platform data:
- TikTok: ${tiktok ? `${tiktokFollowers.toLocaleString()} followers, last post: ${lastPostDate ?? 'unknown'}` : 'not connected'}
- Spotify: ${spotify ? `${spotifyFollowers.toLocaleString()} followers` : 'not connected'}
- YouTube: ${youtube ? `${youtubeSubscribers.toLocaleString()} subscribers, last video: ${lastPostDate ?? 'unknown'}` : 'not connected'}`;

  const checks = await evaluateChecksWithLLM(
    SYSTEM_PROMPT,
    artistContext,
    checkInputs,
    () => runPlatformAuditFallback(profile, platformData)
  );

  return buildDimensionResult('platform', checks);
}

// ── Rule-based fallback ───────────────────────────────────────────────────────

function runPlatformAuditFallback(
  profile: ArtistProfile,
  platformData: PulsePlatformData[]
): AuditCheck[] {
  const artistType = profile.artistType as ArtistType;
  const requiredPlatforms = REQUIRED_PLATFORMS[artistType] ?? ['spotify'];
  const now = new Date();

  const tiktok = findFreshData(platformData, 'tiktok', now);
  const spotify = findFreshData(platformData, 'spotify', now);
  const youtube = findFreshData(platformData, 'youtube', now);

  const isTiktokRequired = requiredPlatforms.includes('tiktok');
  const isSpotifyRequired = requiredPlatforms.includes('spotify');
  const isYoutubeRequired = requiredPlatforms.includes('youtube');

  return [
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

function getLastPostDate(
  tiktok: PulsePlatformData | undefined,
  youtube: PulsePlatformData | undefined
): string | null {
  for (const platform of [tiktok, youtube]) {
    if (!platform) continue;
    const data = platform.data as Record<string, unknown>;
    const lastPost =
      data.last_post_date ?? data.last_video_date ?? data.updated_at;
    if (typeof lastPost === 'string') return lastPost;
  }
  return null;
}

function daysSince(date: Date | string): number {
  return Math.floor(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
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
