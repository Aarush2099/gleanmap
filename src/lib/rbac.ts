/**
 * Role-Based Access Control (RBAC) utilities
 * 
 * Centralized RBAC checks to ensure consistent admin and role validation
 * across the application. All sensitive operations must validate on the server,
 * not just in the UI.
 * 
 * Security: NEVER rely on client-side RBAC checks alone. Always validate
 * server-side before performing privileged operations.
 */

import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

/**
 * Check if a user has a specific role
 * 
 * @param user - The authenticated user profile
 * @param role - The role to check
 * @returns true if user has the role, false otherwise
 */
export function hasRole(user: Profile | null, role: AppRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user is an admin
 * Convenience function for the most common RBAC check
 * 
 * @param user - The authenticated user profile
 * @returns true if user is an admin, false otherwise
 */
export function hasAdminAccess(user: Profile | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Server-side validation: Check if user email is in admin allowlist
 * Use this in server functions that auto-promote admins
 * 
 * @param email - User email to check
 * @param adminEmails - Array of allowed admin emails from config
 * @returns true if email is in allowlist, false otherwise
 */
export function isEmailAdmin(email: string, adminEmails: string[]): boolean {
  return adminEmails.some(
    (allowedEmail) => allowedEmail.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Async server function: Validate admin access via RPC or direct DB query
 * For server functions that need dynamic role validation
 * 
 * Example:
 * ```
 * const isAdmin = await validateAdminAccess(userId, supabase);
 * if (!isAdmin) throw new Error('Forbidden: admin only');
 * ```
 * 
 * @param userId - The user ID to validate
 * @param supabase - Supabase client with service role or authenticated session
 * @returns Promise<boolean> - true if user has admin role
 */
export async function validateAdminAccess(
  userId: string,
  supabase: any // Use 'any' to avoid circular imports; it's a Supabase client
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (error) {
      console.error('[RBAC] RPC error checking admin role:', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('[RBAC] Unexpected error in validateAdminAccess:', err);
    return false;
  }
}

/**
 * Type guard: Ensure we have a user (non-null) and they are an admin
 * Useful for TypeScript narrowing in conditional blocks
 * 
 * Example:
 * ```
 * if (isAdminUser(profile)) {
 *   // TypeScript knows profile is Profile & admin here
 *   renderAdminUI(profile);
 * }
 * ```
 */
export function isAdminUser(user: Profile | null): user is Profile {
  return hasAdminAccess(user);
}

/**
 * Assert that a user has admin access, throw if not
 * Use this in server functions to ensure early failure
 * 
 * Example:
 * ```
 * assertAdminAccess(user);
 * // Now safe to proceed with admin operations
 * ```
 */
export function assertAdminAccess(user: Profile | null): asserts user is Profile {
  if (!hasAdminAccess(user)) {
    const error = new Error('Forbidden: admin access required');
    (error as any).statusCode = 403;
    throw error;
  }
}

/**
 * Assert that user has a specific role, throw if not
 */
export function assertHasRole(
  user: Profile | null,
  role: AppRole
): asserts user is Profile {
  if (!hasRole(user, role)) {
    const error = new Error(`Forbidden: ${role} role required`);
    (error as any).statusCode = 403;
    throw error;
  }
}
