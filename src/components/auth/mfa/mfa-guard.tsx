import { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { EnrollMFA } from './enroll-mfa';
import { MfaErrorCard } from './ui/MfaErrorCard';
import { VerifyMFA } from './verify-mfa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMfaStatus } from '@/hooks/auth/use-mfa';

interface MfaGuardProps {
  children: ReactNode;
}

export function MfaGuard({ children }: MfaGuardProps) {
  const queryClient = useQueryClient();
  const {
    mfaRequired,
    needsMfaEnrollment,
    needsMfaVerification,
    isMfaVerified,
    totpFactors,
    isLoading,
    error,
  } = useMfaStatus();

  // Handle successful MFA operations
  const handleMfaSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Checking security requirements</CardTitle>
          <CardDescription>Please wait while we verify your account...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <MfaErrorCard
        error={error}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['auth'] })}
      />
    );
  }

  // If MFA is not required, render children
  if (!mfaRequired) {
    return <>{children}</>;
  }

  // If MFA is verified, render children
  if (isMfaVerified) {
    return <>{children}</>;
  }

  // If MFA enrollment is needed, show enrollment dialog
  if (needsMfaEnrollment) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Security Requirement</CardTitle>
            <CardDescription>
              Your account requires two-factor authentication to access this area.
            </CardDescription>
          </CardHeader>
        </Card>
        <EnrollMFA
          onEnrolled={handleMfaSuccess}
          onCancelled={() => {}} // No cancel option for required MFA
        />
      </div>
    );
  }

  // If MFA verification is needed, show verification dialog
  if (needsMfaVerification && totpFactors.length > 0) {
    return (
      <div className="container max-w-md mx-auto py-8">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Verification Required</CardTitle>
            <CardDescription>
              Please verify your identity with two-factor authentication to continue.
            </CardDescription>
          </CardHeader>
        </Card>
        <VerifyMFA factorId={totpFactors[0].id} onVerified={handleMfaSuccess} showCancel={false} />
      </div>
    );
  }

  // Fallback - should not reach here if all conditions are properly handled
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Authentication Error</CardTitle>
        <CardDescription>
          There was an issue with your authentication status. Please try logging out and back in.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
