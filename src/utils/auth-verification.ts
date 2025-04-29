import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Function to verify the current user's password
export const verifyUserPassword = createServerFn({ method: 'POST' })
  .validator((data: { password: string }) => ({
    password: data.password,
  }))
  .handler(async (ctx) => {
    const { password } = ctx.data;
    console.log('Verifying user password');
    const supabase = createServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error getting current user:', userError?.message);
      throw new Error('Not authenticated');
    }

    // Verify the password by attempting to sign in with the current email and provided password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password: password,
    });

    if (signInError) {
      console.error('Password verification failed:', signInError.message);
      throw new Error('Invalid password');
    }

    // If we get here, the password was correct
    return { success: true };
  });
