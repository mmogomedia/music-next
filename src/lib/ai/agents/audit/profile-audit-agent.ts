/**
 * Profile Audit Agent
 *
 * Evaluates an artist's Flemoji profile completeness using Azure OpenAI.
 * The LLM receives the actual profile data and makes qualitative judgements
 * rather than simple boolean field checks.
 *
 * Falls back to deterministic rule evaluation if the LLM call fails.
 *
 * Checks:
 *  - profile_name       Artist name is set and professional
 *  - profile_bio        Bio is compelling and sufficient for curators
 *  - profile_image      Profile image is uploaded
 *  - profile_cover      Cover image is uploaded
 *  - profile_genre      Genre is tagged
 *  - profile_social     At least 1 social link is present
 *  - profile_track      At least 1 track has been uploaded
 *  - profile_location   Country / province is set
 */

import type { ArtistProfile, Track } from '@prisma/client';
import type {
  AuditCheck,
  AuditGap,
  DimensionResult,
} from '@/types/career-intelligence';
import {
  evaluateChecksWithLLM,
  type LLMCheckInput,
} from './llm-audit-evaluator';

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior A&R consultant evaluating an artist's profile for a music platform.
Assess each check using the actual data provided. Your evaluation should reflect what
playlist curators, DSP editorial teams, and booking agents actually look for.

For passed checks: write 1 sentence confirming the strength with relevant context.
For failed checks: write 1–2 sentences on the real-world cost — what it costs them
on DSPs, with curators, or at bookings. Use direct industry language. No filler phrases.`;

// ── Static check definitions ──────────────────────────────────────────────────

function buildCheckInputs(
  profile: ArtistProfile,
  tracks: Track[]
): LLMCheckInput[] {
  const socialOk = hasSocialLinks(profile.socialLinks);
  const bioLen = profile.bio?.length ?? 0;

  return [
    {
      checkId: 'profile_name',
      label: 'Artist name is set',
      impact: 15,
      rulePassedHint: Boolean(profile.artistName?.trim()),
      ruleDetail: profile.artistName?.trim()
        ? `Artist name: "${profile.artistName}"`
        : 'No artist name set.',
    },
    {
      checkId: 'profile_bio',
      label: 'Bio is compelling and sufficient for curators',
      impact: 12,
      rulePassedHint: bioLen >= 50,
      ruleDetail: `Bio (${bioLen} chars): "${profile.bio?.slice(0, 200) ?? ''}"`,
    },
    {
      checkId: 'profile_image',
      label: 'Profile image is uploaded',
      impact: 14,
      rulePassedHint: Boolean(profile.profileImage),
      ruleDetail: profile.profileImage
        ? 'Profile image is present.'
        : 'No profile image uploaded.',
    },
    {
      checkId: 'profile_cover',
      label: 'Cover image is uploaded',
      impact: 10,
      rulePassedHint: Boolean(profile.coverImage),
      ruleDetail: profile.coverImage
        ? 'Cover image is present.'
        : 'No cover image uploaded.',
    },
    {
      checkId: 'profile_genre',
      label: 'Genre is tagged',
      impact: 10,
      rulePassedHint: Boolean(profile.genreId || profile.genre),
      ruleDetail:
        profile.genreId || profile.genre
          ? `Genre tagged: "${profile.genre ?? profile.genreId}"`
          : 'No genre tagged.',
    },
    {
      checkId: 'profile_social',
      label: 'At least one social link is present',
      impact: 12,
      rulePassedHint: socialOk,
      ruleDetail: socialOk
        ? `Social links: ${formatSocialLinks(profile.socialLinks)}`
        : 'No social links added.',
    },
    {
      checkId: 'profile_track',
      label: 'At least one track is uploaded',
      impact: 20,
      rulePassedHint: tracks.length > 0,
      ruleDetail:
        tracks.length > 0
          ? `${tracks.length} track${tracks.length !== 1 ? 's' : ''} uploaded.`
          : 'No tracks uploaded.',
    },
    {
      checkId: 'profile_location',
      label: 'Country or province is set',
      impact: 7,
      rulePassedHint: Boolean(profile.country || profile.province),
      ruleDetail:
        profile.country || profile.province
          ? `Location: ${[profile.country, profile.province].filter(Boolean).join(', ')}`
          : 'No location set.',
    },
  ];
}

// ── Main export ───────────────────────────────────────────────────────────────

interface ProfileAuditInput {
  profile: ArtistProfile;
  tracks: Track[];
}

export async function runProfileAudit({
  profile,
  tracks,
}: ProfileAuditInput): Promise<DimensionResult> {
  const checkInputs = buildCheckInputs(profile, tracks);

  const artistContext = `Artist data:
