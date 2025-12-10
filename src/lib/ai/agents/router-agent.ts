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
import { HelpAgent } from './help-agent';
import { analyzeIntent } from './router-intent-detector';
import { logRoutingDecision } from '../routing-decision-logger';
import { logger } from '@/lib/utils/logger';
import type { AIProvider } from '@/types/ai-service';

export type AgentIntent =
  | 'discovery'
  | 'recommendation'
  | 'abuse'
  | 'industry'
  | 'help'
  | 'unknown';

export interface RoutingDecision {
  intent: AgentIntent;
  confidence: number;
  agent:
    | 'DiscoveryAgent'
    | 'RecommendationAgent'
    | 'AbuseGuardAgent'
    | 'IndustryInfoAgent'
    | 'HelpAgent'
    | 'FallbackAgent';
}

/**
 * Router Agent
 *
 * Routes user queries to appropriate specialized agents based on intent analysis.
 */
export class RouterAgent {
  private discoveryAgent: DiscoveryAgent;
  private recommendationAgent: RecommendationAgent;
  private abuseGuardAgent: AbuseGuardAgent;
  private industryInfoAgent: IndustryInfoAgent;
  private helpAgent: HelpAgent;
  private intentClassifierAgent: IntentClassifierAgent;
  private clarificationAgent: ClarificationAgent;
  private fallbackAgent: FallbackAgent;

  /**
   * Create a new RouterAgent instance
   * @param provider - AI provider to use for specialized agents (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    this.discoveryAgent = new DiscoveryAgent(provider);
    this.recommendationAgent = new RecommendationAgent(provider);
    this.abuseGuardAgent = new AbuseGuardAgent();
    this.industryInfoAgent = new IndustryInfoAgent();
    this.helpAgent = new HelpAgent();
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
    });

    try {
      // Emit analyzing intent event
      context?.emitEvent?.({
        type: 'analyzing_intent',
        message: "Understanding what you're looking for...",
        stage: 'intent_analysis',
        timestamp: new Date().toISOString(),
      });

      // PRIMARY: Always use LLM for intent classification
      context?.emitEvent?.({
        type: 'llm_classifying',
        message: 'Analyzing your request...',
        stage: 'llm_classification',
        timestamp: new Date().toISOString(),
      });

      let finalDecision: RoutingDecision | undefined;
      let routingMethod: 'llm' | 'keyword' | 'clarification' | 'fallback' =
        'llm';

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

          context?.emitEvent?.({
            type: 'routing_decision',
            intent: 'unknown',
            confidence: llmDecision.confidence,
            method: 'clarification',
            agent: 'ClarificationAgent',
            latency: {
              llm: llmLatency,
              total: Date.now() - startTime,
            },
            timestamp: new Date().toISOString(),
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

          context?.emitEvent?.({
            type: 'routing_decision',
            intent: 'unknown',
            confidence: llmDecision.confidence,
            method: 'clarification',
            agent: 'ClarificationAgent',
            latency: {
              llm: llmLatency,
              total: Date.now() - startTime,
            },
            timestamp: new Date().toISOString(),
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
        context?.emitEvent?.({
          type: 'routing_decision',
          intent: finalDecision.intent,
          confidence: finalDecision.confidence,
          method: routingMethod,
          agent: finalDecision.agent,
          latency: {
            llm: llmLatency,
            total: Date.now() - startTime,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (llmError) {
        // FALLBACK: Use keyword detection if LLM fails
        logger.warn(
          '[RouterAgent] LLM intent classification failed, using keyword fallback:',
          llmError
        );

        const intentContext = {
          conversationHistory: context?.conversationHistory?.map(msg => ({
            role: msg.role || 'user',
            content:
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content),
          })),
          filters: context?.filters,
          previousIntent: context?.metadata?.previousIntent as
            | string
            | undefined,
        };

        const keywordStartTime = Date.now();
        keywordDecision = analyzeIntent(message, intentContext);
        keywordLatency = Date.now() - keywordStartTime;

        logger.info('[RouterAgent] Keyword fallback decision:', {
          intent: keywordDecision.intent,
          confidence: keywordDecision.confidence,
          agent: keywordDecision.agent,
          latency: keywordLatency,
        });

        finalDecision = keywordDecision;
        routingMethod = 'keyword';

        // Emit routing decision (keyword fallback)
        context?.emitEvent?.({
          type: 'routing_decision',
          intent: keywordDecision.intent,
          confidence: keywordDecision.confidence,
          method: 'keyword',
          agent: keywordDecision.agent,
          latency: {
            keyword: keywordLatency,
            total: Date.now() - startTime,
          },
          timestamp: new Date().toISOString(),
        });
      }

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
        },
      };

      // Emit agent processing event
      const agentMessages: Record<string, string> = {
        DiscoveryAgent: 'Searching our music library...',
        RecommendationAgent: 'Finding personalized recommendations...',
        AbuseGuardAgent: 'Processing request...',
        IndustryInfoAgent: 'Processing request...',
        HelpAgent: 'Getting help information...',
        FallbackAgent: 'Processing your request...',
      };

      context?.emitEvent?.({
        type: 'agent_processing',
        agent: confirmedDecision.agent,
        message:
          agentMessages[confirmedDecision.agent] ||
          'Processing your request...',
        stage: 'agent_execution',
        timestamp: new Date().toISOString(),
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
      case 'abuse':
        return await this.abuseGuardAgent.process(message, context);
      case 'industry':
        return await this.industryInfoAgent.process(message, context);
      case 'help':
        return await this.helpAgent.process(message, context);
      case 'discovery':
        return await this.discoveryAgent.process(message, context);
      case 'recommendation':
        return await this.recommendationAgent.process(message, context);
      case 'unknown':
        // Unknown intents should have been caught by FallbackAgent check above
        // But if we get here, route to FallbackAgent
        return await this.fallbackAgent.process(message, context);
      default:
        // Default to FallbackAgent for truly unknown intents
        return await this.fallbackAgent.process(message, context);
    }
  }

  /**
   * Check if we have enough context to make a routing decision
   */
  /**
   * Check if we have STRONG context that should override clarification
   * Strong context = active filters or previous intent, NOT just conversation history
   * Conversation history alone doesn't mean the current message has enough context
   */
  private hasStrongContext(context?: AgentContext): boolean {
    // Strong context means:
    // 1. Active filters exist (genre/province filters suggest clear intent)
    // 2. Previous intent exists AND it's recent/relevant
    // NOTE: Conversation history alone is NOT strong context - it can cause false positives
    return !!(
      context?.filters?.genre ||
      context?.filters?.province ||
      context?.metadata?.previousIntent
    );
  }

