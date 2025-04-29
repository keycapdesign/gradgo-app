import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { MfaHandler } from './mfa-handler';
import { createClient } from '@/utils/supabase/client';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';

import { FeatureShowcase } from '@/components/feature-showcase';
import { Input } from '@/components/gradgo/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

// Zod schema for login form
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMfaHandler, setShowMfaHandler] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      // Sign in with password
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // Wait for session to be ready
      let sessionReady = false;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          sessionReady = true;
          break;
        }
        await new Promise((res) => setTimeout(res, 100));
      }

      if (!sessionReady) {
        setError('Login succeeded but session was not established. Please try again.');
        setIsLoading(false);
        return;
      }

      // Invalidate user roles query to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: userWithRolesQueryOptions().queryKey });

      // Show MFA handler to check if MFA is required
      setShowMfaHandler(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('[Login] error:', error);
      setIsLoading(false);
    }
  };

  // Handle MFA completion
  const handleMfaComplete = () => {
    setShowMfaHandler(false);
  };

  // Handle MFA cancellation
  const handleMfaCancel = async () => {
    // Sign out if MFA is cancelled
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowMfaHandler(false);
    setIsLoading(false);
  };

  if (showMfaHandler) {
    return <MfaHandler onComplete={handleMfaComplete} onCancel={handleMfaCancel} />;
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Login</CardTitle>
          <CardDescription className="text-foreground">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <Input {...field} id="email" type="email" placeholder="Type here" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel htmlFor="password" className="text-foreground">
                        Password
                      </FormLabel>
                      <Link
                        to="/forgot-password"
                        className="ml-auto inline-block text-sm text-foreground hover:text-muted-foreground hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="Type here"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/70 text-primary-foreground font-medium py-3 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <p className="text-sm text-foreground">
                Don't have an account?{' '}
                <Link
                  className="text-foreground hover:text-muted-foreground hover:underline"
                  to="/sign-up"
                >
                  Sign up
                </Link>
              </p>
              <FeatureShowcase />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
