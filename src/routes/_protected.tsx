import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { cleanupReturnsMode } from '@/utils/cleanup-returns-mode.server';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';
import { createClient as createServerClient } from '@/utils/supabase/server';

export const loginFn = createServerFn({ method: 'POST' })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const supabase = createServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }

    // Clean up any lingering returns mode roles
    await cleanupReturnsMode();
  });

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context }) => {
    try {
      console.log('[ProtectedRoute] Starting beforeLoad, fetching user data');

      // Use the query client to ensure the user data is cached
      const user = await context.queryClient.ensureQueryData(userWithRolesQueryOptions());

      console.log('[ProtectedRoute] User data fetched:', user ? 'User found' : 'No user found');

      // Check if the user is authenticated
      if (!user) {
        console.log('[ProtectedRoute] No authenticated user found, redirecting to login');
        throw redirect({ to: '/login' });
      }

      // Get user roles from the user object
      const userRoles = user.roles || [];
      console.log('[ProtectedRoute] User roles:', userRoles);
      console.log('[ProtectedRoute] User ID:', user.id);
      console.log('[ProtectedRoute] User email:', user.email);

      return {
        user,
        userRoles,
      };
    } catch (error) {
      console.error('[ProtectedRoute] Error in beforeLoad:', error);

      // Log more details about the error
      if (error.cause) {
        console.error('[ProtectedRoute] Error cause:', error.cause);
      }

      if (error.stack) {
        console.error('[ProtectedRoute] Error stack:', error.stack);
      }

      // If there's an error fetching the user, redirect to login
      if (error.message !== 'Unauthorized') {
        console.log('[ProtectedRoute] Redirecting to login due to error');
        throw redirect({ to: '/login' });
      }

      throw error;
    }
  },

  // Add onError handler to properly handle errors during route loading
  onError: ({ error }) => {
    // Check if error exists before accessing its properties
    if (error) {
      console.log('[ProtectedRoute] onError handling:', error.message);
    } else {
      console.log('[ProtectedRoute] onError handling: Error object is undefined');
      // Create a new error with a message for the default catch boundary
      throw new Error('An unexpected error occurred');
    }
    // We don't need to do anything special here, just log the error
    // Child routes will handle their specific error cases
  },

  component: Outlet,
});
