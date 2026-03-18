import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client for working memory (session cache)
 *
 * Working memory provides fast, ephemeral storage for:
 * - Recent conversation messages (last 5-10 messages)
 * - Active session data
 * - Temporary user state
 *
 * To use Upstash Redis:
 * 1. Go to Vercel Dashboard > Storage > Create Database > Upstash Redis
 * 2. The integration will automatically inject environment variables:
 *    - UPSTASH_REDIS_REST_URL
 *    - UPSTASH_REDIS_REST_TOKEN
 * 3. No additional configuration needed!
 *
 * @example
 * // Store recent messages for a conversation
 * await redis.lpush(`wm:${conversationId}`, JSON.stringify(message));
 * await redis.ltrim(`wm:${conversationId}`, 0, 4); // Keep only latest 5
 *
 * // Retrieve recent messages
 * const messages = await redis.lrange(`wm:${conversationId}`, 0, -1);
 *
 * // Set expiration (optional, for session cleanup)
 * await redis.expire(`wm:${conversationId}`, 3600); // Expire after 1 hour
 */

// Check if Redis is configured
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client if configured, otherwise create a mock client
export const redis = isRedisConfigured
  ? Redis.fromEnv()
  : ({
      // Mock implementation for development without Redis
      lpush: async () => 0,
      lrange: async () => [],
      ltrim: async () => 'OK',
      expire: async () => 1,
      del: async () => 0,
      get: async () => null,
      set: async () => 'OK',
      setex: async () => 'OK',
    } as unknown as Redis);

// Log Redis status
if (!isRedisConfigured) {
  console.warn(
    '[Redis] Upstash Redis not configured. Using mock client. To enable Redis:' +
      '\n1. Go to Vercel Dashboard > Storage > Create Database > Upstash Redis' +
      '\n2. Link it to your project' +
      '\n3. Deploy or restart your development server'
  );
}

/**
 * Helper: Store recent messages for working memory
 */
export async function storeWorkingMemoryMessage(
  conversationId: string,
  message: { role: string; content: string; timestamp: Date }
): Promise<void> {
  try {
    await redis.lpush(`wm:${conversationId}`, JSON.stringify(message));
    await redis.ltrim(`wm:${conversationId}`, 0, 4); // Keep only latest 5
    await redis.expire(`wm:${conversationId}`, 3600); // Expire after 1 hour
  } catch (error) {
    console.error('[Redis] Failed to store working memory:', error);
  }
}

/**
 * Helper: Retrieve recent messages from working memory
 */
export async function getWorkingMemoryMessages(
  conversationId: string
): Promise<Array<{ role: string; content: string; timestamp: Date }>> {
  try {
    const messages = await redis.lrange(`wm:${conversationId}`, 0, -1);
    return messages
      .map(msg => {
        try {
          return typeof msg === 'string' ? JSON.parse(msg) : msg;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse(); // Reverse to get chronological order
  } catch (error) {
    console.error('[Redis] Failed to retrieve working memory:', error);
    return [];
  }
}

/**
 * Helper: Clear working memory for a conversation
 */
export async function clearWorkingMemory(
  conversationId: string
): Promise<void> {
  try {
    await redis.del(`wm:${conversationId}`);
  } catch (error) {
    console.error('[Redis] Failed to clear working memory:', error);
  }
}
