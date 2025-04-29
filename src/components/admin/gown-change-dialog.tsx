import { useCallback, useEffect, useRef, useState } from 'react';
import { onlineManager, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, WifiOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import type { Database } from '@/types/database.types';
import { checkInGown, checkOutGown, fetchGownByRfid } from '@/utils/gown-operations';
import { getGownFromCache } from '@/utils/offline/gown-cache';
import { createOfflineMutation } from '@/utils/offline/mutation-handler';
import { offlineFetchGownByRfid } from '@/utils/offline/operations';
import { addToQueue, OperationType } from '@/utils/offline/queue';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Extend the booking type to include joined gown and event objects
export type BookingWithGown = Database['public']['Views']['bookings_extended']['Row'] & {
  gown?: { id: number | null; ean: string | null; rfid: string | null } | null;
  event?: { id: number | null; name: string | null; organization?: any } | null;
};

interface GownChangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithGown;
  selectedEventName?: string;
  onSuccess?: () => void;
}

export function GownChangeDialog({
  isOpen,
  onOpenChange,
  booking,
  selectedEventName,
  onSuccess,
}: GownChangeDialogProps) {
  const [rfid, setRfid] = useState('');
  const debouncedRfid = useDebounce(rfid, 500);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isManualInput, setIsManualInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showNewGownConfirmation, setShowNewGownConfirmation] = useState(false);
  const [existingGownCheckedOut, setExistingGownCheckedOut] = useState(false);
  const [preventAutoSubmit, setPreventAutoSubmit] = useState(false);

  // Get offline mode status
  const { isOffline } = useNetworkStatus();

  // Mutation for changing a gown
  const changeGownMutation = useMutation({
    ...createOfflineMutation('change', queryClient),
    mutationFn: async (data: {
      bookingId: number | null;
      oldRfid: string;
      newRfid: string;
      ean: string;
    }) => {
      console.log('[OFFLINE_DEBUG] changeGownMutation: Starting with data:', data);
      console.log('[OFFLINE_DEBUG] changeGownMutation: Offline mode:', isOffline);
      console.log('[OFFLINE_DEBUG] changeGownMutation: Online status:', onlineManager.isOnline());

      // If we're online, use the normal gown change process
      if (onlineManager.isOnline() && !isOffline) {
        console.log('[OFFLINE_DEBUG] changeGownMutation: Using online gown change');

        // First check in the old gown
        try {
          await checkInGown({
            data: {
              bookingId: data.bookingId!,
              rfid: data.oldRfid,
              skipRfidCheck: true, // Skip RFID check since we're doing an admin operation
            },
          });
        } catch (error: any) {
          throw new Error(error.message || 'Failed to check in the old gown');
        }

        // Then check out the new gown
        return checkOutGown({
          data: {
            bookingId: data.bookingId!,
            rfid: data.newRfid,
            ean: data.ean,
          },
        });
      }

      // If we're offline, add to queue and handle optimistic update
      console.log('[OFFLINE_DEBUG] changeGownMutation: Using offline mutation system');
      await addToQueue(OperationType.CHANGE_GOWN, data);
      return { success: true, message: 'Gown change queued for processing' };
    },
    onSuccess: () => {
      toast.success('Gown changed successfully');
      // Let the parent component handle the query invalidation
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(`Error: ${(error as { message: string }).message}`);
      } else {
        toast.error('An unknown error occurred');
      }

      // Check for specific error messages
      if ((error as { message: string }).message.includes('already checked out')) {
        setExistingGownCheckedOut(true);
      } else if ((error as { message: string }).message.includes('Invalid RFID format')) {
        setValidationError('Invalid RFID format. RFID must be 8 alphanumeric characters.');
      } else if ((error as { message: string }).message.includes('No gown found')) {
        // If the server reports no gown found, show the confirmation dialog
        setShowNewGownConfirmation(true);
      } else {
        setValidationError(`Error changing gown: ${(error as { message: string }).message}`);
      }
      setIsProcessing(false);
    },
  });

  // Focus the input when the dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setRfid('');
      setValidationError(null);
      setShowNewGownConfirmation(false);
      setExistingGownCheckedOut(false);
      setIsProcessing(false);
      setPreventAutoSubmit(false);

      // Focus the input after a short delay to ensure the dialog is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRfid(e.target.value);
    setValidationError(null);
    setExistingGownCheckedOut(false);
    setShowNewGownConfirmation(false);
    setIsManualInput(true);

    // If the user is typing, prevent auto-submit for this session
    setPreventAutoSubmit(true);
  };

  // Proceed with gown change after confirmation if needed
  const proceedWithGownChange = useCallback(() => {
    console.log(
      '[OFFLINE_DEBUG] proceedWithGownChange: Starting gown change with booking ID:',
      booking?.id
    );
    console.log('[OFFLINE_DEBUG] proceedWithGownChange: Offline mode:', isOffline);
    console.log('[OFFLINE_DEBUG] proceedWithGownChange: Online status:', onlineManager.isOnline());

    if (!booking?.gown?.rfid) {
      setValidationError('The current booking does not have a gown assigned to it.');
      setIsProcessing(false);
      return;
    }

    try {
      const data = {
        bookingId: booking.id,
        oldRfid: booking.gown.rfid,
        newRfid: rfid.trim(),
        ean: booking.booking_ean || '',
      };

      // Set processing state
      setIsProcessing(true);

      // Check if we're offline
      const isCurrentlyOffline = isOffline || !onlineManager.isOnline();

      console.log(
        '[OFFLINE_DEBUG] proceedWithGownChange: Is currently offline:',
        isCurrentlyOffline
      );
      console.log(
        '[OFFLINE_DEBUG] proceedWithGownChange: Calling changeGownMutation.mutate with data:',
        data
      );

      // Add a timeout to detect if the mutation gets stuck
      const timeoutId = setTimeout(() => {
        console.error(
          '[OFFLINE_DEBUG] proceedWithGownChange: Mutation appears to be stuck (3s timeout)'
        );
        // If we're in offline mode and the mutation is stuck, try to complete the UI flow
        if (isCurrentlyOffline && isProcessing) {
          console.log(
            '[OFFLINE_DEBUG] proceedWithGownChange: Forcing UI completion due to timeout'
          );
          setIsProcessing(false);
          toast.success('Gown change queued for processing');
          if (onSuccess) onSuccess();
          onOpenChange(false);
        }
      }, 3000); // 3 second timeout

      // If we're offline, we can close the dialog immediately after the mutation is queued
      if (isCurrentlyOffline) {
        // Short timeout to allow the mutation to be properly queued
        setTimeout(() => {
          console.log('[OFFLINE_DEBUG] proceedWithGownChange: Closing dialog in offline mode');
          setIsProcessing(false);
          toast.success('Gown change queued for processing');
          if (onSuccess) onSuccess();
          onOpenChange(false);
          clearTimeout(timeoutId);
        }, 500);
      }

      changeGownMutation.mutate(data, {
        onSuccess: () => {
          clearTimeout(timeoutId);
          console.log('[OFFLINE_DEBUG] proceedWithGownChange: Mutation succeeded');
          setIsProcessing(false);
          toast.success(
            isCurrentlyOffline ? 'Gown change queued for processing' : 'Gown changed successfully'
          );
          if (onSuccess) onSuccess();
          onOpenChange(false);
        },
        onError: (error) => {
          clearTimeout(timeoutId);
          console.error('[OFFLINE_DEBUG] proceedWithGownChange: Mutation error:', error);
          // If we're offline, we still want to close the dialog as the operation is queued
          if (isCurrentlyOffline) {
            setIsProcessing(false);
            toast.success('Gown change queued for processing');
            if (onSuccess) onSuccess();
            onOpenChange(false);
          } else {
            // Only show error if we're online
            setIsProcessing(false);
            setValidationError(
              `Error changing gown: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        },
        onSettled: () => {
          clearTimeout(timeoutId);
          console.log('[OFFLINE_DEBUG] proceedWithGownChange: Mutation settled, cleared timeout');
        },
      });
    } catch (error) {
      console.error('[OFFLINE_DEBUG] proceedWithGownChange: Error initiating gown change:', error);
      setValidationError(
        `Error initiating gown change: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsProcessing(false);
    }
  }, [booking, rfid, changeGownMutation, isOffline, onSuccess, onOpenChange]);

  // Check if a gown exists with the given RFID using useCallback
  const checkGownExists = useCallback(
    async (rfidToCheck: string) => {
      setIsProcessing(true);

      try {
        // Call the appropriate function based on offline mode
        let gown: { id?: number; rfid?: string; ean?: string; in_stock?: boolean } | null;

        if (isOffline) {
          console.log('[OFFLINE_DEBUG] checkGownExists: Using offline gown lookup');
          // First try to get the gown from the cache
          gown = await getGownFromCache(rfidToCheck);

          // If not found in cache, try the regular offline lookup
          if (!gown) {
            console.log(
              '[OFFLINE_DEBUG] checkGownExists: Gown not found in cache, trying offline lookup'
            );
            gown = await offlineFetchGownByRfid({ rfid: rfidToCheck });
          } else {
            console.log('[OFFLINE_DEBUG] checkGownExists: Gown found in cache:', gown);
          }
        } else {
          gown = await fetchGownByRfid({ data: { rfid: rfidToCheck } });
        }

        if (gown) {
          // Gown exists, check if it's already checked out
          console.log('Gown found:', gown);

          if (gown.in_stock === false) {
            // Gown is already checked out
            setExistingGownCheckedOut(true);
            setIsProcessing(false);
          } else {
            // Gown exists and is in stock, proceed with gown change
            proceedWithGownChange();
          }
        } else {
          // Gown doesn't exist, show confirmation dialog
          console.log('No gown found with RFID:', rfidToCheck);
          setShowNewGownConfirmation(true);
          // Keep isProcessing true while showing confirmation
        }
      } catch (error) {
        console.error('Error checking gown existence:', error);

        if (isOffline) {
          // In offline mode, we'll assume the gown doesn't exist and allow creation
          console.log('In offline mode, assuming gown does not exist');
          setShowNewGownConfirmation(true);
        } else {
          setValidationError('Error checking if gown exists');
          setIsProcessing(false);
        }
      }
    },
    [proceedWithGownChange, isOffline]
  );

  // Handle form submission with useCallback to prevent dependency cycles
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Don't submit if already processing or showing confirmation
      if (isProcessing || showNewGownConfirmation || existingGownCheckedOut) {
        return;
      }

      // Validate RFID format
      if (!rfid.trim()) {
        setValidationError('Please scan or enter a gown RFID');
        return;
      }

      if (!/^[A-Z0-9]{8}$/i.test(rfid.trim())) {
        setValidationError('Invalid RFID format. RFID must be 8 alphanumeric characters.');
        return;
      }

      setIsProcessing(true);

      // Check if the RFID is the same as the current gown
      if (booking?.gown?.rfid === rfid.trim()) {
        setValidationError(
          'This is the same gown that is currently assigned. Please scan a different gown.'
        );
        setIsProcessing(false);
        return;
      }

      // Check if the gown exists
      console.log('Checking if gown exists...');
      checkGownExists(rfid.trim());
    },
    [
      rfid,
      isProcessing,
      showNewGownConfirmation,
      existingGownCheckedOut,
      booking?.gown?.rfid,
      checkGownExists,
    ]
  );

  // Handle confirmation for creating a new gown
  const handleConfirmNewGown = useCallback(() => {
    setShowNewGownConfirmation(false);
    proceedWithGownChange();
  }, [proceedWithGownChange]);

  // Handle cancellation of new gown creation
  const handleCancelNewGown = useCallback(() => {
    setShowNewGownConfirmation(false);
    setIsProcessing(false);
    inputRef.current?.focus();
  }, []);

  // Auto-submit when RFID is scanned (not manually entered)
  useEffect(() => {
    // Skip if:
    // - RFID is empty
    // - User is manually typing
    // - Already processing
    // - Already showing an error or confirmation
    // - Mutation is in progress
    if (
      !debouncedRfid ||
      isManualInput ||
      isProcessing ||
      validationError ||
      showNewGownConfirmation ||
      existingGownCheckedOut ||
      changeGownMutation.isPending ||
      preventAutoSubmit
    ) {
      // Reset manual input flag for next scan
      setIsManualInput(false);
      return;
    }

    // If we get here, it's safe to auto-submit
    console.log('Auto-submitting RFID scan:', debouncedRfid);
    const event = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(event);
  }, [
    debouncedRfid,
    isManualInput,
    isProcessing,
    validationError,
    showNewGownConfirmation,
    existingGownCheckedOut,
    changeGownMutation.isPending,
    preventAutoSubmit,
    handleSubmit,
  ]);

  // Handle input keydown
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // If Enter key is pressed, submit the form
      if (e.key === 'Enter') {
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Change Gown</DialogTitle>
            {isOffline && (
              <div className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 px-2 py-1 rounded">
                <WifiOff className="h-3 w-3" />
                <span>Offline Mode</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Booking Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Student</Label>
              <div className="font-medium">{booking?.full_name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Event</Label>
              <div className="font-medium">{booking?.event?.name || 'Unknown Event'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Current Gown RFID</Label>
              <div className="font-medium">{booking?.gown?.rfid || 'None'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="font-medium capitalize">
                {booking?.booking_status?.replace(/_/g, ' ') || 'Unknown'}
              </div>
            </div>
            {booking?.check_out_time && (
              <div>
                <Label className="text-muted-foreground">Checked Out</Label>
                <div className="font-medium">
                  {format(new Date(booking.check_out_time), 'PPP p')}
                </div>
              </div>
            )}
          </div>

          {/* RFID Input */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <Label htmlFor="rfid-input">Scan or enter new gown RFID</Label>
            <div className="relative">
              <Input
                id="rfid-input"
                ref={inputRef}
                type="text"
                placeholder="Scan RFID..."
                value={rfid}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={cn(
                  'text-lg pr-8',
                  validationError && 'border-destructive',
                  showNewGownConfirmation && 'bg-muted cursor-not-allowed opacity-70'
                )}
                autoComplete="off"
                readOnly={showNewGownConfirmation}
              />
              {isProcessing ? (
                <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                rfid && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 py-0"
                    onClick={() => {
                      setRfid('');
                      setValidationError(null);
                      setExistingGownCheckedOut(false);
                      inputRef.current?.focus();
                    }}
                    disabled={showNewGownConfirmation || isProcessing}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )
              )}
            </div>

            {/* Validation Error */}
            {validationError && <div className="text-destructive text-sm">{validationError}</div>}

            {/* Existing Gown Checked Out Warning */}
            {existingGownCheckedOut && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-300">Warning</p>
                <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                  This gown is already checked out to another student. Please scan a different gown.
                </p>
              </div>
            )}

            {/* New Gown Confirmation */}
            {showNewGownConfirmation && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-300">Confirm New Gown</p>
                <p className="text-blue-700 dark:text-blue-400 mt-1">
                  No gown found with RFID: {rfid}. Do you want to create a new gown record?
                </p>
                <div className="flex gap-2 mt-2">
                  <Button type="button" size="sm" variant="outline" onClick={handleCancelNewGown}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleConfirmNewGown}>
                    Create New Gown
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={changeGownMutation.isPending || isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={
              !rfid.trim() ||
              changeGownMutation.isPending ||
              showNewGownConfirmation ||
              isProcessing ||
              existingGownCheckedOut
            }
          >
            {changeGownMutation.isPending || isProcessing ? 'Processing...' : 'Change Gown'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
