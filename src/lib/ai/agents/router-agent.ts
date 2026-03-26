/**
 * Router Agent
 *
 * Main agent that routes user queries to the appropriate specialized agent.
 * Analyzes user intent and delegates to Discovery, Recommendation,
 * AbuseGuard, or IndustryInfo agents.
 *
 * @module RouterAgent
 */

import type { AgentContext, AgentResponse } from './base-agent';
import { DiscoveryAgent } from './discovery-agent';
import { RecommendationAgent } from './recommendation-agent';
import { AbuseGuardAgent } from './abuse-guard-agent';
import { IndustryInfoAgent } from './industry-info-agent';
import { IntentClassifierAgent } from './intent-classifier-agent';
import { ClarificationAgent } from './clarification-agent';
import { FallbackAgent } from './fallback-agent';
import { TimelineAgent } from './timeline-agent';
import { HelpAgent } from './help-agent';
import { PreferencesAgent } from './preferences-agent';
import { AuditAgent } from './audit-agent';
import {
  analyzeIntent,
  extractDiscoveryMetadata,
} from './router-intent-detector';
import { logRoutingDecision } from '../routing-decision-logger';
import { logger } from '@/lib/utils/logger';
import type { AIProvider } from '@/types/ai-service';
import { AgentEventService } from '../services/agent-event-service';

export type AgentIntent =
  | 'preferences'
  | 'discovery'
  | 'recommendation'
  | 'abuse'
  | 'industry'
  | 'help'
  | 'timeline'
  | 'audit'
  | 'unknown';

export interface RoutingDecision {
  intent: AgentIntent;
  confidence: number;
  agent:
    | 'PreferencesAgent'
    | 'DiscoveryAgent'
    | 'RecommendationAgent'
    | 'AbuseGuardAgent'
    | 'IndustryInfoAgent'
    | 'HelpAgent'
    | 'TimelineAgent'
    | 'AuditAgent'
    | 'FallbackAgent';
}

/**
 * Router Agent
 *
 * Routes user queries to appropriate specialized agents based on intent analysis.
 */
export class RouterAgent {
  private preferencesAgent: PreferencesAgent;
  private discoveryAgent: DiscoveryAgent;
  private recommendationAgent: RecommendationAgent;
  private abuseGuardAgent: AbuseGuardAgent;
  private industryInfoAgent: IndustryInfoAgent;
  private helpAgent: HelpAgent;
  private timelineAgent: TimelineAgent;
  private auditAgent: AuditAgent;
  private intentClassifierAgent: IntentClassifierAgent;
  private clarificationAgent: ClarificationAgent;
  private fallbackAgent: FallbackAgent;

