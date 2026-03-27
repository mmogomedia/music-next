/**
 * Business Readiness Audit Agent
 *
 * Evaluates the business infrastructure behind the artist's career using Azure OpenAI.
 * The LLM receives actual split sheet data, ISRC coverage, and distribution evidence
 * and explains what gaps cost the artist in real royalty and legal terms.
 *
 * Falls back to deterministic rule evaluation if the LLM call fails.
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
import {
  evaluateChecksWithLLM,
  type LLMCheckInput,
} from './llm-audit-evaluator';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SplitEntry {
  percentage: number;
}

interface BusinessReadinessAuditInput {
  artistType: ArtistType;
  user: Pick<User, 'emailVerified'> | null;
  tracks: Track[];
  splitSheets: SplitSheet[];
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an A&R consultant evaluating an artist's business and legal readiness for professional music industry engagement.

For each check, consider what's actually at risk: uncollected royalties, disputed ownership,
blocked PRO registration, payment processing failures, ISRC tracking gaps.

For SIGNED_ARTIST types: note where label responsibility differs from independent artists.
For passed checks: 1 sentence confirming the strength.
For failed checks: 1–2 sentences on the specific financial or legal risk. Direct industry language. No filler phrases.`;

// ── Main export ───────────────────────────────────────────────────────────────

export async function runBusinessReadinessAudit({
  artistType,
  user,
  tracks,
  splitSheets,
}: BusinessReadinessAuditInput): Promise<DimensionResult> {
  const hasTracks = tracks.length > 0;
  const isLabelSigned = (artistType as string) === 'SIGNED_ARTIST';

  const tracksWithSplits = tracks.filter(t =>
    splitSheets.some(s => s.trackId === t.id)
  );
  const splitCoverage = hasTracks
    ? Math.round((tracksWithSplits.length / tracks.length) * 100)
    : 0;

  const allSplitsBalanced = splitSheets.every(sheet => {
    const masterSplits = (sheet.masterSplits ?? []) as unknown as SplitEntry[];
    if (masterSplits.length === 0) return false;
    const total = masterSplits.reduce((sum, s) => sum + (s.percentage ?? 0), 0);
    return Math.abs(total - 100) <= 1;
  });

  const unbalancedCount = splitSheets.filter(sheet => {
    const masterSplits = (sheet.masterSplits ?? []) as unknown as SplitEntry[];
    if (masterSplits.length === 0) return true;
    const total = masterSplits.reduce((sum, s) => sum + (s.percentage ?? 0), 0);
    return Math.abs(total - 100) > 1;
  }).length;

  const hasStreamingLinks = tracks.some(t => {
    if (!t.streamingLinks) return false;
    const links = t.streamingLinks as unknown[];
    return Array.isArray(links) && links.length > 0;
  });

  const isrcCount = tracks.filter(t => Boolean(t.isrc?.trim())).length;
  const hasIsrc = isrcCount > 0;

  const checkInputs: LLMCheckInput[] = [
    {
      checkId: 'business_email_verified',
      label: 'Email address is verified',
      impact: 15,
      rulePassedHint: Boolean(user?.emailVerified),
      ruleDetail: user?.emailVerified
        ? 'Email is verified.'
        : 'Email is not verified.',
    },
    {
      checkId: 'business_split_sheet',
      label: 'At least one split sheet created',
      impact: isLabelSigned ? 8 : 20,
      rulePassedHint: splitSheets.length > 0,
      ruleDetail:
        splitSheets.length > 0
          ? `${splitSheets.length} split sheet${splitSheets.length !== 1 ? 's' : ''} created.`
          : isLabelSigned
            ? 'No split sheets — label-signed artist (label may manage).'
            : 'No split sheets created.',
    },
    {
      checkId: 'business_split_coverage',
      label: '≥ 50% of tracks have a split sheet',
      impact: isLabelSigned ? 6 : 18,
      rulePassedHint: !hasTracks || splitCoverage >= 50,
      ruleDetail: !hasTracks
        ? 'No tracks uploaded yet.'
        : `${splitCoverage}% of tracks covered by split sheets (${tracksWithSplits.length} of ${tracks.length}).`,
    },
    {
      checkId: 'business_splits_balanced',
      label: 'Split sheet percentages total 100%',
      impact: 14,
      rulePassedHint: splitSheets.length === 0 || allSplitsBalanced,
      ruleDetail:
        splitSheets.length === 0
          ? 'No split sheets yet.'
          : allSplitsBalanced
            ? `All ${splitSheets.length} split sheets balance to 100%.`
            : `${unbalancedCount} of ${splitSheets.length} split sheets do not sum to 100%.`,
    },
    {
      checkId: 'business_streaming_links',
      label: 'At least one track has streaming platform links',
      impact: 18,
      rulePassedHint: hasStreamingLinks,
      ruleDetail: hasStreamingLinks
        ? 'Streaming platform links present on tracks.'
        : 'No tracks have streaming platform links — distribution evidence is missing.',
    },
    {
      checkId: 'business_isrc',
      label: 'At least one track has an ISRC code',
      impact: 15,
      rulePassedHint: hasIsrc,
      ruleDetail: hasIsrc
        ? `${isrcCount} of ${tracks.length} track${tracks.length !== 1 ? 's' : ''} have ISRC codes.`
        : 'No tracks have ISRC codes.',
    },
  ];

  const artistContext = `Artist type: ${artistType}${isLabelSigned ? ' (label handles most split logistics)' : ''}

Business data:
- Email verified: ${user?.emailVerified ? 'yes' : 'no'}
- Split sheets: ${splitSheets.length} covering ${splitCoverage}% of tracks
- Split balance: ${splitSheets.length === 0 ? 'no sheets' : allSplitsBalanced ? 'all sum to 100%' : `${unbalancedCount} sheet(s) have errors`}
- Streaming links on tracks: ${hasStreamingLinks ? 'present' : 'absent'}
- ISRC codes: ${isrcCount} of ${tracks.length} tracks`;

  const checks = await evaluateChecksWithLLM(
    SYSTEM_PROMPT,
    artistContext,
    checkInputs,
    () =>
      runBusinessReadinessAuditFallback({
        artistType,
        user,
        tracks,
        splitSheets,
      })
  );

  return buildDimensionResult('business', checks);
}

// ── Rule-based fallback ───────────────────────────────────────────────────────

function runBusinessReadinessAuditFallback({
  artistType,
  user,
  tracks,
  splitSheets,
}: BusinessReadinessAuditInput): AuditCheck[] {
  const hasTracks = tracks.length > 0;
  const isLabelSigned = (artistType as string) === 'SIGNED_ARTIST';

  const tracksWithSplits = tracks.filter(t =>
    splitSheets.some(s => s.trackId === t.id)
  );
  const splitCoverage = hasTracks
    ? Math.round((tracksWithSplits.length / tracks.length) * 100)
    : 0;

  const allSplitsBalanced = splitSheets.every(sheet => {
    const masterSplits = (sheet.masterSplits ?? []) as unknown as SplitEntry[];
    if (masterSplits.length === 0) return false;
    const total = masterSplits.reduce((sum, s) => sum + (s.percentage ?? 0), 0);
    return Math.abs(total - 100) <= 1;
  });

  const hasStreamingLinks = tracks.some(t => {
    if (!t.streamingLinks) return false;
    const links = t.streamingLinks as unknown[];
    return Array.isArray(links) && links.length > 0;
  });

  const hasIsrc = tracks.some(t => Boolean(t.isrc?.trim()));

  return [
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
