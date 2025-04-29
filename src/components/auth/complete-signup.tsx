import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { EmailResendForm, type EmailFormValues } from './email-resend-form';
import { MfaHandler } from './mfa-handler';
import { PasswordForm, type PasswordFormValues } from './password-form';
import { SelfieUpload } from './selfie-upload';
import { SuccessMessage } from './success-message';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getUserStatus,
  userWithRolesQueryOptions,
} from '@/utils/supabase/fetch-user-roles-server-fn';
import { createClient } from '@/utils/supabase/client';

interface CompleteSignupFormProps extends React.ComponentPropsWithoutRef<'div'> {
  token?: string;
  email?: string;
  isTokenValid?: boolean;
  verifyError?: Error | null;
  isVerifying?: boolean;
}

// Type for selfie data
interface SelfieData {
  userId: string;
  contactId: number;
  eventId: number;
}

export function CompleteSignupForm({
  className,
  token,
  email,
  isTokenValid,
  verifyError,
  isVerifying,
  ...props
}: CompleteSignupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMfaHandler, setShowMfaHandler] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showSelfieUpload, setShowSelfieUpload] = useState(false);
  const [selfieData, setSelfieData] = useState<SelfieData | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mutation for updating user password
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const supabase = createClient();
      return supabase.auth.updateUser({ password });
    },
  });

  // Mutation for updating user metadata
  const updateUserMetadataMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      return supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });
    },
  });

  // Mutation for sending magic link
  const sendMagicLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      const supabase = createClient();
      return supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/complete-signup`,
          data: { email_verification: true },
        },
      });
    },
  });

  // Function to check if selfie is needed
  const checkSelfieRequired = async (userId: string) => {
    const supabase = createClient();

    // Get contact data
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (contactError && !contactError.message.includes('No rows found')) {
      console.error('Error fetching contact data:', contactError);
      return null;
    }

    if (!contactData) {
      console.log('No contact found for this user');
      return null;
    }

    console.log('Contact found, checking for event with face ID enabled');

    // Get event data in a single query
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('event(id, face_id_enabled, is_gowns_only)')
      .eq('contact', contactData.id)
      .order('created_at', { ascending: false })
      .single();

    if (bookingError && !bookingError.message.includes('No rows found')) {
      console.error('Error fetching booking data:', bookingError);
      return null;
    }

    if (!bookingData?.event) {
      console.log('No event data found for this contact');
      return null;
    }

    // Cast the event data to the correct type
    const eventData = bookingData.event as any;
    console.log('Event data:', eventData);

    // Check if face ID is enabled and it's not a gowns-only event
    const needsSelfie = eventData.face_id_enabled === true && eventData.is_gowns_only === false;
    console.log(
      `Face ID enabled: ${eventData.face_id_enabled}, Is gowns only: ${eventData.is_gowns_only}`
    );
    console.log(`Needs selfie: ${needsSelfie}`);

    if (needsSelfie) {
      return {
        userId,
        contactId: contactData.id,
        eventId: eventData.id,
      };
    }

    return null;
  };

  // Function to navigate based on user status
  const navigateBasedOnUserStatus = async (isAdmin: boolean) => {
    // Wait until Supabase session is available (max 2 seconds)
    const supabase = createClient();
    let sessionReady = false;
    let attempts = 0;

    console.log('Waiting for session to be established before navigation');
    while (!sessionReady && attempts < 20) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        console.log('Session established, user ID:', sessionData.session.user.id);
        sessionReady = true;
        break;
      }
      await new Promise((res) => setTimeout(res, 100)); // Wait 100ms
      attempts++;
    }

    if (!sessionReady) {
      console.warn('Session not established after maximum attempts, proceeding anyway');
    }

    // Invalidate and refetch user data to ensure it's available in the protected route
    console.log('Invalidating user data query');
    await queryClient.invalidateQueries({ queryKey: userWithRolesQueryOptions().queryKey });

    try {
      // Explicitly fetch the user data to ensure it's in the cache
      console.log('Fetching fresh user data');
      const userData = await queryClient.fetchQuery(userWithRolesQueryOptions());
      console.log(
        'Successfully fetched fresh user data:',
        userData ? 'User found' : 'No user found'
      );
      if (userData) {
        console.log('User ID:', userData.id);
        console.log('User roles:', userData.roles);
      }
    } catch (error) {
      console.error('Error fetching user data before navigation:', error);
      // Continue with navigation even if there's an error
    }

    // Now navigate
    if (isAdmin) {
      console.log('Navigating to admin page');
      navigate({ to: '/admin' });
    } else {
      console.log('Navigating to home page');
      navigate({ to: '/' });
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      // Token is already verified on page load
      if (!isTokenValid) {
        throw new Error(
          'Your verification link has expired or is invalid. Please request a new one.'
        );
      }

      // Update password
      const { data, error } = await updatePasswordMutation.mutateAsync(values.password);
      if (error) throw error;

      // Always sign in after password update to ensure a valid session
      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: data.user.email || '',
        password: values.password,
      });

      // Check user status
      console.log('Checking user status to determine flow');
      const userStatus = await getUserStatus();
      console.log(
        `User status: isStudent=${userStatus.isStudent}, isAdmin=${userStatus.isAdmin}, mfaRequired=${userStatus.mfaRequired}`
      );

      // Handle based on user type
      if (!userStatus.isStudent) {
        // User is staff (has roles)
        console.log('User is staff (has roles), checking if MFA is required');

        if (userStatus.mfaRequired) {
          // MFA is required
          console.log('MFA is required for staff user, showing MFA handler');
          setShowMfaHandler(true);
        } else {
          // No MFA required
          console.log('MFA not required for staff user, completing onboarding');
          await updateUserMetadataMutation.mutateAsync();
          await navigateBasedOnUserStatus(userStatus.isAdmin);
        }
      } else {
        // User is a student (no roles)
        console.log('User is a student (no roles), checking if selfie is needed');

        // Check if selfie is needed
        const selfieRequired = await checkSelfieRequired(data.user.id);

        if (selfieRequired) {
          // Selfie is required
          console.log('Selfie is required for student, showing selfie upload');
          setSelfieData(selfieRequired);
          setShowSelfieUpload(true);
        } else {
          // No selfie required
          console.log('No selfie required for student, completing onboarding');
          await updateUserMetadataMutation.mutateAsync();
          await navigateBasedOnUserStatus(false); // Students are never admins
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';

      // Check if the error is related to an expired or invalid link
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setShowResendForm(true);
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email resend submission
  const handleResendSubmit = async (values: EmailFormValues) => {
    setError(null);
    setIsLoading(true);

    // Make sure we're in the user-requested resend form mode, not the error mode
    if (!showResendForm) {
      setShowResendForm(true);
    }

    try {
      const { error } = await sendMagicLinkMutation.mutateAsync(values.email);
      if (error) throw error;

      console.log('Email sent successfully, updating UI state');

      // Set success state
      setResendSuccess(true);
      setIsLoading(false);

      // Clear any verification errors that might be present
      if (verifyError) {
        console.log('Clearing verification error state');
        // We can't directly modify verifyError as it's a prop, but we can
        // ensure we're in the user-requested flow instead of the error flow
        setShowResendForm(true);
      }
    } catch (error: unknown) {
      console.error('Error sending magic link:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  // Handle MFA completion
  const handleMfaComplete = async () => {
    setShowMfaHandler(false);
    setIsLoading(true);

    try {
      // Mark onboarding as completed
      console.log('MFA completed, completing onboarding');
      await updateUserMetadataMutation.mutateAsync();

      // Get user status to determine where to navigate
      console.log('Checking user status after MFA');
      const userStatus = await getUserStatus();
      console.log(`User status after MFA: isAdmin=${userStatus.isAdmin}`);

      // Navigate based on user status
      await navigateBasedOnUserStatus(userStatus.isAdmin);
    } catch (error) {
      console.error('Error after MFA completion:', error);
      // Still try to navigate even if there's an error
      navigate({ to: '/' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle MFA cancellation
  const handleMfaCancel = async () => {
    setShowMfaHandler(false);
    setIsLoading(true);

    try {
      // Mark onboarding as completed
      console.log('MFA cancelled, completing onboarding');
      await updateUserMetadataMutation.mutateAsync();

      // Get user status to determine where to navigate
      console.log('Checking user status after MFA cancel');
      const userStatus = await getUserStatus();
      console.log(`User status after MFA cancel: isAdmin=${userStatus.isAdmin}`);

      // Navigate based on user status
      await navigateBasedOnUserStatus(userStatus.isAdmin);
    } catch (error) {
      console.error('Error after MFA cancellation:', error);
      // Still try to navigate even if there's an error
      navigate({ to: '/' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selfie upload completion
  const handleSelfieComplete = async () => {
    setIsLoading(true);

    try {
      // Mark onboarding as completed
      console.log('Selfie uploaded, completing onboarding');
      await updateUserMetadataMutation.mutateAsync();

      // For students, always navigate to home page
      console.log('Navigating to home page after selfie');
      await navigateBasedOnUserStatus(false);
    } catch (error) {
      console.error('Error after selfie completion:', error);
      // Still try to navigate even if there's an error
      navigate({ to: '/' });
    } finally {
      setIsLoading(false);
    }
  };

  // Render MFA handler if needed
  if (showMfaHandler) {
    return <MfaHandler onComplete={handleMfaComplete} onCancel={handleMfaCancel} />;
  }

  // Render selfie upload if needed
  if (showSelfieUpload && selfieData) {
    return (
      <SelfieUpload
        userId={selfieData.userId}
        contactId={selfieData.contactId}
        eventId={selfieData.eventId}
        onComplete={handleSelfieComplete}
        className={className}
      />
    );
  }

  // Render loading, error, or main UI
  if (isVerifying) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        Verifying link...
      </div>
    );
  }

  // Helper function to render the resend form UI
  const renderResendFormUI = (isError: boolean = false) => {
    // Debug log to check state when rendering
    console.log('Rendering resend form UI:', {
      isError,
      resendSuccess,
      isLoading,
      showResendForm,
    });

    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle className={cn('text-2xl', isError ? 'text-destructive' : 'text-foreground')}>
              {isError
                ? 'Verification Link Error'
                : resendSuccess
                  ? 'Magic Link Sent'
                  : 'Verify Your Email'}
            </CardTitle>
            <CardDescription className="text-foreground">
              {isError
                ? verifyError?.message || 'Your verification link is invalid or expired.'
                : resendSuccess
                  ? 'Please check your inbox for the magic link'
                  : 'Enter your email to receive a magic link to verify your email'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resendSuccess ? (
              <>
                {console.log('Rendering success message')}
                <SuccessMessage
                  primaryMessage="If your email exists in our system, you will receive a verification email."
                  secondaryMessage="Please check your inbox and click the magic link to verify your email and complete your signup."
                />
              </>
            ) : (
              <>
                {console.log('Rendering email form')}
                <EmailResendForm
                  onSubmit={handleResendSubmit}
                  error={error}
                  isLoading={isLoading}
                  submitButtonText="Send magic link"
                  loadingButtonText="Sending..."
                  defaultEmail={email}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Show error form if verification failed and user hasn't explicitly requested resend form
  if (verifyError && !showResendForm) {
    return renderResendFormUI(true);
  }

  // Show resend form if triggered
  if (showResendForm) {
    console.log('Showing resend form with resendSuccess =', resendSuccess);
    return renderResendFormUI();
  }

  // Show password form if token is valid
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Complete Your Signup</CardTitle>
          <CardDescription className="text-foreground">
            Please set a password to complete your account setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm
            onSubmit={handlePasswordSubmit}
            error={error}
            isLoading={isLoading}
            submitButtonText="Complete signup"
            loadingButtonText="Setting up account..."
            passwordLabel="Password"
            confirmPasswordLabel="Confirm Password"
            onRequestNewLink={() => setShowResendForm(true)}
            requestLinkText="Request new verification link"
          />
        </CardContent>
      </Card>
    </div>
  );
}
