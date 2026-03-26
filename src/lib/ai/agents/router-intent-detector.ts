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
 * Note: Playback queries are routed to DiscoveryAgent (no separate PlaybackAgent)
 */
function getAgentForIntent(intent: string): RoutingDecision['agent'] {
  switch (intent) {
    case 'preferences':
      return 'PreferencesAgent';
    case 'recommendation':
      return 'RecommendationAgent';
    case 'discovery':
      return 'DiscoveryAgent';
    case 'abuse':
      return 'AbuseGuardAgent';
    case 'industry':
      return 'IndustryInfoAgent';
    case 'help':
      return 'HelpAgent';
    case 'timeline':
      return 'TimelineAgent';
    case 'audit':
      return 'AuditAgent';
    default:
      return 'DiscoveryAgent';
  }
}

/**
 * Check if message matches preferences intent patterns
 */
function isPreferencesIntent(message: string): boolean {
  const patterns = [
    /\bmy (music\s+)?(taste|preferences?|history|profile|likes?|favourites?|favorites?)\b/i,
    /\bwhat (music|songs?|tracks?|genres?|artists?)\s+do\s+i\s+(like|love|listen to|prefer|enjoy)\b/i,
    /\bwhat (are|have been) my (music\s+)?(preferences?|genres?|artists?|favourites?|favorites?|top)\b/i,
    /\bshow me (my|what) (music\s+)?(preferences?|taste|history|likes?|favourites?|favorites?)\b/i,
    /\bwhat (have|did) i (been\s+)?(listen(ed|ing) to|play(ed|ing))\b/i,
    /\bmy listening history\b/i,
    /\btell me (about\s+)?(my|what i) (like|prefer|listen to|enjoy)\b/i,
  ];
  return patterns.some(p => p.test(message));
}

/**
 * Check if message matches help/meta-question intent patterns
 */
function isHelpIntent(message: string): boolean {
  const patterns = [
    /\b(how can|how do|how to)\s+(i|you|we)\s+(search|find|use|play|discover|get|access|navigate|work|operate)/i,
    /\b(what can|what does|what is|what are)\s+(you|this|it|the system|the app|flemoji)\s+(do|can|help|support|offer|provide)/i,
    /\b(where|how)\s+(can|do|to|is|are)\s+(i|you|we)\s+(search|find|play|discover|get|access|use|navigate)/i,
    /\b(can you|can i|how does|how do|how is|how are)\s+(search|find|discover|get|access|use|navigate|work|operate)/i,
    /\b(how|what|where|when|why)\s+(can|do|to|is|are|does)\s+(i|you|we)\s+.*\b(here|this|system|app|platform|website|site)\b/i,
  ];
  return patterns.some(p => p.test(message));
}

/**
 * Check if message matches career audit intent patterns
 */
function isAuditIntent(message: string): boolean {
  const patterns = [
    /\baudit\b/i,
    /\bcareer (check|research|readiness|review|analysis|audit)\b/i,
    /\breadiness\b/i,
    /\bhow ready am i\b/i,
    /\bcheck my (profile|career|platforms?|readiness)\b/i,
    /\bresearch my (career|profile|platforms?|social)\b/i,
    /\bwhat (am i|are we) missing\b/i,
    /\bgaps? in my (profile|career|marketing|platforms?)\b/i,
    /\bcareer (gaps?|score|review)\b/i,
    /\bartist (audit|score|check|readiness)\b/i,
    /\banalyse? my (career|profile|readiness)\b/i,
    /\bhow (complete|strong|ready) (is|am) (my|i)\b/i,
  ];
  return patterns.some(p => p.test(message));
}

/**
 * Check if message matches timeline/feed intent patterns
 */
