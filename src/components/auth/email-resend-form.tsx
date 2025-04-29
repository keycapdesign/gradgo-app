import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Input } from '@/components/gradgo/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Form schema for email
const emailFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailResendFormProps {
  onSubmit: (values: EmailFormValues) => void;
  error: string | null;
  isLoading: boolean;
  submitButtonText: string;
  loadingButtonText: string;
  showLoginLink?: boolean;
  defaultEmail?: string;
}

export function EmailResendForm({
  onSubmit,
  error,
  isLoading,
  submitButtonText,
  loadingButtonText,
  showLoginLink = true,
  defaultEmail = '',
}: EmailResendFormProps) {
  // Initialize email form
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/70 text-primary-foreground font-medium py-3 rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? loadingButtonText : submitButtonText}
        </Button>
        {showLoginLink && (
          <p className="text-sm text-foreground">
            <Link className="text-foreground hover:text-primary hover:underline" to="/login">
              Return to login
            </Link>
          </p>
        )}
      </form>
    </Form>
  );
}
