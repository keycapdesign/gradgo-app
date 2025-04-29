import { createServerFn } from '@tanstack/react-start';
import { createAdminClient } from '@/utils/supabase/server';

/**
 * Checks if MFA is required for any of the user's roles
 * @returns Promise<boolean> True if MFA is required for any of the user's roles
 * @throws Error if there's an issue with the session or database query
 */
export const checkMfaRequired = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    console.log('[checkMfaRequired] Checking if MFA is required for user roles');
    const supabase = createAdminClient();

    // First check if the session is valid
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[checkMfaRequired] Session error:', sessionError.message);
      throw new Error(`Session error: ${sessionError.message}`);
    }

    if (!sessionData.session) {
      console.error('[checkMfaRequired] No active session found');
      throw new Error('No active session found. Please log in again.');
    }

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('[checkMfaRequired] Error getting user:', userError.message);
      throw new Error(`Error getting user: ${userError.message}`);
    }

    if (!userData.user) {
      console.error('[checkMfaRequired] No authenticated user found');
      throw new Error('No authenticated user found. Please log in again.');
    }

    // Query to check if any of the user's roles require MFA
    const { data, error } = await supabase.rpc('check_user_mfa_required', {
      user_id_param: userData.user.id,
    });

    if (error) {
      console.error('[checkMfaRequired] Error checking MFA requirement:', error.message);
      throw new Error(`Error checking MFA requirement: ${error.message}`);
    }

    console.log('[checkMfaRequired] MFA required:', data);
    return data;
  } catch (error) {
    console.error('[checkMfaRequired] Unexpected error:', error);
    throw error; // Propagate the error to be handled by the caller
  }
});

/**
 * TanStack Query options for checking if MFA is required
 */
export const mfaRequiredQueryOptions = () => ({
  queryKey: ['user', 'mfaRequired'],
  queryFn: () => checkMfaRequired(),
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: 3, // Retry failed requests up to 3 times
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
});
