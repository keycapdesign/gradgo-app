import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

/**
 * Server function to clean up any lingering returns mode roles when a user logs in.
 * This ensures that if a user closed their browser without properly exiting returns mode,
 * they won't be stuck in returns mode when they log in again.
 */
export const cleanupReturnsMode = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const supabase = createServerClient();

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[cleanupReturnsMode] No user found, skipping cleanup');
        return { cleaned: false, reason: 'No user found' };
      }

      console.log(`[cleanupReturnsMode] Checking for limited role for user ${user.id}`);

      // First check if the user has the limited role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles_view')
        .select('role_name')
        .eq('user_id', user.id)
        .eq('role_name', 'limited')
        .maybeSingle();

      if (roleError) {
        console.error('[cleanupReturnsMode] Error checking for limited role:', roleError);
        return { cleaned: false, reason: 'Role check error', error: roleError };
      }

      if (!roleData) {
        console.log('[cleanupReturnsMode] User does not have limited role, no cleanup needed');
        return { cleaned: false, reason: 'No limited role' };
      }

      console.log('[cleanupReturnsMode] User has limited role, removing it');

      // Call the RPC function to exit returns mode
      const { data, error } = await supabase.rpc('exit_returns_mode');

      if (error) {
        console.error('[cleanupReturnsMode] Error removing limited role:', error);
        return { cleaned: false, reason: 'RPC error', error };
      }

      if (data) {
        console.log('[cleanupReturnsMode] Successfully removed limited role');
        return { cleaned: true };
      } else {
        console.log('[cleanupReturnsMode] Failed to remove limited role');
        return { cleaned: false, reason: 'RPC returned no data' };
      }
    } catch (error) {
      console.error('[cleanupReturnsMode] Error in cleanup:', error);
      return { cleaned: false, reason: 'Exception', error };
    }
  });
