import { createClient } from '@/utils/supabase/client';

/**
 * Check if the current user has a specific role (client-side version)
 * @param roleName The name of the role to check for
 * @returns Promise<boolean> True if the user has the role, false otherwise
 */
export async function checkUserRole(roleName: string): Promise<boolean> {
  try {
    console.log('[checkUserRole] Checking if user has role:', roleName);
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('[checkUserRole] Error getting user:', userError);
      return false;
    }

    if (!user) {
      console.log('[checkUserRole] No user found');
      return false;
    }

    // Use the simpler function to get role names directly
    const { data, error } = await supabase.rpc('get_user_role_names');

    if (error) {
      console.error('[checkUserRole] Error checking user role:', error);
      return false;
    }

    // Check if any of the returned roles match the requested role
    const hasRole = data?.some((role) => role.role_name === roleName) || false;
    console.log('[checkUserRole] Role check result:', hasRole);
    return hasRole;
  } catch (error) {
    console.error('[checkUserRole] Unexpected error in checkUserRole:', error);
    return false;
  }
}

/**
 * Check if the current user is in returns mode (has the 'limited' role)
 * @returns Promise<boolean> True if the user is in returns mode, false otherwise
 */
export async function hasLimitedRole(): Promise<boolean> {
  const result = await checkUserRole('limited');
  console.log(`[hasLimitedRole] Checked if user has limited role: ${result}`);
  return result;
}