  /**
   * Create a new RouterAgent instance
   * @param provider - AI provider to use for specialized agents (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    this.preferencesAgent = new PreferencesAgent();
    this.discoveryAgent = new DiscoveryAgent(provider);
    this.recommendationAgent = new RecommendationAgent(provider);
    this.abuseGuardAgent = new AbuseGuardAgent();
    this.industryInfoAgent = new IndustryInfoAgent();
    this.helpAgent = new HelpAgent();
    this.timelineAgent = new TimelineAgent(provider);
    this.auditAgent = new AuditAgent();
    this.intentClassifierAgent = new IntentClassifierAgent(provider);
    this.clarificationAgent = new ClarificationAgent();
    this.fallbackAgent = new FallbackAgent();
  }

  /**
   * Route a user message to the appropriate agent
   * Uses pure LLM approach: LLM-first intent detection with keyword fallback
   */
  async route(message: string, context?: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();
    let llmLatency: number | undefined;
    let keywordLatency: number | undefined;
    let llmDecision:
      | (RoutingDecision & {
          needsClarification?: boolean;
          isMetaQuestion?: boolean;
        })
      | undefined;
    let keywordDecision: RoutingDecision | undefined;

    logger.info('[RouterAgent] ===== ROUTING REQUEST =====');
    logger.info('[RouterAgent] Message:', message);
    logger.info('[RouterAgent] Context:', {
      userId: context?.userId,
      conversationId: context?.conversationId,
      hasHistory: !!context?.conversationHistory?.length,
      filters: context?.filters,
      previousIntent: context?.metadata?.previousIntent,
      chatType: context?.metadata?.chatType,
    });

    // PRIORITY 0: Check if this is a timeline chat - route directly to TimelineAgent
    if (context?.metadata?.chatType === 'TIMELINE') {
      logger.info(
        '[RouterAgent] Timeline chat detected, routing directly to TimelineAgent'
      );
      return await this.timelineAgent.process(message, context);
    }

    // PRIORITY 0b: Hard intercept for self-referential preference queries
    if (this.isPreferencesQuery(message)) {
      logger.info(
        '[RouterAgent] Preferences query detected, routing directly to PreferencesAgent'
      );
      return await this.preferencesAgent.process(message, context);
    }

    try {
      // Initialize event service
      const eventService = new AgentEventService(context?.emitEvent);

      // Emit analyzing intent event
      eventService.analyzingIntent();

      let finalDecision: RoutingDecision | undefined;
      let routingMethod: 'llm' | 'keyword' | 'clarification' | 'fallback' =
        'llm';

      // KEYWORD-FIRST: Run keyword detector before LLM to save latency
      const intentContext = {
        conversationHistory: context?.conversationHistory?.map(msg => ({
          role: msg.role || 'user',
          content:
            typeof msg.content === 'string'
              ? msg.content
              : JSON.stringify(msg.content),
        })),
        filters: context?.filters,
        previousIntent: context?.metadata?.previousIntent as string | undefined,
      };

      const keywordStartTime = Date.now();
      keywordDecision = analyzeIntent(message, intentContext);
      keywordLatency = Date.now() - keywordStartTime;

      logger.info('[RouterAgent] Keyword decision:', {
        intent: keywordDecision.intent,
        confidence: keywordDecision.confidence,
        agent: keywordDecision.agent,
        latency: keywordLatency,
      });

      // If keyword router is confident (>= 0.6), skip LLM entirely
      if (keywordDecision.confidence >= 0.6) {
        logger.info(
          '[RouterAgent] Keyword confidence sufficient — skipping LLM',
          {
            intent: keywordDecision.intent,
            confidence: keywordDecision.confidence,
            method: 'keyword',
          }
        );

        finalDecision = keywordDecision;
        routingMethod = 'keyword';

        eventService.routingDecision({
          intent: keywordDecision.intent,
          confidence: keywordDecision.confidence,
          method: 'keyword',
          agent: keywordDecision.agent,
          latency: {
            keyword: keywordLatency,
            total: Date.now() - startTime,
          },
        });
      } else {
        // LOW keyword confidence — fall through to LLM classifier
        eventService.llmClassifying();

        try {
          const llmStartTime = Date.now();
          llmDecision = await this.intentClassifierAgent.classifyIntent(
            message,
            context
          );
          llmLatency = Date.now() - llmStartTime;

          logger.info('[RouterAgent] LLM-based decision:', {
            intent: llmDecision.intent,
            confidence: llmDecision.confidence,
            agent: llmDecision.agent,
            needsClarification: llmDecision.needsClarification,
            isMetaQuestion: llmDecision.isMetaQuestion,
            latency: llmLatency,
          });

          // PRIORITY 1: Handle help/meta-questions
          if (
            llmDecision.intent === 'help' ||
            llmDecision.isMetaQuestion ||
            this.isMetaQuestion(message)
          ) {
            logger.info(
              '[RouterAgent] Help/meta-question detected, routing to HelpAgent:',
              {
                message,
                llmIntent: llmDecision.intent,
                llmConfidence: llmDecision.confidence,
              }
            );

            finalDecision = {
              intent: 'help',
              confidence: llmDecision.confidence || 0.9,
              agent: 'HelpAgent',
            };
            routingMethod = 'llm';
          }
          // PRIORITY 2: Handle needsClarification flag from LLM
          else if (
            llmDecision.needsClarification &&
            llmDecision.intent !== 'abuse'
          ) {
            logger.info(
              '[RouterAgent] LLM flagged query as needing clarification:',
              {
                message,
                llmIntent: llmDecision.intent,
                llmConfidence: llmDecision.confidence,
              }
            );

            eventService.routingDecision({
              intent: 'unknown',
              confidence: llmDecision.confidence,
              method: 'clarification',
              agent: 'ClarificationAgent',
              latency: {
                llm: llmLatency,
                total: Date.now() - startTime,
              },
            });

            return await this.clarificationAgent.process(message, context);
          }
          // PRIORITY 3: Handle abuse detection (high confidence)
          else if (
            llmDecision.intent === 'abuse' &&
            llmDecision.confidence >= 0.8
          ) {
            logger.info(
              '[RouterAgent] LLM detected abuse, routing to AbuseGuardAgent'
            );
            finalDecision = {
              intent: llmDecision.intent,
              confidence: llmDecision.confidence,
              agent: llmDecision.agent,
            };
            routingMethod = 'llm';
          }
          // PRIORITY 4: Handle low confidence queries
          else if (
            llmDecision.confidence < 0.3 &&
            llmDecision.intent !== 'abuse' &&
            llmDecision.intent !== 'industry'
          ) {
            // Very low confidence - route to clarification
            logger.info(
              '[RouterAgent] Very low confidence, routing to clarification:',
              {
                message,
                llmIntent: llmDecision.intent,
                llmConfidence: llmDecision.confidence,
              }
            );

            eventService.routingDecision({
              intent: 'unknown',
              confidence: llmDecision.confidence,
              method: 'clarification',
              agent: 'ClarificationAgent',
              latency: {
                llm: llmLatency,
                total: Date.now() - startTime,
              },
            });

            return await this.clarificationAgent.process(message, context);
          }
          // DEFAULT: Use LLM decision
          else {
            finalDecision = {
              intent: llmDecision.intent,
              confidence: llmDecision.confidence,
              agent: llmDecision.agent,
            };
            routingMethod = 'llm';
          }

          // Emit final routing decision
          eventService.routingDecision({
            intent: finalDecision.intent,
            confidence: finalDecision.confidence,
            method: routingMethod,
            agent: finalDecision.agent,
            latency: {
              llm: llmLatency,
              total: Date.now() - startTime,
            },
          });
        } catch (llmError) {
          // FALLBACK: LLM failed — reuse already-computed keyword decision
          logger.warn(
            '[RouterAgent] LLM intent classification failed, using keyword fallback:',
            llmError
          );

          logger.info('[RouterAgent] Keyword fallback decision:', {
            intent: keywordDecision.intent,
            confidence: keywordDecision.confidence,
            agent: keywordDecision.agent,
            latency: keywordLatency,
          });

          finalDecision = keywordDecision;
          routingMethod = 'keyword';

          // Emit routing decision (keyword fallback)
          eventService.routingDecision({
            intent: keywordDecision.intent,
            confidence: keywordDecision.confidence,
            method: 'keyword',
            agent: keywordDecision.agent,
            latency: {
              keyword: keywordLatency,
              total: Date.now() - startTime,
            },
          });
        }
      } // close else (low keyword confidence)

      // Ensure we have a final decision (should always be set by now, but safety check)
      if (!finalDecision) {
        logger.error(
          '[RouterAgent] No final decision made, defaulting to discovery'
        );
        finalDecision = {
          intent: 'discovery',
          confidence: 0.5,
          agent: 'DiscoveryAgent',
        };
        routingMethod = 'llm';
      }

      // At this point, finalDecision is guaranteed to be set
      const confirmedDecision: RoutingDecision = finalDecision;
      const totalLatency = Date.now() - startTime;

      // Log routing decision (async, non-blocking)
      logRoutingDecision({
        userId: context?.userId,
        conversationId: context?.conversationId,
        message,
        keywordDecision: keywordDecision,
        llmDecision: llmDecision || undefined,
        finalDecision: confirmedDecision,
        routingMethod,
        keywordLatency,
        llmLatency,
        totalLatency,
      }).catch(error => {
        // Log errors but don't break routing
        console.error('Failed to log routing decision:', error);
      });

      // Extract discovery sub-intent and entities for deterministic tool selection
      const discoveryMeta =
        confirmedDecision.intent === 'discovery'
          ? extractDiscoveryMetadata(message)
          : null;

      // Store current intent in context metadata for follow-up queries
      const enhancedContext: AgentContext = {
        ...context,
        metadata: {
          ...context?.metadata,
          previousIntent: confirmedDecision.intent,
          routingMethod,
          keywordLatency,
          llmLatency,
          totalLatency,
          // Pass discovery sub-intent hints so DiscoveryAgent can skip LLM tool selection
          ...(discoveryMeta && {
            subIntent: discoveryMeta.subIntent,
            entities: discoveryMeta.entities,
          }),
        },
      };

      // Emit agent processing event
      eventService.agentProcessing({
        agent: confirmedDecision.agent,
      });

      return await this.routeToAgent(
        confirmedDecision,
        message,
        enhancedContext
      );
    } catch (error) {
      console.error('RouterAgent error:', error);
      throw error;
    }
  }

