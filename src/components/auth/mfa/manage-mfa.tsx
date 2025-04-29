import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, Shield, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { EnrollMFA } from './enroll-mfa';
import { useMfaStatus } from '@/hooks/auth/use-mfa';
import { createClient } from '@/utils/supabase/client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ManageMFA() {
  const [error, setError] = useState<string | null>(null);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFactorId, setSelectedFactorId] = useState<string | null>(null);

  const supabase = createClient();
  const queryClient = useQueryClient();

  // Use the shared hook to get MFA status
  const { factors, isLoading } = useMfaStatus();

  // Use TanStack Mutation for unenrolling a factor
  const unenrollMutation = useMutation({
    mutationFn: async (factorId: string) => {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        throw error;
      }

      // Refresh the session to update the AAL level
      await supabase.auth.refreshSession();

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['mfa'] });

      // Close the dialog
      setShowDeleteDialog(false);
      setSelectedFactorId(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to delete MFA factor');
      console.error('[ManageMFA] Error deleting factor:', err);
    },
  });

  const handleEnrollSuccess = () => {
    setShowEnrollDialog(false);
    // Invalidate any queries that might depend on MFA status
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['mfa'] });
  };

  const handleDeleteFactor = () => {
    if (!selectedFactorId) return;
    unenrollMutation.mutate(selectedFactorId);
  };

  const confirmDeleteFactor = (factorId: string) => {
    setSelectedFactorId(factorId);
    setShowDeleteDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Loading your authentication factors...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
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
            {factors.length === 0 && <Shield className="h-8 w-8 text-muted-foreground" />}
            {factors.length > 0 && <ShieldCheck className="h-8 w-8 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {factors.length === 0 ? (
            <div className="text-center py-6">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No MFA factors enabled</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Add an authenticator app to secure your account
              </p>
              <Button onClick={() => setShowEnrollDialog(true)}>Set up authenticator app</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Active authenticator apps</h3>
              {factors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{factor.friendly_name || 'Authenticator app'}</p>
                      <p className="text-xs text-muted-foreground">
                        Added on {new Date(factor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmDeleteFactor(factor.id)}
                    disabled={unenrollMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enroll MFA Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-md">
          <EnrollMFA
            onEnrolled={handleEnrollSuccess}
            onCancelled={() => setShowEnrollDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove authenticator app</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this authenticator app? This will reduce the security
              of your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={unenrollMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFactor}
              disabled={unenrollMutation.isPending}
            >
              {unenrollMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
