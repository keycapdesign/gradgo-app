import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient, onlineManager } from '@tanstack/react-query'
import { X, Loader2, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebounce } from '@/hooks/use-debounce'
import { checkOutGown, checkInGown, fetchGownByRfid } from '@/utils/gown-operations'
import { offlineFetchGownByRfid } from '@/utils/offline/operations'
import { useOfflineMode } from '@/hooks/useNetworkStatus'
import { createOfflineMutation, mutationKeys } from '@/utils/offline/mutation-handler'
import { addToQueue, OperationType } from '@/utils/offline/queue'
import { cn } from '@/lib/utils'

interface GownCheckoutDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  mode: 'checkout' | 'checkin'
  onSuccess: () => void
  selectedEventName?: string
}

export function GownCheckoutDialog({
  isOpen,
  onOpenChange,
  booking,
  mode,
  onSuccess,
  selectedEventName
}: GownCheckoutDialogProps) {
  // Log the booking data to see its structure
  console.log('GownCheckoutDialog - booking:', booking)
  console.log('GownCheckoutDialog - event data:', booking?.event)
  console.log('GownCheckoutDialog - event_name:', booking?.event_name)
  const [rfid, setRfid] = useState('')
  const debouncedRfid = useDebounce(rfid, 500)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [isManualInput, setIsManualInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showNewGownConfirmation, setShowNewGownConfirmation] = useState(false)
  const [existingGownCheckedOut, setExistingGownCheckedOut] = useState(false)
  const [preventAutoSubmit, setPreventAutoSubmit] = useState(false)

  // Get offline mode status
  const { isOfflineMode } = useOfflineMode()

  // Focus the input field when the dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setRfid('')
      setIsManualInput(false)
      setIsProcessing(false)
      setValidationError(null)
      setShowNewGownConfirmation(false)
      setExistingGownCheckedOut(false)
      setPreventAutoSubmit(false)
    }
  }, [isOpen])

  // Mutation for checking out a gown
  const checkOutMutation = useMutation({
    ...createOfflineMutation('checkout', queryClient),
    mutationFn: async (data: { bookingId: number, rfid: string, ean: string }) => {
      console.log('[OFFLINE_DEBUG] checkOutMutation: Starting with data:', data);
      console.log('[OFFLINE_DEBUG] checkOutMutation: Offline mode:', isOfflineMode);
      console.log('[OFFLINE_DEBUG] checkOutMutation: Online status:', onlineManager.isOnline());

      // If we're online, use the normal checkout function
      if (onlineManager.isOnline() && !isOfflineMode) {
        console.log('[OFFLINE_DEBUG] checkOutMutation: Using online checkout');
        return checkOutGown({ data });
      }

      // If we're offline, add to queue and handle optimistic update
      console.log('[OFFLINE_DEBUG] checkOutMutation: Using offline mutation system');
      await addToQueue(OperationType.CHECK_OUT_GOWN, data);

      // Create optimistic update data
      const updatedBooking = {
        ...booking,
        booking_status: 'collected',
        check_out_time: new Date().toISOString(),
        gown: {
          rfid: data.rfid,
          ean: data.ean,
          in_stock: false
        },
        _offlineQueued: true // Special flag for the UI to know this is an optimistic update
      };

      // Extract the event ID from the booking
      const eventId = typeof booking.event === 'object' ? booking.event?.id : booking.event;
      console.log('[OFFLINE_DEBUG] checkOutMutation: Extracted eventId:', eventId);

      // Find and update this booking in the query cache
      const bookingsQueryKey = ['event', eventId, 'all-bookings'];
      const allBookings = queryClient.getQueryData<any[]>(bookingsQueryKey) || [];

      if (allBookings.length > 0) {
        const updatedBookings = allBookings.map(b =>
          b.id === data.bookingId ? { ...b, ...updatedBooking } : b
        );

        // Update the query cache directly
        queryClient.setQueryData(bookingsQueryKey, updatedBookings);
      }

      return { success: true, message: 'Gown checkout queued for processing' };
    },
    onSuccess: () => {
      // Extract the event ID from the booking
      const eventId = typeof booking.event === 'object' ? booking.event?.id : booking.event;
      console.log('[OFFLINE_DEBUG] checkOutMutation.onSuccess: Using eventId:', eventId);

      toast.success('Gown checked out successfully')
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'all-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'bookingStats'] })
      queryClient.invalidateQueries({ queryKey: ['booking', booking.id] })
      onSuccess()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      console.error('[OFFLINE_DEBUG] checkOutMutation.onError: Checkout error:', error.message)
      console.error('[OFFLINE_DEBUG] checkOutMutation.onError: Error stack:', error.stack || 'No stack trace')
      console.error('[OFFLINE_DEBUG] checkOutMutation.onError: Offline mode:', isOfflineMode)

      // Check for specific error messages
      if (error.message.includes('already checked out')) {
        console.log('[OFFLINE_DEBUG] checkOutMutation.onError: Gown already checked out')
        setExistingGownCheckedOut(true)
        // Don't set both validation error and existingGownCheckedOut
        // to avoid duplicate messages
      } else if (error.message.includes('Invalid RFID format')) {
        console.log('[OFFLINE_DEBUG] checkOutMutation.onError: Invalid RFID format')
        setValidationError('Invalid RFID format. RFID must be 8 alphanumeric characters.')
      } else if (error.message.includes('No gown found')) {
        console.log('[OFFLINE_DEBUG] checkOutMutation.onError: No gown found, showing confirmation dialog')
        // If the server reports no gown found, show the confirmation dialog
        setShowNewGownConfirmation(true)
      } else {
        console.log('[OFFLINE_DEBUG] checkOutMutation.onError: Generic error')
        setValidationError(`Error checking out gown: ${error.message}`)
      }

      console.log('[OFFLINE_DEBUG] checkOutMutation.onError: Setting isProcessing to false')
      setIsProcessing(false)
    }
  })

  // Mutation for checking in a gown
  const checkInMutation = useMutation({
    ...createOfflineMutation('checkin', queryClient),
    mutationFn: async (data: { bookingId: number, rfid: string }) => {
      console.log('[OFFLINE_DEBUG] checkInMutation: Starting with data:', data);
      console.log('[OFFLINE_DEBUG] checkInMutation: Offline mode:', isOfflineMode);
      console.log('[OFFLINE_DEBUG] checkInMutation: Online status:', onlineManager.isOnline());

      // If we're online, use the normal check-in function
      if (onlineManager.isOnline() && !isOfflineMode) {
        console.log('[OFFLINE_DEBUG] checkInMutation: Using online check-in');
        return checkInGown({ data });
      }

      // If we're offline, add to queue and handle optimistic update
      console.log('[OFFLINE_DEBUG] checkInMutation: Using offline mutation system');
      await addToQueue(OperationType.CHECK_IN_GOWN, data);

      // Create optimistic update data
      const updatedBooking = {
        ...booking,
        booking_status: 'returned',
        check_in_time: new Date().toISOString(),
        _offlineQueued: true // Special flag for the UI to know this is an optimistic update
      };

      // Extract the event ID from the booking
      const eventId = typeof booking.event === 'object' ? booking.event?.id : booking.event;
      console.log('[OFFLINE_DEBUG] checkInMutation: Extracted eventId:', eventId);

      // Find and update this booking in the query cache
      const bookingsQueryKey = ['event', eventId, 'all-bookings'];
      const allBookings = queryClient.getQueryData<any[]>(bookingsQueryKey) || [];

      if (allBookings.length > 0) {
        const updatedBookings = allBookings.map(b =>
          b.id === data.bookingId ? { ...b, ...updatedBooking } : b
        );

        // Update the query cache directly
        queryClient.setQueryData(bookingsQueryKey, updatedBookings);
      }

      return { success: true, message: 'Gown check-in queued for processing' };
    },
    onSuccess: () => {
      // Extract the event ID from the booking
      const eventId = typeof booking.event === 'object' ? booking.event?.id : booking.event;
      console.log('[OFFLINE_DEBUG] checkInMutation.onSuccess: Using eventId:', eventId);

      toast.success('Gown checked in successfully')
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'all-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'bookingStats'] })
      queryClient.invalidateQueries({ queryKey: ['booking', booking.id] })
      onSuccess()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      console.error('Check-in error:', error.message)

      // We've already validated the RFID client-side, so this is likely a server error
      setValidationError(`Error checking in gown: ${error.message}`)
      setIsProcessing(false)
    }
  })

  // Check if a gown with this RFID exists
  const checkGownExists = async (rfidToCheck: string) => {
    try {
      console.log('Checking if gown exists with RFID:', rfidToCheck);

      // Call the appropriate function based on offline mode
      let gown: { id?: number; rfid?: string; ean?: string; in_stock?: boolean } | null;
      if (isOfflineMode) {
        console.log('Using offline gown lookup');
        gown = await offlineFetchGownByRfid({ rfid: rfidToCheck });
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
          // Gown exists and is in stock, proceed with checkout
          proceedWithCheckout();
        }
      } else {
        // Gown doesn't exist, show confirmation dialog
        console.log('No gown found with RFID:', rfidToCheck);
        setShowNewGownConfirmation(true);
        // Important: Keep isProcessing true while showing confirmation
        // It will be reset when the user makes a choice
      }
    } catch (error) {
      console.error('Error checking gown existence:', error);

      if (isOfflineMode) {
        // In offline mode, we'll assume the gown doesn't exist and allow creation
        console.log('In offline mode, assuming gown does not exist');
        setShowNewGownConfirmation(true);
      } else {
        setValidationError('Error checking if gown exists');
        setIsProcessing(false);
      }
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Reset validation state
    setValidationError(null)
    setShowNewGownConfirmation(false)
    setExistingGownCheckedOut(false)
    setIsProcessing(true)

    console.log('Submitting form with booking:', booking)
    console.log('RFID:', rfid)
    console.log('Offline mode:', isOfflineMode)

    if (!rfid.trim()) {
      setValidationError('Please scan or enter an RFID')
      setIsProcessing(false)
      return
    }

    // Validate RFID format
    if (!(/^[A-Z0-9]{8}$/i.test(rfid))) {
      setValidationError('Invalid RFID format. RFID must be 8 alphanumeric characters.')
      setIsProcessing(false)
      return
    }

    if (mode === 'checkout') {
      // For checkout, we'll first check if the gown exists

      // Check if the RFID is already in the booking
      if (booking?.gown?.rfid === rfid.trim()) {
        // If the RFID matches the booking's gown, proceed directly
        console.log('RFID matches booking\'s gown, proceeding with checkout');
        proceedWithCheckout();
      } else if (isOfflineMode) {
        // In offline mode, we can skip the gown existence check and show the confirmation directly
        console.log('In offline mode, showing confirmation dialog directly');
        setShowNewGownConfirmation(true);
        return;
      } else {
        // Otherwise, check if the gown exists
        console.log('Checking if gown exists...');
        checkGownExists(rfid.trim());
        // Don't proceed automatically - wait for the checkGownExists function to decide
        return;
      }
    } else {
      // For check-in, verify the RFID matches the booking's gown
      if (!booking?.gown?.rfid) {
        setValidationError('This booking does not have a gown assigned to it.');
        setIsProcessing(false);
        return;
      }

      // Check if the scanned RFID matches the booking's gown RFID
      if (booking.gown.rfid !== rfid.trim()) {
        setValidationError(`Incorrect RFID. Please scan the gown with RFID: ${booking.gown.rfid}`);
        setIsProcessing(false);
        return;
      }

      // RFID matches, proceed with check-in
      console.log('RFID matches booking\'s gown, proceeding with check-in');

      // Extract the event ID from the booking
      const eventId = typeof booking.event === 'object' ? booking.event?.id : booking.event;
      console.log('[OFFLINE_DEBUG] handleSubmit: Extracted eventId:', eventId);

      const data = {
        bookingId: booking.id,
        rfid: rfid.trim(),
        eventId: eventId
      };

      // Check if we're offline
      const isCurrentlyOffline = isOfflineMode || !onlineManager.isOnline();
      console.log('[OFFLINE_DEBUG] handleSubmit: Is currently offline:', isCurrentlyOffline);

      // Add a timeout to detect if the mutation gets stuck
      const timeoutId = setTimeout(() => {
        console.error('[OFFLINE_DEBUG] handleSubmit: Check-in mutation appears to be stuck (3s timeout)');
        // If we're in offline mode and the mutation is stuck, try to complete the UI flow
        if (isCurrentlyOffline && isProcessing) {
          console.log('[OFFLINE_DEBUG] handleSubmit: Forcing UI completion due to timeout');
          setIsProcessing(false);
          toast.success('Gown check-in queued for processing');
          onSuccess();
          onOpenChange(false);
        }
      }, 3000); // 3 second timeout

      // If we're offline, we can close the dialog immediately after the mutation is queued
      if (isCurrentlyOffline) {
        // Short timeout to allow the mutation to be properly queued
        setTimeout(() => {
          console.log('[OFFLINE_DEBUG] handleSubmit: Closing dialog in offline mode');
          setIsProcessing(false);
          toast.success('Gown check-in queued for processing');
          onSuccess();
          onOpenChange(false);
          clearTimeout(timeoutId);
        }, 500);
      }

      checkInMutation.mutate(data, {
        onSuccess: () => {
          clearTimeout(timeoutId);
          console.log('[OFFLINE_DEBUG] handleSubmit: Check-in mutation succeeded');
          setIsProcessing(false);
          toast.success(isCurrentlyOffline ? 'Gown check-in queued for processing' : 'Gown checked in successfully');
          onSuccess();
          onOpenChange(false);
        },
        onError: (error) => {
          clearTimeout(timeoutId);
          console.error('[OFFLINE_DEBUG] handleSubmit: Check-in mutation error:', error);
          // If we're offline, we still want to close the dialog as the operation is queued
          if (isCurrentlyOffline) {
            setIsProcessing(false);
            toast.success('Gown check-in queued for processing');
            onSuccess();
            onOpenChange(false);
          } else {
            // Only show error if we're online
            setIsProcessing(false);
            setValidationError(`Error checking in gown: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        },
        onSettled: () => {
          clearTimeout(timeoutId);
          console.log('[OFFLINE_DEBUG] handleSubmit: Check-in mutation settled, cleared timeout');
        }
      })
    }
  }

  // Proceed with checkout after confirmation if needed
  const proceedWithCheckout = () => {
    console.log('[OFFLINE_DEBUG] proceedWithCheckout: Starting checkout with booking ID:', booking.id, 'RFID:', rfid.trim(), 'EAN:', booking.ean || '');
    console.log('[OFFLINE_DEBUG] proceedWithCheckout: Offline mode:', isOfflineMode);
    console.log('[OFFLINE_DEBUG] proceedWithCheckout: Online status:', onlineManager.isOnline());

    try {
      // Extract the event ID from the booking
      const eventId = typeof booking.event === 'object' ? booking.event?.id : booking.event;
      console.log('[OFFLINE_DEBUG] proceedWithCheckout: Extracted eventId:', eventId);

      const data = {
        bookingId: booking.id,
        rfid: rfid.trim(),
        ean: booking.ean || '',
        eventId: eventId
      };

      // Set processing state
      setIsProcessing(true);

      // Check if we're offline
      const isCurrentlyOffline = isOfflineMode || !onlineManager.isOnline();

      console.log('[OFFLINE_DEBUG] proceedWithCheckout: Is currently offline:', isCurrentlyOffline);
      console.log('[OFFLINE_DEBUG] proceedWithCheckout: Calling checkOutMutation.mutate with data:', data);

      // Add a timeout to detect if the mutation gets stuck
      const timeoutId = setTimeout(() => {
        console.error('[OFFLINE_DEBUG] proceedWithCheckout: Mutation appears to be stuck (3s timeout)');
        // If we're in offline mode and the mutation is stuck, try to complete the UI flow
        if (isCurrentlyOffline && isProcessing) {
          console.log('[OFFLINE_DEBUG] proceedWithCheckout: Forcing UI completion due to timeout');
          setIsProcessing(false);
          toast.success('Gown checkout queued for processing');
          onSuccess();
          onOpenChange(false);
        }
      }, 3000); // 3 second timeout

      // If we're offline, we can close the dialog immediately after the mutation is queued
      if (isCurrentlyOffline) {
        // Short timeout to allow the mutation to be properly queued
        setTimeout(() => {
          console.log('[OFFLINE_DEBUG] proceedWithCheckout: Closing dialog in offline mode');
          setIsProcessing(false);
          toast.success('Gown checkout queued for processing');
          onSuccess();
          onOpenChange(false);
          clearTimeout(timeoutId);
        }, 500);
      }

      // Execute the mutation
      checkOutMutation.mutate(data, {
        onSuccess: () => {
          clearTimeout(timeoutId);
          console.log('[OFFLINE_DEBUG] proceedWithCheckout: Mutation succeeded');
          setIsProcessing(false);
          toast.success(isCurrentlyOffline ? 'Gown checkout queued for processing' : 'Gown checked out successfully');
          onSuccess();
          onOpenChange(false);
        },
        onError: (error) => {
          clearTimeout(timeoutId);
          console.error('[OFFLINE_DEBUG] proceedWithCheckout: Mutation error:', error);

          // If we're offline, we still want to close the dialog as the operation is queued
          if (isCurrentlyOffline) {
            setIsProcessing(false);
            toast.success('Gown checkout queued for processing');
            onSuccess();
            onOpenChange(false);
          } else {
            // Only show error if we're online
            setIsProcessing(false);
            setValidationError(`Error checking out gown: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        },
        onSettled: () => {
          clearTimeout(timeoutId);
          console.log('[OFFLINE_DEBUG] proceedWithCheckout: Mutation settled, cleared timeout');
        }
      });
    } catch (error) {
      console.error('[OFFLINE_DEBUG] proceedWithCheckout: Error initiating checkout:', error);
      setValidationError(`Error initiating checkout: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Clear validation errors when the user starts typing again
    if (validationError) {
      setValidationError(null)
    }

    // Clear existing gown checked out warning when the user changes the input
    if (existingGownCheckedOut) {
      setExistingGownCheckedOut(false)
    }

    setRfid(newValue)

    // Detect if this is likely a scan or manual input
    if (newValue.length > 0 && rfid.length === 0) {
      // First character - start tracking if this might be a scan
      setIsManualInput(false)
    } else if (newValue.length > rfid.length + 1) {
      // Multiple characters added at once - likely a scan
      setIsManualInput(false)
    } else if (newValue.length === rfid.length + 1) {
      // Single character added - likely manual typing
      setIsManualInput(true)
    }
  }

  // Auto-submit when RFID is scanned (not manually typed)
  useEffect(() => {
    // Only proceed if we have a debounced RFID value
    if (!debouncedRfid || debouncedRfid.length < 8) return;

    // Don't auto-submit if any of these conditions are true
    if (isManualInput ||
        isProcessing ||
        validationError ||
        showNewGownConfirmation ||
        existingGownCheckedOut ||
        checkOutMutation.isPending ||
        checkInMutation.isPending ||
        preventAutoSubmit) {
      return;
    }

    // If we get here, it's safe to auto-submit
    console.log('Auto-submitting RFID scan:', debouncedRfid);
    try {
      const event = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(event);
    } catch (error) {
      console.error('Error during auto-submit:', error);
      setValidationError('Error processing scan. Please try again.');
      setIsProcessing(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRfid, isManualInput, isProcessing, validationError, showNewGownConfirmation, existingGownCheckedOut, checkOutMutation.isPending, checkInMutation.isPending, preventAutoSubmit])

  // Handle input keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed, submit the form
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>
              {mode === 'checkout' ? 'Check Out Gown' : 'Check In Gown'}
            </DialogTitle>
            {isOfflineMode && (
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
              <div className="font-medium">
                {(() => {
                  // Try to get the event name from all possible locations
                  if (booking?.event_name) {
                    return booking.event_name;
                  }

                  if (booking?.event) {
                    // If event is an object with a name property
                    if (typeof booking.event === 'object' && booking.event !== null) {
                      if ('name' in booking.event && booking.event.name) {
                        return booking.event.name;
                      }

                      // Handle nested event object
                      if ('event' in booking.event && booking.event.event?.name) {
                        return booking.event.event.name;
                      }
                    }

                    // If event is an array (from the Supabase join)
                    if (Array.isArray(booking.event) && booking.event.length > 0) {
                      if (booking.event[0]?.name) {
                        return booking.event[0].name;
                      }
                    }
                  }

                  // Try to get event name from event_id or event field
                  if (booking?.event_id && typeof booking.event_id === 'object' && booking.event_id?.name) {
                    return booking.event_id.name;
                  }

                  // If we have the selected event name from props
                  if (selectedEventName) {
                    return selectedEventName;
                  }

                  return 'Unknown Event';
                })()}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Order Type</Label>
              <div className="font-medium">{booking?.order_type}</div>
            </div>
            {mode === 'checkout' && (
              <div>
                <Label className="text-muted-foreground">Gown EAN</Label>
                <div className="font-medium">{booking?.ean || 'N/A'}</div>
              </div>
            )}
            {mode === 'checkin' && (
              <div>
                <Label className="text-muted-foreground">Gown RFID</Label>
                <div className="font-medium">{booking?.gown?.rfid || 'Unknown'}</div>
              </div>
            )}
            {mode === 'checkin' && booking?.check_out_time && (
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
            <Label htmlFor="rfid-input">
              {mode === 'checkout' ? 'Scan or enter gown RFID' : 'Confirm gown RFID'}
            </Label>
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
                  "text-lg pr-8",
                  validationError && "border-destructive",
                  showNewGownConfirmation && "bg-muted cursor-not-allowed opacity-70"
                )}
                autoComplete="off"
                readOnly={showNewGownConfirmation}
              />
              {isProcessing ? (
                <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : rfid && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2 py-0"
                  onClick={() => {
                    setRfid('')
                    setValidationError(null)
                    setExistingGownCheckedOut(false)
                    inputRef.current?.focus()
                  }}
                  disabled={showNewGownConfirmation || isProcessing}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="text-destructive text-sm">{validationError}</div>
            )}

            {/* New Gown Confirmation */}
            {showNewGownConfirmation && (
              <div className="bg-muted p-3 rounded-md mt-2">
                <p className="text-sm mb-2">No gown found with this RFID. Would you like to create a new gown record?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={() => {
                      console.log('[OFFLINE_DEBUG] New gown confirmation: User clicked Yes');
                      console.log('[OFFLINE_DEBUG] New gown confirmation: Setting showNewGownConfirmation to false');
                      setShowNewGownConfirmation(false);
                      console.log('[OFFLINE_DEBUG] New gown confirmation: Calling proceedWithCheckout');
                      proceedWithCheckout();
                    }}
                  >
                    Yes, Create New Gown
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Reset all states to allow user to try again
                      setShowNewGownConfirmation(false)
                      setIsProcessing(false)

                      // Set flag to prevent auto-submission
                      setPreventAutoSubmit(true)

                      // Clear the RFID to prevent auto-resubmission
                      setRfid('')

                      // Reset the flag after a delay
                      setTimeout(() => {
                        setPreventAutoSubmit(false)
                      }, 1000)

                      // Focus the input field after a short delay to ensure it's enabled
                      setTimeout(() => {
                        inputRef.current?.focus()
                      }, 50)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Already Checked Out Warning */}
            {existingGownCheckedOut && (
              <div className="bg-destructive/10 p-3 rounded-md mt-2">
                <p className="text-sm mb-2">This gown is already checked out to another student. Please use a different gown.</p>
              </div>
            )}
          </form>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={checkOutMutation.isPending || checkInMutation.isPending || isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!rfid.trim() || checkOutMutation.isPending || checkInMutation.isPending || showNewGownConfirmation || isProcessing}
          >
            {checkOutMutation.isPending || checkInMutation.isPending || isProcessing
              ? 'Processing...'
              : mode === 'checkout'
                ? 'Check Out Gown'
                : 'Check In Gown'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
