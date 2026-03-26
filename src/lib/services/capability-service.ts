/**
 * Capability Service
 *
 * Graph lookup helpers used by the DecisionEngine:
 * - Map gaps → missing capabilities
 * - Map capabilities → blocked revenue streams
 * - Assess and persist artist capability levels from audit results
 */

import { prisma } from '@/lib/db';
import type {
  AuditGap,
  BlockedRevenueStream,
  MissingCapability,
} from '@/types/career-intelligence';

/**
 * Given a list of audit gaps, resolve them to their missing capabilities.
 * Deduplicates by capability ID and sums frequency (how many gaps point to each).
 */
export async function resolveCapabilitiesFromGaps(
  gaps: AuditGap[]
): Promise<MissingCapability[]> {
  if (gaps.length === 0) return [];

  const checkIds = gaps.map(g => g.checkId);

  const mappings = await prisma.auditCheckCapability.findMany({
    where: { checkId: { in: checkIds } },
    include: { capability: true },
  });

  // Aggregate by capability — count how many gaps point to it and sum weight
  const capabilityMap = new Map<
    string,
    {
      capability: (typeof mappings)[0]['capability'];
      frequency: number;
      totalWeight: number;
    }
  >();

  for (const mapping of mappings) {
    const existing = capabilityMap.get(mapping.capabilityId);
    if (existing) {
      existing.frequency += 1;
      existing.totalWeight += mapping.weight;
    } else {
      capabilityMap.set(mapping.capabilityId, {
        capability: mapping.capability,
        frequency: 1,
        totalWeight: mapping.weight,
      });
    }
  }

  // Sort by total weight (impact on the capability) descending
  return Array.from(capabilityMap.values())
    .sort((a, b) => b.totalWeight - a.totalWeight)
    .map(({ capability, frequency, totalWeight }) => ({
      id: capability.id,
      label: capability.label,
      description: capability.description,
      category: capability.category,
      frequency,
      totalWeight,
    }));
}

/**
 * Given missing capabilities, find which revenue streams they are blocking
 * and compute a % completion for each blocked stream.
 */
export async function resolveBlockedRevenue(
  missingCapabilityIds: string[]
): Promise<BlockedRevenueStream[]> {
  if (missingCapabilityIds.length === 0) return [];

  // Get all revenue streams with their required capabilities
  const revenueStreams = await prisma.revenueStream.findMany({
    include: {
      requiredCapabilities: {
        include: { capability: true },
      },
    },
  });

  const blocked: BlockedRevenueStream[] = [];

  for (const stream of revenueStreams) {
    const required = stream.requiredCapabilities.filter(rc => rc.required);
    if (required.length === 0) continue;

    const blockedBy = required
      .filter(rc => missingCapabilityIds.includes(rc.capabilityId))
      .map(rc => rc.capabilityId);

    if (blockedBy.length === 0) continue; // stream is fully unlocked

    const completionPct = Math.round(
      ((required.length - blockedBy.length) / required.length) * 100
    );

    blocked.push({
      revenueStreamId: stream.id,
      label: stream.label,
      description: stream.description,
      supportingPlatforms: stream.supportingPlatforms,
      blockedBy,
      totalRequired: required.length,
      completionPct,
    });
  }

  // Sort by completion % desc (closest to unlocking first)
  return blocked.sort((a, b) => b.completionPct - a.completionPct);
}

/**
 * Persist assessed capability levels for an artist after an audit.
 * Uses upsert so re-audits update existing records.
 */
export async function persistArtistCapabilities(
  artistProfileId: string,
  missingCapabilities: MissingCapability[],
  allCapabilityIds: string[]
): Promise<void> {
  // Missing capabilities get a low level based on weight
  const upserts = allCapabilityIds.map(capId => {
    const missing = missingCapabilities.find(mc => mc.id === capId);
    const level = missing
      ? Math.max(0, 0.3 - missing.totalWeight * 0.1) // penalise by weight, floor at 0
      : 0.8; // present and passing = high level

    return prisma.artistCapability.upsert({
      where: {
        artistProfileId_capabilityId: { artistProfileId, capabilityId: capId },
      },
      update: { level, assessedAt: new Date(), source: 'audit' },
      create: { artistProfileId, capabilityId: capId, level, source: 'audit' },
    });
  });

  await Promise.all(upserts);
}

/**
 * Get the current capability state for an artist (all 12 capabilities with levels).
 */
export async function getArtistCapabilityState(artistProfileId: string) {
  const [allCapabilities, artistCapabilities] = await Promise.all([
    prisma.capability.findMany({ orderBy: { category: 'asc' } }),
    prisma.artistCapability.findMany({ where: { artistProfileId } }),
  ]);

  return allCapabilities.map(cap => {
    const state = artistCapabilities.find(ac => ac.capabilityId === cap.id);
    return {
      ...cap,
      level: state?.level ?? null,
      assessedAt: state?.assessedAt ?? null,
      source: state?.source ?? null,
    };
  });
}
