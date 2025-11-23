/**
 * Router Agent
 *
 * Main agent that routes user queries to the appropriate specialized agent.
 * Analyzes user intent and delegates to Discovery, Playback, Recommendation,
 * AbuseGuard, or IndustryInfo agents.
 *
 * @module RouterAgent
 */

import type { AgentContext, AgentResponse } from './base-agent';
import { DiscoveryAgent } from './discovery-agent';
import { PlaybackAgent } from './playback-agent';
import { RecommendationAgent } from './recommendation-agent';
import { AbuseGuardAgent } from './abuse-guard-agent';
import { IndustryInfoAgent } from './industry-info-agent';
import { IntentClassifierAgent } from './intent-classifier-agent';
import { analyzeIntent } from './router-intent-detector';
import { MIN_KEYWORD_CONFIDENCE_THRESHOLD } from './agent-config';
import { logRoutingDecision } from '../routing-decision-logger';
import { logger } from '@/lib/utils/logger';
import type { AIProvider } from '@/types/ai-service';

export type AgentIntent =
  | 'discovery'
  | 'playback'
  | 'recommendation'
  | 'abuse'
  | 'industry'
  | 'unknown';

export interface RoutingDecision {
  intent: AgentIntent;
  confidence: number;
  agent:
    | 'DiscoveryAgent'
    | 'PlaybackAgent'
    | 'RecommendationAgent'
    | 'AbuseGuardAgent'
    | 'IndustryInfoAgent';
}

/**
 * Router Agent
 *
 * Routes user queries to appropriate specialized agents based on intent analysis.
 */
export class RouterAgent {
  private discoveryAgent: DiscoveryAgent;
  private playbackAgent: PlaybackAgent;
  private recommendationAgent: RecommendationAgent;
  private abuseGuardAgent: AbuseGuardAgent;
  private industryInfoAgent: IndustryInfoAgent;
  private intentClassifierAgent: IntentClassifierAgent;

  /**
   * Create a new RouterAgent instance
   * @param provider - AI provider to use for specialized agents (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    this.discoveryAgent = new DiscoveryAgent(provider);
    this.playbackAgent = new PlaybackAgent(provider);
    this.recommendationAgent = new RecommendationAgent(provider);
    this.abuseGuardAgent = new AbuseGuardAgent();
    this.industryInfoAgent = new IndustryInfoAgent();
    this.intentClassifierAgent = new IntentClassifierAgent(provider);
  }

  /**
   * Route a user message to the appropriate agent
   * Uses hybrid approach: keyword-based fast path + LLM fallback for low confidence
   */
  async route(message: string, context?: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();
    let keywordLatency: number | undefined;
    let llmLatency: number | undefined;
    let keywordDecision: RoutingDecision;
    let llmDecision: RoutingDecision | undefined;

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

      // Build context for intent analysis
      const intentContext = {
        conversationHistory: context?.conversationHistory?.map(msg => ({
          role: msg.role || 'user',
          content:
            typeof msg.content === 'string'
              ? msg.content
              : JSON.stringify(msg.content),
        })),
        filters: context?.filters,
        // Extract previous intent from context metadata if available
        previousIntent: context?.metadata?.previousIntent as string | undefined,
      };

      // Fast path: keyword-based intent detection
      const keywordStartTime = Date.now();
      keywordDecision = analyzeIntent(message, intentContext);
      keywordLatency = Date.now() - keywordStartTime;

      logger.info('[RouterAgent] Keyword-based decision:', {
        intent: keywordDecision.intent,
        confidence: keywordDecision.confidence,
        agent: keywordDecision.agent,
        latency: keywordLatency,
      });

      let finalDecision = keywordDecision;
      let routingMethod: 'keyword' | 'llm' | 'hybrid' = 'keyword';

      logger.info('[RouterAgent] Confidence threshold check:', {
        confidence: keywordDecision.confidence,
        threshold: MIN_KEYWORD_CONFIDENCE_THRESHOLD,
        needsLLM: keywordDecision.confidence < MIN_KEYWORD_CONFIDENCE_THRESHOLD,
      });

      // Emit initial routing decision (keyword-based)
      context?.emitEvent?.({
        type: 'routing_decision',
        intent: keywordDecision.intent,
        confidence: keywordDecision.confidence,
        method: 'keyword',
        agent: keywordDecision.agent,
        latency: {
          keyword: keywordLatency,
          total: keywordLatency,
        },
        timestamp: new Date().toISOString(),
      });

      // If confidence is below threshold, use LLM fallback
      if (keywordDecision.confidence < MIN_KEYWORD_CONFIDENCE_THRESHOLD) {
        // Emit LLM classifying event
        context?.emitEvent?.({
          type: 'llm_classifying',
          message: 'Analyzing your request more carefully...',
          stage: 'llm_classification',
          timestamp: new Date().toISOString(),
        });

        try {
          const llmStartTime = Date.now();
          llmDecision = await this.intentClassifierAgent.classifyIntent(
            message,
            context
          );
          llmLatency = Date.now() - llmStartTime;

          // Use LLM decision if it has higher confidence
          if (llmDecision.confidence > keywordDecision.confidence) {
            finalDecision = llmDecision;
            routingMethod = 'llm';
          } else {
            routingMethod = 'hybrid'; // LLM was used but keyword decision was kept
          }

          // Emit updated routing decision with LLM results
          context?.emitEvent?.({
            type: 'routing_decision',
            intent: finalDecision.intent,
            confidence: finalDecision.confidence,
            method: routingMethod,
            agent: finalDecision.agent,
            latency: {
              keyword: keywordLatency,
              llm: llmLatency,
              total: Date.now() - startTime,
            },
            timestamp: new Date().toISOString(),
          });
        } catch (llmError) {
          // Fallback to keyword decision if LLM fails
          console.warn(
            'LLM intent classification failed, using keyword decision:',
            llmError
          );
        }
      }

      const totalLatency = Date.now() - startTime;

      // Log routing decision (async, non-blocking)
      logRoutingDecision({
        userId: context?.userId,
        conversationId: context?.conversationId,
        message,
        keywordDecision,
        llmDecision,
        finalDecision,
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
          previousIntent: finalDecision.intent,
          routingMethod,
          keywordLatency,
          llmLatency,
          totalLatency,
        },
      };

      // Emit agent processing event
      const agentMessages: Record<string, string> = {
        DiscoveryAgent: 'Searching our music library...',
        PlaybackAgent: 'Preparing playback...',
        RecommendationAgent: 'Finding personalized recommendations...',
        AbuseGuardAgent: 'Processing request...',
        IndustryInfoAgent: 'Processing request...',
      };

      context?.emitEvent?.({
        type: 'agent_processing',
        agent: finalDecision.agent,
        message:
          agentMessages[finalDecision.agent] || 'Processing your request...',
        stage: 'agent_execution',
        timestamp: new Date().toISOString(),
      });

      return await this.routeToAgent(finalDecision, message, enhancedContext);
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
      case 'discovery':
        return await this.discoveryAgent.process(message, context);
      case 'playback':
        return await this.playbackAgent.process(message, context);
      case 'recommendation':
        return await this.recommendationAgent.process(message, context);
      default:
        // Default to discovery for unknown intents
        return await this.discoveryAgent.process(message, context);
    }
  }

  /**
   * Get routing decision without executing
   * Useful for testing and debugging
   */
  getRoutingDecision(message: string): RoutingDecision {
    return analyzeIntent(message);
  }
}
