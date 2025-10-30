/**
 * AI Agents
 *
 * Central export for all specialized agents.
 *
 * @module ai-agents
 */

export * from './base-agent';
export * from './discovery-agent';

/**
 * Create and export an instance of the discovery agent
 */
import { DiscoveryAgent } from './discovery-agent';

// Create a default discovery agent instance
export const discoveryAgent = new DiscoveryAgent();
