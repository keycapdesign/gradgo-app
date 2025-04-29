import { Info } from 'lucide-react'
import { format } from 'date-fns'
import { useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ConfirmDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onCancel: () => void
  onConfirm: () => void
  isProcessing: boolean
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  booking,
  onCancel,
  onConfirm,
  isProcessing
}: ConfirmDialogProps) {
  // Store the booking in a ref to ensure it's available when needed
  const bookingRef = useRef(booking);

  // Update the ref when the booking changes
  useEffect(() => {
    if (booking) {
      bookingRef.current = booking;
    }
  }, [booking]);
  // Don't render the dialog if booking is null or undefined
  if (!booking && !bookingRef.current) {
    return null;
  }

  // Use the booking from the ref if the booking prop is null or undefined
  const bookingData = booking || bookingRef.current;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Gown Return</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <div className="font-medium">{bookingData?.full_name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Event</Label>
              <div className="font-medium">{bookingData?.event?.name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <div className="font-medium">{bookingData?.email}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Checked Out</Label>
              <div className="font-medium">
                {bookingData?.check_out_time ? format(new Date(bookingData.check_out_time), 'PPP p') : 'Unknown'}
              </div>
            </div>
          </div>
          <div className="bg-muted p-3 rounded-md flex items-start gap-2">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">Please confirm that this information is correct before proceeding.</p>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              // Use the booking from the ref to ensure it's available
              if (bookingData) {
                console.log('Confirm button clicked with valid booking data');
                onConfirm();
              } else {
                console.error('Cannot confirm: booking data is undefined');
              }
            }}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
