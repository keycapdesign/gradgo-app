import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CheckCircle } from 'lucide-react'
import { useEventStore } from '@/stores/event-store'
import { fetchContactByGownRfid, updateContactPhotoStartTime, updateContactPhotoEndTime, fetchActiveContacts } from '@/utils/stage-queue'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const Route = createFileRoute('/_protected/admin/stage-queue/')({
  component: RouteComponent,
  loader: () => {
    return {
      title: 'Stage Queue'
    }
  }
})

function RouteComponent() {
  const { selectedEvent } = useEventStore()
  const [rfid, setRfid] = useState('')
  const debouncedRfid = useDebounce(rfid, 500) // 500ms debounce - shorter to be responsive but prevent duplicates
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [isManualInput, setIsManualInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Use a more focused approach to maintain input focus
  // We'll only refocus when clicking inside the main content area
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Get the sidebar inset element
      const sidebarInset = document.querySelector('[data-sidebar-inset]')

      // Check if the click is inside the sidebar inset but not on interactive elements
      if (sidebarInset &&
          sidebarInset.contains(target) &&
          !target.closest('button') &&
          !target.closest('.popover') &&
          !target.closest('[role="combobox"]') &&
          !target.closest('a') &&
          !target.closest('input:not(#rfid-input)') &&
          inputRef.current) {
        inputRef.current.focus()
      }
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  // Define the type for active contacts
  interface ActiveContact {
    id: number
    name: string
    photo_start_time: string
    photo_end_time: string | null
  }

  // Query for active contacts
  const activeContactsQuery = useQuery<ActiveContact[]>({
    queryKey: ['activeContacts', selectedEvent?.id],
    queryFn: () => {
      if (!selectedEvent?.id) return []
      return fetchActiveContacts({ data: { eventId: selectedEvent.id } })
    },
    enabled: !!selectedEvent?.id,
    refetchInterval: 5000 // Refetch every 5 seconds to keep the list updated
  })

  // Mutation to update contact photo_start_time
  const updatePhotoStartTimeMutation = useMutation({
    mutationFn: (contactId: number) => {
      return updateContactPhotoStartTime({ data: { contactId } })
    },
    onSuccess: () => {
      // Refetch active contacts
      if (selectedEvent?.id) {
        queryClient.invalidateQueries({ queryKey: ['activeContacts', selectedEvent.id] })
      }
      // Clear the input field
      setRfid('')
    },
    onError: (error) => {
      toast.error(`Error updating contact: ${error.message}`)
    }
  })

  // Mutation to update contact photo_end_time
  const updatePhotoEndTimeMutation = useMutation({
    mutationFn: (contactId: number) => {
      return updateContactPhotoEndTime({ data: { contactId } })
    },
    onSuccess: () => {
      toast.success('Student marked as completed')
      // Refetch active contacts
      if (selectedEvent?.id) {
        queryClient.invalidateQueries({ queryKey: ['activeContacts', selectedEvent.id] })
      }
    },
    onError: (error) => {
      toast.error(`Error updating contact: ${error.message}`)
    }
  })

  // Process RFID submission
  const processRfid = useCallback(async (rfidValue: string) => {
    // Prevent processing if already in progress
    if (isProcessing) {
      return
    }

    if (!rfidValue.trim()) {
      toast.error('Please scan a gown RFID')
      return
    }

    if (!selectedEvent?.id) {
      toast.error('Please select an event first')
      return
    }

    try {
      // Set processing flag to prevent duplicate submissions
      setIsProcessing(true)

      // Fetch the contact associated with this RFID
      const booking = await fetchContactByGownRfid({ data: { rfid: rfidValue.trim() } })

      // Check if the booking is for the selected event
      if (booking.event_id !== selectedEvent.id) {
        toast.error(`This gown is associated with a different event: ${booking.event_name}`)
        return
      }

      // Update the contact's photo_start_time
      updatePhotoStartTimeMutation.mutate(booking.contact_id)

      toast.success(`${booking.full_name} has been added to the queue`)
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      // Clear the input field
      setRfid('')
      // Focus the input field again
      if (inputRef.current) {
        inputRef.current.focus()
      }
      // Reset processing flag after a short delay to prevent immediate resubmission
      setTimeout(() => {
        setIsProcessing(false)
      }, 1000)
    }
  }, [selectedEvent, updatePhotoStartTimeMutation, isProcessing])

  // Handle form submission (manual submit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await processRfid(rfid)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setRfid(newValue)

    // Detect if this is likely a scan or manual input
    // RFID scans typically happen very quickly
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
    // Only process if there's a value and it's not from manual input
    // Also check that we're not already processing
    if (debouncedRfid &&
        !isManualInput &&
        debouncedRfid.length >= 8 &&
        !isProcessing) {
      processRfid(debouncedRfid)
    }
  }, [debouncedRfid, isManualInput, isProcessing, processRfid])

  // Handle input keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed, submit the form
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {!selectedEvent && (
        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-md text-yellow-800 dark:text-yellow-200">
          Please select an event from the sidebar to use the stage queue.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scan Gown Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scan Gown</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="rfid-input"
                ref={inputRef}
                type="text"
                placeholder="Scan RFID..."
                value={rfid}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="text-lg"
                autoComplete="off"
                disabled={!selectedEvent}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={!selectedEvent || !rfid.trim() || updatePhotoStartTimeMutation.isPending}
              >
                {updatePhotoStartTimeMutation.isPending ? 'Processing...' : 'Process RFID'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Students Card */}
        <Card>
          <CardHeader>
            <CardTitle>Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            {activeContactsQuery.isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : activeContactsQuery.isError ? (
              <div className="text-center py-4 text-red-500">
                Error: {(activeContactsQuery.error as Error).message}
              </div>
            ) : activeContactsQuery.data?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No active students in the queue.
              </div>
            ) : (
              <ul className="space-y-2">
                {activeContactsQuery.data?.map((contact) => (
                  <li
                    key={contact.id}
                    className="p-3 rounded-md border border-border flex justify-between items-center gap-2"
                  >
                    <span className="font-medium">{contact.name}</span>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {format(new Date(contact.photo_start_time), 'h:mm a')}
                        </span>
                        <TooltipProvider>
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                variant="default"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updatePhotoEndTimeMutation.mutate(contact.id)}
                                disabled={updatePhotoEndTimeMutation.isPending}
                                >
                                <CheckCircle className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Mark as completed</p>
                            </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                      </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
