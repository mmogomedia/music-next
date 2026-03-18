/**
 * Router Keywords
 *
 * Keyword definitions for intent detection in RouterAgent.
 * Organized by intent category for easy maintenance and updates.
 *
 * @module RouterKeywords
 */

/**
 * Keywords that indicate playback/control intent
 */
export const PLAYBACK_KEYWORDS = [
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
] as const;

/**
 * Keywords that indicate recommendation intent
 * Note: "discover" removed to avoid overlap with discovery intent
 */
export const RECOMMENDATION_KEYWORDS = [
  'recommend',
  'suggest',
  'similar',
  'like',
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
] as const;

/**
 * Keywords that indicate discovery/search intent
 */
export const DISCOVERY_KEYWORDS = [
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
] as const;

/**
 * Theme keywords that boost discovery intent
 * These are weighted more heavily in discovery scoring
 */
export const THEME_KEYWORDS = [
  'women empowerment',
  'woman empowerment',
  'self love',
  'self-love',
  'self empowerment',
  'healing',
  'inspiration',
  'uplifting',
  'mental health',
  'political',
  'activism',
] as const;

/**
 * Keywords that indicate music industry knowledge queries
 */
export const INDUSTRY_KNOWLEDGE_KEYWORDS = [
  'royalties',
  'royalty',
  'publishing',
  'mechanical rights',
  'sync rights',
  'samro',
  'capasso',
  'split sheet',
  'distribution deal',
  'record deal',
  'label advance',
  'collecting society',
] as const;

/**
 * Keywords that indicate malicious intent
 */
export const MALICIOUS_KEYWORDS = [
  'hack',
  'virus',
  'exploit',
  'ddos',
  'bomb',
  'attack',
  'kill',
] as const;

/**
 * Keywords that indicate music-related content
 * Used to filter out non-music queries
 */
export const MUSIC_KEYWORDS = [
  'music',
  'song',
  'track',
  'artist',
  'playlist',
  'dj',
  'album',
  'beat',
] as const;

/**
 * Keywords that indicate off-topic (non-music) queries
 */
export const OFF_TOPIC_KEYWORDS = [
  'recipe',
  'weather',
  'football',
  'soccer',
  'basketball',
  'stock',
  'crypto',
  'math',
  'homework',
  'essay',
  'programming',
  'python',
  'javascript',
  'movie',
  'tv show',
  'series',
  'news',
  'politics',
  'code',
] as const;

/**
 * Keywords that indicate explicit/inappropriate content
 */
export const EXPLICIT_KEYWORDS = [
  'sex',
  'sexual',
  'kamasutra',
  'sex positions',
  'sexual position',
  'erotic',
  'porn',
] as const;
