import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { MfaErrorCard } from './ui/MfaErrorCard';
import { MfaLoadingCard } from './ui/MfaLoadingCard';
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
import { useEnrollTotp, useMfaVerify } from '@/hooks/auth/use-mfa';

// Form validation schema
const formSchema = z.object({
  verificationCode: z.string().min(6, {
    message: 'Enter the 6-digit code',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export interface EnrollMFAProps {
  onEnrolled: () => void;
  onCancelled: () => void;
}

export function EnrollMFA({ onEnrolled, onCancelled }: EnrollMFAProps) {
  const [error, setError] = useState<string | null>(null);

  // Initialize react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      verificationCode: '',
    },
  });

  // Use custom hook for TOTP enrollment
  const {
    data: enrollData,
    isLoading: isEnrolling,
    error: enrollError,
    refetch: refetchEnroll,
  } = useEnrollTotp();

  // Use custom hook for verification
  const verifyMutation = useMfaVerify(onEnrolled);

  // Form submission handler
  const onSubmit = (data: FormValues) => {
    setError(null);
    if (!enrollData?.factorId) {
      setError('No factor ID available. Please try again.');
      return;
    }
    
    verifyMutation.mutate({ 
      factorId: enrollData.factorId, 
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

  if (isEnrolling || !enrollData) {
    return (
      <MfaLoadingCard
        title="Set Up Two-Factor Authentication"
        description="Generating your QR code..."
      />
    );
  }

  if (enrollError) {
    return <MfaErrorCard error={enrollError} onRetry={() => refetchEnroll()} />;
  }

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
        <CardTitle>Set Up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Scan the QR code below with your authenticator app and enter the 6-digit code to complete
          setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <img src={enrollData.qrCode} alt="MFA QR Code" className="mx-auto w-40 h-40" />
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
            {error && (
              <div className="text-sm font-medium text-destructive text-center">{error}</div>
            )}
            <div className="flex flex-col items-center space-y-2">
              <div className="text-sm text-muted-foreground text-center mb-2">
                Enter the 6-digit code from your authenticator app
              </div>
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
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancelled}>
          Cancel
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)}>
          Verify and Enable
        </Button>
      </CardFooter>
    </Card>
  );
}
