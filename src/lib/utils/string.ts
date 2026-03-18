/**
 * String Utility Functions
 *
 * Centralized string manipulation utilities used throughout the application.
 * Consolidates duplicate implementations from multiple locations.
 */

/**
 * Convert a string to a URL-friendly slug
 *
 * This function:
 * - Converts to lowercase
 * - Removes special characters (keeps alphanumeric, spaces, and hyphens)
 * - Replaces spaces with hyphens
 * - Removes duplicate hyphens
 * - Trims leading/trailing hyphens
 * - Limits length to specified maximum
 *
 * @param value - The string to slugify
 * @param maxLength - Maximum length of the slug (default: 90)
 * @returns URL-friendly slug
 *
 * @example
 * ```typescript
 * slugify('Hello World!') // 'hello-world'
 * slugify('Foo  Bar---Baz', 20) // 'foo-bar-baz'
 * slugify('Artíst Ñame') // 'artst-ame'
 * ```
 *
 * Previously duplicated in:
 * - /src/lib/services/quick-link-service.ts (lines 6-14)
 * - /src/lib/services/smart-link-service.ts (lines 6-14)
 * - /src/components/dashboard/quick-links/QuickLinksManager.tsx (lines 112-120)
 * - /src/components/dashboard/smart-links/QuickLinksManager.tsx (lines 112-120)
 */
export function slugify(value: string, maxLength: number = 90): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, maxLength); // Limit length
}

/**
 * Capitalize the first letter of a string
 *
 * @param value - The string to capitalize
 * @returns String with first letter capitalized
 *
 * @example
 * ```typescript
 * capitalize('hello world') // 'Hello world'
 * capitalize('HELLO') // 'HELLO'
 * ```
 */
export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Capitalize the first letter of each word
 *
 * @param value - The string to title case
 * @returns String with each word capitalized
 *
 * @example
 * ```typescript
 * titleCase('hello world') // 'Hello World'
 * titleCase('the quick brown fox') // 'The Quick Brown Fox'
 * ```
 */
export function titleCase(value: string): string {
  if (!value) return value;
  return value
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Truncate a string to a maximum length with ellipsis
 *
 * @param value - The string to truncate
 * @param maxLength - Maximum length (default: 50)
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated string
 *
 * @example
 * ```typescript
 * truncate('This is a very long string', 10) // 'This is...'
 * truncate('Short', 10) // 'Short'
 * ```
 */
export function truncate(
  value: string,
  maxLength: number = 50,
  ellipsis: string = '...'
): string {
  if (!value || value.length <= maxLength) return value;
  return value.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Remove extra whitespace and normalize spacing
 *
 * @param value - The string to normalize
 * @returns String with normalized spacing
 *
 * @example
 * ```typescript
 * normalizeWhitespace('  hello   world  ') // 'hello world'
 * normalizeWhitespace('foo\n\nbar') // 'foo bar'
 * ```
 */
export function normalizeWhitespace(value: string): string {
  if (!value) return value;
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Generate a random string of specified length
 *
 * @param length - Length of the random string (default: 10)
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Random string
 *
 * @example
 * ```typescript
 * randomString(8) // 'a7B3xY9z'
 * randomString(6, 'numeric') // '123456'
 * ```
 */
export function randomString(
  length: number = 10,
  charset: 'alphanumeric' | 'alpha' | 'numeric' = 'alphanumeric'
): string {
  let chars = '';

  switch (charset) {
    case 'alphanumeric':
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      break;
    case 'alpha':
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      break;
    case 'numeric':
      chars = '0123456789';
      break;
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Extract initials from a name
 *
 * @param name - The name to extract initials from
 * @param maxInitials - Maximum number of initials (default: 2)
 * @returns Uppercase initials
 *
 * @example
 * ```typescript
 * getInitials('John Doe') // 'JD'
 * getInitials('Mary Jane Watson', 3) // 'MJW'
 * ```
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name) return '';

  return name
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}