  /**
   * Route to the appropriate agent based on routing decision
   */
  private async routeToAgent(
    decision: RoutingDecision,
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    switch (decision.intent) {
      case 'preferences':
        return await this.preferencesAgent.process(message, context);
      case 'abuse':
        return await this.abuseGuardAgent.process(message, context);
      case 'industry':
        return await this.industryInfoAgent.process(message, context);
      case 'help':
        return await this.helpAgent.process(message, context);
      case 'timeline':
        return await this.timelineAgent.process(message, context);
      case 'audit':
        return await this.auditAgent.process(message, context);
      case 'discovery':
        return await this.discoveryAgent.process(message, context);
      case 'recommendation':
        return await this.recommendationAgent.process(message, context);
      case 'unknown':
        return await this.fallbackAgent.process(message, context);
      default:
        return await this.fallbackAgent.process(message, context);
    }
  }

  /**
   * Check if query is about the user's own taste/preferences/history
   * e.g. "what music do I like", "show me my preferences", "my music history"
   */
  private isPreferencesQuery(message: string): boolean {
    const lower = message.toLowerCase();
    const patterns = [
      /\bwhat (music|songs?|tracks?|genres?|artists?)\s+do\s+i\s+(like|love|listen to|prefer|enjoy)\b/i,
      /\bmy (music\s+)?(taste|preferences?|history|profile|likes?|favourites?|favorites?)\b/i,
      /\bwhat (are|have been) my (music\s+)?(preferences?|genres?|artists?|favourites?|favorites?|top)\b/i,
      /\bshow me (my|what) (music\s+)?(preferences?|taste|history|likes?|favourites?|favorites?)\b/i,
      /\bwhat (have|did) i (been\s+)?(listen(ed|ing) to|play(ed|ing))\b/i,
      /\bmy listening history\b/i,
      /\btell me (about\s+)?(my|what i) (like|prefer|listen to|enjoy)\b/i,
    ];
    return patterns.some(p => p.test(lower));
  }

