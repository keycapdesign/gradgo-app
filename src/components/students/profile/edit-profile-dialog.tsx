import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { createClient } from '@/utils/supabase/client';

import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Define the form schema with zod
const profileFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

/**
 * Edit Profile Dialog
 *
 * This dialog allows users to update their email address and request password resets.
 * Note: This only updates the user's email in the auth.users table, not in the contacts table.
 * This is intentional as per requirements to only update the email on the user record.
 */
interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  onSuccess: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  currentEmail,
  onSuccess,
}: EditProfileDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: currentEmail || '',
    },
  });

  // Handle form submission to update email
  const onSubmit = async (data: ProfileFormValues) => {
    // If email hasn't changed, don't do anything
    if (data.email === currentEmail) {
      toast.info('Email address is unchanged');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const supabase = createClient();

      // Update ONLY the user's email in auth.users table, not in contacts
      const { error } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (error) {
        throw error;
      }

      toast.success(
        'Email update initiated. Please check both your current and new email addresses to confirm the change.'
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating email:', error);
      setError(error.message || 'Failed to update email');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password reset request
  const handlePasswordReset = async () => {
    setIsRequestingReset(true);
    setError(null);

    try {
      const supabase = createClient();

      // Request password reset
      const { error } = await supabase.auth.resetPasswordForEmail(currentEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Password reset email sent. Please check your inbox.');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      setError(error.message || 'Failed to request password reset');
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your email address (requires confirmation on both old and new emails) or request
            a password reset.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="your.email@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isUpdating || isRequestingReset}>
                {isUpdating ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Email'
                )}
              </Button>
            </div>
          </form>
        </Form>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            type="button"
            className="w-full flex-1"
            onClick={handlePasswordReset}
            disabled={isUpdating || isRequestingReset}
          >
            {isRequestingReset ? (
              <>
                <LoadingSpinner className="mr-2" />
                Sending...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
          <Button
            variant="secondary"
            type="button"
            className="w-full flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating || isRequestingReset}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
