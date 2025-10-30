/**
 * Router Agent
 *
 * Main agent that routes user queries to the appropriate specialized agent.
 * Analyzes user intent and delegates to Discovery, Playback, or Recommendation agents.
 *
 * @module RouterAgent
 */

import type { AgentContext, AgentResponse } from './base-agent';
import { DiscoveryAgent } from './discovery-agent';
import { PlaybackAgent } from './playback-agent';
import { RecommendationAgent } from './recommendation-agent';
import type { AIProvider } from '@/types/ai-service';

export type AgentIntent =
  | 'discovery'
  | 'playback'
  | 'recommendation'
  | 'unknown';

export interface RoutingDecision {
  intent: AgentIntent;
  confidence: number;
  agent: 'DiscoveryAgent' | 'PlaybackAgent' | 'RecommendationAgent';
}

export class RouterAgent {
  private discoveryAgent: DiscoveryAgent;
  private playbackAgent: PlaybackAgent;
  private recommendationAgent: RecommendationAgent;

  constructor(provider: AIProvider = 'openai') {
    this.discoveryAgent = new DiscoveryAgent(provider);
    this.playbackAgent = new PlaybackAgent(provider);
    this.recommendationAgent = new RecommendationAgent(provider);
  }

  /**
   * Route a user message to the appropriate agent
   */
  async route(message: string, context?: AgentContext): Promise<AgentResponse> {
    try {
      const decision = this.analyzeIntent(message);
      console.log(
        `Routing to ${decision.agent} with intent: ${decision.intent} (confidence: ${decision.confidence})`
      );

      switch (decision.intent) {
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
    } catch (error) {
      console.error('RouterAgent error:', error);
      throw error;
    }
  }

  /**
   * Analyze user intent from message
   */
  private analyzeIntent(message: string): RoutingDecision {
    const lowerMessage = message.toLowerCase();

    // Playback keywords
    const playbackKeywords = [
      'play',
      'start',
      'begin',
      'resume',
      'pause',
      'stop',
      'shuffle',
      'queue',
      'add to',
      'next',
      'previous',
      'skip',
    ];
    const playbackScore = playbackKeywords.filter(keyword =>
      lowerMessage.includes(keyword)
    ).length;

    // Recommendation keywords
    const recommendationKeywords = [
      'recommend',
      'suggest',
      'similar',
      'like',
      'discover',
      'new music',
      'fresh',
      'what should i',
      'tell me what',
      'help me find',
      'best',
      'top',
    ];
    const recommendationScore = recommendationKeywords.filter(keyword =>
      lowerMessage.includes(keyword)
    ).length;

    // Discovery keywords (general search/browse)
    const discoveryKeywords = [
      'find',
      'search',
      'show',
      'list',
      'browse',
      'look for',
      'what is',
      'who is',
      'tell me about',
      'artist',
      'album',
      'playlist',
    ];
    const discoveryScore = discoveryKeywords.filter(keyword =>
      lowerMessage.includes(keyword)
    ).length;

    // Calculate intent based on scores
    const maxScore = Math.max(
      playbackScore,
      recommendationScore,
      discoveryScore
    );

    if (maxScore === 0) {
      // No clear intent, default to discovery
      return {
        intent: 'unknown',
        confidence: 0,
        agent: 'DiscoveryAgent',
      };
    }

    // Priority order: playback > recommendation > discovery
    // Playback has highest priority because it's more action-oriented
    if (playbackScore >= maxScore) {
      return {
        intent: 'playback',
        confidence: Math.min(playbackScore / playbackKeywords.length, 1),
        agent: 'PlaybackAgent',
      };
    }

    if (recommendationScore >= maxScore) {
      return {
        intent: 'recommendation',
        confidence: Math.min(
          recommendationScore / recommendationKeywords.length,
          1
        ),
        agent: 'RecommendationAgent',
      };
    }

    // Default to discovery
    return {
      intent: 'discovery',
      confidence: Math.min(discoveryScore / discoveryKeywords.length, 1),
      agent: 'DiscoveryAgent',
    };
  }

  /**
   * Get routing decision without executing
   */
  getRoutingDecision(message: string): RoutingDecision {
    return this.analyzeIntent(message);
  }
}