  /**
   * Check if query is a meta-question about the system itself
   * (e.g., "How can I search for a song here", "What can you do", "How do I use this")
   */
  private isMetaQuestion(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const metaPatterns = [
      // Questions about how to use the system (exclude "listen" — "how can I listen to X" is a content request)
      /\b(how can|how do|how to)\s+(i|you|we)\s+(search|find|use|play|discover|get|access|navigate|work|operate)/i,
      // Questions about what the system can do — must reference the system explicitly, not "I"
      /\b(what can|what does|what is|what are)\s+(you|this|it|the system|the app|flemoji)\s+(do|can|help|support|offer|provide)/i,
      // Questions about where/how to do something in the system (exclude "listen")
      /\b(where|how)\s+(can|do|to|is|are)\s+(i|you|we)\s+(search|find|play|discover|get|access|use|navigate)/i,
      // Questions about system functionality (exclude "listen" — "can I listen to X" is a content request)
      /\b(can you|can i|how does|how do|how is|how are)\s+(search|find|play|discover|get|access|use|navigate|work|operate)/i,
      // Questions with "here" or "this" referring to the system
      /\b(how|what|where|when|why)\s+(can|do|to|is|are|does)\s+(i|you|we)\s+.*\b(here|this|system|app|platform|website|site)\b/i,
    ];

    return metaPatterns.some(pattern => pattern.test(lowerMessage));
  }

  /**
   * Get routing decision without executing
   * Useful for testing and debugging
   */
  getRoutingDecision(message: string): RoutingDecision {
    return analyzeIntent(message);
  }
}
