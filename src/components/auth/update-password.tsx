import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { EmailResendForm, type EmailFormValues } from './email-resend-form';
import { MfaHandler } from './mfa-handler';
import { VerifyMFA } from './mfa/verify-mfa';
import { PasswordForm, type PasswordFormValues } from './password-form';
import { SuccessMessage } from './success-message';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import {
  useAuthenticatorAssuranceLevel,
  useMfaFactors,
  useMfaRequired,
} from '@/hooks/auth/use-mfa';

interface UpdatePasswordFormProps extends React.ComponentPropsWithoutRef<'div'> {
  token?: string;
  email?: string;
  isTokenValid?: boolean | null;
  verifyError?: string | null;
}

export function UpdatePasswordForm({ className, token, email, isTokenValid, verifyError, ...props }: UpdatePasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMfaHandler, setShowMfaHandler] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showMfaVerification, setShowMfaVerification] = useState(false);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get MFA status
  const { data: mfaRequired = false } = useMfaRequired();
  const { data: aalData } = useAuthenticatorAssuranceLevel();
  const { data: factorsData } = useMfaFactors();

  // Determine if MFA verification is needed
  const needsMfaVerification =
    mfaRequired &&
    aalData?.currentLevel === 'aal1' &&
    aalData?.nextLevel === 'aal2' &&
    factorsData?.totp &&
    factorsData.totp.length > 0;

  // No need for error from URL anymore

  // Robust function to wait for a valid Supabase session before navigating
  const navigateAfterPasswordUpdate = async () => {
    const supabase = createClient();
    let sessionReady = false;
    let attempts = 0;
    while (!sessionReady && attempts < 20) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        sessionReady = true;
        break;
      }
      await new Promise(res => setTimeout(res, 100));
      attempts++;
    }
    navigate({ to: '/' });
  };

  // Handle password submission
  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      // No need to verify token again, already done in loader
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;

      // Check if the user has completed onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const onboardingCompleted = user?.user_metadata?.onboarding_completed === true;

      // Check if the user needs to upload a selfie
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('selfie_path')
        .eq('user_id', user?.id)
        .single();

      if (contactError && !contactError.message.includes('No rows found')) {
        console.error('Error checking selfie status:', contactError);
      }

      const hasSelfie = !!contactData?.selfie_path;

      // If onboarding is not completed or selfie is needed, redirect to complete-signup
      if (!onboardingCompleted || !hasSelfie) {
        // Redirect to complete-signup
        window.location.href = '/complete-signup';
        return;
      }

      // After updating password, robustly wait for session before navigating
      await navigateAfterPasswordUpdate();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';

      // Check if the error is related to an expired or invalid link
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setShowResendForm(true);
      }
      // Check if the error is related to MFA requirement
      else if (errorMessage.includes('AAL2 session is required')) {
        setPendingPassword(values.password);
        setShowMfaVerification(true);
      } else {
        setError(errorMessage);
      }

      setIsLoading(false);
    }
  };

  // Handle email resend submission
  const handleResendSubmit = async (values: EmailFormValues) => {
    const supabase = createClient();
    setError(null);
    setIsLoading(true);

    try {
      // Use resetPasswordForEmail for password resets
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      // Show success message
      setResendSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle MFA completion
  const handleMfaComplete = () => {
    setShowMfaHandler(false);
    setIsLoading(false);
    // Navigation is handled by the MFA handler
  };

  // Handle MFA cancellation
  const handleMfaCancel = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowMfaHandler(false);
    setIsLoading(false);
    navigate({ to: '/login' });
  };

  // Handle MFA verification success
  const handleMfaVerified = async () => {
    setIsLoading(true);

    try {
      // Now that MFA is verified, update the password
      if (pendingPassword) {
        const supabase = createClient();

        // Verify the token again if provided
        if (token) {
          // Verify the token - only using recovery type for password reset
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });

          if (verifyError) {
            throw new Error(
              'Your password reset link has expired or is invalid. Please request a new one.'
            );
          }
        }

        const { error } = await supabase.auth.updateUser({ password: pendingPassword });
        if (error) throw error;

        // Show MFA handler to check if MFA is required for future operations
        setShowMfaVerification(false);
        setShowMfaHandler(true);

        // After successful password update + MFA, robustly wait for session before navigating
        await navigateAfterPasswordUpdate();
      } else {
        throw new Error('No password provided');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';

      // Check if the error is related to an expired or invalid link
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setShowResendForm(true);
        setShowMfaVerification(false);
      } else {
        setError(errorMessage);
      }

      setIsLoading(false);
    }
  };

  if (showMfaHandler) {
    return <MfaHandler onComplete={handleMfaComplete} onCancel={handleMfaCancel} />;
  }

  if (showMfaVerification && factorsData?.totp && factorsData.totp.length > 0) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Verification Required</CardTitle>
            <CardDescription className="text-foreground">
              Please verify your identity with two-factor authentication to update your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VerifyMFA
              factorId={factorsData.totp[0].id}
              onVerified={handleMfaVerified}
              onCancel={() => {
                setShowMfaVerification(false);
                setPendingPassword(null);
              }}
              showCancel={true}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render logic for token validity
  if (isTokenValid === false) {
    return (
      <div className={cn('space-y-6', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>Invalid or Expired Link</CardTitle>
            <CardDescription>
              {verifyError || 'Your password reset link has expired or is invalid. Please request a new one.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Render form if token is valid or still loading
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="bg-transparent border-none shadow-none">
        {showResendForm ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">
                {resendSuccess ? 'Email Sent' : 'Reset Password Link Expired'}
              </CardTitle>
              <CardDescription className="text-foreground">
                {resendSuccess
                  ? 'Please check your inbox for the password reset email'
                  : 'Enter your email to receive a new password reset link'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resendSuccess ? (
                <SuccessMessage
                  primaryMessage="If your email exists in our system, you will receive a password reset email."
                  secondaryMessage="Please check your inbox and follow the instructions in the email to reset your password."
                />
              ) : (
                <EmailResendForm
                  onSubmit={handleResendSubmit}
                  error={error}
                  isLoading={isLoading}
                  submitButtonText="Send reset link"
                  loadingButtonText="Sending..."
                  defaultEmail={email}
                />
              )}
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Reset Your Password</CardTitle>
              <CardDescription className="text-foreground">
                Please enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm
                onSubmit={handlePasswordSubmit}
                error={error}
                isLoading={isLoading}
                submitButtonText="Save new password"
                loadingButtonText="Saving..."
                passwordLabel="New Password"
                confirmPasswordLabel="Confirm New Password"
                onRequestNewLink={() => setShowResendForm(true)}
                requestLinkText="Request new reset link"
              />
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