- Name: ${profile.artistName?.trim() || 'not set'}
- Bio: "${profile.bio?.slice(0, 300) ?? 'not provided'}" (${profile.bio?.length ?? 0} chars)
- Profile image: ${profile.profileImage ? 'present' : 'absent'}
- Cover image: ${profile.coverImage ? 'present' : 'absent'}
- Genre: ${profile.genre ?? profile.genreId ?? 'not tagged'}
- Social links: ${formatSocialLinks(profile.socialLinks)}
- Tracks uploaded: ${tracks.length}
- Location: ${[profile.country, profile.province].filter(Boolean).join(', ') || 'not set'}
- Artist type: ${profile.artistType ?? 'unknown'}
- Career stage: ${profile.careerStage ?? 'unknown'}`;

  const checks = await evaluateChecksWithLLM(
    SYSTEM_PROMPT,
    artistContext,
    checkInputs,
    () => runProfileAuditFallback(profile, tracks)
  );

  return buildDimensionResult('profile', checks);
}

// ── Rule-based fallback ───────────────────────────────────────────────────────

function runProfileAuditFallback(
  profile: ArtistProfile,
  tracks: Track[]
): AuditCheck[] {
  return [
    check(
      'profile_name',
      'Artist name is set',
      Boolean(profile.artistName?.trim()),
      15,
      profile.artistName?.trim()
        ? 'Artist name is present.'
        : 'Add your artist name to be discovered on Flemoji.'
    ),
    check(
      'profile_bio',
      'Bio is compelling and sufficient for curators',
      (profile.bio?.length ?? 0) >= 50,
      12,
      (profile.bio?.length ?? 0) >= 50
        ? `Bio is ${profile.bio!.length} characters.`
        : `Bio is ${profile.bio?.length ?? 0} characters — write at least 50 to tell your story.`
    ),
    check(
      'profile_image',
      'Profile image is uploaded',
      Boolean(profile.profileImage),
      14,
      profile.profileImage
        ? 'Profile image is present.'
        : 'Upload a professional profile photo to build trust with fans and curators.'
    ),
    check(
      'profile_cover',
      'Cover image is uploaded',
      Boolean(profile.coverImage),
      10,
      profile.coverImage
        ? 'Cover image is present.'
        : 'Add a cover image to make your profile stand out.'
    ),
    check(
      'profile_genre',
      'Genre is tagged',
      Boolean(profile.genreId || profile.genre),
      10,
      profile.genreId || profile.genre
        ? 'Genre is tagged.'
        : 'Add a genre so fans and algorithms can find your music.'
    ),
    check(
      'profile_social',
      'At least one social link is present',
      hasSocialLinks(profile.socialLinks),
      12,
      hasSocialLinks(profile.socialLinks)
        ? 'Social links are present.'
        : 'Add at least one social media link so fans can follow you.'
    ),
    check(
      'profile_track',
      'At least one track is uploaded',
      tracks.length > 0,
      20,
      tracks.length > 0
        ? `${tracks.length} track${tracks.length !== 1 ? 's' : ''} uploaded.`
        : 'Upload your first track — an artist profile without music is invisible to fans.'
    ),
    check(
      'profile_location',
      'Country or province is set',
      Boolean(profile.country || profile.province),
      7,
      profile.country || profile.province
        ? 'Location is set.'
        : 'Add your location to improve local discovery and booking opportunities.'
    ),
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasSocialLinks(socialLinks: unknown): boolean {
  if (!socialLinks || typeof socialLinks !== 'object') return false;
  const links = socialLinks as Record<string, unknown>;
  return Object.values(links).some(
    v => typeof v === 'string' && v.trim().length > 0
  );
}

function formatSocialLinks(socialLinks: unknown): string {
  if (!socialLinks || typeof socialLinks !== 'object') return 'none';
  const links = socialLinks as Record<string, unknown>;
  const present = Object.entries(links)
    .filter(([, v]) => typeof v === 'string' && (v as string).trim().length > 0)
    .map(([k]) => k);
  return present.length > 0 ? present.join(', ') : 'none';
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
