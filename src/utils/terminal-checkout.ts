import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

import { createTerminalCheckout } from './terminal-checkout.server';
import { createClient as createBrowserClient } from '@/utils/supabase/client';

// Client-side hook for creating a terminal checkout
export function useTerminalCheckoutMutation() {
  return useMutation({
    mutationFn: async (params: {
      data: {
        imageIds: string[];
        deviceId: string;
        contactId: number;
        quantity: number;
      };
    }) => {
      // Optionally: Use createBrowserClient for any browser-only logic, if needed
      // const supabase = createBrowserClient();
      // ...
      // Call the server function for actual checkout
      return await createTerminalCheckout(params);
    },
  });
}

/**
 * Hook for subscribing to transaction status changes
 * @param transactionId The ID of the transaction to subscribe to
 * @param onStatusChange Callback function to call when the transaction status changes
 */
export function useTransactionStatusSubscription(
  transactionId: string | null,
  onStatusChange: (status: string) => void
) {
  // Use the browser client for realtime subscriptions
  const supabase = createBrowserClient();

  // Set up the subscription when transactionId changes
  useEffect(() => {
    if (!transactionId) return;

    // Create the subscription
    const subscription = supabase
      .channel(`transaction-${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'terminal_transactions',
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          console.log('Transaction status changed:', payload);
          const newStatus = payload.new.status;
          onStatusChange(newStatus);
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts or transactionId changes
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [transactionId, onStatusChange]);
}
