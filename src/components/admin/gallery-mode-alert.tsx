import { AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GalleryModeAlertProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GalleryModeAlert({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
}: GalleryModeAlertProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Entering Gallery Kiosk Mode
          </AlertDialogTitle>
          <div className="text-sm text-muted-foreground">
            <p className="mb-4">
              You are about to enter Gallery Kiosk Mode. This is a restricted mode designed for
              students to view and select their graduation photos.
            </p>

            <p className="mb-4">
              <strong>Important:</strong> While in this mode, normal navigation will be disabled.
              You can exit this mode by:
            </p>

            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Clicking the X button in the top-left corner of the gallery screen</li>
            </ul>

            <p>Exiting will require you to enter your admin password to confirm.</p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue to Gallery Mode</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
