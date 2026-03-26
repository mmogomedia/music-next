/**
 * Audit Orchestrator Agent
 *
 * Entry point for the Career Intelligence Engine.
 * Runs the four audit sub-agents in parallel, aggregates scores,
 * persists the ArtistAudit, then triggers the Decision Engine.
 *
 * This is the ONLY file that talks to sub-agents, the score aggregator,
 * the decision engine, and the database — all other layers are pure functions.
 *
 * Flow:
 *  1. Batch-fetch all required data in ONE query round
 *  2. Run sub-agents in parallel (pure functions, no I/O)
 *  3. Aggregate scores
 *  4. Persist ArtistAudit to DB
 *  5. Run Decision Engine (capability resolution + action ranking + LLM narrative)
 *  6. Return full DecisionEngineResult
 */

import { prisma } from '@/lib/db';
import type { ArtistProfile, ArtistType } from '@prisma/client';
import type {
  AuditResult,
  DecisionEngineResult,
} from '@/types/career-intelligence';
import { runProfileAudit } from './audit/profile-audit-agent';
import { runPlatformAudit } from './audit/platform-audit-agent';
import { runReleasePlanningAudit } from './audit/release-planning-agent';
import { runBusinessReadinessAudit } from './audit/business-readiness-agent';
import { buildAuditResult } from './audit/score-aggregator';
import { runDecisionEngine } from '@/lib/services/decision-engine';

/**
 * Run a full career readiness audit for an artist.
 *
 * @param artistProfileId - The artist's profile ID
 * @returns DecisionEngineResult with prioritised actions, gaps, and narrative
 */
export async function runCareerAudit(
  artistProfileId: string
): Promise<DecisionEngineResult> {
  // ── Step 1: Batch data fetch ───────────────────────────────────────────────
  // Profile is fetched first so we can use its userId for subsequent queries.
  const profile = await prisma.artistProfile.findUniqueOrThrow({
    where: { id: artistProfileId },
    include: { user: { select: { emailVerified: true } } },
  });

  const [tracks, platformData, smartLinks, splitSheets] = await Promise.all([
    prisma.track.findMany({
      where: {
        OR: [
          { artistProfileId },
          { primaryArtistIds: { has: artistProfileId } },
        ],
      },
      select: {
        id: true,
        title: true,
        genre: true,
        genreId: true,
        coverImageUrl: true,
        albumArtwork: true,
        streamingLinks: true,
        isrc: true,
        createdAt: true,
        updatedAt: true,
        artistProfileId: true,
        primaryArtistIds: true,
        featuredArtistIds: true,
        filePath: true,
        uniqueUrl: true,
        userId: true,
      },
    }),
    prisma.pulsePlatformData.findMany({
      where: { artistProfileId },
      orderBy: { fetchedAt: 'desc' },
    }),
    prisma.smartLink.findMany({
      where: {
        track: {
          OR: [
            { artistProfileId },
            { primaryArtistIds: { has: artistProfileId } },
          ],
        },
      },
      select: {
        id: true,
        trackId: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        clickCount: true,
      },
    }),
    profile.userId
      ? prisma.splitSheet.findMany({
          where: { userId: profile.userId },
          select: {
            id: true,
            trackId: true,
            masterSplits: true,
            publishingSplits: true,
            userId: true,
            name: true,
            songTitle: true,
            songDate: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  // ── Step 2: Run sub-agents in parallel (pure functions) ────────────────────
  const [profileResult, platformResult, releaseResult, businessResult] =
    await Promise.all([
      Promise.resolve(runProfileAudit({ profile, tracks: tracks as never[] })),
      Promise.resolve(runPlatformAudit({ profile, platformData })),
      Promise.resolve(
        runReleasePlanningAudit({
          tracks: tracks as never[],
          smartLinks: smartLinks as never[],
        })
      ),
      Promise.resolve(
        runBusinessReadinessAudit({
          artistType: profile.artistType as ArtistType,
          user: profile.user ?? null,
          tracks: tracks as never[],
          splitSheets: splitSheets as never[],
        })
      ),
    ]);

  // ── Step 3: Aggregate scores ───────────────────────────────────────────────
  const auditResult: AuditResult = buildAuditResult(
    artistProfileId,
    profile.artistType as ArtistType,
    {
      profile: profileResult,
      platform: platformResult,
      release: releaseResult,
      business: businessResult,
    }
  );

  // ── Step 4: Persist ArtistAudit ───────────────────────────────────────────
  const savedAudit = await prisma.artistAudit.create({
    data: {
      artistProfileId,
      overallScore: auditResult.overallScore,
      tier: auditResult.tier,
      profileScore: auditResult.profileScore,
      platformScore: auditResult.platformScore,
      releaseScore: auditResult.releaseScore,
      businessScore: auditResult.businessScore,
      gaps: auditResult.gaps as unknown as import('@prisma/client').Prisma.InputJsonValue,
      checks:
        auditResult.checks as unknown as import('@prisma/client').Prisma.InputJsonValue,
    },
  });

  // ── Step 5: Decision Engine ────────────────────────────────────────────────
  const decisionResult = await runDecisionEngine(
    savedAudit.id,
    auditResult,
    profile as ArtistProfile
  );

  return decisionResult;
}

/**
 * Fetch the most recent completed audit + decision result for an artist.
 * Returns null if no audit has been run yet.
 */
export async function getLatestAuditResult(artistProfileId: string): Promise<{
  audit: Awaited<ReturnType<typeof prisma.artistAudit.findFirst>>;
  decision: Awaited<ReturnType<typeof prisma.decisionResult.findFirst>>;
} | null> {
  const audit = await prisma.artistAudit.findFirst({
    where: { artistProfileId },
    orderBy: { createdAt: 'desc' },
  });

  if (!audit) return null;

  const decision = await prisma.decisionResult.findUnique({
    where: { auditId: audit.id },
  });

  return { audit, decision };
}
