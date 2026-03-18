/**
 * Agent Configuration
 *
 * Centralized configuration constants for AI agents.
 * Makes it easy to update thresholds and limits across the system.
 *
 * @module AgentConfig
 */

/**
 * Minimum track strength score required for tracks to be returned in AI responses
 * Tracks with strength < MIN_TRACK_STRENGTH are filtered out
 */
export const MIN_TRACK_STRENGTH = 70;

/**
 * Maximum number of related/other tracks to include in discovery responses
 */
export const MAX_RELATED_TRACKS = 3;

/**
 * Maximum number of tracks to return in any discovery response (main + other combined)
 * Hard limit enforced across all discovery responses
 */
export const MAX_TRACKS_PER_RESPONSE = 10;

/**
 * Agent-specific temperature overrides
 * Some agents benefit from different temperature settings
 */
export const AGENT_TEMPERATURE_OVERRIDES = {} as const;

/**
 * Theme keyword weight multiplier for discovery intent scoring
 * Theme keywords are weighted more heavily because they indicate specific thematic searches
 */
export const THEME_KEYWORD_WEIGHT = 1.5;

/**
 * Minimum confidence threshold for keyword-based routing
 * Below this threshold, LLM fallback may be used (if available)
 */
export const MIN_KEYWORD_CONFIDENCE_THRESHOLD = 0.8;

/**
 * Maximum confidence threshold for using clarification
 * If confidence is below this AND no helpful context exists, ask for clarification
 * instead of defaulting to discovery
 */
export const MAX_CLARIFICATION_CONFIDENCE_THRESHOLD = 0.3;
