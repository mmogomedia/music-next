/**
 * Business Readiness Audit Agent
 *
 * Checks the business infrastructure behind the artist's career.
 * All logic is deterministic — no LLM calls.
 *
 * Checks:
 *  - business_email_verified   User's email address is verified
 *  - business_split_sheet      Has at least one split sheet created
 *  - business_split_coverage   ≥ 50% of tracks have a linked split sheet
 *  - business_splits_balanced  Split sheet percentages sum to 100 (no gaps or over-allocation)
 *  - business_streaming_links  At least one track has streaming platform links (distribution evidence)
 *  - business_isrc             At least one track has an ISRC code (professional registration signal)
 */

import type { ArtistType, Track, SplitSheet, User } from '@prisma/client';
import type {
  AuditCheck,
  AuditGap,
  DimensionResult,
} from '@/types/career-intelligence';

interface SplitEntry {
  percentage: number;
}

interface BusinessReadinessAuditInput {
  artistType: ArtistType;
  user: Pick<User, 'emailVerified'> | null;
  tracks: Track[];
  splitSheets: SplitSheet[];
}

export function runBusinessReadinessAudit({
  artistType,
  user,
  tracks,
  splitSheets,
}: BusinessReadinessAuditInput): DimensionResult {
  const hasTracks = tracks.length > 0;

  // Split sheet coverage: % of tracks linked to a split sheet
  const tracksWithSplits = tracks.filter(t =>
    splitSheets.some(s => s.trackId === t.id)
  );
  const splitCoverage = hasTracks
    ? Math.round((tracksWithSplits.length / tracks.length) * 100)
    : 0;

  // Check that master splits sum close to 100 (allow ±1 for rounding)
  const allSplitsBalanced = splitSheets.every(sheet => {
    const masterSplits = (sheet.masterSplits ?? []) as unknown as SplitEntry[];
    if (masterSplits.length === 0) return false;
    const total = masterSplits.reduce((sum, s) => sum + (s.percentage ?? 0), 0);
    return Math.abs(total - 100) <= 1;
  });

  // Distribution evidence: any track has streaming links
  const hasStreamingLinks = tracks.some(t => {
    if (!t.streamingLinks) return false;
    const links = t.streamingLinks as unknown[];
    return Array.isArray(links) && links.length > 0;
  });

  // ISRC coverage: at least one track has an ISRC
  const hasIsrc = tracks.some(t => Boolean(t.isrc?.trim()));

  // Signed artists get a pass on some business checks (label handles splits)
  const isLabelSigned = (artistType as string) === 'SIGNED_ARTIST';

  const checks: AuditCheck[] = [
    check(
      'business_email_verified',
      'Email address is verified',
      Boolean(user?.emailVerified),
      15,
      user?.emailVerified
        ? 'Email is verified.'
        : "Verify your email address — it's required for payouts, split invitations, and security."
    ),
    check(
      'business_split_sheet',
      'At least one split sheet created',
      splitSheets.length > 0,
      isLabelSigned ? 8 : 20,
      splitSheets.length > 0
        ? `${splitSheets.length} split sheet${splitSheets.length !== 1 ? 's' : ''} created.`
        : isLabelSigned
          ? 'Your label should manage splits — confirm they have filed your royalty agreements.'
          : 'Create a split sheet for every track you collaborate on. It protects everyone and is required for royalty payouts.'
    ),
    check(
      'business_split_coverage',
      '≥ 50% of tracks have a split sheet',
      !hasTracks || splitCoverage >= 50,
      isLabelSigned ? 6 : 18,
      !hasTracks
        ? 'Upload tracks first.'
        : splitCoverage >= 50
          ? `${splitCoverage}% of tracks are covered by split sheets.`
          : `Only ${splitCoverage}% of tracks have split sheets — cover at least 50% to protect your royalties.`
    ),
    check(
      'business_splits_balanced',
      'Split sheet percentages total 100%',
      splitSheets.length === 0 || allSplitsBalanced,
      14,
      splitSheets.length === 0
        ? 'No split sheets yet — create one for your next release.'
        : allSplitsBalanced
          ? 'All split sheets are balanced to 100%.'
          : "One or more split sheets don't add up to 100% — fix them to avoid payout disputes."
    ),
    check(
      'business_streaming_links',
      'At least one track has streaming platform links',
      hasStreamingLinks,
      18,
      hasStreamingLinks
        ? 'Streaming links are present on tracks.'
        : 'Add streaming platform links to your tracks — this is evidence that your music is distributed.'
    ),
    check(
      'business_isrc',
      'At least one track has an ISRC code',
      hasIsrc,
      15,
      hasIsrc
        ? 'ISRC codes are present on tracks.'
        : "Get ISRC codes for your tracks — they're required to track streams and royalties accurately on all platforms."
    ),
  ];

  return buildDimensionResult('business', checks);
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
