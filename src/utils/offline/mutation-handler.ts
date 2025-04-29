/**
 * Offline mutation handler for TanStack Query
 * Based on TanStack Query's offline examples
 */
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { addToQueue, OperationType } from './queue';
import { markAsProcessed, removeErroredOperationsForBooking } from '@/utils/offline/queue';
// Uncomment to force offline mode for testing
// onlineManager.setOnline(false);
import { getOperationDescription } from '@/hooks/useOfflineOperations';
// We're no longer using the event emitter for UI updates

// Define mutation keys
export const mutationKeys = {
  all: () => ['mutations'],
  gowns: () => [...mutationKeys.all(), 'gowns'],
  checkout: () => [...mutationKeys.gowns(), 'checkout'],
  checkin: () => [...mutationKeys.gowns(), 'checkin'],
  changeGown: () => [...mutationKeys.gowns(), 'change'],
  undoCheckout: () => [...mutationKeys.gowns(), 'undo-checkout'],
  undoCheckin: () => [...mutationKeys.gowns(), 'undo-checkin'],
};

/**
 * Initialize mutation defaults for the query client
 * This allows mutations to be properly persisted and resumed
 */
export function initializeMutationDefaults(queryClient: QueryClient) {
  // Set defaults for checkout mutations
  queryClient.setMutationDefaults(mutationKeys.checkout(), {
    mutationFn: async (_data: { bookingId: number; rfid: string; ean: string; eventId: number }) => {
      // This will be called when a paused mutation is resumed
      return { success: true, message: 'Gown checked out successfully' };
    },
    onMutate: async (data) => {
      // Only proceed with optimistic updates if we're offline
      if (!onlineManager.isOnline()) {
        // Step 1: Add to queue
        const opId = await addToQueue(OperationType.CHECK_OUT_GOWN, data);

        // Step 1.5: Immediately update the pendingOperation query cache for instant UI feedback
        queryClient.setQueryData(['pendingOperation', data.bookingId], {
          type: OperationType.CHECK_OUT_GOWN,
          description: getOperationDescription(OperationType.CHECK_OUT_GOWN),
          timestamp: Date.now(),
          id: opId !== -1 ? opId : undefined,
        });

        // Step 1.6: Optimistically update the bookings array in the cache for instant UI feedback
        const bookingsQueryKey = ['event', data.eventId, 'bookings'];
        const allBookingsQueryKey = ['event', data.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        const currentBookings = queryClient.getQueryData(bookingsQueryKey) || [];
        const currentAllBookings = queryClient.getQueryData(allBookingsQueryKey) || [];
        if (Array.isArray(currentBookings)) {
          const updatedBookings = [...currentBookings];
          const index = updatedBookings.findIndex(b => b.id === data.bookingId);
          if (index !== -1) {
            updatedBookings[index] = {
              ...updatedBookings[index],
              booking_status: 'collected',
              check_out_time: new Date().toISOString(),
              pendingCheckout: true,
            };
            queryClient.setQueryData(bookingsQueryKey, updatedBookings);
          }
        }
        if (Array.isArray(currentAllBookings)) {
          const updatedAllBookings = [...currentAllBookings];
          const index = updatedAllBookings.findIndex(b => b.id === data.bookingId);
          if (index !== -1) {
            updatedAllBookings[index] = {
              ...updatedAllBookings[index],
              booking_status: 'collected',
              check_out_time: new Date().toISOString(),
              pendingCheckout: true,
            };
            queryClient.setQueryData(allBookingsQueryKey, updatedAllBookings);
          }
        }

        // Step 2: Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: bookingsQueryKey });

        // Step 3: Snapshot the previous value
        const previousBookings = queryClient.getQueryData(bookingsQueryKey);
        const previousAllBookings = queryClient.getQueryData(allBookingsQueryKey);

        // Step 4: Create optimistic update
        const optimisticBooking = {
          id: data.bookingId,
          booking_status: 'collected',
          check_out_time: new Date().toISOString(),
          gown: {
            rfid: data.rfid,
            ean: data.ean,
            in_stock: false
          },
          pendingCheckout: true // Add this flag for UI indicators
        };

        // Step 5: Optimistically update to the new value
        if (Array.isArray(currentBookings)) {
          // Create a new array to avoid mutating the original
          const updatedBookings = [...currentBookings];

          // Find the booking to update
          const index = updatedBookings.findIndex(b => b.id === data.bookingId);

          if (index !== -1) {
            // Create the updated booking by merging the existing booking with the optimistic update
            const updatedBooking = {
              ...updatedBookings[index],
              ...optimisticBooking,
              // Preserve any existing properties that shouldn't be overwritten
              ceremony: updatedBookings[index].ceremony,
              event: updatedBookings[index].event,
              event_name: updatedBookings[index].event_name
            };

            // Update the booking in the array
            updatedBookings[index] = updatedBooking;

            // Force a cache update by setting the data
            queryClient.setQueryData(bookingsQueryKey, updatedBookings);
          } else {
            console.warn('[OFFLINE] Booking not found for optimistic update:', data.bookingId);
          }
        } else {
          console.warn('[OFFLINE] currentBookings is not an array:', currentBookings);
        }

        if (Array.isArray(currentAllBookings)) {
          const updatedAllBookings = [...currentAllBookings];
          const index = updatedAllBookings.findIndex(b => b.id === data.bookingId);
          if (index !== -1) {
            const updatedBooking = {
              ...updatedAllBookings[index],
              ...optimisticBooking,
              ceremony: updatedAllBookings[index].ceremony,
              event: updatedAllBookings[index].event,
              event_name: updatedAllBookings[index].event_name
            };
            updatedAllBookings[index] = updatedBooking;
            queryClient.setQueryData(allBookingsQueryKey, updatedAllBookings);
          } else {
            console.warn('[OFFLINE] Booking not found for optimistic update:', data.bookingId);
          }
        } else {
          console.warn('[OFFLINE] currentAllBookings is not an array:', currentAllBookings);
        }

        // Also update any booking stats
        updateBookingStats(queryClient, data.eventId, 'checkout');

        // Invalidate and refetch the pending operation query for this booking
        queryClient.invalidateQueries({
          queryKey: ['pendingOperation', data.bookingId],
          refetchType: 'all'
        });

        // Force a refetch to ensure the UI is updated immediately
        queryClient.refetchQueries({ queryKey: ['pendingOperation', data.bookingId] });

        // Step 7: Return a context object with the snapshot and opId
        return { opId, previousBookings, previousAllBookings, bookingId: data.bookingId, eventId: data.eventId };
      }

      return null;
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _data, context) => {
      if (context) {
        // Roll back to the previous state
        const allBookingsQueryKey = ['event', context.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        queryClient.setQueryData(allBookingsQueryKey, context.previousAllBookings);

        console.log(`[OFFLINE] Rolling back optimistic update for booking ${context.bookingId}`);
      }
      // Optionally: keep onError for logging only
    },
    // Always refetch after error or success
    onSettled: async (_data, error, variables, context) => {
      // Handle error case: write error to queue and invalidate queries
      if (error && context && context.opId) {
        console.log('[OFFLINE] onSettled: Handling sync error for opId', context.opId, 'Error:', error.message);
        // Write error to the queue (mark the operation as processed with error)
        try {
          await markAsProcessed(context.opId, error.message || 'Unknown error');
          console.log('[OFFLINE] onSettled: markAsProcessed called for opId', context.opId);
        } catch (e) {
          console.error('[OFFLINE] onSettled: Failed to mark operation as errored in offline queue:', e);
        }
        // Invalidate both pending and errored operation queries for this booking
        if (variables && variables.bookingId) {
          queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
          queryClient.invalidateQueries({ queryKey: ['erroredOperation', variables.bookingId] });
          console.log('[OFFLINE] onSettled: Invalidated pendingOperation and erroredOperation queries for booking', variables.bookingId);
        }
      }
      // Always invalidate the main bookings query
      const allBookingsQueryKey = ['event', variables.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
      queryClient.invalidateQueries({ queryKey: allBookingsQueryKey });
      console.log('[OFFLINE] onSettled: Invalidated allBookingsQueryKey', allBookingsQueryKey);
      // Invalidate and refetch pending operation queries
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation', variables.bookingId],
        refetchType: 'all'
      });
      queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation'],
        refetchType: 'all'
      });
      console.log('[OFFLINE] onSettled: Completed all invalidations and refetches for booking', variables.bookingId);
      if (!error && variables && variables.bookingId) {
        await removeErroredOperationsForBooking(variables.bookingId);
        queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
        queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      }
    },
  });

  // Set defaults for checkin mutations
  queryClient.setMutationDefaults(mutationKeys.checkin(), {
    mutationFn: async (_data: { bookingId: number; rfid: string; ean: string; eventId: number }) => {
      // This will be called when a paused mutation is resumed
      return { success: true, message: 'Gown checked in successfully' };
    },
    onMutate: async (data) => {
      // Only proceed with optimistic updates if we're offline
      if (!onlineManager.isOnline()) {
        // Step 1: Add to queue
        const opId = await addToQueue(OperationType.CHECK_IN_GOWN, data);

        // Step 2: Cancel any outgoing refetches
        const bookingsQueryKey = ['event', data.eventId, 'bookings'];
        const allBookingsQueryKey = ['event', data.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        await queryClient.cancelQueries({ queryKey: bookingsQueryKey });

        // Step 3: Snapshot the previous value
        const previousBookings = queryClient.getQueryData(bookingsQueryKey);
        const previousAllBookings = queryClient.getQueryData(allBookingsQueryKey);

        // Step 4: Create optimistic update
        const optimisticBooking = {
          id: data.bookingId,
          booking_status: 'returned',
          check_in_time: new Date().toISOString(),
          gown: {
            rfid: data.rfid,
            ean: data.ean,
            in_stock: true
          },
          pendingCheckin: true // Add this flag for UI indicators
        };

        // Step 5: Optimistically update to the new value
        const currentBookings = queryClient.getQueryData(bookingsQueryKey) || [];
        const currentAllBookings = queryClient.getQueryData(allBookingsQueryKey) || [];

        if (Array.isArray(currentBookings)) {
          // Create a new array to avoid mutating the original
          const updatedBookings = [...currentBookings];

          // Find the booking to update
          const index = updatedBookings.findIndex(b => b.id === data.bookingId);

          if (index !== -1) {
            // Create the updated booking by merging the existing booking with the optimistic update
            const updatedBooking = {
              ...updatedBookings[index],
              ...optimisticBooking,
              // Preserve any existing properties that shouldn't be overwritten
              ceremony: updatedBookings[index].ceremony,
              event: updatedBookings[index].event,
              event_name: updatedBookings[index].event_name
            };

            // Update the booking in the array
            updatedBookings[index] = updatedBooking;

            // Force a cache update by setting the data
            queryClient.setQueryData(bookingsQueryKey, updatedBookings);
          } else {
            console.warn('[OFFLINE] Booking not found for optimistic update:', data.bookingId);
          }
        } else {
          console.warn('[OFFLINE] currentBookings is not an array:', currentBookings);
        }

        if (Array.isArray(currentAllBookings)) {
          const updatedAllBookings = [...currentAllBookings];
          const index = updatedAllBookings.findIndex(b => b.id === data.bookingId);
          if (index !== -1) {
            const updatedBooking = {
              ...updatedAllBookings[index],
              ...optimisticBooking,
              ceremony: updatedAllBookings[index].ceremony,
              event: updatedAllBookings[index].event,
              event_name: updatedAllBookings[index].event_name
            };
            updatedAllBookings[index] = updatedBooking;
            queryClient.setQueryData(allBookingsQueryKey, updatedAllBookings);
          } else {
            console.warn('[OFFLINE] Booking not found for optimistic update:', data.bookingId);
          }
        } else {
          console.warn('[OFFLINE] currentAllBookings is not an array:', currentAllBookings);
        }

        // Also update any booking stats
        updateBookingStats(queryClient, data.eventId, 'checkin');

        // Step 7: Return a context object with the snapshot and opId
        return { opId, previousBookings, previousAllBookings, bookingId: data.bookingId, eventId: data.eventId };
      }

      return null;
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _data, context) => {
      if (context) {
        // Roll back to the previous state
        const allBookingsQueryKey = ['event', context.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        queryClient.setQueryData(allBookingsQueryKey, context.previousAllBookings);

        console.log(`[OFFLINE] Rolling back optimistic update for booking ${context.bookingId}`);
      }
      // Optionally: keep onError for logging only
    },
    // Always refetch after error or success
    onSettled: async (_data, error, variables, context) => {
      // Handle error case: write error to queue and invalidate queries
      if (error && context && context.opId) {
        console.log('[OFFLINE] onSettled: Handling sync error for opId', context.opId, 'Error:', error.message);
        // Write error to the queue (mark the operation as processed with error)
        try {
          await markAsProcessed(context.opId, error.message || 'Unknown error');
          console.log('[OFFLINE] onSettled: markAsProcessed called for opId', context.opId);
        } catch (e) {
          console.error('[OFFLINE] onSettled: Failed to mark operation as errored in offline queue:', e);
        }
        // Invalidate both pending and errored operation queries for this booking
        if (variables && variables.bookingId) {
          queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
          queryClient.invalidateQueries({ queryKey: ['erroredOperation', variables.bookingId] });
          console.log('[OFFLINE] onSettled: Invalidated pendingOperation and erroredOperation queries for booking', variables.bookingId);
        }
      }
      // Always invalidate the main bookings query
      const allBookingsQueryKey = ['event', variables.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
      queryClient.invalidateQueries({ queryKey: allBookingsQueryKey });
      console.log('[OFFLINE] onSettled: Invalidated allBookingsQueryKey', allBookingsQueryKey);
      // Invalidate and refetch pending operation queries
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation', variables.bookingId],
        refetchType: 'all'
      });
      queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation'],
        refetchType: 'all'
      });
      console.log('[OFFLINE] onSettled: Completed all invalidations and refetches for booking', variables.bookingId);
      if (!error && variables && variables.bookingId) {
        await removeErroredOperationsForBooking(variables.bookingId);
        queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
        queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      }
    },
  });

  // Set defaults for gown change mutations
  queryClient.setMutationDefaults(mutationKeys.changeGown(), {
    mutationFn: async (_data: { bookingId: number; oldRfid: string; newRfid: string; ean: string; eventId: number }) => {
      // This will be called when a paused mutation is resumed
      return { success: true, message: 'Gown changed successfully' };
    },
    onMutate: async (data) => {
      // Only proceed with optimistic updates if we're offline
      if (!onlineManager.isOnline()) {
        // Step 1: Add to queue
        const opId = await addToQueue(OperationType.CHANGE_GOWN, data);

        // Step 2: Cancel any outgoing refetches
        const bookingsQueryKey = ['event', data.eventId, 'bookings'];
        const allBookingsQueryKey = ['event', data.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        await queryClient.cancelQueries({ queryKey: bookingsQueryKey });

        // Step 3: Snapshot the previous value
        const previousBookings = queryClient.getQueryData(bookingsQueryKey);
        const previousAllBookings = queryClient.getQueryData(allBookingsQueryKey);

        // Step 4: Create optimistic update
        const optimisticBooking = {
          id: data.bookingId,
          booking_status: 'collected',
          gown: {
            rfid: data.newRfid,
            ean: data.ean,
            in_stock: false
          },
          pendingGownChange: true // Add this flag for UI indicators
        };

        // Step 5: Optimistically update to the new value
        const currentBookings = queryClient.getQueryData(bookingsQueryKey) || [];
        const currentAllBookings = queryClient.getQueryData(allBookingsQueryKey) || [];

        if (Array.isArray(currentBookings)) {
          // Create a new array to avoid mutating the original
          const updatedBookings = [...currentBookings];

          // Find the booking to update
          const index = updatedBookings.findIndex(b => b.id === data.bookingId);

          if (index !== -1) {
            // Create the updated booking by merging the existing booking with the optimistic update
            const updatedBooking = {
              ...updatedBookings[index],
              ...optimisticBooking,
              // Preserve any existing properties that shouldn't be overwritten
              ceremony: updatedBookings[index].ceremony,
              event: updatedBookings[index].event,
              event_name: updatedBookings[index].event_name
            };

            // Update the booking in the array
            updatedBookings[index] = updatedBooking;

            // Force a cache update by setting the data
            queryClient.setQueryData(bookingsQueryKey, updatedBookings);
          } else {
            console.warn('[OFFLINE] Booking not found for optimistic update:', data.bookingId);
          }
        } else {
          console.warn('[OFFLINE] currentBookings is not an array:', currentBookings);
        }

        if (Array.isArray(currentAllBookings)) {
          const updatedAllBookings = [...currentAllBookings];
          const index = updatedAllBookings.findIndex(b => b.id === data.bookingId);
          if (index !== -1) {
            const updatedBooking = {
              ...updatedAllBookings[index],
              ...optimisticBooking,
              ceremony: updatedAllBookings[index].ceremony,
              event: updatedAllBookings[index].event,
              event_name: updatedAllBookings[index].event_name
            };
            updatedAllBookings[index] = updatedBooking;
            queryClient.setQueryData(allBookingsQueryKey, updatedAllBookings);
          } else {
            console.warn('[OFFLINE] Booking not found for optimistic update:', data.bookingId);
          }
        } else {
          console.warn('[OFFLINE] currentAllBookings is not an array:', currentAllBookings);
        }

        // Also update any booking stats
        updateBookingStats(queryClient, data.eventId, 'change');

        // Step 7: Return a context object with the snapshot and opId
        return { opId, previousBookings, previousAllBookings, bookingId: data.bookingId, eventId: data.eventId };
      }

      return null;
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _data, context) => {
      if (context) {
        // Roll back to the previous state
        const bookingsQueryKey = ['event', context.eventId, 'bookings'];
        const allBookingsQueryKey = ['event', context.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        queryClient.setQueryData(bookingsQueryKey, context.previousBookings);
        queryClient.setQueryData(allBookingsQueryKey, context.previousAllBookings);

        console.log(`[OFFLINE] Rolling back optimistic update for booking ${context.bookingId}`);
      }
      // Optionally: keep onError for logging only
    },
    // Always refetch after error or success
    onSettled: async (_data, error, variables, context) => {
      // Handle error case: write error to queue and invalidate queries
      if (error && context && context.opId) {
        console.log('[OFFLINE] onSettled: Handling sync error for opId', context.opId, 'Error:', error.message);
        // Write error to the queue (mark the operation as processed with error)
        try {
          await markAsProcessed(context.opId, error.message || 'Unknown error');
          console.log('[OFFLINE] onSettled: markAsProcessed called for opId', context.opId);
        } catch (e) {
          console.error('[OFFLINE] onSettled: Failed to mark operation as errored in offline queue:', e);
        }
        // Invalidate both pending and errored operation queries for this booking
        if (variables && variables.bookingId) {
          queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
          queryClient.invalidateQueries({ queryKey: ['erroredOperation', variables.bookingId] });
          console.log('[OFFLINE] onSettled: Invalidated pendingOperation and erroredOperation queries for booking', variables.bookingId);
        }
      }
      // Always invalidate the main bookings query
      const allBookingsQueryKey = ['event', variables.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
      queryClient.invalidateQueries({ queryKey: allBookingsQueryKey });
      console.log('[OFFLINE] onSettled: Invalidated allBookingsQueryKey', allBookingsQueryKey);
      // Invalidate and refetch pending operation queries
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation', variables.bookingId],
        refetchType: 'all'
      });
      queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation'],
        refetchType: 'all'
      });
      console.log('[OFFLINE] onSettled: Completed all invalidations and refetches for booking', variables.bookingId);
      if (!error && variables && variables.bookingId) {
        await removeErroredOperationsForBooking(variables.bookingId);
        queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
        queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      }
    },
  });

  // Add mutation defaults for undo checkout
  queryClient.setMutationDefaults(mutationKeys.undoCheckout(), {
    mutationFn: async (_data: { bookingId: number; eventId: number }) => {
      return { success: true, message: 'Undo checkout will be processed when online' };
    },
    onMutate: async (data) => {
      if (!onlineManager.isOnline()) {
        const opId = await addToQueue(OperationType.UNDO_CHECK_OUT, data);
        // Optimistic update: revert booking to 'awaiting_pickup', clear check_out_time, set pendingUndoCheckout
        const bookingsQueryKey = ['event', data.eventId, 'bookings'];
        const allBookingsQueryKey = ['event', data.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        await queryClient.cancelQueries({ queryKey: bookingsQueryKey });
        const previousBookings = queryClient.getQueryData(bookingsQueryKey);
        const previousAllBookings = queryClient.getQueryData(allBookingsQueryKey);
        const updateBooking = (booking) => ({
          ...booking,
          booking_status: 'awaiting_pickup',
          check_out_time: null,
          pendingUndoCheckout: true,
        });
        const currentBookings = queryClient.getQueryData(bookingsQueryKey) || [];
        const currentAllBookings = queryClient.getQueryData(allBookingsQueryKey) || [];
        if (Array.isArray(currentBookings)) {
          const updated = [...currentBookings];
          const idx = updated.findIndex(b => b.id === data.bookingId);
          if (idx !== -1) updated[idx] = updateBooking(updated[idx]);
          queryClient.setQueryData(bookingsQueryKey, updated);
        }
        if (Array.isArray(currentAllBookings)) {
          const updated = [...currentAllBookings];
          const idx = updated.findIndex(b => b.id === data.bookingId);
          if (idx !== -1) updated[idx] = updateBooking(updated[idx]);
          queryClient.setQueryData(allBookingsQueryKey, updated);
        }
        queryClient.setQueryData(['pendingOperation', data.bookingId], {
          type: OperationType.UNDO_CHECK_OUT,
          description: getOperationDescription(OperationType.UNDO_CHECK_OUT),
          timestamp: Date.now(),
        });
        // Step 7: Return a context object with the snapshot and opId
        return { opId, previousBookings: null, previousAllBookings: null, bookingId: data.bookingId, eventId: data.eventId };
      }
      return null;
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _data, context) => {
      if (context) {
        // Roll back to the previous state
        const allBookingsQueryKey = ['event', context.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        queryClient.setQueryData(allBookingsQueryKey, context.previousAllBookings);

        console.log(`[OFFLINE] Rolling back optimistic update for booking ${context.bookingId}`);
      }
      // Optionally: keep onError for logging only
    },
    // Always refetch after error or success
    onSettled: async (_data, error, variables, context) => {
      // Handle error case: write error to queue and invalidate queries
      if (error && context && context.opId) {
        console.log('[OFFLINE] onSettled: Handling sync error for opId', context.opId, 'Error:', error.message);
        // Write error to the queue (mark the operation as processed with error)
        try {
          await markAsProcessed(context.opId, error.message || 'Unknown error');
          console.log('[OFFLINE] onSettled: markAsProcessed called for opId', context.opId);
        } catch (e) {
          console.error('[OFFLINE] onSettled: Failed to mark operation as errored in offline queue:', e);
        }
        // Invalidate both pending and errored operation queries for this booking
        if (variables && variables.bookingId) {
          queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
          queryClient.invalidateQueries({ queryKey: ['erroredOperation', variables.bookingId] });
          console.log('[OFFLINE] onSettled: Invalidated pendingOperation and erroredOperation queries for booking', variables.bookingId);
        }
      }
      // Always invalidate the main bookings query
      const allBookingsQueryKey = ['event', variables.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
      queryClient.invalidateQueries({ queryKey: allBookingsQueryKey });
      console.log('[OFFLINE] onSettled: Invalidated allBookingsQueryKey', allBookingsQueryKey);
      // Invalidate and refetch pending operation queries
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation', variables.bookingId],
        refetchType: 'all'
      });
      queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation'],
        refetchType: 'all'
      });
      console.log('[OFFLINE] onSettled: Completed all invalidations and refetches for booking', variables.bookingId);
      if (!error && variables && variables.bookingId) {
        await removeErroredOperationsForBooking(variables.bookingId);
        queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
        queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      }
    },
  });

  // Add mutation defaults for undo checkin
  queryClient.setMutationDefaults(mutationKeys.undoCheckin(), {
    mutationFn: async (_data: { bookingId: number; eventId: number }) => {
      return { success: true, message: 'Undo check-in will be processed when online' };
    },
    onMutate: async (data) => {
      if (!onlineManager.isOnline()) {
        const opId = await addToQueue(OperationType.UNDO_CHECK_IN, data);
        // Optimistic update: revert booking to 'collected', clear check_in_time, set pendingUndoCheckin
        const bookingsQueryKey = ['event', data.eventId, 'bookings'];
        const allBookingsQueryKey = ['event', data.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        await queryClient.cancelQueries({ queryKey: bookingsQueryKey });
        const previousBookings = queryClient.getQueryData(bookingsQueryKey);
        const previousAllBookings = queryClient.getQueryData(allBookingsQueryKey);
        const updateBooking = (booking) => ({
          ...booking,
          booking_status: 'collected',
          check_in_time: null,
          pending: true,
        });
        const currentBookings = queryClient.getQueryData(bookingsQueryKey) || [];
        const currentAllBookings = queryClient.getQueryData(allBookingsQueryKey) || [];
        if (Array.isArray(currentBookings)) {
          const updated = [...currentBookings];
          const idx = updated.findIndex(b => b.id === data.bookingId);
          if (idx !== -1) updated[idx] = updateBooking(updated[idx]);
          queryClient.setQueryData(bookingsQueryKey, updated);
        }
        if (Array.isArray(currentAllBookings)) {
          const updated = [...currentAllBookings];
          const idx = updated.findIndex(b => b.id === data.bookingId);
          if (idx !== -1) updated[idx] = updateBooking(updated[idx]);
          queryClient.setQueryData(allBookingsQueryKey, updated);
        }
        queryClient.setQueryData(['pendingOperation', data.bookingId], {
          type: OperationType.UNDO_CHECK_IN,
          description: getOperationDescription(OperationType.UNDO_CHECK_IN),
          timestamp: Date.now(),
        });
        // Step 7: Return a context object with the snapshot and opId
        return { opId, previousBookings: null, previousAllBookings: null, bookingId: data.bookingId, eventId: data.eventId };
      }
      return null;
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _data, context) => {
      if (context) {
        // Roll back to the previous state
        const allBookingsQueryKey = ['event', context.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
        queryClient.setQueryData(allBookingsQueryKey, context.previousAllBookings);

        console.log(`[OFFLINE] Rolling back optimistic update for booking ${context.bookingId}`);
      }
      // Optionally: keep onError for logging only
    },
    // Always refetch after error or success
    onSettled: async (_data, error, variables, context) => {
      // Handle error case: write error to queue and invalidate queries
      if (error && context && context.opId) {
        console.log('[OFFLINE] onSettled: Handling sync error for opId', context.opId, 'Error:', error.message);
        // Write error to the queue (mark the operation as processed with error)
        try {
          await markAsProcessed(context.opId, error.message || 'Unknown error');
          console.log('[OFFLINE] onSettled: markAsProcessed called for opId', context.opId);
        } catch (e) {
          console.error('[OFFLINE] onSettled: Failed to mark operation as errored in offline queue:', e);
        }
        // Invalidate both pending and errored operation queries for this booking
        if (variables && variables.bookingId) {
          queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
          queryClient.invalidateQueries({ queryKey: ['erroredOperation', variables.bookingId] });
          console.log('[OFFLINE] onSettled: Invalidated pendingOperation and erroredOperation queries for booking', variables.bookingId);
        }
      }
      // Always invalidate the main bookings query
      const allBookingsQueryKey = ['event', variables.eventId, 'all-bookings', { sortBy: 'created_at', sortDirection: 'desc' }];
      queryClient.invalidateQueries({ queryKey: allBookingsQueryKey });
      console.log('[OFFLINE] onSettled: Invalidated allBookingsQueryKey', allBookingsQueryKey);
      // Invalidate and refetch pending operation queries
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation', variables.bookingId],
        refetchType: 'all'
      });
      queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation'],
        refetchType: 'all'
      });
      console.log('[OFFLINE] onSettled: Completed all invalidations and refetches for booking', variables.bookingId);
      if (!error && variables && variables.bookingId) {
        await removeErroredOperationsForBooking(variables.bookingId);
        queryClient.invalidateQueries({ queryKey: ['pendingOperation', variables.bookingId] });
        queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
      }
    },
  });
}

