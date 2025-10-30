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

      let response: AgentResponse;
      switch (decision.intent) {
        case 'discovery':
          response = await this.discoveryAgent.process(message, context);
          break;
        case 'playback':
          response = await this.playbackAgent.process(message, context);
          break;
        case 'recommendation':
          response = await this.recommendationAgent.process(message, context);
          break;
        default:
          // Default to discovery for unknown intents
          response = await this.discoveryAgent.process(message, context);
      }

      return response;
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
      'what else',
      'else is good',
      'other good',
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
      'trending',
      'track',
      'song',
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
      // No clear intent, default to discovery as fallback
      return {
        intent: 'discovery',
        confidence: 0.1,
        agent: 'DiscoveryAgent',
      };
    }

    // Calculate normalized confidence (0 to 1 scale where > 0.3 is good)
    const calculateConfidence = (score: number) => {
      // Single keyword match = 0.8, two keywords = 0.95, three+ = 1.0
      if (score >= 3) return 1.0;
      if (score === 2) return 0.95;
      if (score === 1) return 0.8;
      return 0.5; // Shouldn't happen with maxScore check
    };

    // Priority order: playback > recommendation > discovery
    // Playback has highest priority because it's more action-oriented
    if (playbackScore >= maxScore) {
      return {
        intent: 'playback',
        confidence: calculateConfidence(playbackScore),
        agent: 'PlaybackAgent',
      };
    }

    if (recommendationScore >= maxScore) {
      return {
        intent: 'recommendation',
        confidence: calculateConfidence(recommendationScore),
        agent: 'RecommendationAgent',
      };
    }

    // Default to discovery
    return {
      intent: 'discovery',
      confidence: calculateConfidence(discoveryScore),
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
