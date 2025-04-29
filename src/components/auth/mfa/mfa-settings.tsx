import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { EnrollMFA } from './enroll-mfa';
import { ManageMFA } from './manage-mfa';
import { useMfaStatus } from '@/hooks/auth/use-mfa';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function MfaSettings() {
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const queryClient = useQueryClient();

  const { mfaRequired, hasMfaFactors, isMfaVerified, isLoading } = useMfaStatus();

  const handleEnrollmentSuccess = () => {
    setShowEnrollDialog(false);
    // Invalidate queries to refresh MFA status
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  // If user already has MFA factors, show the management component
  if (hasMfaFactors) {
    return <ManageMFA />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Secure your account with two-factor authentication</CardDescription>
            </div>
            {mfaRequired ? (
              <ShieldAlert className="h-8 w-8 text-amber-500" />
            ) : (
              <Shield className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            {mfaRequired ? (
              <>
                <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">MFA Required</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Your role requires two-factor authentication for security purposes.
                </p>
              </>
            ) : (
              <>
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Enhance Your Account Security</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Add an authenticator app to protect your account with two-factor authentication.
                </p>
              </>
            )}
            <Button onClick={() => setShowEnrollDialog(true)}>Set up authenticator app</Button>
          </div>
        </CardContent>
      </Card>

      {/* Enroll MFA Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-md">
          <EnrollMFA
            onEnrolled={handleEnrollmentSuccess}
            onCancelled={() => setShowEnrollDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
