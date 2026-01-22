/**
 * API Response Utility Functions
 *
 * Standardized response helpers for API routes.
 * Integrates with existing error handlers and provides consistent success responses.
 */

import { NextResponse } from 'next/server';
import type {
  PaginationParams,
  CursorPaginationParams,
  ApiSuccessResponse,
} from '@/types/api';
import { createErrorResponse } from '@/lib/api-error-handler';

// ============================================================================
// SUCCESS RESPONSE HELPERS
// ============================================================================

/**
 * Create a standardized success response
 *
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @param message - Optional success message
 * @returns NextResponse with standardized structure
 *
 * @example
 * ```typescript
 * return successResponse({ track: trackData });
 * return successResponse(null, 201, 'Track created successfully');
 * ```
 */
export function successResponse<T = unknown>(
  data?: T,
  status: number = 200,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create a paginated success response
 *
 * @param data - Array of items
 * @param pagination - Pagination parameters
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with paginated data
 *
 * @example
 * ```typescript
 * return paginatedResponse(tracks, {
 *   page: 1,
 *   limit: 20,
 *   total: 100,
 *   pages: 5
 * });
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationParams,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
    },
    { status }
  );
}

/**
 * Create a cursor-based paginated response
 *
 * @param data - Array of items
 * @param cursor - Next cursor value (undefined if no more pages)
 * @param hasMore - Whether there are more items
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with cursor pagination
 *
 * @example
 * ```typescript
 * return cursorPaginatedResponse(posts, nextCursor, hasMore);
 * ```
 */
export function cursorPaginatedResponse<T>(
  data: T[],
  cursor: string | undefined,
  hasMore: boolean,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      cursor,
      hasMore,
    },
    { status }
  );
}

/**
 * Create a created response (201)
 *
 * @param data - The created resource
 * @param message - Optional success message
 * @returns NextResponse with 201 status
 *
 * @example
 * ```typescript
 * return createdResponse(newTrack, 'Track created successfully');
 * ```
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, 201, message);
}

/**
 * Create a no content response (204)
 *
 * @returns NextResponse with 204 status and no body
 *
 * @example
 * ```typescript
 * return noContentResponse(); // For successful DELETE operations
 * ```
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create an accepted response (202)
 *
 * @param data - Optional data about the accepted request
 * @param message - Optional message
 * @returns NextResponse with 202 status
 *
 * @example
 * ```typescript
 * return acceptedResponse({ jobId: '123' }, 'Processing started');
 * ```
 */
export function acceptedResponse<T>(
  data?: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, 202, message);
}

// ============================================================================
// ERROR RESPONSE HELPERS (Re-export from api-error-handler)
// ============================================================================

/**
 * Create a standardized error response
 *
 * Uses the existing error handler for consistency
 *
 * @param error - Error message or Error object
 * @param status - HTTP status code (default: 500)
 * @param details - Additional error details
 * @returns Response with standardized error structure
 *
 * @example
 * ```typescript
 * return errorResponse('Invalid input', 400, { field: 'email' });
 * ```
 */
export function errorResponse(
  error: string | Error,
  status: number = 500,
  details?: Record<string, unknown>
): Response {
  return createErrorResponse(error, status, details);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate pagination metadata
 *
 * @param total - Total number of items
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @returns Pagination parameters object
 *
 * @example
 * ```typescript
 * const pagination = calculatePagination(100, 2, 20);
 * // { page: 2, limit: 20, total: 100, pages: 5 }
 * ```
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationParams {
  const pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    pages,
  };
}

/**
 * Calculate cursor pagination metadata
 *
 * @param items - Array of items with id property
 * @param limit - Items per page
 * @returns Cursor pagination parameters
 *
 * @example
 * ```typescript
 * const { cursor, hasMore } = calculateCursorPagination(posts, 20);
 * ```
 */
export function calculateCursorPagination<T extends { id: string }>(
  items: T[],
  limit: number
): CursorPaginationParams {
  const hasMore = items.length > limit;
  const cursor = hasMore ? items[limit - 1]?.id : undefined;

  return {
    cursor,
    hasMore,
  };
}

/**
 * Parse pagination parameters from URL search params
 *
 * @param searchParams - URLSearchParams object
 * @param defaults - Default pagination values
 * @returns Parsed page and limit
 *
 * @example
 * ```typescript
 * const { page, limit } = parsePaginationParams(request.nextUrl.searchParams);
 * ```
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): { page: number; limit: number } {
  const {
    page: defaultPage = 1,
    limit: defaultLimit = 20,
    maxLimit = 100,
  } = defaults;

  const page = Math.max(
    1,
    parseInt(searchParams.get('page') || String(defaultPage))
  );
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit)))
  );

  return { page, limit };
}

/**
 * Parse cursor from URL search params
 *
 * @param searchParams - URLSearchParams object
 * @param defaultLimit - Default limit value
 * @param maxLimit - Maximum allowed limit
 * @returns Cursor and limit
 *
 * @example
 * ```typescript
 * const { cursor, limit } = parseCursorParams(request.nextUrl.searchParams);
 * ```
 */
export function parseCursorParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 20,
  maxLimit: number = 50
): { cursor: string | undefined; limit: number } {
  const cursor = searchParams.get('cursor') || undefined;
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit)))
  );

  return { cursor, limit };
}

/**
 * Create a response with custom headers
 *
 * @param data - Response data
 * @param status - HTTP status code
 * @param headers - Custom headers object
 * @returns NextResponse with custom headers
 *
 * @example
 * ```typescript
 * return responseWithHeaders(data, 200, {
 *   'Cache-Control': 'public, max-age=3600',
 *   'X-Custom-Header': 'value'
 * });
 * ```
 */
export function responseWithHeaders<T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers,
  });
}

/**
 * Create a redirect response
 *
 * @param url - URL to redirect to
 * @param status - HTTP status code (default: 302)
 * @returns NextResponse redirect
 *
 * @example
 * ```typescript
 * return redirectResponse('/login', 302);
 * ```
 */
export function redirectResponse(
  url: string,
  status: number = 302
): NextResponse {
  return NextResponse.redirect(url, status);
}
