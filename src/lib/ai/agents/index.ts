/**
 * AI Agents
 *
 * Central export for all specialized agents.
 *
 * @module ai-agents
 */

export * from './base-agent';
export * from './discovery-agent';
export * from './playback-agent';
export * from './recommendation-agent';
export * from './router-agent';

/**
 * Create and export instances of all agents
 */
import { DiscoveryAgent } from './discovery-agent';
import { PlaybackAgent } from './playback-agent';
import { RecommendationAgent } from './recommendation-agent';
import { RouterAgent } from './router-agent';

// Create default agent instances
export const discoveryAgent = new DiscoveryAgent();
export const playbackAgent = new PlaybackAgent();
export const recommendationAgent = new RecommendationAgent();
export const routerAgent = new RouterAgent();
