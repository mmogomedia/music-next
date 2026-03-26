/**
 * Release Planning Audit Agent
 *
 * Checks release infrastructure — smart links, metadata completeness,
 * cover art, and release cadence.
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

interface ReleasePlanningAuditInput {
  tracks: Track[];
  smartLinks: SmartLink[];
}

// A track counts as "recently released" if it was created within 90 days
const RECENT_RELEASE_DAYS = 90;

export function runReleasePlanningAudit({
  tracks,
  smartLinks,
}: ReleasePlanningAuditInput): DimensionResult {
  const now = Date.now();
  const recentCutoff = now - RECENT_RELEASE_DAYS * 24 * 60 * 60 * 1000;

  const hasTracks = tracks.length > 0;
  const mostRecentTrack = tracks.sort(
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

  const checks: AuditCheck[] = [
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

  return buildDimensionResult('release', checks);
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
