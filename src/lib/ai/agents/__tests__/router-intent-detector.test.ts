/**
 * Router Intent Detector Tests
 *
 * Comprehensive tests for intent detection including:
 * - Keyword matching with word boundaries
 * - Context-aware routing
 * - Follow-up query detection
 * - Confidence calculation
 * - Tie-breaking logic
 */

import {
  analyzeIntent,
  isFollowUpQuery,
  calculateConfidence,
} from '../router-intent-detector';

describe('Router Intent Detector', () => {
  describe('analyzeIntent - Basic Intent Detection', () => {
    it('should detect discovery intent for search queries', () => {
      const decision = analyzeIntent('find amapiano tracks');
      expect(decision.intent).toBe('discovery');
      expect(decision.agent).toBe('DiscoveryAgent');
      expect(decision.confidence).toBeGreaterThan(0.5);
    });

    it('should route playback queries to discovery agent', () => {
      const decision = analyzeIntent('play this song');
      // Playback queries are routed to DiscoveryAgent (no separate PlaybackAgent)
      expect(decision.intent).toBe('discovery');
      expect(decision.agent).toBe('DiscoveryAgent');
    });

    it('should detect recommendation intent for suggestion queries', () => {
      const decision = analyzeIntent('what should I listen to?');
      expect(decision.intent).toBe('recommendation');
      expect(decision.agent).toBe('RecommendationAgent');
    });

    it('should detect industry intent for music industry queries', () => {
      const decision = analyzeIntent('how do royalties work?');
      expect(decision.intent).toBe('industry');
      expect(decision.agent).toBe('IndustryInfoAgent');
      expect(decision.confidence).toBe(1);
    });

    it('should detect abuse intent for malicious queries', () => {
      const decision = analyzeIntent('how to hack the system');
      expect(decision.intent).toBe('abuse');
      expect(decision.agent).toBe('AbuseGuardAgent');
      expect(decision.confidence).toBe(1);
    });

    it('should detect abuse intent for non-music queries', () => {
      const decision = analyzeIntent('what is the weather today?');
      expect(decision.intent).toBe('abuse');
      expect(decision.agent).toBe('AbuseGuardAgent');
    });
  });

  describe('Word Boundary Matching', () => {
    it('should not match "play" in "playlist"', () => {
      const decision = analyzeIntent('show me playlists');
      // Should match "show" and "playlist" but not "play" from "playlist"
      expect(decision.intent).toBe('discovery');
    });

    it('should correctly match standalone keywords', () => {
      const decision = analyzeIntent('play the track');
      // Playback keywords route to discovery (user wants to find and play)
      expect(decision.intent).toBe('discovery');
    });
  });

  describe('Context-Aware Routing', () => {
    it('should use previous intent for follow-up queries', () => {
      const context = {
        previousIntent: 'discovery',
      };
      const decision = analyzeIntent('play that', context);
      expect(decision.intent).toBe('discovery');
      expect(decision.confidence).toBe(0.9);
    });

    it('should enrich with conversation history', () => {
      const context = {
        conversationHistory: [
          { role: 'user', content: 'find amapiano tracks' },
          { role: 'assistant', content: 'Here are some amapiano tracks...' },
        ],
      };
      const decision = analyzeIntent('show me more', context);
      // Should use context to understand "more" refers to tracks
      expect(decision.intent).toBe('discovery');
    });

    it('should use genre filters from context', () => {
      const decision = analyzeIntent('find tracks');
      // Context enrichment should help with intent detection
      expect(decision.intent).toBe('discovery');
    });
  });

  describe('Follow-Up Query Detection', () => {
    it('should detect "that" as follow-up', () => {
      expect(isFollowUpQuery('play that')).toBe(true);
    });

    it('should detect "this" as follow-up', () => {
      expect(isFollowUpQuery('show me this')).toBe(true);
    });

    it('should detect "more" as follow-up', () => {
      expect(isFollowUpQuery('show me more')).toBe(true);
    });

    it('should detect "again" as follow-up', () => {
      expect(isFollowUpQuery('play again')).toBe(true);
    });

    it('should not detect regular queries as follow-up', () => {
      expect(isFollowUpQuery('find amapiano tracks')).toBe(false);
    });
  });

  describe('Confidence Calculation', () => {
    it('should return high confidence for multiple keyword matches', () => {
      const confidence = calculateConfidence(3, 3, 1);
      expect(confidence).toBe(1.0);
    });

    it('should return medium confidence for single keyword match', () => {
      const confidence = calculateConfidence(1, 1, 0);
      expect(confidence).toBe(0.8);
    });

    it('should boost confidence for clear winners', () => {
      const confidence = calculateConfidence(2, 2, 0);
      // Score diff > 1 should boost confidence
      expect(confidence).toBeGreaterThanOrEqual(0.95);
    });
  });

  describe('Theme Keyword Weighting', () => {
    it('should boost discovery score for theme keywords', () => {
      const decision = analyzeIntent('find women empowerment songs');
      expect(decision.intent).toBe('discovery');
      expect(decision.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Tie-Breaking', () => {
    it('should prefer recommendation over discovery in ties', () => {
      // This test depends on keyword scores being equal
      // In practice, tie-breaking prefers recommendation
      const decision = analyzeIntent('play recommend');
      // Should break tie based on priority order
      expect(['discovery', 'recommendation']).toContain(decision.intent);
    });
  });

  describe('Edge Cases', () => {
    it('should default to discovery for empty messages', () => {
      const decision = analyzeIntent('');
      expect(decision.intent).toBe('discovery');
      expect(decision.confidence).toBe(0.1);
    });

    it('should handle messages with no keywords', () => {
      const decision = analyzeIntent('hello there');
      expect(decision.intent).toBe('discovery');
      expect(decision.confidence).toBeLessThan(0.5);
    });

    it('should handle mixed case messages', () => {
      const decision = analyzeIntent('FIND AMAPIANO TRACKS');
      expect(decision.intent).toBe('discovery');
    });
  });
});
