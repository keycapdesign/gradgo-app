import { createFileRoute, redirect } from '@tanstack/react-router';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { CompleteSignupForm } from '@/components/auth/complete-signup';

export const Route = createFileRoute('/complete-signup')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: search.token as string | undefined,
    email: search.email as string | undefined,
    type: search.type as string | undefined,
  }),
  loaderDeps: ({ search: { token, email } }) => ({ token, email }),
  loader: async ({ deps: { token, email } }) => {
    if (!token) {
      throw redirect({ to: '/login', search: {} });
    }
    // SSR token verification
    let isTokenValid: boolean | null = null;
    let verifyError: string | null = null;
    try {
      const supabase = createServerClient();
      // Try as 'invite' type first
      const { error: inviteError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'invite',
      });
      if (!inviteError) isTokenValid = true;
      else {
        // Try as 'email' type
        const { error: emailError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });
        if (!emailError) isTokenValid = true;
        else {
          isTokenValid = false;
          verifyError =
            inviteError?.message || emailError?.message || 'Invalid or expired verification link.';
        }
      }
    } catch (e: any) {
      isTokenValid = false;
      verifyError = e?.message || 'Token verification failed.';
    }
    return { token, email, isTokenValid, verifyError };
  },
  component: CompleteSignup,
});

function CompleteSignup() {
  const { token, email, isTokenValid, verifyError } = Route.useLoaderData() as {
    token: string;
    email?: string;
    isTokenValid: boolean | null;
    verifyError: string | null;
  };
  // No need for client query if SSR succeeded
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <CompleteSignupForm
          token={token}
          email={email}
          isTokenValid={isTokenValid ?? undefined}
          verifyError={verifyError ? new Error(verifyError) : undefined}
          isVerifying={false}
        />
      </div>
    </div>
  );
}
