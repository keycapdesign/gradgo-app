import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';
import { createClient } from '@/utils/supabase/client';

import { MfaSettings } from '@/components/auth/mfa/mfa-settings';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Define the form schema with zod
const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function AccountSettings() {
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch current user data
  const { data: user, isLoading } = useQuery(userWithRolesQueryOptions());

  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  // Update form values when user data is loaded
  useState(() => {
    if (user) {
      const metadata = user.user_metadata as { first_name?: string; last_name?: string } | null;

      form.reset({
        firstName: metadata?.first_name || '',
        lastName: metadata?.last_name || '',
        email: user.email || '',
      });
    }
  });

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    setIsUpdating(true);

    try {
      const supabase = createClient();

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
      });

      if (error) {
        throw error;
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account profile information</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" {...field} disabled />
                    </FormControl>
                    <FormDescription>Contact support to change your email address.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You will receive an email with instructions to reset your password.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleResetPassword}>
            Reset Password
          </Button>
        </CardFooter>
      </Card>

      {/* MFA Settings */}
      <MfaSettings />
    </div>
  );
}
