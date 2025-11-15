// In-memory rate limiting (can be extended to Redis for production)
const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number; lockedUntil?: number }
>();

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  lockoutMs?: number; // Optional lockout period after max requests
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  lockedUntil?: number;
  retryAfter?: number; // Seconds until lockout expires
}

/**
 * Check rate limit for a given identifier (IP, userId, etc.)
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Check if account is locked
  if (record?.lockedUntil && now < record.lockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      lockedUntil: record.lockedUntil,
      retryAfter: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  // Reset if window expired or no record exists
  if (!record || now > record.resetAt) {
    const resetAt = now + options.windowMs;
    rateLimitMap.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt,
    };
  }

  // Check if limit exceeded
  if (record.count >= options.maxRequests) {
    // Apply lockout if configured
    if (options.lockoutMs) {
      const lockedUntil = now + options.lockoutMs;
      record.lockedUntil = lockedUntil;
      rateLimitMap.set(identifier, record);
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
        lockedUntil,
        retryAfter: Math.ceil(options.lockoutMs / 1000),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Increment count
  record.count++;
  rateLimitMap.set(identifier, record);

  return {
    allowed: true,
    remaining: options.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Reset rate limit for an identifier (useful for testing or manual unlocks)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP (in order of preference)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (won't work in serverless, but useful for development)
  return 'unknown';
}

/**
 * Clean up expired rate limit records (call periodically)
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (
      now > record.resetAt &&
      (!record.lockedUntil || now > record.lockedUntil)
    ) {
      rateLimitMap.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
}
