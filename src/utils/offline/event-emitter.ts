/**
 * Offline event emitter for notifying components about offline data changes
 */

// Event types
export enum OfflineEventType {
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  STATS_UPDATED = 'STATS_UPDATED',
  SYNC_COMPLETED = 'SYNC_COMPLETED',
}

// Event interface
export interface OfflineEvent {
  type: OfflineEventType;
  data: any;
}

// Event listener type
type EventListener = (event: OfflineEvent) => void;

// Event listeners storage
const listeners: Record<string, EventListener[]> = {};

/**
 * Subscribe to offline events
 * @param eventType The event type to subscribe to
 * @param listener The listener function
 * @returns A function to unsubscribe
 */
export function subscribeToOfflineEvents(
  eventType: OfflineEventType,
  listener: EventListener
): () => void {
  if (!listeners[eventType]) {
    listeners[eventType] = [];
  }

  listeners[eventType].push(listener);

  // Return unsubscribe function
  return () => {
    listeners[eventType] = listeners[eventType].filter(l => l !== listener);
  };
}

/**
 * Emit an offline event
 * @param eventType The event type to emit
 * @param data The event data
 * @param queryClient Optional QueryClient to invalidate queries
 */
export function emitOfflineEvent(eventType: OfflineEventType, data: any, queryClient?: any): void {
  if (!listeners[eventType]) {
    return;
  }

  const event: OfflineEvent = { type: eventType, data };

  console.log(`[OFFLINE_EVENT] Emitting ${eventType} event:`, data);

  // If we have a booking update and a query client, invalidate the relevant queries
  if (eventType === OfflineEventType.BOOKING_UPDATED && queryClient && data.id) {
    console.log(`[OFFLINE] Invalidating queries for booking ${data.id}`);

    // Immediately invalidate and refetch the pending operation query for this booking
    queryClient.invalidateQueries({
      queryKey: ['pendingOperation', data.id],
      refetchType: 'active',
      exact: true
    });

    // Also invalidate all pending operations to be safe
    queryClient.invalidateQueries({
      queryKey: ['pendingOperation'],
      refetchType: 'all'
    });

    // If we have an event ID, invalidate the bookings query for this event
    if (data.event) {
      const eventId = typeof data.event === 'object' ? data.event.id : data.event;
      if (eventId) {
        console.log(`[OFFLINE] Invalidating bookings query for event ${eventId}`);
        queryClient.invalidateQueries({ queryKey: ['event', eventId, 'all-bookings'] });

        // Also invalidate booking stats
        queryClient.invalidateQueries({ queryKey: ['event', eventId, 'bookingStats'] });
      }
    }

    // Force a refetch of the pending operation query after a delay
    // This helps ensure the UI is updated after the operation is processed
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['pendingOperation', data.id], exact: true });
      queryClient.refetchQueries({ queryKey: ['pendingOperation'] });
    }, 100);
  }

  // Use setTimeout to ensure the event is emitted asynchronously
  // This helps prevent issues with React's rendering cycle
  setTimeout(() => {
    listeners[eventType].forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in offline event listener for ${eventType}:`, error);
      }
    });
  }, 0);
}
