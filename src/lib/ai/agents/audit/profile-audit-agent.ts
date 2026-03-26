/**
 * Profile Audit Agent
 *
 * Checks the completeness of an artist's Flemoji profile.
 * All logic is deterministic — no LLM calls.
 *
 * Checks:
 *  - profile_name       Artist name is set
 *  - profile_bio        Bio is ≥ 50 characters
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

interface ProfileAuditInput {
  profile: ArtistProfile;
  tracks: Track[];
}

export function runProfileAudit({
  profile,
  tracks,
}: ProfileAuditInput): DimensionResult {
  const checks: AuditCheck[] = [
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
      'Bio is at least 50 characters',
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

  return buildDimensionResult('profile', checks);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasSocialLinks(socialLinks: unknown): boolean {
  if (!socialLinks || typeof socialLinks !== 'object') return false;
  const links = socialLinks as Record<string, unknown>;
  return Object.values(links).some(
    v => typeof v === 'string' && v.trim().length > 0
  );
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
