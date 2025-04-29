import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEventStore } from '@/stores/event-store'
import { checkInGown } from '@/utils/gown-operations'
import { fetchBookingByGownRfid } from '@/utils/returns-mode'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

// Import custom components
import { RfidScanHelp } from '@/components/returns/rfid-scan-help'
import { SuccessScreen } from '@/components/returns/success-screen'
import { LateReturnScreen } from '@/components/returns/late-return-screen'
import { ConfirmDialog } from '@/components/returns/confirm-dialog'
import { ExitDialog } from '@/components/returns/exit-dialog'

export const Route = createFileRoute('/_protected/kiosk/returns')({
  component: ReturnsMode,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/login' })
    }

    // Check if the user has the limited role (returns mode)
    const userRoles = context.userRoles || []

    // If not in returns mode, redirect to admin dashboard
    if (!userRoles) {
      console.log('[ReturnsRoute] User does not have access to returns mode, redirecting to login')
      throw redirect({ to: '/login' })
    }

    return {
      title: 'Returns Kiosk'
    }
  }
})

// Define the zod schema for RFID validation
const rfidSchema = z.object({
  rfid: z.string()
    .min(8, { message: 'RFID must be at least 8 characters' })
    .max(8, { message: 'RFID must be at most 8 characters' })
    .regex(/^[a-zA-Z0-9]+$/, { message: 'RFID must contain only letters and numbers' })
})

type RfidFormValues = z.infer<typeof rfidSchema>

