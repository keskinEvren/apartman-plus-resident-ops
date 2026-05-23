import { TRPCError } from "@trpc/server";

/**
 * Auth Middleware
 * Checks if user is authenticated and has required role
 */

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: AuthUser | undefined,
  requiredRole: string,
): boolean {
  if (!user) return false;

  const roleHierarchy: Record<string, number> = {
    user: 1,
    manager: 2,
    admin: 3,
    superadmin: 4,
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Throw if user doesn't have required role
 */
export function requireRole(
  user: AuthUser | undefined,
  requiredRole: string,
): void {
  if (!hasRole(user, requiredRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This action requires ${requiredRole} role or higher`,
    });
  }
}

/**
 * Throw if user is not authenticated
 */
export function requireAuth(
  user: AuthUser | undefined,
): asserts user is AuthUser {
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
}
