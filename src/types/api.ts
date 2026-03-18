/**
 * Standardized API Response Types
 *
 * This file contains type-safe interfaces for API responses,
 * pagination, and standard response wrappers used throughout the application.
 */

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Standard pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Cursor-based pagination parameters for infinite scroll
 */
export interface CursorPaginationParams {
  cursor?: string;
  hasMore: boolean;
}

/**
 * Generic paginated response wrapper (for admin & listing endpoints)
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}

/**
 * Generic cursor-based response wrapper (for timeline & feeds)
 */
export interface CursorPaginatedResponse<T> {
  data: T[];
  cursor?: string;
  hasMore: boolean;
}

// ============================================================================
// STANDARD API RESPONSES
// ============================================================================

/**
 * Standard success response format
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Standard error response format
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: ApiErrorDetails;
}

/**
 * Error details structure
 */
export interface ApiErrorDetails {
  timestamp: string;
  type?: string;
  solution?: string;
  [key: string]: unknown;
}

/**
 * Generic API response type (success or error)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

/**
 * Standard search and filter parameters
 */
export interface SearchParams {
  search?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Date range filter parameters
 */
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Status filter parameters
 */
export interface StatusParams {
  status?: string;
}

// ============================================================================
// REQUEST METADATA TYPES
// ============================================================================

/**
 * User agent and request metadata
 */
export interface RequestMetadata {
  userAgent?: string;
  ip?: string;
  referer?: string;
  timestamp: Date;
}

/**
 * File upload metadata
 */
export interface UploadMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if response is a success response
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error response
 */
export function isErrorResponse(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Extract data type from paginated response
 */
export type ExtractPaginatedData<T> =
  T extends PaginatedResponse<infer U> ? U : never;

/**
 * Extract data type from cursor paginated response
 */
export type ExtractCursorPaginatedData<T> =
  T extends CursorPaginatedResponse<infer U> ? U : never;
