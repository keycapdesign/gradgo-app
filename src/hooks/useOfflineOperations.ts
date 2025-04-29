import { useQuery, useQueryClient, onlineManager, useIsRestoring } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { getPendingOperationsForBooking, getErroredOperationsForBooking, OperationType } from '@/utils/offline/queue'

// Export getOperationDescription for use in mutation-handler
export function getOperationDescription(type: OperationType): string {
  switch (type) {
    case OperationType.CHECK_OUT_GOWN:
      return 'This booking will be checked out when back online.'
    case OperationType.CHECK_IN_GOWN:
      return 'This booking will be checked in when back online.'
    case OperationType.UNDO_CHECK_OUT:
      return 'The checkout for this booking will be undone when back online.'
    case OperationType.UNDO_CHECK_IN:
      return 'The check-in for this booking will be undone when back online.'
    case OperationType.CHANGE_GOWN:
      return 'The gown for this booking will be changed when back online.'
    default:
      return 'This booking has a pending operation that will be applied when back online.'
  }
}

export function useOfflineOperations(bookingId?: number) {
  const queryClient = useQueryClient()
  const [directPendingOp, setDirectPendingOp] = useState<any>(null)

  // Check if we're offline
  const isOffline = !onlineManager.isOnline();

  // Query for a single booking's pending operations
  const pendingOperationQuery = useQuery({
    queryKey: ['pendingOperation', bookingId],
    queryFn: async () => {
      if (!bookingId) return null

      try {
        const pendingOps = await getPendingOperationsForBooking(bookingId)

        if (pendingOps.length === 0) {
          setDirectPendingOp(null)
          return null
        }

        // Return the most recent pending operation
        const latestOp = pendingOps[0]
        const result = {
          type: latestOp.type,
          description: getOperationDescription(latestOp.type),
          timestamp: latestOp.timestamp,
          id: latestOp.id,
          error: latestOp.error
        };

        // Update the direct pending op state
        setDirectPendingOp(result)

        return result;
      } catch (error) {
        console.error(`Error getting pending operation for booking ${bookingId}:`, error)
        return null
      }
    },
    // Set staleTime to 0 to always refetch when requested
    staleTime: 0,
    // Set cacheTime to a very short duration to ensure fresh data
    gcTime: 1000, // 1 second
    // Only run if we have a bookingId
    enabled: !!bookingId,
    // Refetch on window focus to ensure we have the latest data
    refetchOnWindowFocus: true,
    // Refetch on reconnect to ensure we have the latest data after coming back online
    refetchOnReconnect: true,
    // Refetch more frequently when offline to ensure we have the latest data
    refetchInterval: isOffline ? 2000 : false,
  })

  // Query for errored operations for this booking
  const erroredOperationQuery = useQuery({
    queryKey: ['erroredOperation', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      const errored = await getErroredOperationsForBooking(bookingId);
      return errored;
    },
    enabled: !!bookingId,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });
  const latestError = erroredOperationQuery.data?.[0]?.error;

  // Function to check for pending operations and update state
  const checkAndUpdatePendingOps = useCallback(async () => {
    if (!bookingId) return;

    try {
      const pendingOps = await getPendingOperationsForBooking(bookingId);

      if (pendingOps.length > 0) {
        const latestOp = pendingOps[0];
        setDirectPendingOp({
          type: latestOp.type,
          description: getOperationDescription(latestOp.type),
          timestamp: latestOp.timestamp,
          id: latestOp.id,
          error: latestOp.error
        });
      } else {
        setDirectPendingOp(null);
      }
    } catch (error) {
      console.error(`Error checking pending operations for booking ${bookingId}:`, error);
    }
  }, [bookingId]);

  // Check if we're restoring from query cache
  const isRestoring = useIsRestoring()

  // Invalidate pending operations when coming back online
  useEffect(() => {
    if (isOffline === false && bookingId) {
      // When coming back online, invalidate the query to get fresh data
      queryClient.invalidateQueries({ queryKey: ['pendingOperation', bookingId] })
      queryClient.invalidateQueries({ queryKey: ['erroredOperation', bookingId] })
      // Also directly check for pending operations
      checkAndUpdatePendingOps()
    }
  }, [isOffline, bookingId, queryClient, checkAndUpdatePendingOps])

  // Helper function to invalidate pending operation queries
  const invalidatePendingOperation = useCallback((targetBookingId?: number) => {
    if (targetBookingId) {
      // Invalidate specific booking
      queryClient.invalidateQueries({ queryKey: ['pendingOperation', targetBookingId] })
    } else {
      // Invalidate all pending operation queries
      queryClient.invalidateQueries({ queryKey: ['pendingOperation'] })
    }
  }, [queryClient])

  // Helper function to check if a booking has pending operations
  const checkForPendingOperations = useCallback(async () => {
    if (!bookingId) return false

    try {
      const pendingOps = await getPendingOperationsForBooking(bookingId)
      return pendingOps.length > 0
    } catch (error) {
      console.error(`Error checking for pending operations for booking ${bookingId}:`, error)
      return false
    }
  }, [bookingId])

  // Use the direct pending op if available, otherwise use the query data
  // This ensures we have immediate updates when operations are added
  const pendingOperation = directPendingOp || pendingOperationQuery.data

  // Function to manually refresh pending operations
  const refreshPendingOperations = useCallback(() => {
    if (bookingId) {
      // Directly check for pending operations
      checkAndUpdatePendingOps()
      // Also invalidate and refetch the query
      queryClient.invalidateQueries({ queryKey: ['pendingOperation', bookingId] })
      // Force a refetch
      pendingOperationQuery.refetch()
    }
  }, [bookingId, checkAndUpdatePendingOps, queryClient, pendingOperationQuery])

  return {
    pendingOperation: directPendingOp,
    error: latestError,
    invalidatePendingOperation,
    checkForPendingOperations,
    isRestoring,
    isOffline,
    isPendingOperationLoading: pendingOperationQuery.isLoading,
    isPendingOperationError: pendingOperationQuery.isError,
    refreshPendingOperations
  }
}