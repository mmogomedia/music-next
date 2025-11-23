/**
 * Router Intent Detector
 *
 * Utilities for detecting user intent from messages.
 * Separated from RouterAgent for better maintainability and testability.
 *
 * @module RouterIntentDetector
 */

import {
  PLAYBACK_KEYWORDS,
  RECOMMENDATION_KEYWORDS,
  DISCOVERY_KEYWORDS,
  THEME_KEYWORDS,
  INDUSTRY_KNOWLEDGE_KEYWORDS,
  MALICIOUS_KEYWORDS,
  MUSIC_KEYWORDS,
  OFF_TOPIC_KEYWORDS,
  EXPLICIT_KEYWORDS,
} from './router-keywords';
import { THEME_KEYWORD_WEIGHT } from './agent-config';
import type { RoutingDecision, AgentIntent } from './router-agent';

/**
 * Calculate keyword match score for a message using word boundaries
 * Prevents false positives from substring matching (e.g., "playlist" matching "play")
 */
function calculateKeywordScore(
  message: string,
  keywords: readonly string[]
): number {
  return keywords.filter(keyword => {
    // Use word boundaries to prevent substring false positives
    const regex = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i'
    );
    return regex.test(message);
  }).length;
}

/**
 * Check if message contains industry knowledge keywords
 */
export function isIndustryKnowledgeIntent(message: string): boolean {
  return INDUSTRY_KNOWLEDGE_KEYWORDS.some(keyword => message.includes(keyword));
}

/**
 * Check if message contains malicious intent keywords
 */
export function hasMaliciousIntent(message: string): boolean {
  return MALICIOUS_KEYWORDS.some(keyword => message.includes(keyword));
}

/**
 * Check if message is non-music related
 */
export function hasNonMusicIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // First check if it references music - if so, it's music-related
  const referencesMusic = MUSIC_KEYWORDS.some(keyword => {
    const regex = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i'
    );
    return regex.test(lowerMessage);
  });
  if (referencesMusic) return false;

  // Check for off-topic keywords
  if (
    OFF_TOPIC_KEYWORDS.some(keyword => {
      const regex = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      );
      return regex.test(lowerMessage);
    })
  ) {
    return true;
  }

  // Check for explicit content
  return EXPLICIT_KEYWORDS.some(keyword => {
    const regex = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i'
    );
    return regex.test(lowerMessage);
  });
}

/**
 * Break ties between playback and recommendation intents
 * Uses message patterns to determine the more likely intent
 */
function breakTie(
  playbackScore: number,
  recommendationScore: number,
  message: string
): 'playback' | 'recommendation' {
  // Check for action verbs (stronger signal for playback)
  if (
    /\b(play|start|begin|queue|pause|stop|resume|skip|next|previous)\b/i.test(
      message
    )
  ) {
    return 'playback';
  }
  // Check for question words (stronger signal for recommendation)
  if (
    /\b(what|should|recommend|suggest|want|need|looking for)\b/i.test(message)
  ) {
    return 'recommendation';
  }
  // Default to playback (more action-oriented)
  return 'playback';
}

/**
 * Calculate confidence score from keyword matches
 * Single keyword = 0.8, two keywords = 0.95, three+ = 1.0
 * Also factors in score difference between intents for better confidence
 */
export function calculateConfidence(
  score: number,
  maxScore: number,
  secondMaxScore: number
): number {
  // Base confidence from keyword count
  let baseConfidence: number;
  if (score >= 3) {
    baseConfidence = 1.0;
  } else if (score === 2) {
    baseConfidence = 0.95;
  } else if (score === 1) {
    baseConfidence = 0.8;
  } else {
    baseConfidence = 0.5; // Fallback (shouldn't happen with proper maxScore check)
  }

  // Boost confidence if there's a clear winner (score difference > 1)
  const scoreDiff = maxScore - secondMaxScore;
  if (scoreDiff > 1) {
    baseConfidence = Math.min(1.0, baseConfidence + 0.1);
  }

  return baseConfidence;
}

/**
 * Detect if message is a follow-up query referencing previous conversation
 */
export function isFollowUpQuery(message: string): boolean {
  const followUpPatterns = [
    /\b(that|this|it|them|those)\b/i,
    /\b(play|show|find|get|tell|give)\s+(that|this|it|them|those)\b/i,
    /\b(again|more|another|next|same|similar)\b/i,
  ];
  return followUpPatterns.some(pattern => pattern.test(message));
}

/**
 * Enrich message with conversation context for better intent detection
 */
function enrichMessageWithContext(
  message: string,
  context?: {
    conversationHistory?: Array<{ role: string; content: string }>;
    filters?: { genre?: string; province?: string };
    previousIntent?: string;
  }
): string {
  let enriched = message;

  // Add recent conversation context (last 2-3 messages)
  if (context?.conversationHistory && context.conversationHistory.length > 0) {
    const recent = context.conversationHistory.slice(-3);
    const contextText = recent
      .map(m => m.content)
      .join(' ')
      .toLowerCase();
    enriched = `${enriched} ${contextText}`;
  }

  // Add filter context (genre, province)
  if (context?.filters?.genre) {
    enriched = `${enriched} ${context.filters.genre}`;
  }
  if (context?.filters?.province) {
    enriched = `${enriched} ${context.filters.province}`;
  }

  return enriched;
}

