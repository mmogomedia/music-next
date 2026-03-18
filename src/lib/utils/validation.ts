/**
 * Validation Utility Functions
 *
 * Centralized validation helpers used across API routes and forms.
 * Consolidates duplicate validation logic from multiple locations.
 */

// ============================================================================
// ARRAY VALIDATORS
// ============================================================================

/**
 * Sanitize and validate string array input
 *
 * Filters out non-string values, trims whitespace, and removes empty strings
 *
 * @param value - Value to sanitize (can be any type)
 * @returns Sanitized array of non-empty strings
 *
 * @example
 * ```typescript
 * sanitizeStringArray(['  hello  ', '', 'world', 123, null])
 * // ['hello', 'world']
 * ```
 *
 * Previously duplicated in:
 * - /src/app/api/tracks/create/route.ts (lines 9-14)
 * - /src/app/api/tracks/update/route.ts (lines 9-14)
 */
export function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

/**
 * Validate that an array has at least a minimum number of items
 *
 * @param value - Array to validate
 * @param min - Minimum required items
 * @returns True if array has at least min items
 *
 * @example
 * ```typescript
 * validateArrayMinLength(['a', 'b'], 1) // true
 * validateArrayMinLength([], 1) // false
 * ```
 */
export function validateArrayMinLength<T>(value: T[], min: number): boolean {
  return Array.isArray(value) && value.length >= min;
}

/**
 * Validate that an array has at most a maximum number of items
 *
 * @param value - Array to validate
 * @param max - Maximum allowed items
 * @returns True if array has at most max items
 *
 * @example
 * ```typescript
 * validateArrayMaxLength(['a', 'b'], 5) // true
 * validateArrayMaxLength([1,2,3,4,5,6], 5) // false
 * ```
 */
export function validateArrayMaxLength<T>(value: T[], max: number): boolean {
  return Array.isArray(value) && value.length <= max;
}

// ============================================================================
// NUMBER VALIDATORS
// ============================================================================

/**
 * Clamp a number value to a valid range
 *
 * Ensures the value is a number, not NaN, and within min/max bounds
 *
 * @param value - Value to clamp
 * @param fallback - Fallback value if input is invalid
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: 100)
 * @returns Clamped number value
 *
 * @example
 * ```typescript
 * clampNumber(150, 50, 0, 100) // 100
 * clampNumber(-10, 50, 0, 100) // 0
 * clampNumber('abc', 50, 0, 100) // 50 (fallback)
 * ```
 *
 * Previously used as `clampStrength` in:
 * - /src/app/api/tracks/create/route.ts (lines 16-21)
 * - /src/app/api/tracks/update/route.ts (lines 16-21)
 */
export function clampNumber(
  value: unknown,
  fallback: number,
  min: number = 0,
  max: number = 100
): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Validate that a value is a positive number
 *
 * @param value - Value to validate
 * @returns True if value is a positive number
 *
 * @example
 * ```typescript
 * isPositiveNumber(5) // true
 * isPositiveNumber(0) // false
 * isPositiveNumber(-5) // false
 * ```
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && value > 0;
}

/**
 * Validate that a value is a non-negative number
 *
 * @param value - Value to validate
 * @returns True if value is a non-negative number
 *
 * @example
 * ```typescript
 * isNonNegativeNumber(0) // true
 * isNonNegativeNumber(5) // true
 * isNonNegativeNumber(-5) // false
 * ```
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && value >= 0;
}

// ============================================================================
// STRING VALIDATORS
// ============================================================================

/**
 * Validate that a string has minimum length
 *
 * @param value - String to validate
 * @param minLength - Minimum required length
 * @returns True if string meets minimum length
 *
 * @example
 * ```typescript
 * validateStringMinLength('hello', 3) // true
 * validateStringMinLength('hi', 3) // false
 * ```
 */
export function validateStringMinLength(
  value: string,
  minLength: number
): boolean {
  return typeof value === 'string' && value.trim().length >= minLength;
}

/**
 * Validate that a string has maximum length
 *
 * @param value - String to validate
 * @param maxLength - Maximum allowed length
 * @returns True if string is within maximum length
 *
 * @example
 * ```typescript
 * validateStringMaxLength('hello', 10) // true
 * validateStringMaxLength('hello world!', 5) // false
 * ```
 */
export function validateStringMaxLength(
  value: string,
  maxLength: number
): boolean {
  return typeof value === 'string' && value.length <= maxLength;
}

