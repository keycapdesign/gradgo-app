import type { Factor, User } from '@supabase/supabase-js';
import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { createAdminClient, createClient as createServerClient } from '@/utils/supabase/server';

export type SSRSafeUser = User & {
  factors: (Factor & { factor_type: 'phone' | 'totp' })[];
  roles: string[];
  mfaRequired: boolean;
};

/**
 * Fetches the current authenticated user with their roles in a single operation
 * @returns Promise<SSRSafeUser | null> The user with roles or null if not authenticated
 */
export const fetchUserWithRoles: () => Promise<SSRSafeUser | null> = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const supabase = createServerClient();
    const adminClient = createAdminClient();

    // Get the current user
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      console.log('[fetchUserWithRoles] No authenticated user found or error:', error?.message);
      return null;
    }

    // Use admin client to reliably get user roles
    const { data: userRoles, error: userRolesError } = await adminClient
      .from('user_roles')
      .select('role_id')
      .eq('user_id', data.user.id);

    if (userRolesError) {
      console.error('[fetchUserWithRoles] Error fetching user roles:', userRolesError.message);
    }

    if (!userRoles || userRoles.length === 0) {
      console.log(`[fetchUserWithRoles] No roles found for user ${data.user.id}`);

      // User has no roles, they're a student
      const userWithRoles: SSRSafeUser = {
        ...(data.user as SSRSafeUser),
        roles: [],
        mfaRequired: false,
      };

      return userWithRoles;
    }

    // Get role details including MFA requirements
    const roleIds = userRoles.map((ur) => ur.role_id);
    const { data: roles, error: rolesError } = await adminClient
      .from('roles')
      .select('id, name, mfa_required')
      .in('id', roleIds);

    if (rolesError) {
      console.error('[fetchUserWithRoles] Error fetching role details:', rolesError.message);
    }

    // Extract role names and check if any role requires MFA
    const roleNames = roles?.map((role) => role.name) || [];
    const mfaRequired = roles?.some((role) => role.mfa_required) || false;

    console.log(`[fetchUserWithRoles] Found roles for user ${data.user.id}:`, roleNames);
    console.log(`[fetchUserWithRoles] MFA required: ${mfaRequired}`);

    // Add roles and MFA requirement to the user object
    const userWithRoles: SSRSafeUser = {
      ...(data.user as SSRSafeUser),
      roles: roleNames,
      mfaRequired,
    };

    return userWithRoles;
  } catch (error) {
    console.error('[fetchUserWithRoles] Unexpected error:', error);
    return null;
  }
});

/**
 * Fetches the roles for the current authenticated user
 * @returns Promise<string[]> Array of role names the user has
 */
export const fetchUserRoles = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const user = await fetchUserWithRoles();
    return user?.roles || [];
  } catch (error) {
    console.error('[fetchUserRoles] Unexpected error:', error);
    return [];
  }
});

/**
 * Checks if the current user is a student (has no roles)
 * @returns Promise<boolean> True if the user is a student, false otherwise
 */
export const isUserStudent = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const user = await fetchUserWithRoles();
    return !user?.roles.length;
  } catch (error) {
    console.error('[isUserStudent] Unexpected error:', error);
    return false;
  }
});

/**
 * Checks if MFA is required for the current user
 * @returns Promise<boolean> True if MFA is required, false otherwise
 */
export const isMfaRequired = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const user = await fetchUserWithRoles();
    return user?.mfaRequired || false;
  } catch (error) {
    console.error('[isMfaRequired] Unexpected error:', error);
    return false;
  }
});

/**
 * TanStack Query options for fetching the current user with roles
 */
export const userWithRolesQueryOptions = () =>
  queryOptions({
    queryKey: ['user', 'withRoles'],
    queryFn: () => fetchUserWithRoles(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * TanStack Query options for fetching user roles
 */
export const userRolesQueryOptions = () =>
  queryOptions({
    queryKey: ['user', 'roles'],
    queryFn: () => fetchUserRoles(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * TanStack Query options for checking if user is a student
 */
export const isUserStudentQueryOptions = () =>
  queryOptions({
    queryKey: ['user', 'isStudent'],
    queryFn: () => isUserStudent(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * TanStack Query options for checking if MFA is required
 */
export const isMfaRequiredQueryOptions = () =>
  queryOptions({
    queryKey: ['user', 'mfaRequired'],
    queryFn: () => isMfaRequired(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * Type for user status information
 */
export type UserStatusInfo = {
  isStudent: boolean;
  isAdmin: boolean;
  mfaRequired: boolean;
  roles: string[];
};

/**
 * Gets complete user status information for onboarding flow
 * @returns Promise<UserStatusInfo> User status information
 */
export const getUserStatus = createServerFn({
  method: 'GET',
}).handler(async (): Promise<UserStatusInfo> => {
  try {
    const user = await fetchUserWithRoles();

    if (!user) {
      console.log('[getUserStatus] No authenticated user found');
      return {
        isStudent: false,
        isAdmin: false,
        mfaRequired: false,
        roles: [],
      };
    }

    const roles = user.roles || [];
    const isStudent = roles.length === 0;
    const isAdmin = roles.some((role) => role === 'admin' || role === 'super_admin');
    const mfaRequired = user.mfaRequired || false;

    console.log(
      `[getUserStatus] User status: isStudent=${isStudent}, isAdmin=${isAdmin}, mfaRequired=${mfaRequired}, roles=${roles.join(', ')}`
    );

    return {
      isStudent,
      isAdmin,
      mfaRequired,
      roles,
    };
  } catch (error) {
    console.error('[getUserStatus] Unexpected error:', error);
    return {
      isStudent: false,
      isAdmin: false,
      mfaRequired: false,
      roles: [],
    };
  }
});