  /**
   * @deprecated Use hasStrongContext() instead
   * Kept for backward compatibility but should not be used for clarification checks
   */
  private hasEnoughContext(context?: AgentContext): boolean {
    // We have enough context if:
    // 1. Previous intent exists (user has been using the system)
    // 2. Active filters exist (genre/province filters suggest intent)
    // 3. Conversation history exists (can infer from context)
    return !!(
      context?.metadata?.previousIntent ||
      context?.filters?.genre ||
      context?.filters?.province ||
      (context?.conversationHistory && context.conversationHistory.length > 0)
    );
  }

  /**
   * Check if query is truly ambiguous (no keywords matched)
   */
  private isTrulyAmbiguous(
    message: string,
    decision: RoutingDecision
  ): boolean {
    // Truly ambiguous if:
    // 1. Confidence is very low (0.1 is the default when no keywords match)
    // 2. Intent is discovery (default fallback) OR intent is abuse with low confidence
    // 3. Message doesn't contain explicit music-related keywords
    const lowerMessage = message.toLowerCase();
    const isShort = message.trim().split(/\s+/).length < 5; // Relaxed: less than 5 words
    const hasNoMusicKeywords =
      !/\b(song|track|music|artist|playlist|album|genre|amapiano|afrobeat|hip hop|r&b|gospel|house)\b/i.test(
        lowerMessage
      );
    const hasNoExplicitActions =
      !/\b(find|search|show|play|recommend|suggest|get|want|need|help|listen|queue|skip|pause|stop)\b/i.test(
        lowerMessage
      );

    // Ambiguous if:
    // - Low confidence AND
    // - (No music keywords OR no explicit actions) AND
    // - (Short message OR intent is discovery/abuse)
    return (
      decision.confidence <= 0.2 &&
      (hasNoMusicKeywords || hasNoExplicitActions) &&
      (isShort ||
        decision.intent === 'discovery' ||
        (decision.intent === 'abuse' && decision.confidence < 0.5))
    );
  }

  /**
   * Check if query is an emotional query (expresses feelings/emotions)
   */
  private isEmotionalQuery(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const emotionalPatterns = [
      /\b(feel|feeling|felt)\s+(lonely|sad|happy|excited|anxious|stressed|depressed|angry|frustrated|grateful|hopeful|worried|scared|nervous|calm|peaceful|energetic|tired|exhausted|motivated|inspired|confused|lost|overwhelmed|relieved|proud|ashamed|guilty|jealous|envious|disappointed|surprised|shocked|amazed|bored|interested|curious|excited|thrilled|ecstatic|miserable|terrible|awful|great|wonderful|fantastic|amazing|awesome)\b/,
      /\b(i|i'm|i am|im)\s+(lonely|sad|happy|excited|anxious|stressed|depressed|angry|frustrated|grateful|hopeful|worried|scared|nervous|calm|peaceful|energetic|tired|exhausted|motivated|inspired|confused|lost|overwhelmed|relieved|proud|ashamed|guilty|jealous|envious|disappointed|surprised|shocked|amazed|bored|interested|curious|excited|thrilled|ecstatic|miserable|terrible|awful|great|wonderful|fantastic|amazing|awesome)\b/,
      /\b(celebrating|mourning|grieving|healing|recovering|struggling|suffering|enjoying|appreciating|missing|longing|yearning|craving|desiring|wanting|needing|hoping|wishing|dreaming|praying)\b/,
    ];

    return emotionalPatterns.some(pattern => pattern.test(lowerMessage));
  }

  /**
   * Check if query is a meta-question about the system itself
   * (e.g., "How can I search for a song here", "What can you do", "How do I use this")
   */
  private isMetaQuestion(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const metaPatterns = [
      // Questions about how to use the system
      /\b(how can|how do|how to)\s+(i|you|we)\s+(search|find|use|play|listen|discover|get|access|navigate|work|operate)/i,
      // Questions about what the system can do
      /\b(what can|what does|what is|what are)\s+(you|this|it|the system|the app|flemoji)\s+(do|can|help|support|offer|provide)/i,
      // Questions about where/how to do something in the system
      /\b(where|how)\s+(can|do|to|is|are)\s+(i|you|we)\s+(search|find|play|listen|discover|get|access|use|navigate)/i,
      // Questions about system functionality
      /\b(can you|can i|how does|how do|how is|how are)\s+(search|find|play|listen|discover|get|access|use|navigate|work|operate)/i,
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