/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns True if email format is valid
 *
 * @example
 * ```typescript
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 *
 * @param url - URL to validate
 * @returns True if URL format is valid
 *
 * @example
 * ```typescript
 * isValidUrl('https://example.com') // true
 * isValidUrl('not-a-url') // false
 * ```
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that URL starts with http:// or https://
 *
 * @param url - URL to validate
 * @returns True if URL is HTTP/HTTPS
 *
 * @example
 * ```typescript
 * isHttpUrl('https://example.com') // true
 * isHttpUrl('ftp://example.com') // false
 * ```
 */
export function isHttpUrl(url: string): boolean {
  return isValidUrl(url) && /^https?:\/\//i.test(url);
}

// ============================================================================
// TYPE VALIDATORS
// ============================================================================

/**
 * Check if value is a plain object (not array, null, etc.)
 *
 * @param value - Value to check
 * @returns True if value is a plain object
 *
 * @example
 * ```typescript
 * isPlainObject({}) // true
 * isPlainObject([]) // false
 * isPlainObject(null) // false
 * ```
 */
export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Check if value is defined (not null or undefined)
 *
 * @param value - Value to check
 * @returns True if value is defined
 *
 * @example
 * ```typescript
 * isDefined(0) // true
 * isDefined('') // true
 * isDefined(null) // false
 * isDefined(undefined) // false
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 *
 * @param value - Value to check
 * @returns True if value is empty
 *
 * @example
 * ```typescript
 * isEmpty('') // true
 * isEmpty([]) // true
 * isEmpty({}) // true
 * isEmpty(0) // false
 * ```
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) return Object.keys(value).length === 0;
  return false;
}

// ============================================================================
// FILE VALIDATORS
// ============================================================================

/**
 * Validate file MIME type
 *
 * @param mimeType - MIME type to validate
 * @param allowedTypes - Array of allowed MIME types or patterns
 * @returns True if MIME type is allowed
 *
 * @example
 * ```typescript
 * isValidMimeType('image/png', ['image/*']) // true
 * isValidMimeType('audio/mp3', ['audio/mp3', 'audio/mpeg']) // true
 * isValidMimeType('video/mp4', ['image/*']) // false
 * ```
 */
export function isValidMimeType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  if (!mimeType) return false;

  return allowedTypes.some(allowed => {
    if (allowed.endsWith('/*')) {
      const prefix = allowed.slice(0, -2);
      return mimeType.startsWith(`${prefix}/`);
    }
    return mimeType === allowed;
  });
}

/**
 * Validate file size
 *
 * @param fileSize - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns True if file size is within limit
 *
 * @example
 * ```typescript
 * isValidFileSize(1024 * 1024, 5 * 1024 * 1024) // true (1MB < 5MB)
 * isValidFileSize(10 * 1024 * 1024, 5 * 1024 * 1024) // false (10MB > 5MB)
 * ```
 */
export function isValidFileSize(fileSize: number, maxSize: number): boolean {
  return isNonNegativeNumber(fileSize) && fileSize <= maxSize;
}

/**
 * Validate file extension
 *
 * @param fileName - File name with extension
 * @param allowedExtensions - Array of allowed extensions (without dots)
 * @returns True if file extension is allowed
 *
 * @example
 * ```typescript
 * isValidFileExtension('song.mp3', ['mp3', 'wav']) // true
 * isValidFileExtension('image.jpg', ['mp3', 'wav']) // false
 * ```
 */
export function isValidFileExtension(
  fileName: string,
  allowedExtensions: string[]
): boolean {
  if (!fileName) return false;

  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return false;

  return allowedExtensions.some(
    ext => ext.toLowerCase() === extension.toLowerCase()
  );
}

// ============================================================================
// DATE VALIDATORS
// ============================================================================

/**
 * Validate that a date string is a valid ISO 8601 date
 *
 * @param dateString - Date string to validate
 * @returns True if date string is valid
 *
 * @example
 * ```typescript
 * isValidISODate('2024-01-15T10:30:00Z') // true
 * isValidISODate('invalid-date') // false
 * ```
 */
export function isValidISODate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

/**
 * Validate that a date is in the past
 *
 * @param date - Date to validate
 * @returns True if date is in the past
 *
 * @example
 * ```typescript
 * isDateInPast(new Date('2020-01-01')) // true
 * isDateInPast(new Date('2030-01-01')) // false
 * ```
 */
export function isDateInPast(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate.getTime() < Date.now();
}

/**
 * Validate that a date is in the future
 *
 * @param date - Date to validate
 * @returns True if date is in the future
 *
 * @example
 * ```typescript
 * isDateInFuture(new Date('2030-01-01')) // true
 * isDateInFuture(new Date('2020-01-01')) // false
 * ```
 */
export function isDateInFuture(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate.getTime() > Date.now();
}

// ============================================================================
// ID VALIDATORS
// ============================================================================

/**
 * Validate UUID format
 *
 * @param uuid - UUID string to validate
 * @returns True if string is a valid UUID
 *
 * @example
 * ```typescript
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * isValidUUID('invalid-uuid') // false
 * ```
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate CUID format (Prisma default ID format)
 *
 * @param cuid - CUID string to validate
 * @returns True if string is a valid CUID
 *
 * @example
 * ```typescript
 * isValidCUID('cl9ebqhxk00008eef652ll9f3') // true
 * isValidCUID('invalid') // false
 * ```
 */
export function isValidCUID(cuid: string): boolean {
  if (!cuid || typeof cuid !== 'string') return false;

  // CUID format: starts with 'c', followed by timestamp and random chars
  const cuidRegex = /^c[^\s-]{24,}$/;
  return cuidRegex.test(cuid);
}
