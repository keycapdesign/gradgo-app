import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ReturnsModeAlertProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}

export function ReturnsModeAlert({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel
}: ReturnsModeAlertProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Entering Returns Kiosk Mode
          </AlertDialogTitle>
          <div className="text-sm text-muted-foreground">
            <p className="mb-4">
              You are about to enter Returns Kiosk Mode. This is a restricted mode designed for gown returns at a kiosk.
            </p>

            <p className="mb-4">
              <strong>Important:</strong> While in this mode, normal navigation will be disabled. You can exit this mode by:
            </p>

            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Clicking the X button in the top-right corner of the returns screen</li>
              <li>Triple-clicking on the "Gown Returns" title</li>
            </ul>

            <p>
              Both methods will require you to enter your admin password to confirm exit.
            </p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue to Returns Mode</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
