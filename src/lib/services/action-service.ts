/**
 * Action Service
 *
 * Fetches, filters, and ranks actions for a given artist profile + audit result.
 * All ranking logic is deterministic — no LLM calls here.
 */

import { prisma } from '@/lib/db';
import type { ArtistProfile } from '@prisma/client';
import type {
  BlockedRevenueStream,
  MissingCapability,
  RankedAction,
  RankingContext,
} from '@/types/career-intelligence';

// Effort → inverse score (LOW = high score, HIGH = low score)
const EFFORT_INVERSE: Record<string, number> = {
  LOW: 1.0,
  MEDIUM: 0.6,
  HIGH: 0.3,
};

// Position weight for revenueModels[] and growthEngines[] arrays
const POSITION_WEIGHTS = [1.0, 0.6, 0.3];

/**
 * Fetch all active actions for the missing capabilities,
 * filter by artist type, and return ranked results.
 */
export async function fetchAndRankActions(
  missingCapabilities: MissingCapability[],
  blockedRevenue: BlockedRevenueStream[],
  profile: ArtistProfile
): Promise<RankedAction[]> {
  if (missingCapabilities.length === 0) return [];

  const actions = await prisma.action.findMany({
    where: {
      capabilityId: { in: missingCapabilities.map(c => c.id) },
      isActive: true,
      artistTypeRelevance: { has: profile.artistType },
    },
    include: {
      revenueStreams: {
        include: { revenueStream: true },
      },
      capability: true,
    },
  });

  const context: RankingContext = {
    missingCapabilities,
    blockedRevenue,
    profile,
  };
  return rankActions(actions, context);
}

function rankActions(
  actions: Awaited<
    ReturnType<
      typeof prisma.action.findMany<{
        include: {
          revenueStreams: { include: { revenueStream: true } };
          capability: true;
        };
      }>
    >
  >,
  context: RankingContext
): RankedAction[] {
  const { profile } = context;

  return actions
    .map(action => {
      // Component 1: Impact score (0–0.40)
      const impactScore = (action.expectedImpact / 30) * 0.4;

      // Component 2: Effort inverse (0–0.25) — prefer low effort
      const effortScore = (EFFORT_INVERSE[action.effort] ?? 0.3) * 0.25;

      // Component 3: Revenue unlock value (0–0.35) — prefer actions that nearly unlock a stream
      const revenueScore = computeRevenueUnlockValue(action, context) * 0.35;

      const baseScore = impactScore + effortScore + revenueScore;

      // Relevance multiplier from revenueModels array position
      const revenueIdx = profile.revenueModels.findIndex(m =>
        action.revenueModelRelevance.includes(m)
      );
      const revenueRelevance =
        revenueIdx >= 0 ? (POSITION_WEIGHTS[revenueIdx] ?? 0.3) : 0.2;

      // Growth engine multiplier (advisory — no match = neutral, not a penalty)
      const growthIdx = profile.growthEngines.findIndex(g =>
        action.growthEngineRelevance.includes(g)
      );
      const growthRelevance =
        growthIdx >= 0 ? (POSITION_WEIGHTS[growthIdx] ?? 0.3) : 1.0;

      const rankScore = baseScore * revenueRelevance * growthRelevance;

      return {
        id: action.id,
        label: action.label,
        description: action.description,
        capabilityId: action.capabilityId,
        capabilityLabel: action.capability.label,
        dimension: action.dimension,
        effort: action.effort,
        timeToComplete: action.timeToComplete,
        expectedImpact: action.expectedImpact,
        actionUrl: action.actionUrl ?? null,
        revenueStreams: action.revenueStreams.map(rs => ({
          id: rs.revenueStream.id,
          label: rs.revenueStream.label,
        })),
        rankScore: Math.round(rankScore * 100) / 100,
      } satisfies RankedAction;
    })
    .sort((a, b) => b.rankScore - a.rankScore);
}

/**
 * Higher score if the action unblocks a stream the artist is close to unlocking.
 * Diminishing bonus as the stream needs more capabilities (harder to unlock).
 */
function computeRevenueUnlockValue(
  action: { revenueStreams: { revenueStream: { id: string } }[] },
  context: RankingContext
): number {
  if (action.revenueStreams.length === 0) return 0;

  const total = action.revenueStreams.reduce((score, { revenueStream }) => {
    const blocked = context.blockedRevenue.find(
      b => b.revenueStreamId === revenueStream.id
    );
    if (!blocked) return score;

    // Bonus: stream only needs 1 more capability = full unlock with this action
    const completionBonus =
      blocked.blockedBy.length === 1
        ? 1.0
        : blocked.blockedBy.length === 2
          ? 0.6
          : 0.3;
    return score + completionBonus;
  }, 0);

  return total / action.revenueStreams.length;
}

/**
 * Compute the revenue unlock path — for each blocked stream, which
 * ranked actions would unlock it and how many are needed.
 */
export function computeRevenueUnlockPath(
  rankedActions: RankedAction[],
  blockedRevenue: BlockedRevenueStream[]
): RevenueUnlockPathItem[] {
  return blockedRevenue.map(blocked => {
    // Find actions that build one of the blocking capabilities
    const unlockActions = rankedActions.filter(action =>
      blocked.blockedBy.includes(action.capabilityId)
    );

    const scoreDelta = unlockActions.reduce(
      (sum, a) => sum + a.expectedImpact,
      0
    );

    return {
      revenueStreamId: blocked.revenueStreamId,
      label: blocked.label,
      currentCompletionPct: blocked.completionPct,
      requiredActions: unlockActions.map(a => ({ id: a.id, label: a.label })),
      estimatedScoreDelta: scoreDelta,
    };
  });
}

export interface RevenueUnlockPathItem {
  revenueStreamId: string;
  label: string;
  currentCompletionPct: number;
  requiredActions: { id: string; label: string }[];
  estimatedScoreDelta: number;
}
