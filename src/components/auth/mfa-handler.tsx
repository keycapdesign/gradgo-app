import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

import { EnrollMFA } from './mfa/enroll-mfa';
import { MfaErrorCard } from './mfa/ui/MfaErrorCard';
import { VerifyMFA } from './mfa/verify-mfa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';
import {
  useAuthenticatorAssuranceLevel,
  useMfaFactors,
  useMfaRequired,
} from '@/hooks/auth/use-mfa';

interface MfaHandlerProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function MfaHandler({ onComplete, onCancel }: MfaHandlerProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if MFA is required
  const {
    data: mfaRequired = false,
    isLoading: isMfaRequiredLoading,
    error: mfaRequiredError,
  } = useMfaRequired();

  // Get AAL
  const {
    data: aalData,
    isLoading: isAalLoading,
    error: aalError,
  } = useAuthenticatorAssuranceLevel();

  // Get factors
  const { data: factorsData, isLoading: isFactorsLoading, error: factorsError } = useMfaFactors();

  const isLoading = isMfaRequiredLoading || isAalLoading || isFactorsLoading;
  const error = mfaRequiredError || aalError || factorsError;

  // Handle successful MFA operations
  const handleMfaSuccess = async () => {
    try {
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      await queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Notify parent component that MFA is complete
      onComplete();

      // Get user roles to determine where to navigate
      const user = await queryClient.fetchQuery(userWithRolesQueryOptions());

      // Navigate based on user roles
      if (user?.roles && user.roles.length > 0) {
        await navigate({ to: '/admin' });
      } else {
        await navigate({ to: '/' });
      }
    } catch (err: any) {
      console.error('[MfaHandler] Error after MFA operation:', err);
      // Default to home page if there's an error
      await navigate({ to: '/' });
    }
  };

  // Auto-complete login if MFA is not required or already verified
  useEffect(() => {
    const completeLogin = async () => {
      if (
        !isLoading &&
        !error &&
        (!mfaRequired || (aalData?.currentLevel === 'aal2' && aalData?.nextLevel === 'aal2'))
      ) {
        try {
          // Notify parent component that MFA is complete
          onComplete();

          // Get user roles to determine where to navigate
          const user = await queryClient.fetchQuery(userWithRolesQueryOptions());

          // Navigate based on user roles
          if (user?.roles && user.roles.length > 0) {
            await navigate({ to: '/admin' });
          } else {
            await navigate({ to: '/' });
          }
        } catch (err: any) {
          console.error('[MfaHandler] Error completing login:', err);
          // Default to home page if there's an error
          await navigate({ to: '/' });
        }
      }
    };

    completeLogin();
  }, [isLoading, error, mfaRequired, aalData, onComplete, navigate, queryClient]);

  // Show loading state
  if (isLoading) {
    return (
      <Card className="w-full border-none shadow-none">
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return <MfaErrorCard error={error} onRetry={onCancel} />;
  }

  // If MFA is not required or already verified, show loading while auto-completing login
  if (!mfaRequired || (aalData?.currentLevel === 'aal2' && aalData?.nextLevel === 'aal2')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Logging in</CardTitle>
          <CardDescription>Please wait while we complete your login...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // If MFA is required but user has no factors, show enrollment
  const totpFactors = factorsData?.totp || [];
  if (mfaRequired && totpFactors.length === 0) {
    return (
      <>
        <Card className="w-full mb-4">
          <CardHeader>
            <CardTitle>Security Requirement</CardTitle>
            <CardDescription>
              Your account requires two-factor authentication. Please set it up to continue.
            </CardDescription>
          </CardHeader>
        </Card>
        <EnrollMFA onEnrolled={handleMfaSuccess} onCancelled={onCancel} />
      </>
    );
  }

  // If MFA is required and user has factors, show verification
  if (mfaRequired && totpFactors.length > 0) {
    return (
      <>
        <Card className="w-full mb-4">
          <CardHeader>
            <CardTitle>Verification Required</CardTitle>
            <CardDescription>
              Please verify your identity with two-factor authentication to continue.
            </CardDescription>
          </CardHeader>
        </Card>
        <VerifyMFA
          factorId={totpFactors[0].id}
          onVerified={handleMfaSuccess}
          onCancel={onCancel}
          showCancel={true}
        />
      </>
    );
  }

  // Fallback (should not reach here)
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Authentication Error</CardTitle>
        <CardDescription>
          An unexpected error occurred. Please try logging in again.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