function ReturnsMode() {
  const { selectedEvent } = useEventStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [isManualInput, setIsManualInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showScanHelp, setShowScanHelp] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [showLateReturnScreen, setShowLateReturnScreen] = useState(false)
  const [currentBooking, setCurrentBooking] = useState<any>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [preventAutoSubmit, setPreventAutoSubmit] = useState(false) // Flag to prevent auto-submission
  const navigate = useNavigate()

  // Initialize react-hook-form
  const form = useForm<RfidFormValues>({
    resolver: zodResolver(rfidSchema),
    defaultValues: {
      rfid: ''
    }
  })

  // Get the current RFID value from the form
  const rfid = form.watch('rfid')
  const debouncedRfid = useDebounce(rfid, 300) // 300ms debounce time for responsiveness

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }

    // We no longer need to block navigation with beforeunload
    // since we're using server-side route guards
  }, [])

  // Reset focus when the success screen is dismissed
  useEffect(() => {
    if (!showSuccessScreen && !showLateReturnScreen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [showSuccessScreen, showLateReturnScreen])

  // Reset state when dialog is opened or closed
  useEffect(() => {
    if (!showConfirmDialog) {
      // Dialog was just closed
      console.log('Dialog state changed: closed')
    } else {
      // Dialog was just opened
      console.log('Dialog state changed: opened')
      // Set flag to prevent auto-submission while dialog is open
      setPreventAutoSubmit(true)
    }
  }, [showConfirmDialog])

  // Check-in mutation - improved error handling
  const checkInMutation = useMutation({
    mutationFn: (data: { bookingId: number, rfid: string }) => {
      return checkInGown({ data })
    },
    onSuccess: () => {
      // Show success screen
      setShowSuccessScreen(true)

      // Set flag to prevent auto-submission
      setPreventAutoSubmit(true)

      // Reset processing flag
      setIsProcessing(false)

      // Reset after 5 seconds
      setTimeout(() => {
        setShowSuccessScreen(false)
        form.setValue('rfid', '')
        setCurrentBooking(null)
        if (inputRef.current) {
          inputRef.current.focus()
        }

        // Reset the flag after success screen is dismissed
        setTimeout(() => {
          setPreventAutoSubmit(false)
        }, 1000)
      }, 5000)

      // Invalidate relevant queries
      if (selectedEvent?.id) {
        queryClient.invalidateQueries({ queryKey: ['event', selectedEvent.id, 'bookings'] })
        queryClient.invalidateQueries({ queryKey: ['event', selectedEvent.id, 'bookingStats'] })
      }
    },
    onError: (error: Error) => {
      console.error('Check-in error:', error)
      form.setError('rfid', { message: `Error checking in gown: ${error.message}` })
      setIsProcessing(false)

      // Reset the form after a delay for any error
      setTimeout(() => {
        form.setValue('rfid', '')
        form.clearErrors()
        setPreventAutoSubmit(false)
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 2000)
    }
  })

  // Process RFID submission - improved error handling
  const processRfid = useCallback(async (rfidValue: string) => {
    // Simple guard against processing when already processing or dialogs are open
    if (isProcessing || showConfirmDialog || showLateReturnScreen || showSuccessScreen || showScanHelp) {
      console.log('Already processing an RFID or a dialog is open, ignoring new submission')
      return
    }

    // Validate the RFID using the form validation
    const isValid = await form.trigger('rfid')
    if (!isValid) {
      console.log('RFID validation failed')
      return
    }

    if (!selectedEvent?.id) {
      form.setError('rfid', { message: 'No event selected. Please contact an administrator.' })
      return
    }

    try {
      // Set processing flag to prevent duplicate submissions
      setIsProcessing(true)
      form.clearErrors()

      console.log('Processing RFID:', rfidValue.trim())

      // Fetch the booking by gown RFID
      const booking = await fetchBookingByGownRfid({ data: { rfid: rfidValue.trim() } })

      // Check if the booking is for the selected event
      if (booking.event.id !== selectedEvent.id) {
        form.setError('rfid', { message: `This gown is associated with a different event: ${booking.event.name}` })
        setIsProcessing(false)
        // Reset form after error
        setTimeout(() => form.setValue('rfid', ''), 2000)
        return
      }

      // Check if the gown was purchased
      if (booking.order_type === 'PURCHASE') {
        form.setError('rfid', { message: 'This gown was purchased and should not be returned. Please contact an administrator.' })
        setIsProcessing(false)
        // Reset form after error
        setTimeout(() => form.setValue('rfid', ''), 2000)
        return
      }

      // Check if the return is late
      if (booking.booking_status === 'late' || booking.is_late) {
        setCurrentBooking(booking)
        setShowLateReturnScreen(true)
        setIsProcessing(false)
        return
      }

      // Set the current booking first, then show the confirmation dialog
      // This ensures the booking is available before the dialog is rendered
      setCurrentBooking(booking)
      // Use a small timeout to ensure the state update has been processed
      setTimeout(() => {
        setShowConfirmDialog(true)
        setIsProcessing(false)
      }, 50)
    } catch (error: any) {
      console.error('Error processing RFID:', error)
      form.setError('rfid', { message: `Error: ${error.message}` })
      setIsProcessing(false)

      // If the error is about the gown already being checked in, clear the form after a delay
      if (error.message && error.message.includes('already checked in')) {
        setTimeout(() => {
          form.setValue('rfid', '')
          form.clearErrors()
        }, 2000)
      }
    }
  }, [selectedEvent, showConfirmDialog, showLateReturnScreen, showSuccessScreen, showScanHelp, form])

  // Handle form submission (manual submit)
  const onSubmit = async (data: RfidFormValues) => {
    // Prevent duplicate submissions or processing when dialogs are open
    if (isProcessing || showConfirmDialog || showLateReturnScreen || showSuccessScreen || showScanHelp) {
      console.log('Already processing or dialog is open, ignoring form submission')
      return
    }

    await processRfid(data.rfid)
  }

  // Handle input change - simplified detection of scan vs manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Detect if this is likely a scan or manual input
    if (newValue.length > rfid.length + 1) {
      // Multiple characters added at once - likely a scan
      setIsManualInput(false)
    } else {
      // Single character added - likely manual typing
      setIsManualInput(true)
    }
  }

  // Auto-submit when RFID is scanned (not manually typed) - simplified
  useEffect(() => {
    // Only proceed if this is a scan (not manual input) and the RFID is valid
    if (!isManualInput && debouncedRfid && debouncedRfid.length === 8) {
      // Check if we can submit (no dialogs open, not processing, etc.)
      const canSubmit = !isProcessing &&
                        !showConfirmDialog &&
                        !showSuccessScreen &&
                        !showLateReturnScreen &&
                        !showScanHelp &&
                        !preventAutoSubmit;

      if (canSubmit) {
        console.log('Auto-submitting scanned RFID:', debouncedRfid);
        processRfid(debouncedRfid);
        // Reset isManualInput after submission
        setIsManualInput(true);
      }
    }
  }, [debouncedRfid, isManualInput, isProcessing, processRfid, showConfirmDialog, showSuccessScreen, showLateReturnScreen, showScanHelp, preventAutoSubmit])

  // Handle input keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed, submit the form
    if (e.key === 'Enter') {
      // Prevent processing if already in progress or dialogs are open
      if (isProcessing || showConfirmDialog || showLateReturnScreen || showSuccessScreen || showScanHelp) {
        console.log('Already processing or dialog is open, ignoring Enter key press')
        e.preventDefault()
        return
      }
      console.log('Manual submit via Enter key')
      form.handleSubmit(onSubmit)(e)
    }
  }

  // Handle confirmation of check-in - improved error handling
  const handleConfirmCheckIn = () => {
    console.log('Current booking:', currentBooking)
    if (!currentBooking || !currentBooking.booking_id) {
      console.error('Cannot confirm check-in: currentBooking or currentBooking.booking_id is undefined')
      form.setError('rfid', { message: 'Error: Unable to process this booking. Please try again.' })
      setShowConfirmDialog(false)
      setIsProcessing(false)

      // Reset form after error
      setTimeout(() => {
        form.setValue('rfid', '')
        form.clearErrors()
      }, 2000)
      return;
    }

    const bookingId = currentBooking.booking_id;
    const rfidValue = currentBooking.rfid;

    console.log('Confirming check-in for booking:', bookingId)

    // Set flag to prevent auto-submission
    setPreventAutoSubmit(true)

    // Process the check-in
    checkInMutation.mutate({
      bookingId: bookingId,
      rfid: rfidValue
    })

    // Close the dialog
    setShowConfirmDialog(false)

    // Don't reset processing flag here as the mutation is still in progress
    // It will be reset in the mutation's onSuccess or onError callbacks
  }

  // Secret exit trigger - triple click on the title
  const [clickCount, setClickCount] = useState(0)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTitleClick = () => {
    setClickCount(prev => prev + 1)

    // Reset click count after 1 second
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
    }

    clickTimer.current = setTimeout(() => {
      setClickCount(0)
    }, 1000)

    // Show exit dialog after 3 clicks
    if (clickCount === 2) {
      setShowExitDialog(true)
      setClickCount(0)
      if (clickTimer.current) {
        clearTimeout(clickTimer.current)
      }
    }
  }



  // If no event is selected, show a message
  if (!selectedEvent?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Returns Kiosk</CardTitle>
            <CardDescription className="text-center">No event selected</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p>Please contact an administrator to set up this kiosk.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success screen
  if (showSuccessScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">

        <SuccessScreen studentName={currentBooking?.full_name || 'Student'} />
      </div>
    )
  }

  // Show late return screen
  if (showLateReturnScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">

        <LateReturnScreen
          booking={currentBooking}
          onCancel={() => {
            console.log('Late return screen canceled')
            // Set flag to prevent auto-submission
            setPreventAutoSubmit(true)
            setShowLateReturnScreen(false)
            setCurrentBooking(null)
            // Clear the input RFID
            form.setValue('rfid', '')
            // Reset processing flag to ensure we can scan again
            setIsProcessing(false)

            // Reset the flag after a delay
            setTimeout(() => {
              setPreventAutoSubmit(false)
            }, 1000)
          }}
          onAdminApprove={() => {
            console.log('Late return approved by admin')

            // Ensure we have the current booking data
            if (!currentBooking || !currentBooking.booking_id) {
              console.error('Cannot approve late return: currentBooking or currentBooking.booking_id is undefined')
              form.setError('rfid', { message: 'Error: Unable to process this booking. Please try again.' })
              setShowLateReturnScreen(false)
              setIsProcessing(false)

              // Reset form after error
              setTimeout(() => {
                form.setValue('rfid', '')
                form.clearErrors()
              }, 2000)
              return;
            }

            // Store booking data in local variables to ensure they're available
            const bookingId = currentBooking.booking_id;
            const rfidValue = currentBooking.rfid;

            // Set flag to prevent auto-submission
            setPreventAutoSubmit(true)

            // Process the check-in
            checkInMutation.mutate({
              bookingId: bookingId,
              rfid: rfidValue
            })

            // Close the screen
            setShowLateReturnScreen(false)

            // Don't reset processing flag here as the mutation is still in progress
            // It will be reset in the mutation's onSuccess or onError callbacks
          }}
        />
      </div>
    )
  }

  // Show scan help screen
  if (showScanHelp) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">

        <RfidScanHelp onBack={() => {
          console.log('Scan help screen closed')
          // Set flag to prevent auto-submission
          setPreventAutoSubmit(true)
          setShowScanHelp(false)
          // Clear the input RFID
          form.setValue('rfid', '')
          // Reset processing flag to ensure we can scan again
          setIsProcessing(false)

          // Reset the flag after a delay
          setTimeout(() => {
            setPreventAutoSubmit(false)
          }, 1000)
        }} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="absolute top-4 left-4 flex justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowExitDialog(true)}
            className="h-8 w-8 rounded-full"
            title="Exit Returns Mode"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      <Card className="w-full max-w-md">
        <CardHeader>
            <div className="flex-grow text-center">
              <CardTitle className="text-center" onClick={handleTitleClick}>
                Gown Returns
              </CardTitle>
              <CardDescription className="text-center">
                {selectedEvent.name}
              </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="rfid"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Scan or enter gown RFID</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          ref={inputRef}
                          type="text"
                          placeholder="Scan RFID..."
                          onChange={(e) => {
                            field.onChange(e)
                            handleInputChange(e)
                          }}
                          onKeyDown={handleKeyDown}
                          className="text-lg pr-8"
                          autoComplete="off"
                        />
                      </FormControl>
                      {isProcessing ? (
                        <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-2 py-0"
                          onClick={() => {
                            form.setValue('rfid', '')
                            form.clearErrors()
                            inputRef.current?.focus()
                          }}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={!rfid.trim() || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Submit'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setShowScanHelp(true)}
              className="text-muted-foreground"
            >
              Where do I scan?
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onOpenChange={(open) => {
            // Only handle the dialog closing here
            if (!open) {
              console.log('Dialog closed via onOpenChange')
              // Set flag to prevent auto-submission
              setPreventAutoSubmit(true)
              // Clear dialog state
              setShowConfirmDialog(false)
              // Don't clear currentBooking here as it might be needed for handleConfirmCheckIn
              // Clear the input RFID
              form.setValue('rfid', '')
              // Reset processing flag to ensure we can scan again
              setIsProcessing(false)

              // Reset the flag and clear currentBooking after a delay
              setTimeout(() => {
                setPreventAutoSubmit(false)
                setCurrentBooking(null)
              }, 1000)
            }
          }}
          booking={currentBooking}
          onCancel={() => {
            console.log('Dialog canceled via onCancel button')
            // Set flag to prevent auto-submission
            setPreventAutoSubmit(true)
            // Clear the input RFID
            form.setValue('rfid', '')
            // Clear dialog state
            setShowConfirmDialog(false)
            // Reset processing flag to ensure we can scan again
            setIsProcessing(false)

            // Reset the flag and clear currentBooking after a delay
            setTimeout(() => {
              setPreventAutoSubmit(false)
              setCurrentBooking(null)
            }, 1000)
          }}
          onConfirm={handleConfirmCheckIn}
          isProcessing={checkInMutation.isPending}
        />


      {/* Exit Dialog */}
      <ExitDialog
        isOpen={showExitDialog}
        onOpenChange={setShowExitDialog}
        onSuccess={() => {
          console.log('[ReturnsMode] Exit dialog success, navigating to admin dashboard')
          navigate({ to: '/admin/event-manager' })
        }}
      />
    </div>
  )
}
