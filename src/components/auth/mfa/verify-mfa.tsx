import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MfaLoadingCard } from './ui/MfaLoadingCard';
import { useMfaVerify } from '@/hooks/auth/use-mfa';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// Form validation schema
const formSchema = z.object({
  verificationCode: z.string().min(6, {
    message: 'Enter the 6-digit code',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export interface VerifyMFAProps {
  factorId: string;
  onVerified: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function VerifyMFA({ factorId, onVerified, onCancel, showCancel = true }: VerifyMFAProps) {
  const [error, setError] = useState<string | null>(null);

  // Initialize react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      verificationCode: '',
    },
  });

  // Use custom hook for verification
  const verifyMutation = useMfaVerify(onVerified);

  // Form submission handler
  const onSubmit = (data: FormValues) => {
    setError(null);
    verifyMutation.mutate({ 
      factorId, 
      code: data.verificationCode 
    });
  };

  // Handle OTP input complete
  const handleComplete = (value: string) => {
    form.setValue('verificationCode', value);
    // Auto-submit when all digits are entered
    if (value.length === 6) {
      form.handleSubmit(onSubmit)();
    }
  };

  if (verifyMutation.isPending) {
    return (
      <MfaLoadingCard
        title="Verifying Code"
        description="Please wait while we verify your authentication code..."
      />
    );
  }

  if (verifyMutation.isError) {
    setError(verifyMutation.error.message || 'Failed to verify code');
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app to verify your identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="text-sm font-medium text-destructive text-center">{error}</div>
          )}
          <div className="flex flex-col items-center space-y-2">
            <InputOTP
              maxLength={6}
              value={form.watch('verificationCode')}
              onChange={(value) => form.setValue('verificationCode', value)}
              onComplete={handleComplete}
              autoFocus
            >
              <InputOTPGroup>
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {form.formState.errors.verificationCode && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.verificationCode.message}
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {showCancel && onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          className={showCancel ? "" : "w-full"}
        >
          Verify
        </Button>
      </CardFooter>
    </Card>
  );
}
