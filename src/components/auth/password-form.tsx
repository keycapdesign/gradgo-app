import { zodResolver } from '@hookform/resolvers/zod';
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

// Form schema with password validation
const passwordFormSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface PasswordFormProps {
  onSubmit: (values: PasswordFormValues) => void;
  error: string | null;
  isLoading: boolean;
  submitButtonText: string;
  loadingButtonText: string;
  passwordLabel?: string;
  confirmPasswordLabel?: string;
  onRequestNewLink?: () => void;
  requestLinkText?: string;
}

export function PasswordForm({
  onSubmit,
  error,
  isLoading,
  submitButtonText,
  loadingButtonText,
  passwordLabel = 'Password',
  confirmPasswordLabel = 'Confirm Password',
  onRequestNewLink,
  requestLinkText,
}: PasswordFormProps) {
  // Initialize password form
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{passwordLabel}</FormLabel>
              <FormControl>
                <Input {...field} id="password" type="password" placeholder="Type here" required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{confirmPasswordLabel}</FormLabel>
              <FormControl>
                <Input {...field} id="confirmPassword" type="password" placeholder="Type here" required />
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
        {onRequestNewLink && (
          <p className="text-sm text-foreground">
            Link expired or invalid?{' '}
            <button
              type="button"
              className="text-foreground hover:text-primary hover:underline"
              onClick={onRequestNewLink}
            >
              {requestLinkText || 'Request new link'}
            </button>
          </p>
        )}
      </form>
    </Form>
  );
}
