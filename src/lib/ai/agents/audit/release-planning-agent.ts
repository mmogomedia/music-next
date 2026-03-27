/**
 * Release Planning Audit Agent
 *
 * Evaluates an artist's release infrastructure using Azure OpenAI.
 * The LLM receives actual track counts, metadata completeness, cadence data,
 * and smart link status and makes contextual judgements for the artist's type.
 *
 * Falls back to deterministic rule evaluation if the LLM call fails.
 *
 * Checks:
 *  - release_has_tracks      At least 1 track is uploaded
 *  - release_smart_link      At least 1 smart link exists
 *  - release_cover_art       Most recent track has cover art
 *  - release_metadata        Tracks have titles and genre tags
 *  - release_cadence         A track was released in the last 90 days
 *  - release_multiple_tracks Library has 3+ tracks (momentum signal)
 */

import type { Track, SmartLink } from '@prisma/client';
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

const RECENT_RELEASE_DAYS = 90;

const SYSTEM_PROMPT = `You are an A&R consultant evaluating an artist's release infrastructure and catalog momentum.

Consider context: a 95-day gap for a SESSION_PRODUCER who releases beats differently than
an INDEPENDENT artist actively building a fanbase. A smart link is table stakes for any
artist trying to convert social traffic to streams. Metadata completeness affects algorithmic
discovery — genre tagging on every track is how playlisting algorithms find you.

For passed checks: 1 sentence confirming the strength.
For failed checks: 1–2 sentences on what it costs them — lost streams, blocked distribution,
reduced algorithmic visibility. Direct industry language. No filler phrases.`;

// ── Main export ───────────────────────────────────────────────────────────────

interface ReleasePlanningAuditInput {
  tracks: Track[];
  smartLinks: SmartLink[];
}

