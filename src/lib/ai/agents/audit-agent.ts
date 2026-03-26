/**
 * Audit Agent
 *
 * Thin agent wrapper around the AuditOrchestratorAgent.
 * Conforms to the BaseAgent interface so the RouterAgent can dispatch to it.
 *
 * Requires: context.userId (to resolve artistProfileId)
 * Returns: AgentResponse with type 'artist_audit'
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { prisma } from '@/lib/db';
import { runCareerAudit } from './audit-orchestrator-agent';
import type { ArtistAuditResponse } from '@/types/ai-responses';

export class AuditAgent extends BaseAgent {
  constructor() {
    super(
      'AuditAgent',
      'You are the Career Intelligence Engine. Run artist readiness audits.'
    );
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  async process(
    _message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    if (!context?.userId) {
      return {
        message:
          'I need you to be signed in to run a career audit. Please log in and try again.',
        data: { type: 'text' },
      };
    }

    // Resolve artistProfileId from userId
    const artistProfile = await prisma.artistProfile.findFirst({
      where: { userId: context.userId },
      select: { id: true },
    });

    if (!artistProfile) {
      return {
        message:
          "You don't have an artist profile yet. Set one up in your dashboard, then I can run your career audit.",
        data: { type: 'text' },
      };
    }

    try {
      const result = await runCareerAudit(artistProfile.id);

      const tierLabel: Record<string, string> = {
        tour_ready: '🟢 Release Ready',
        developing: '🟡 Developing',
        needs_work: '🟠 Needs Work',
        just_starting: '🔴 Just Starting',
      };

      const responseData: ArtistAuditResponse = {
        type: 'artist_audit',
        message: `Your career readiness score is **${result.overallScore}/100** — ${tierLabel[result.tier] ?? result.tier}`,
        timestamp: new Date(),
        conversationId: context.conversationId,
        data: {
          decisionId: result.id,
          auditId: result.auditId,
          artistProfileId: artistProfile.id,
          overallScore: result.overallScore,
          tier: result.tier,
          profileScore: result.profileScore,
          platformScore: result.platformScore,
          releaseScore: result.releaseScore,
          businessScore: result.businessScore,
          prioritizedActions: result.prioritizedActions,
          missingCapabilities: result.missingCapabilities,
          blockedRevenue: result.blockedRevenue,
          revenueUnlockPath: result.revenueUnlockPath,
          reasoning: result.reasoning,
          estimatedScoreIfCompleted: result.estimatedScoreIfCompleted,
        },
        actions: [
          {
            type: 'send_message' as const,
            label: 'What should I focus on first?',
            data: { message: 'What should I focus on first?' },
          },
          {
            type: 'send_message' as const,
            label: 'Explain my biggest gap',
            data: { message: 'Explain my biggest gap' },
          },
          {
            type: 'send_message' as const,
            label: 'Run my audit again',
            data: { message: 'Run my career audit' },
          },
        ],
      };

      return {
        message: responseData.message,
        data: responseData,
        actions: responseData.actions,
      };
    } catch (error) {
      console.error('[AuditAgent] Error running career audit:', error);
      return {
        message:
          'I ran into an issue running your audit. Please try again in a moment.',
        data: { type: 'text' },
      };
    }
  }
}
