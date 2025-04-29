import { createFileRoute } from '@tanstack/react-router';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { UpdatePasswordForm } from '@/components/auth/update-password';

export const Route = createFileRoute('/update-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: search.token as string | undefined,
    email: search.email as string | undefined,
    type: search.type as string | undefined,
    error: search.error as string | undefined,
  }),
  loaderDeps: ({ search: { token, email, type, error } }) => ({ token, email, type, error }),
  loader: async ({ deps: { token, email, type, error } }) => {
    let isTokenValid: boolean | null = null;
    let verifyError: string | null = null;
    if (token) {
      try {
        const supabase = createServerClient();
        // Try as 'recovery' type (for password reset)
        const { error: recoveryError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        });
        if (!recoveryError) {
          isTokenValid = true;
        } else {
          isTokenValid = false;
          verifyError = recoveryError.message || 'Invalid or expired verification link.';
        }
      } catch (e: any) {
        isTokenValid = false;
        verifyError = e?.message || 'Token verification failed.';
      }
    } else {
      isTokenValid = false;
      verifyError = 'No verification token provided.';
    }
    return { token, email, type, error, isTokenValid, verifyError };
  },
  component: UpdatePassword,
});

function UpdatePassword() {
  const { token, email, isTokenValid, verifyError } = Route.useLoaderData();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm token={token} email={email} isTokenValid={isTokenValid} verifyError={verifyError} />
      </div>
    </div>
  );
}
