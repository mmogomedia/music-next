/**
 * Date and Time Utility Functions
 *
 * Centralized date/time formatting utilities used throughout the application.
 * Consolidates duplicate implementations from multiple locations.
 */

/**
 * Format a date as "time ago" with verbose output
 *
 * Displays elapsed time in a human-readable format:
 * - "Just now" for < 1 minute
 * - "X minute(s) ago" for < 1 hour
 * - "X hour(s) ago" for < 1 day
 * - "X day(s) ago" for >= 1 day
 *
 * @param date - The date to format (Date object or ISO string)
 * @returns Human-readable time ago string
 *
 * @example
 * ```typescript
 * formatTimeAgo(new Date(Date.now() - 30000)) // 'Just now'
 * formatTimeAgo(new Date(Date.now() - 300000)) // '5 minutes ago'
 * formatTimeAgo('2024-01-01T00:00:00Z') // '15 days ago' (example)
 * ```
 *
 * Previously duplicated in:
 * - /src/app/api/admin/dashboard-stats/route.ts (lines 337-353)
 * - /src/components/dashboard/RecentActivity.tsx (lines 269-279)
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

/**
 * Format a date as "time ago" with abbreviated output
 *
 * Displays elapsed time in a compact format:
 * - "Just now" for < 1 minute
 * - "Xm ago" for < 1 hour
 * - "Xh ago" for < 1 day
 * - "Xd ago" for >= 1 day
 *
 * @param date - The date to format (Date object or ISO string)
 * @returns Abbreviated time ago string
 *
 * @example
 * ```typescript
 * formatTimeAgoShort(new Date(Date.now() - 30000)) // 'Just now'
 * formatTimeAgoShort(new Date(Date.now() - 300000)) // '5m ago'
 * formatTimeAgoShort('2024-01-01T00:00:00Z') // '15d ago' (example)
 * ```
 */
export function formatTimeAgoShort(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}

/**
 * Format a date to a localized string
 *
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions (optional)
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate(new Date()) // 'Jan 15, 2026' (locale-specific)
 * formatDate(new Date(), { dateStyle: 'full' }) // 'Wednesday, January 15, 2026'
 * ```
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return targetDate.toLocaleDateString(undefined, options || defaultOptions);
}

/**
 * Format a date to a localized date and time string
 *
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions (optional)
 * @returns Formatted date and time string
 *
 * @example
 * ```typescript
 * formatDateTime(new Date()) // 'Jan 15, 2026, 10:30 AM'
 * formatDateTime(new Date(), { timeStyle: 'medium' }) // 'Jan 15, 2026, 10:30:45 AM'
 * ```
 */
export function formatDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return targetDate.toLocaleString(undefined, options || defaultOptions);
}

/**
 * Check if a date is today
 *
 * @param date - The date to check
 * @returns True if the date is today
 *
 * @example
 * ```typescript
 * isToday(new Date()) // true
 * isToday('2024-01-01') // false
 * ```
 */
export function isToday(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    targetDate.getDate() === today.getDate() &&
    targetDate.getMonth() === today.getMonth() &&
    targetDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is within the last N days
 *
 * @param date - The date to check
 * @param days - Number of days to check
 * @returns True if the date is within the last N days
 *
 * @example
 * ```typescript
 * isWithinDays(new Date(), 7) // true
 * isWithinDays('2024-01-01', 7) // false
 * ```
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  return diffInDays >= 0 && diffInDays <= days;
}

/**
 * Get the start of day for a date
 *
 * @param date - The date to get start of day for
 * @returns Date object set to start of day (00:00:00.000)
 *
 * @example
 * ```typescript
 * startOfDay(new Date('2024-01-15T14:30:00')) // 2024-01-15T00:00:00.000
 * ```
 */
export function startOfDay(date: Date | string): Date {
  const targetDate = typeof date === 'string' ? new Date(date) : new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate;
}

/**
 * Get the end of day for a date
 *
 * @param date - The date to get end of day for
 * @returns Date object set to end of day (23:59:59.999)
 *
 * @example
 * ```typescript
 * endOfDay(new Date('2024-01-15T14:30:00')) // 2024-01-15T23:59:59.999
 * ```
 */
export function endOfDay(date: Date | string): Date {
  const targetDate = typeof date === 'string' ? new Date(date) : new Date(date);
  targetDate.setHours(23, 59, 59, 999);
  return targetDate;
}

/**
 * Add days to a date
 *
 * @param date - The date to add days to
 * @param days - Number of days to add (can be negative)
 * @returns New date object with days added
 *
 * @example
 * ```typescript
 * addDays(new Date('2024-01-15'), 7) // 2024-01-22
 * addDays(new Date('2024-01-15'), -7) // 2024-01-08
 * ```
 */
export function addDays(date: Date | string, days: number): Date {
  const targetDate = typeof date === 'string' ? new Date(date) : new Date(date);
  targetDate.setDate(targetDate.getDate() + days);
  return targetDate;
}

/**
 * Get the difference between two dates in days
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Difference in days (absolute value)
 *
 * @example
 * ```typescript
 * daysBetween(new Date('2024-01-15'), new Date('2024-01-20')) // 5
 * daysBetween('2024-01-20', '2024-01-15') // 5
 * ```
 */
export function daysBetween(
  date1: Date | string,
  date2: Date | string
): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffInMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Format duration in milliseconds to human-readable string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 *
 * @example
 * ```typescript
 * formatDuration(1000) // '1s'
 * formatDuration(60000) // '1m'
 * formatDuration(3661000) // '1h 1m 1s'
 * ```
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
