import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { cleanupReturnsMode } from '@/utils/cleanup-returns-mode.server';
import { createClient as createServerClient } from '@/utils/supabase/server';

const logoutFn = createServerFn().handler(async () => {
  // Clean up any returns mode roles before logging out
  await cleanupReturnsMode();

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      error: true,
      message: error.message,
    };
  }

  throw redirect({
    href: '/login',
  });
});

export const Route = createFileRoute('/logout')({
  preload: false,
  loader: () => logoutFn(),
});