/**
 * Create an offline mutation that will be paused when offline
 * and resumed when online
 */
export function createOfflineMutation(type: 'checkout' | 'checkin' | 'change', queryClient: QueryClient) {
  const mutationKey = type === 'checkout'
    ? mutationKeys.checkout()
    : type === 'checkin'
      ? mutationKeys.checkin()
      : mutationKeys.changeGown();

  return {
    mutationKey,
    // Use online network mode to ensure mutations are paused when offline
    networkMode: 'online' as const,
    // Retry failed mutations when coming back online
    retry: 3,
    retryDelay: 1000, // 1 second between retries
    // Persist mutations in the query cache
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep for 7 days
    onSuccess: (_data: unknown, variables: { eventId: number; bookingId: number }) => {
      const eventId = variables.eventId;

      // Invalidate relevant queries when the mutation succeeds
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'bookingStats'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'all-bookings'] });

      // Invalidate and refetch all pending operation queries to ensure UI is updated
      queryClient.invalidateQueries({
        queryKey: ['pendingOperation'],
        refetchType: 'all'
      });

      queryClient.invalidateQueries({
        queryKey: ['pendingOperation', variables.bookingId],
        refetchType: 'all'
      });

      // Force a refetch to ensure the UI is updated immediately
      queryClient.refetchQueries({ queryKey: ['pendingOperation', variables.bookingId] });
    },
  };
}

/**
 * Helper function to update booking stats optimistically
 */
function updateBookingStats(
  queryClient: QueryClient,
  eventId: number,
  operation: 'checkout' | 'checkin' | 'change'
) {
  const statsKey = ['event', eventId, 'bookingStats'];
  const currentStats = queryClient.getQueryData<Record<string, number>>(statsKey) || {};

  if (currentStats) {
    const updatedStats = { ...currentStats };

    if (operation === 'checkout') {
      // Increment collected count
      updatedStats.collected_count = (updatedStats.collected_count || 0) + 1;
    } else if (operation === 'checkin') {
      // Decrement collected count, increment returned count
      updatedStats.collected_count = Math.max(0, (updatedStats.collected_count || 0) - 1);
      updatedStats.returned_count = (updatedStats.returned_count || 0) + 1;
    }

    // Update the stats in the cache
    queryClient.setQueryData(statsKey, updatedStats);

    // No need to emit events - TanStack Query will handle the UI updates
    // Just log for debugging
    console.log('[OFFLINE] Updated booking stats for event:', eventId);
  }
}