/**
 * Get agent name for intent type
 */
function getAgentForIntent(intent: string): RoutingDecision['agent'] {
  switch (intent) {
    case 'playback':
      return 'PlaybackAgent';
    case 'recommendation':
      return 'RecommendationAgent';
    case 'discovery':
      return 'DiscoveryAgent';
    case 'abuse':
      return 'AbuseGuardAgent';
    case 'industry':
      return 'IndustryInfoAgent';
    default:
      return 'DiscoveryAgent';
  }
}

/**
 * Analyze user intent from message and return routing decision
 * @param message - User message to analyze
 * @param context - Optional context including conversation history and preferences
 */
export function analyzeIntent(
  message: string,
  context?: {
    conversationHistory?: Array<{ role: string; content: string }>;
    previousIntent?: string;
    filters?: { genre?: string; province?: string };
  }
): RoutingDecision {
  const lowerMessage = message.toLowerCase();

  // Check for follow-up queries - use previous intent if available
  if (context?.previousIntent && isFollowUpQuery(message)) {
    return {
      intent: context.previousIntent as AgentIntent,
      confidence: 0.9,
      agent: getAgentForIntent(context.previousIntent),
    };
  }

  // Enrich message with context for better keyword matching
  const enrichedMessage = enrichMessageWithContext(lowerMessage, context);

  // Priority 1: Check for industry knowledge queries
  if (isIndustryKnowledgeIntent(enrichedMessage)) {
    return {
      intent: 'industry',
      confidence: 1,
      agent: 'IndustryInfoAgent',
    };
  }

  // Priority 2: Check for abuse/malicious/non-music queries
  if (
    hasMaliciousIntent(enrichedMessage) ||
    hasNonMusicIntent(enrichedMessage)
  ) {
    return {
      intent: 'abuse',
      confidence: 1,
      agent: 'AbuseGuardAgent',
    };
  }

  // Priority 3: Calculate keyword scores for music intents
  // Use enriched message for better context-aware matching
  const playbackScore = calculateKeywordScore(
    enrichedMessage,
    PLAYBACK_KEYWORDS
  );
  const recommendationScore = calculateKeywordScore(
    enrichedMessage,
    RECOMMENDATION_KEYWORDS
  );
  const discoveryScore = calculateKeywordScore(
    enrichedMessage,
    DISCOVERY_KEYWORDS
  );
  const themeScore = calculateKeywordScore(enrichedMessage, THEME_KEYWORDS);

  // Theme keywords boost discovery score (weighted by configurable multiplier)
  const discoveryScoreWeighted =
    discoveryScore + themeScore * THEME_KEYWORD_WEIGHT;

  // Find the highest score and second highest for confidence calculation
  const scores = [
    { intent: 'playback' as const, score: playbackScore },
    { intent: 'recommendation' as const, score: recommendationScore },
    { intent: 'discovery' as const, score: discoveryScoreWeighted },
  ];
  scores.sort((a, b) => b.score - a.score);
  const maxScore = scores[0].score;
  const secondMaxScore = scores[1]?.score || 0;

  // If no keywords matched, default to discovery with low confidence
  if (maxScore === 0) {
    return {
      intent: 'discovery',
      confidence: 0.1,
      agent: 'DiscoveryAgent',
    };
  }

  // Handle ties between playback and recommendation
  if (
    playbackScore === recommendationScore &&
    playbackScore === maxScore &&
    discoveryScoreWeighted < maxScore
  ) {
    const tieWinner = breakTie(
      playbackScore,
      recommendationScore,
      lowerMessage
    );
    return {
      intent: tieWinner,
      confidence: calculateConfidence(
        tieWinner === 'playback' ? playbackScore : recommendationScore,
        maxScore,
        secondMaxScore
      ),
      agent: tieWinner === 'playback' ? 'PlaybackAgent' : 'RecommendationAgent',
    };
  }

  // Priority order: playback > recommendation > discovery
  // Playback has highest priority because it's more action-oriented
  if (playbackScore >= maxScore) {
    return {
      intent: 'playback',
      confidence: calculateConfidence(playbackScore, maxScore, secondMaxScore),
      agent: 'PlaybackAgent',
    };
  }

  if (recommendationScore >= maxScore) {
    return {
      intent: 'recommendation',
      confidence: calculateConfidence(
        recommendationScore,
        maxScore,
        secondMaxScore
      ),
      agent: 'RecommendationAgent',
    };
  }

  // Default to discovery
  return {
    intent: 'discovery',
    confidence: calculateConfidence(
      discoveryScoreWeighted,
      maxScore,
      secondMaxScore
    ),
    agent: 'DiscoveryAgent',
  };
}
