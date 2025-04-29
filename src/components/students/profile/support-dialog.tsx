import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendSupportEmail } from '@/utils/support';

import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: number | null | undefined;
  selfieData?: any;
  userData?: any;
}

export function SupportDialog({ open, onOpenChange, contactId, selfieData, userData }: SupportDialogProps) {
  const [supportMessage, setSupportMessage] = useState('');

  // Mutation for sending support message with proper TanStack Query patterns
  const sendSupportMutation = useMutation({
    mutationFn: async (message: string) => {
      // Call our server function to send the support email
      const result = await sendSupportEmail({
        data: {
          message,
          subject: 'Support Request from Student',
          contactId,
        },
      });

      return result;
    },
    onSuccess: () => {
      toast.success('Support message sent successfully');
      setSupportMessage('');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  // Handle support message submission
  const handleSendSupportMessage = () => {
    if (!supportMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    sendSupportMutation.mutate(supportMessage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Send us a message and we'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="How can we help you?"
          className="min-h-[120px]"
          value={supportMessage}
          onChange={(e) => setSupportMessage(e.target.value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendSupportMessage}
            disabled={sendSupportMutation.isPending || !supportMessage.trim()}
          >
            {sendSupportMutation.isPending ? (
              <>
                <span className="mr-2">
                  <LoadingSpinner />
                </span>
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
