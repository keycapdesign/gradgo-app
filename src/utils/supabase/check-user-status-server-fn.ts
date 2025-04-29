import { createServerFn } from '@tanstack/react-start';
import { createAdminClient } from '@/utils/supabase/server';

export type UserStatusResult = {
  isAdmin: boolean;
  mfaRequired: boolean;
  error?: string;
};

/**
 * Server function to check user status including admin role and MFA requirements
 * Uses admin client to reliably access role information
 */
export const checkUserStatus = createServerFn({
  method: 'GET',
}).handler(async (): Promise<UserStatusResult> => {
  try {
    console.log('[checkUserStatus] Checking user status');
    const supabase = createAdminClient();

    // First check if the session is valid
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[checkUserStatus] Session error:', sessionError.message);
      return { isAdmin: false, mfaRequired: false, error: `Session error: ${sessionError.message}` };
    }

    if (!sessionData.session) {
      console.error('[checkUserStatus] No active session found');
      return { isAdmin: false, mfaRequired: false, error: 'No active session found' };
    }

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('[checkUserStatus] Error getting user:', userError.message);
      return { isAdmin: false, mfaRequired: false, error: `Error getting user: ${userError.message}` };
    }

    if (!userData.user) {
      console.error('[checkUserStatus] No authenticated user found');
      return { isAdmin: false, mfaRequired: false, error: 'No authenticated user found' };
    }

    // Get user roles with admin client for reliable access
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userData.user.id);

    if (rolesError) {
      console.error('[checkUserStatus] Error getting user roles:', rolesError.message);
      return { isAdmin: false, mfaRequired: false, error: `Error getting user roles: ${rolesError.message}` };
    }

    if (!userRoles || userRoles.length === 0) {
      console.log('[checkUserStatus] User has no roles');
      return { isAdmin: false, mfaRequired: false };
    }

    // Get role details for the user's roles
    const roleIds = userRoles.map(ur => ur.role_id);
    const { data: roles, error: roleDetailsError } = await supabase
      .from('roles')
      .select('name, mfa_required')
      .in('id', roleIds);

    if (roleDetailsError) {
      console.error('[checkUserStatus] Error getting role details:', roleDetailsError.message);
      return { isAdmin: false, mfaRequired: false, error: `Error getting role details: ${roleDetailsError.message}` };
    }

    // Check if user has admin role
    const isAdmin = roles?.some(role => role.name === 'admin' || role.name === 'super_admin') || false;
    
    // Check if any of the user's roles require MFA
    const mfaRequired = roles?.some(role => role.mfa_required) || false;

    console.log(`[checkUserStatus] User status: isAdmin=${isAdmin}, mfaRequired=${mfaRequired}`);
    return { isAdmin, mfaRequired };
  } catch (error: any) {
    console.error('[checkUserStatus] Unexpected error:', error);
    return { isAdmin: false, mfaRequired: false, error: `Unexpected error: ${error.message}` };
  }
});

/**
 * TanStack Query options for checking user status
 */
export const userStatusQueryOptions = () => ({
  queryKey: ['user', 'status'],
  queryFn: () => checkUserStatus(),
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: 3, // Retry failed requests up to 3 times
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
});
