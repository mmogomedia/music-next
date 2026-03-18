/**
 * Rate Limit Handler Utility
 * Handles TikTok API rate limits with exponential backoff
 */

export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  reset: number | null; // Unix timestamp in seconds
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  backoffMultiplier?: number;
}

/**
 * Extract rate limit information from response headers
 */
export function extractRateLimitInfo(response: Response): RateLimitInfo {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  return {
    limit: limit ? parseInt(limit, 10) : null,
    remaining: remaining ? parseInt(remaining, 10) : null,
    reset: reset ? parseInt(reset, 10) : null,
  };
}

/**
 * Calculate delay until rate limit resets
 */
export function calculateResetDelay(resetTimestamp: number | null): number {
  if (!resetTimestamp) {
    return 60000; // Default to 60 seconds if no reset time provided
  }

  const now = Math.floor(Date.now() / 1000);
  const delay = (resetTimestamp - now) * 1000; // Convert to milliseconds

  return Math.max(0, delay);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with rate limit handling and retry logic
 */
export async function withRateLimitHandling<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 60000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error (429)
      const isRateLimit =
        error?.status === 429 ||
        error?.response?.status === 429 ||
        error?.message?.includes('rate limit') ||
        error?.message?.includes('429');

      if (!isRateLimit || attempt === maxRetries) {
        throw error;
      }

      // Extract reset time from error if available
      let resetDelay = delay;
      if (error?.response?.headers) {
        const rateLimitInfo = extractRateLimitInfo(error.response);
        if (rateLimitInfo.reset) {
          resetDelay = calculateResetDelay(rateLimitInfo.reset);
        }
      }

      // Wait before retrying
      const waitTime = Math.min(resetDelay, maxDelay);
      console.warn(
        `[Rate Limit] Rate limited (attempt ${attempt + 1}/${maxRetries + 1}). Waiting ${waitTime}ms before retry...`
      );

      await sleep(waitTime);

      // Exponential backoff for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