function isTimelineIntent(message: string): boolean {
  const patterns = [
    /\b(posts?|feed|timeline|news)\b/i,
    /\bwhat.*(people|artists?|users?).*(say|post|shar)/i,
    /\b(latest|recent).*(update|post|news)\b/i,
  ];
  return patterns.some(p => p.test(message));
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

  // Priority 1: Check for abuse/malicious/non-music queries FIRST
  // This must be checked before anything else to protect against abuse
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

  // Priority 2: Check for industry knowledge queries
  if (isIndustryKnowledgeIntent(enrichedMessage)) {
    return {
      intent: 'industry',
      confidence: 1,
      agent: 'IndustryInfoAgent',
    };
  }

  // Priority 3a: Check for preferences queries (first-person taste/history)
  if (isPreferencesIntent(message)) {
    return {
      intent: 'preferences',
      confidence: 0.95,
      agent: 'PreferencesAgent',
    };
  }

  // Priority 3b: Check for help/meta-question queries
  if (isHelpIntent(message)) {
    return {
      intent: 'help',
      confidence: 0.9,
      agent: 'HelpAgent',
    };
  }

  // Priority 3c: Check for timeline/feed queries
  if (isTimelineIntent(message)) {
    return {
      intent: 'timeline',
      confidence: 0.85,
      agent: 'TimelineAgent',
    };
  }

  // Priority 3c2: Check for career audit queries
  if (isAuditIntent(message)) {
    return {
      intent: 'audit',
      confidence: 0.95,
      agent: 'AuditAgent',
    };
  }

  // Priority 3d: Thematic / semantic queries — mood, feeling, or topic-based discovery.
  // These always go to DiscoveryAgent (semantic search fast-path). Must be checked before
  // keyword scoring so "I need something about X" doesn't fall through to LLM.
  if (hasThematicTrigger(lowerMessage)) {
    return {
      intent: 'discovery',
      confidence: 0.9,
      agent: 'DiscoveryAgent',
    };
  }

  // Priority 3e: Unambiguous discovery queries — always route to DiscoveryAgent regardless
  // of conversation history. These patterns can never be a recommendation request.
  const isUnambiguousDiscovery =
    // Specific song/track title: "song called X", "track named X"
    /\b(?:song|track|music)\s+(?:called|named|titled)\b/i.test(message) ||
    // Genre list: "show me genres", "what genres", "all genres", "list genres"
    /\b(?:what|show|list|all|available)\b.+\bgenres?\b/i.test(message) ||
    /\bgenres?\s+(?:available|on flemoji|here|do you have|are there)\b/i.test(
      message
    ) ||
    // Trending: always a browse/discovery action
    /\btrending\b/i.test(message) ||
    /\btop\s+(?:tracks?|songs?|charts?)\b/i.test(message);

  if (isUnambiguousDiscovery) {
    return {
      intent: 'discovery',
      confidence: 0.98,
      agent: 'DiscoveryAgent',
    };
  }

  // Priority 4: Calculate keyword scores for music intents
  // Use enriched message for better context-aware matching
  // Note: Playback keywords are treated as discovery (user wants to find/play specific content)
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
  // Playback keywords also boost discovery (user wants to play = find and play)
  const discoveryScoreWeighted =
    discoveryScore + themeScore * THEME_KEYWORD_WEIGHT + playbackScore;

  // Find the highest score and second highest for confidence calculation
  const scores = [
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

  // Priority order: recommendation > discovery
  // If recommendation score is highest, route to recommendation
  // Otherwise, route to discovery (includes playback keywords)
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

  // Default to discovery (includes playback keywords)
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

/**
 * Structured metadata extracted from a discovery query.
 * Enables DiscoveryAgent to select tools deterministically without LLM.
 */
export interface DiscoveryMetadata {
  subIntent:
    | 'artist_tracks'
    | 'artist_profile'
    | 'genre_tracks'
    | 'genre_playlists'
    | 'trending'
    | 'genres_list'
    | 'search'
    | 'semantic_search';
  entities: {
    artist?: string;
    genre?: string;
    query?: string;
  };
}

/**
 * Maps mood/emotion keywords to structured mood + attribute tags used by searchTracksByTheme.
 * Each entry lists keywords that trigger the match and the resulting Flemoji mood/attribute values.
 */
const THEMATIC_KEYWORD_MAP: Array<{
  keywords: string[];
  moods: string[];
  attributes: string[];
}> = [
  {
    keywords: ['in love', 'falling in love', 'love song', 'love songs'],
    moods: ['Romantic'],
    attributes: ['Love'],
  },
  {
    keywords: ['romantic', 'romance'],
    moods: ['Romantic'],
    attributes: ['Love'],
  },
  {
    keywords: ['heartbreak', 'heartbroken', 'broken heart'],
    moods: ['Melancholic'],
    attributes: ['Heartbreak'],
  },
  {
    keywords: ['sad', 'sadness', 'cry', 'crying', 'tears'],
    moods: ['Melancholic'],
    attributes: [],
  },
  {
    keywords: ['happy', 'happiness', 'joyful', 'joy', 'cheerful'],
    moods: ['Uplifting', 'Happy'],
    attributes: [],
  },
  {
    keywords: ['celebrate', 'celebration', 'party'],
    moods: ['Energetic'],
    attributes: ['Celebratory'],
  },
  {
    keywords: ['chill', 'relaxed', 'relax', 'calm', 'peaceful', 'mellow'],
    moods: ['Chill'],
    attributes: [],
  },
  {
    keywords: [
      'motivated',
      'motivate',
      'motivation',
      'pump up',
      'energetic',
      'hype',
    ],
    moods: ['Energetic', 'Uplifting'],
    attributes: [],
  },
  {
    keywords: ['worship', 'spiritual', 'prayer', 'praise'],
    moods: ['Spiritual'],
    attributes: ['Worship'],
  },
  {
    keywords: ['family', 'mother', 'mothers', 'mom', 'mum', 'father', 'dad'],
    moods: [],
    attributes: ['Family'],
  },
  {
    keywords: ['empowerment', 'empowering', 'girl power'],
    moods: ['Uplifting'],
    attributes: ['Women empowerment'],
  },
  {
    keywords: ['self-love', 'self love', 'confidence'],
    moods: ['Uplifting'],
    attributes: ['Self-love'],
  },
  {
    keywords: ['nostalgic', 'nostalgia', 'throwback'],
    moods: ['Nostalgic'],
    attributes: [],
  },
];

/**
 * Thematic trigger phrases — indicate the user is expressing a mood, feeling,
 * or topic rather than a genre/artist name.
 * Used by both detectThematicQuery() and the routing priority check.
 */
const THEMATIC_TRIGGERS: RegExp[] = [
  // Feeling / mood expressions
  /\bi\s+feel\b/i, // "I feel in love"
  /\bi(?:'m|\s+am)\s+feeling\b/i, // "I'm feeling sad"
  /\bfeeling\s+\w/i, // "feeling romantic"
  /\bwhen\s+(?:you(?:'re)?|i(?:'m)?)\b/i, // "when you're in love"
  /\bin\s+a\s+\w+\s+(?:mood|vibe)\b/i, // "in a romantic mood"
  // Songs/music explicitly about a topic
  /\bsongs?\s+(?:about|for|that|when)\b/i, // "songs about love"
  /\bmusic\s+(?:about|for|that|when)\b/i, // "music about love"
  /\btracks?\s+(?:about|for|that|when)\b/i, // "tracks about X"
  // "something/anything about X" — covers "I need something that is about X"
  /\b(?:something|anything)\s+(?:that\s+(?:is|are)\s+)?about\b/i,
  // "I want/need something about X"
  /\b(?:want|need|looking for)\s+(?:something|music|songs?|tracks?)\s+(?:that\s+(?:is|are)\s+)?about\b/i,
  // "something/music/songs that celebrate/speak/talk/express"
  /\b(?:something|music|songs?|tracks?)\s+that\s+(?:celebrat|express|speaks?|talks?|sings?|is\s+about|empow)/i,
  // "about [topic]" at the start of the phrase (after "show me" etc. is stripped)
  /\babout\s+(?:women|men|family|love|life|faith|god|hope|strength|empowerment|struggle|heartbreak|friendship|unity|culture|identity|resilience|freedom)\b/i,
];

/**
 * Returns true if the message contains any thematic trigger phrase.
 * Does NOT check the keyword map — the semantic embedding model handles matching.
 */
function hasThematicTrigger(lower: string): boolean {
  return THEMATIC_TRIGGERS.some(p => p.test(lower));
}

/**
 * Extract structured mood + attribute tags from a thematic query string.
 * Uses THEMATIC_KEYWORD_MAP — the same map used by searchTracksByTheme.
 *
 * @param query - Raw query string (lowercased or not; comparison is case-insensitive)
 * @returns Deduplicated moods and attributes matching the query
 */
export function extractTagsFromQuery(query: string): {
  moods: string[];
  attributes: string[];
} {
  const lower = query.toLowerCase();
  const moods = new Set<string>();
  const attributes = new Set<string>();

  for (const entry of THEMATIC_KEYWORD_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      entry.moods.forEach(m => moods.add(m));
      entry.attributes.forEach(a => attributes.add(a));
    }
  }

  return { moods: [...moods], attributes: [...attributes] };
}

/**
 * Detect thematic/emotional intent from a discovery query.
 * Kept for backward-compatibility; now delegates to hasThematicTrigger.
 */
// eslint-disable-next-line no-unused-vars
function detectThematicQuery(lower: string): true | null {
  return hasThematicTrigger(lower) ? true : null;
}

/**
 * Extract sub-intent and named entities from a discovery message.
 * Returns null when the query is too ambiguous for deterministic routing.
 * Designed to be permissive — when in doubt, return a 'search' sub-intent
 * so the fast path fires and we avoid relying on LLM tool selection.
 */
export function extractDiscoveryMetadata(
  message: string
): DiscoveryMetadata | null {
  const lower = message.toLowerCase().trim();

  // --- Genres list ---
  if (
    /\b(what|list|show|available)\b.*(genres?|music types?)\b/i.test(lower) ||
    /\bgenres?\s+(available|on flemoji|here)\b/i.test(lower) ||
    /^(what|show me|list)\s+genres?\s*\??$/i.test(lower)
  ) {
    return { subIntent: 'genres_list', entities: {} };
  }

  // --- Trending ---
  if (
    /\btrending\b/i.test(lower) ||
    /\btop (tracks?|songs?|music|charts?)\b/i.test(lower) ||
    /\b(popular|hottest|biggest)\s+(tracks?|songs?|music|right now)\b/i.test(
      lower
    )
  ) {
    return { subIntent: 'trending', entities: {} };
  }

  // --- Artist profile (who is / tell me about) ---
  const artistProfileMatch = lower.match(
    /\b(?:who is|tell me about|artist profile\s+for?|about artist)\s+(.+)/i
  );
  if (artistProfileMatch) {
    const artist = artistProfileMatch[1].trim().replace(/[?.!]+$/, '');
    if (artist.length > 0 && artist.length < 60) {
      return { subIntent: 'artist_profile', entities: { artist } };
    }
  }

  // --- Artist tracks: "music/tracks/songs by X" or "X's music" or "show me X's tracks" ---
  const artistByMatch = lower.match(/\b(?:music|tracks?|songs?)\s+by\s+(.+)/i);
  if (artistByMatch) {
    const artist = artistByMatch[1].trim().replace(/[?.!]+$/, '');
    if (artist.length > 0 && artist.length < 60) {
      return { subIntent: 'artist_tracks', entities: { artist } };
    }
  }
  const possessiveMatch = lower.match(
    /\b(?:show me|find|play|get)\s+(.+?)'s\s+(?:music|tracks?|songs?)\b/i
  );
  if (possessiveMatch) {
    const artist = possessiveMatch[1].trim();
    if (artist.length > 0 && artist.length < 60) {
      return { subIntent: 'artist_tracks', entities: { artist } };
    }
  }
  // "by [artist]" at start of message
  const byAtStartMatch = lower.match(/^by\s+(.+)/i);
  if (byAtStartMatch) {
    const artist = byAtStartMatch[1].trim().replace(/[?.!]+$/, '');
    if (artist.length > 0 && artist.length < 60) {
      return { subIntent: 'artist_tracks', entities: { artist } };
    }
  }

  // --- Genre playlists ---
  const genrePlaylistMatch = lower.match(
    /\b(?:playlists?)\s+(?:by|in|for)?\s*genre\s+(.+)/i
  );
  if (genrePlaylistMatch) {
    const genre = genrePlaylistMatch[1].trim().replace(/[?.!]+$/, '');
    if (genre.length > 0 && genre.length < 40) {
      return { subIntent: 'genre_playlists', entities: { genre } };
    }
  }

  // --- Genre tracks with explicit suffix: "find amapiano tracks", "show me afrobeat music" ---
  const genreTracksSuffixMatch = lower.match(
    /\b(?:find|show me|search|get|play|give me)\s+(?:some\s+|more\s+)?(.+?)\s+(?:tracks?|songs?|music|vibes?)\b/i
  );
  if (genreTracksSuffixMatch) {
    const genre = genreTracksSuffixMatch[1].trim();
    const nonGenreWords = new Set([
      'trending',
      'popular',
      'random',
      'my',
      'some',
      'good',
      'great',
      'more',
      'the',
      'a',
      'an',
      'any',
      'other',
    ]);
    if (genre.length > 0 && genre.length < 40 && !nonGenreWords.has(genre)) {
      return { subIntent: 'genre_tracks', entities: { genre } };
    }
  }

  // --- Specific song/track title: "a song called X", "a track named X", "looking for X called Y" ---
  // Must come before the generic "looking for" catch-all so we extract just the title, not the full phrase.
  const titleSearchMatch = lower.match(
    /\b(?:song|track|music)\s+(?:called|named|titled)\s+(.+?)(?:\s+by\s+|\s*$)/i
  );
  if (titleSearchMatch) {
    const query = titleSearchMatch[1].trim().replace(/[?.!]+$/, '');
    if (query.length > 0 && query.length < 100) {
      return { subIntent: 'search', entities: { query } };
    }
  }

  // --- Generic search: "search for X", "find X" ---
  const explicitSearchMatch = lower.match(
    /\b(?:search for|look for|looking for)\s+(.+)/i
  );
  if (explicitSearchMatch) {
    const query = explicitSearchMatch[1].trim().replace(/[?.!]+$/, '');
    if (query.length > 0 && query.length < 100) {
      return { subIntent: 'search', entities: { query } };
    }
  }

  // --- Semantic / emotional queries (BEFORE broad catch-alls) ---
  // Must come before "listen to" and "show me X" so that thematic queries like
  // "I need something that is about women empowerment" are not swallowed by those
  // catch-alls and routed as generic 'search' subIntent.
  if (hasThematicTrigger(lower)) {
    return { subIntent: 'semantic_search', entities: { query: lower } };
  }

  // --- "listen to X" / "hear X" / "stream X" ---
  // Catches: "I need to listen to Caesar", "I want to hear amapiano", "play me some afrobeats"
  const listenToMatch = lower.match(
    /\b(?:listen to|listen|hear|stream)\s+(.+)/i
  );
  if (listenToMatch) {
    const raw = listenToMatch[1].trim().replace(/[?.!]+$/, '');
    // Strip leading filler: "to", "some", "a bit of"
    const query = raw.replace(/^(?:to\s+|some\s+|a\s+bit\s+of\s+)/i, '').trim();
    const stopWords = new Set([
      'music',
      'tracks',
      'songs',
      'something',
      'anything',
      'stuff',
    ]);
    if (query.length > 1 && query.length < 80 && !stopWords.has(query)) {
      return { subIntent: 'search', entities: { query } };
    }
  }

  // --- Broad "show me X" / "find X" / "play X" catch-all ---
  // Catches: "show me amapiano", "show me some hip-hop", "play amapiano", "find Caesar"
  const showMeMatch = lower.match(
    /^(?:show me|find|play|give me|get me|i want|i need|i wanna hear|i'd like)\s+(?:some\s+)?(.+)/i
  );
  if (showMeMatch) {
    // Strip "to listen to" / "to hear" from the captured group
    const raw = showMeMatch[1]
      .trim()
      .replace(/^(?:to\s+listen\s+to\s+|to\s+hear\s+|to\s+stream\s+)/i, '')
      .trim()
      .replace(/[?.!]+$/, '');
    const stopWords = new Set([
      'music',
      'tracks',
      'songs',
      'something',
      'anything',
      'stuff',
    ]);
    if (raw.length > 1 && raw.length < 80 && !stopWords.has(raw)) {
      return { subIntent: 'search', entities: { query: raw } };
    }
  }

  return null;
}
