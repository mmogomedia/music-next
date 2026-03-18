/**
 * Routing Decision Logger
 *
 * Logs routing decisions for analytics and performance monitoring.
 * Tracks keyword vs LLM routing, confidence scores, and performance metrics.
 *
 * @module RoutingDecisionLogger
 */

import type { RoutingDecision } from './agents/router-agent';

// Lazy import to ensure prisma is initialized (cached)
let prismaInstance: any = null;

function getPrisma() {
  if (!prismaInstance) {
    try {
      // Use require with resolved path for better Next.js compatibility
      const dbModule = require('@/lib/db');
      prismaInstance = dbModule.prisma;
      if (!prismaInstance) {
        throw new Error('Prisma client not initialized');
      }
    } catch (error) {
      console.error('Failed to load Prisma client:', error);
      throw error;
    }
  }
  return prismaInstance;
}

/**
 * Routing method used
 */
export type RoutingMethod =
  | 'keyword'
  | 'llm'
  | 'hybrid'
  | 'clarification'
  | 'fallback';

/**
 * Parameters for logging a routing decision
 */
export interface RoutingLogParams {
  userId?: string;
  conversationId?: string;
  message: string;
  keywordDecision?: RoutingDecision; // Optional since we use pure LLM approach
  llmDecision?: RoutingDecision;
  finalDecision: RoutingDecision;
  routingMethod: RoutingMethod;
  keywordLatency?: number;
  llmLatency?: number;
  totalLatency: number;
}

/**
 * Log a routing decision to the database
 *
 * @param params - Routing decision parameters
 */
export async function logRoutingDecision(
  params: RoutingLogParams
): Promise<void> {
  try {
    // Persist to database
    const prismaClient = getPrisma();
    await prismaClient.routingDecisionLog.create({
      data: {
        userId: params.userId,
        conversationId: params.conversationId,
        message: params.message,
        intent: params.finalDecision.intent,
        agent: params.finalDecision.agent,
        routingMethod: params.routingMethod,
        confidence: params.finalDecision.confidence,
        keywordConfidence: params.keywordDecision?.confidence ?? null,
        llmConfidence: params.llmDecision?.confidence,
        keywordLatency: params.keywordLatency
          ? Math.round(params.keywordLatency)
          : null,
        llmLatency: params.llmLatency ? Math.round(params.llmLatency) : null,
        totalLatency: Math.round(params.totalLatency),
      },
    });
  } catch (error) {
    console.error('Failed to log routing decision:', error);
    // Don't throw - logging failures shouldn't break routing
  }
}

/**
 * Get routing statistics for analytics
 *
 * @param params - Optional filters (userId, startDate, endDate)
 */
export async function getRoutingStatistics(params?: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalDecisions: number;
  keywordDecisions: number;
  llmDecisions: number;
  averageConfidence: number;
  averageLatency: number;
  intentDistribution: Record<string, number>;
}> {
  try {
    const where: any = {};

    if (params?.userId) {
      where.userId = params.userId;
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    // Get all routing decisions matching filters
    const prismaClient = getPrisma();
    const decisions = await prismaClient.routingDecisionLog.findMany({
      where,
      select: {
        routingMethod: true,
        confidence: true,
        totalLatency: true,
        intent: true,
      },
    });

    // Type for decision objects from Prisma query
    type DecisionItem = {
      routingMethod: string;
      confidence: number;
      totalLatency: number;
      intent: string;
    };

    // Calculate statistics
    const totalDecisions = decisions.length;
    const keywordDecisions = decisions.filter(
      (d: DecisionItem) => d.routingMethod === 'keyword'
    ).length;
    const llmDecisions = decisions.filter(
      (d: DecisionItem) => d.routingMethod === 'llm'
    ).length;
    const averageConfidence =
      decisions.length > 0
        ? decisions.reduce(
            (sum: number, d: DecisionItem) => sum + d.confidence,
            0
          ) / decisions.length
        : 0;
    const averageLatency =
      decisions.length > 0
        ? decisions.reduce(
            (sum: number, d: DecisionItem) => sum + d.totalLatency,
            0
          ) / decisions.length
        : 0;

    // Calculate intent distribution
    const intentDistribution: Record<string, number> = {};
    decisions.forEach((d: DecisionItem) => {
      intentDistribution[d.intent] = (intentDistribution[d.intent] || 0) + 1;
    });

    return {
      totalDecisions,
      keywordDecisions,
      llmDecisions,
      averageConfidence,
      averageLatency,
      intentDistribution,
    };
  } catch (error) {
    console.error('Failed to get routing statistics:', error);
    return {
      totalDecisions: 0,
      keywordDecisions: 0,
      llmDecisions: 0,
      averageConfidence: 0,
      averageLatency: 0,
      intentDistribution: {},
    };
  }
}
