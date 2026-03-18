/**
 * Authentication Utility Functions
 *
 * Standardized authentication helpers for API routes.
 * Provides consistent authentication and authorization checking.
 */

import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { UserRole } from '@prisma/client';

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

/**
 * Custom error class for authentication failures
 */
export class AuthError extends Error {
  public readonly status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/**
 * Custom error class for authorization failures
 */
export class ForbiddenError extends AuthError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Get the current session
 *
 * @returns Session object or null if not authenticated
 *
 * @example
 * ```typescript
 * const session = await getCurrentSession();
 * if (!session) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function getCurrentSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Require authentication for an API route
 *
 * Throws AuthError if user is not authenticated.
 * Optionally checks for specific role(s).
 *
 * @param options - Optional role requirements
 * @returns Session object
 * @throws AuthError if not authenticated
 * @throws ForbiddenError if missing required role
 *
 * @example
 * ```typescript
 * // Require any authenticated user
 * const session = await requireAuth();
 *
 * // Require specific role
 * const session = await requireAuth({ role: 'ADMIN' });
 *
 * // Require one of multiple roles
 * const session = await requireAuth({ role: ['ADMIN', 'ARTIST'] });
 * ```
 */
export async function requireAuth(options?: {
  role?: UserRole | UserRole[];
}): Promise<Session> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AuthError('Authentication required');
  }

  // Check role requirements if specified
  if (options?.role) {
    const allowedRoles = Array.isArray(options.role)
      ? options.role
      : [options.role];

    const userRole = session.user.role as UserRole | undefined;
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new ForbiddenError(
        "You don't have permission to perform this action"
      );
    }
  }

  return session;
}

/**
 * Require admin role for an API route
 *
 * Convenience wrapper for requireAuth({ role: 'ADMIN' })
 *
 * @returns Session object
 * @throws AuthError if not authenticated
 * @throws ForbiddenError if not admin
 *
 * @example
 * ```typescript
 * const session = await requireAdmin();
 * // User is guaranteed to be authenticated and an admin
 * ```
 */
export async function requireAdmin(): Promise<Session> {
  return requireAuth({ role: 'ADMIN' });
}

/**
 * Require artist or admin role for an API route
 *
 * Convenience wrapper for requireAuth({ role: ['ARTIST', 'ADMIN'] })
 *
 * @returns Session object
 * @throws AuthError if not authenticated
 * @throws ForbiddenError if not artist or admin
 *
 * @example
 * ```typescript
 * const session = await requireArtist();
 * // User is guaranteed to be authenticated and either artist or admin
 * ```
 */
export async function requireArtist(): Promise<Session> {
  return requireAuth({ role: ['ARTIST', 'ADMIN'] });
}

// ============================================================================
// AUTHORIZATION CHECKS
// ============================================================================

/**
 * Check if a session has a specific role
 *
 * @param session - Session object
 * @param role - Role or array of roles to check
 * @returns True if session has the role
 *
 * @example
 * ```typescript
 * if (hasRole(session, 'ADMIN')) {
 *   // User is admin
 * }
 *
 * if (hasRole(session, ['ADMIN', 'ARTIST'])) {
 *   // User is admin or artist
 * }
 * ```
 */
export function hasRole(
  session: Session | null,
  role: UserRole | UserRole[]
): boolean {
  if (!session?.user?.role) return false;

  const userRole = session.user.role as UserRole;
  const allowedRoles = Array.isArray(role) ? role : [role];
  return allowedRoles.includes(userRole);
}

/**
 * Check if a session belongs to a specific user
 *
 * @param session - Session object
 * @param userId - User ID to check
 * @returns True if session belongs to the user
 *
 * @example
 * ```typescript
 * if (isOwnResource(session, track.userId)) {
 *   // User owns this track
 * }
 * ```
 */
export function isOwnResource(
  session: Session | null,
  userId: string
): boolean {
  return session?.user?.id === userId;
}

/**
 * Check if a session can access a resource
 *
 * Resource is accessible if:
 * - User is an admin (bypass ownership check)
 * - User owns the resource
 *
 * @param session - Session object
 * @param resourceUserId - User ID of the resource owner
 * @returns True if session can access the resource
 *
 * @example
 * ```typescript
 * if (!canAccessResource(session, track.userId)) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export function canAccessResource(
  session: Session | null,
  resourceUserId: string
): boolean {
  if (!session?.user?.id) return false;

  // Admins can access any resource
  if (hasRole(session, 'ADMIN')) return true;

  // Users can access their own resources
  return isOwnResource(session, resourceUserId);
}

/**
 * Require ownership of a resource or admin role
 *
 * @param session - Session object
 * @param resourceUserId - User ID of the resource owner
 * @throws ForbiddenError if user cannot access resource
 *
 * @example
 * ```typescript
 * const session = await requireAuth();
 * requireResourceAccess(session, track.userId);
 * // Now guaranteed user can access this resource
 * ```
 */
export function requireResourceAccess(
  session: Session | null,
  resourceUserId: string
): void {
  if (!canAccessResource(session, resourceUserId)) {
    throw new ForbiddenError("You don't have access to this resource");
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if session is authenticated
 *
 * @param session - Session object or null
 * @returns True if session is authenticated
 *
 * @example
 * ```typescript
 * const session = await getCurrentSession();
 * if (isAuthenticated(session)) {
 *   // TypeScript knows session.user.id exists
 *   const userId = session.user.id;
 * }
 * ```
 */
export function isAuthenticated(session: Session | null): session is Session {
  return session !== null && !!session.user?.id;
}

/**
 * Type guard to check if session is an admin
 *
 * @param session - Session object or null
 * @returns True if session is admin
 *
 * @example
 * ```typescript
 * if (isAdmin(session)) {
 *   // User is admin
 * }
 * ```
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, 'ADMIN');
}

/**
 * Type guard to check if session is an artist
 *
 * @param session - Session object or null
 * @returns True if session is artist or admin
 *
 * @example
 * ```typescript
 * if (isArtist(session)) {
 *   // User is artist or admin
 * }
 * ```
 */
export function isArtist(session: Session | null): boolean {
  return hasRole(session, ['ARTIST', 'ADMIN']);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user ID from session
 *
 * @param session - Session object
 * @returns User ID or null
 *
 * @example
 * ```typescript
 * const userId = getUserId(session);
 * if (userId) {
 *   // Use userId
 * }
 * ```
 */
export function getUserId(session: Session | null): string | null {
  return session?.user?.id || null;
}

/**
 * Get user role from session
 *
 * @param session - Session object
 * @returns User role or null
 *
 * @example
 * ```typescript
 * const role = getUserRole(session);
 * if (role === 'ADMIN') {
 *   // User is admin
 * }
 * ```
 */
export function getUserRole(session: Session | null): UserRole | null {
  return (session?.user?.role as UserRole | undefined) || null;
}

/**
 * Check if user is active
 *
 * @param session - Session object
 * @returns True if user is active
 *
 * @example
 * ```typescript
 * if (!isUserActive(session)) {
 *   return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
 * }
 * ```
 */
export function isUserActive(session: Session | null): boolean {
  return (session?.user as any)?.isActive ?? false;
}

/**
 * Check if user is premium
 *
 * @param session - Session object
 * @returns True if user is premium
 *
 * @example
 * ```typescript
 * if (isPremiumUser(session)) {
 *   // Unlock premium features
 * }
 * ```
 */
export function isPremiumUser(session: Session | null): boolean {
  return session?.user?.isPremium ?? false;
}
