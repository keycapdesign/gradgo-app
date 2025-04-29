import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createClient } from '@/utils/supabase/client';

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

// Zod schema for the email-only form
const emailFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type FormValues = z.infer<typeof emailFormSchema>;

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    const supabase = createClient();
    setError(null);
    setIsLoading(true);

    try {
      // Use resend with type 'signup' to resend a signup confirmation email
      // This will only send an email if the account exists but is not confirmed
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/complete-signup`,
        },
      });

      if (error) throw error;

      // Show success message regardless of whether email exists
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Complete your signup</CardTitle>
          <CardDescription className="text-foreground">
            Enter your email to receive a new signup confirmation email
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-foreground">
                If your email exists in our system and requires confirmation, you will receive a
                signup confirmation email.
              </p>
              <p className="text-sm text-foreground">
                Please check your inbox and follow the instructions in the email to complete your
                account setup.
              </p>
              <p className="text-sm text-foreground">
                Already have an account?{' '}
                <Link className="text-foreground hover:text-primary hover:underline" to="/login">
                  Login
                </Link>
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="email"
                          type="email"
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
                  {isLoading ? 'Submitting...' : 'Submit'}
                </Button>
                <p className="text-sm text-foreground">
                  Already have an account?{' '}
                  <Link className="text-foreground hover:text-primary hover:underline" to="/login">
                    Login
                  </Link>
                </p>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
