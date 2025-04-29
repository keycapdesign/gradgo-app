import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { mfaRequiredQueryOptions } from '@/utils/supabase/check-mfa-required';

/**
 * Hook to check if MFA is required for the current user
 */
export function useMfaRequired() {
  return useQuery(mfaRequiredQueryOptions());
}

/**
 * Hook to get the current authenticator assurance level (AAL)
 */
export function useAuthenticatorAssuranceLevel() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['auth', 'aal'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get the user's MFA factors
 */
export function useMfaFactors() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['auth', 'mfa', 'factors'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to enroll a new TOTP factor
 */
export function useEnrollTotp() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['auth', 'mfa', 'enroll'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (error) throw error;
      return {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      };
    },
    staleTime: 0, // Don't cache this
    retry: false,
  });
}

/**
 * Hook to challenge and verify an MFA factor
 */
export function useMfaVerify(onSuccess?: () => void) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ factorId, code }: { factorId: string; code: string }) => {
      // Create a challenge
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      
      // Verify the code
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (verify.error) throw verify.error;
      
      // Refresh the session to update AAL
      await supabase.auth.refreshSession();
      
      return verify.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      if (onSuccess) onSuccess();
    },
  });
}

/**
 * Hook to determine the current MFA status
 * This combines the results of the other hooks to provide a complete picture
 */
export function useMfaStatus() {
  // Check if MFA is required
  const { 
    data: mfaRequired = false, 
    isLoading: isMfaRequiredLoading,
    error: mfaRequiredError
  } = useMfaRequired();
  
  // Get AAL
  const { 
    data: aalData, 
    isLoading: isAalLoading,
    error: aalError
  } = useAuthenticatorAssuranceLevel();
  
  // Get factors
  const { 
    data: factorsData, 
    isLoading: isFactorsLoading,
    error: factorsError
  } = useMfaFactors();
  
  // Derive status values
  const currentLevel = aalData?.currentLevel || null;
  const nextLevel = aalData?.nextLevel || null;
  const totpFactors = factorsData?.totp || [];
  const hasMfaFactors = totpFactors.length > 0;
  
  // Determine if MFA verification is needed
  const needsMfaVerification = 
    mfaRequired && 
    currentLevel === 'aal1' && 
    nextLevel === 'aal2' && 
    hasMfaFactors;
  
  // Determine if MFA enrollment is needed
  const needsMfaEnrollment = 
    mfaRequired && 
    !hasMfaFactors;
  
  // Determine if MFA is properly set up and verified
  const isMfaVerified = 
    currentLevel === 'aal2' && 
    nextLevel === 'aal2';
  
  const isLoading = isMfaRequiredLoading || isAalLoading || isFactorsLoading;
  const error = mfaRequiredError || aalError || factorsError;
  
  return {
    mfaRequired,
    currentLevel,
    nextLevel,
    hasMfaFactors,
    needsMfaVerification,
    needsMfaEnrollment,
    isMfaVerified,
    totpFactors,
    isLoading,
    error,
  };
}
