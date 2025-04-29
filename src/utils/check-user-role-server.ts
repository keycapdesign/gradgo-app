import { createClient as createServerClient } from '@/utils/supabase/server';

/**
 * Check if the current user has a specific role (server-side version)
 * @param roleName The name of the role to check for
 * @returns Promise<boolean> True if the user has the role, false otherwise
 */
export async function checkUserRoleServer(roleName: string): Promise<boolean> {
  try {
    console.log('[checkUserRoleServer] Checking if user has role:', roleName);

    // Create the Supabase client with better error handling
    let supabase: ReturnType<typeof createServerClient>;
    try {
      supabase = createServerClient();
    } catch (clientError) {
      console.error('[checkUserRoleServer] Failed to create Supabase client:', clientError);
      return false;
    }

    // Get the current user
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('[checkUserRoleServer] Error getting user:', userError);
        return false;
      }

      if (!user) {
        console.log('[checkUserRoleServer] No user found');
        return false;
      }

      // Use the simpler function to get role names directly
      const { data, error } = await supabase.rpc('get_user_role_names');

      if (error) {
        console.error('[checkUserRoleServer] Error checking user role:', error);
        return false;
      }

      // Check if any of the returned roles match the requested role
      const hasRole = data?.some((role) => role.role_name === roleName) || false;
      console.log('[checkUserRoleServer] Role check result:', hasRole);
      return hasRole;
    } catch (authError) {
      console.error('[checkUserRoleServer] Error in auth operations:', authError);
      return false;
    }
  } catch (error) {
    console.error('[checkUserRoleServer] Unexpected error in checkUserRoleServer:', error);
    return false;
  }
}

/**
 * Check if the current user is in returns mode (has the 'limited' role) - server-side version
 * @returns Promise<boolean> True if the user is in returns mode, false otherwise
 */
export async function hasLimitedRoleServer(): Promise<boolean> {
  const result = await checkUserRoleServer('limited');
  console.log(`[isLimited] Checked if user has limited role: ${result}`);
  return result;
}