export async function runReleasePlanningAudit({
  tracks,
  smartLinks,
}: ReleasePlanningAuditInput): Promise<DimensionResult> {
  const now = Date.now();
  const recentCutoff = now - RECENT_RELEASE_DAYS * 24 * 60 * 60 * 1000;

  const hasTracks = tracks.length > 0;
  const sortedTracks = [...tracks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const mostRecentTrack = sortedTracks[0];
  const hasRecentRelease = tracks.some(
    t => new Date(t.createdAt).getTime() >= recentCutoff
  );
  const tracksWithMetadata = tracks.filter(
    t => t.title?.trim() && (t.genreId || t.genre)
  );
  const metadataCoverage = hasTracks
    ? Math.round((tracksWithMetadata.length / tracks.length) * 100)
    : 0;
  const hasCoverArt = Boolean(
    mostRecentTrack &&
      (mostRecentTrack.coverImageUrl || mostRecentTrack.albumArtwork)
  );
  const daysSinceLastRelease = mostRecentTrack
    ? Math.floor(
        (now - new Date(mostRecentTrack.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const checkInputs: LLMCheckInput[] = [
    {
      checkId: 'release_has_tracks',
      label: 'At least one track is uploaded',
      impact: 18,
      rulePassedHint: hasTracks,
      ruleDetail: hasTracks
        ? `${tracks.length} track${tracks.length !== 1 ? 's' : ''} uploaded.`
        : 'No tracks uploaded.',
    },
    {
      checkId: 'release_smart_link',
      label: 'At least one smart link created',
      impact: 20,
      rulePassedHint: smartLinks.length > 0,
      ruleDetail:
        smartLinks.length > 0
          ? `${smartLinks.length} smart link${smartLinks.length !== 1 ? 's' : ''} active.`
          : 'No smart links created.',
    },
    {
      checkId: 'release_cover_art',
      label: 'Latest track has cover art',
      impact: 15,
      rulePassedHint: hasTracks && hasCoverArt,
      ruleDetail: !hasTracks
        ? 'No tracks uploaded yet.'
        : hasCoverArt
          ? `Most recent track "${mostRecentTrack?.title ?? 'untitled'}" has cover art.`
          : `Most recent track "${mostRecentTrack?.title ?? 'untitled'}" is missing cover art.`,
    },
    {
      checkId: 'release_metadata',
      label: 'Tracks have titles and genre tags (≥ 80%)',
      impact: 14,
      rulePassedHint: metadataCoverage >= 80,
      ruleDetail: hasTracks
        ? `${metadataCoverage}% of tracks have complete metadata (title + genre). ${tracksWithMetadata.length} of ${tracks.length} tracks.`
        : 'No tracks to check metadata on.',
    },
    {
      checkId: 'release_cadence',
      label: `A track was released in the last ${RECENT_RELEASE_DAYS} days`,
      impact: 18,
      rulePassedHint: hasRecentRelease,
      ruleDetail: hasRecentRelease
        ? `Most recent release: ${daysSinceLastRelease} days ago.`
        : `No release in the last ${RECENT_RELEASE_DAYS} days${daysSinceLastRelease ? ` (last was ${daysSinceLastRelease} days ago)` : ''}.`,
    },
    {
      checkId: 'release_multiple_tracks',
      label: 'Library has 3 or more tracks',
      impact: 15,
      rulePassedHint: tracks.length >= 3,
      ruleDetail: `Library has ${tracks.length} track${tracks.length !== 1 ? 's' : ''}.`,
    },
  ];

  const artistContext = `Catalog summary:
- Total tracks: ${tracks.length}
- Most recent track: "${mostRecentTrack?.title ?? 'none'}" uploaded ${daysSinceLastRelease ?? 'N/A'} days ago${hasCoverArt ? ', cover art present' : ', no cover art'}
- Metadata completeness: ${metadataCoverage}% of tracks have title + genre
- Smart links: ${smartLinks.length}
- Days since last release: ${daysSinceLastRelease ?? 'no tracks'}`;

  const checks = await evaluateChecksWithLLM(
    SYSTEM_PROMPT,
    artistContext,
    checkInputs,
    () => runReleasePlanningAuditFallback(tracks, smartLinks)
  );

  return buildDimensionResult('release', checks);
}

// ── Rule-based fallback ───────────────────────────────────────────────────────

function runReleasePlanningAuditFallback(
  tracks: Track[],
  smartLinks: SmartLink[]
): AuditCheck[] {
  const now = Date.now();
  const recentCutoff = now - RECENT_RELEASE_DAYS * 24 * 60 * 60 * 1000;

  const hasTracks = tracks.length > 0;
  const mostRecentTrack = [...tracks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  const hasRecentRelease = tracks.some(
    t => new Date(t.createdAt).getTime() >= recentCutoff
  );
  const tracksWithMetadata = tracks.filter(
    t => t.title?.trim() && (t.genreId || t.genre)
  );
  const metadataCoverage = hasTracks
    ? Math.round((tracksWithMetadata.length / tracks.length) * 100)
    : 0;
  const hasCoverArt = Boolean(
    mostRecentTrack &&
      (mostRecentTrack.coverImageUrl || mostRecentTrack.albumArtwork)
  );

  return [
    check(
      'release_has_tracks',
      'At least one track is uploaded',
      hasTracks,
      18,
      hasTracks
        ? `${tracks.length} track${tracks.length !== 1 ? 's' : ''} uploaded.`
        : 'Upload your first track — no music means no discoverability on streaming platforms.'
    ),
    check(
      'release_smart_link',
      'At least one smart link created',
      smartLinks.length > 0,
      20,
      smartLinks.length > 0
        ? `${smartLinks.length} smart link${smartLinks.length !== 1 ? 's' : ''} active.`
        : 'Create a smart link for your latest release so fans can stream it anywhere in one click.'
    ),
    check(
      'release_cover_art',
      'Latest track has cover art',
      hasTracks && hasCoverArt,
      15,
      !hasTracks
        ? 'Upload a track first.'
        : hasCoverArt
          ? 'Cover art is present on your most recent track.'
          : 'Add cover art to your latest track — releases without artwork look unprofessional on streaming platforms.'
    ),
    check(
      'release_metadata',
      'Tracks have titles and genre tags (≥ 80%)',
      metadataCoverage >= 80,
      14,
      hasTracks
        ? `${metadataCoverage}% of tracks have complete metadata (title + genre).`
        : 'Upload a track first to check metadata completeness.'
    ),
    check(
      'release_cadence',
      `A track was released in the last ${RECENT_RELEASE_DAYS} days`,
      hasRecentRelease,
      18,
      hasRecentRelease
        ? 'You have a recent release — good momentum.'
        : `No new releases in ${RECENT_RELEASE_DAYS} days. Regular releases keep your profile active and visible to algorithms.`
    ),
    check(
      'release_multiple_tracks',
      'Library has 3 or more tracks',
      tracks.length >= 3,
      15,
      tracks.length >= 3
        ? `Library has ${tracks.length} tracks.`
        : `Library has ${tracks.length} track${tracks.length !== 1 ? 's' : ''}. Aim for 3+ so fans have a body of work to explore.`
    ),
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
