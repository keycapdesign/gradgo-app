/**
 * Utility for automating offline data prefetching and syncing
 */
import { onlineManager, useIsRestoring, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { syncOfflineOperations, hasPendingOperations } from './sync-manager';
import { prefetchEventData, isEventDataCached } from './prefetcher';

// Configuration options for auto-sync
interface AutoSyncConfig {
  // Whether to enable auto-prefetch when the event is loaded
  enableAutoPrefetch?: boolean;
  // Whether to enable auto-sync when coming back online
  enableAutoSync?: boolean;
  // Whether to show toast notifications for auto operations
  showNotifications?: boolean;
  // Callback when prefetch completes
  onPrefetchComplete?: (success: boolean) => void;
  // Callback when sync completes
  onSyncComplete?: (success: boolean) => void;
}

/**
 * Hook to automatically prefetch event data and sync offline operations
 * @param eventId The event ID to prefetch data for
 * @param config Configuration options
 */
export function useAutoSync(eventId: number | null | undefined, config: AutoSyncConfig = {}) {
  const {
    enableAutoPrefetch = true,
    enableAutoSync = true,
    showNotifications = true,
    onPrefetchComplete,
    onSyncComplete
  } = config;

  const queryClient = useQueryClient();

  // Track online status using TanStack Query's onlineManager
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const [wasOffline, setWasOffline] = useState(false);
  const isRestoring = useIsRestoring();

  // Set up listener for online status changes
  useEffect(() => {
    const unsubscribe = onlineManager.subscribe(() => {
      const online = onlineManager.isOnline();
      setIsOnline(online);

      if (online && !isOnline) {
        // We just came back online
        setWasOffline(true);

        // Reset wasOffline after a delay
        const timer = setTimeout(() => {
          setWasOffline(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline]);

  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingOps, setHasPendingOps] = useState(false);
  const [isDataCached, setIsDataCached] = useState(false);

  // Check if there are pending operations
  useEffect(() => {
    if (!eventId) return;

    const checkPendingOps = async () => {
      try {
        const hasPending = await hasPendingOperations();
        setHasPendingOps(hasPending);
      } catch (error) {
        console.error('Error checking for pending operations:', error);
      }
    };

    checkPendingOps();
  }, [eventId]);

  // Check if event data is cached
  useEffect(() => {
    if (!eventId) return;

    const checkCachedData = async () => {
      try {
        const isCached = await isEventDataCached(eventId);
        setIsDataCached(isCached);
      } catch (error) {
        console.error('Error checking if event data is cached:', error);
      }
    };

    checkCachedData();
  }, [eventId]);

  // Auto-prefetch event data when the event is loaded
  useEffect(() => {
    if (!eventId || !enableAutoPrefetch || !onlineManager.isOnline() || isDataCached || isRestoring) return;

    const autoPrefetch = async () => {
      try {
        setIsPrefetching(true);
        if (showNotifications) {
          toast.info('Prefetching event data for offline use...');
        }

        const success = await prefetchEventData(eventId);

        if (success) {
          if (showNotifications) {
            toast.success('Event data prefetched successfully');
          }
          setIsDataCached(true);
          onPrefetchComplete?.(true);
        } else {
          if (showNotifications) {
            toast.error('Failed to prefetch event data');
          }
          onPrefetchComplete?.(false);
        }
      } catch (error: any) {
        console.error('Error prefetching data:', error);
        if (showNotifications) {
          toast.error(`Error prefetching data: ${error.message}`);
        }
        onPrefetchComplete?.(false);
      } finally {
        setIsPrefetching(false);
      }
    };

    autoPrefetch();
  }, [eventId, enableAutoPrefetch, isOnline, isDataCached, showNotifications, onPrefetchComplete, isRestoring]);

  // Function to manually trigger sync
  const sync = useCallback(async () => {
    if (!onlineManager.isOnline()) {
      if (showNotifications) {
        toast.error('Cannot sync while offline. Please connect to the internet and try again.');
      }
      return;
    }

    setIsSyncing(true);
    try {
      if (showNotifications) {
        toast.info('Syncing offline changes...');
      }

      const result = await syncOfflineOperations(queryClient);

      if (result.processed > 0) {
        if (showNotifications) {
          toast.success(`Successfully synced ${result.processed} operations`);
        }
        onSyncComplete?.(true);
      }

      if (result.failed > 0) {
        if (showNotifications) {
          toast.error(`Failed to sync ${result.failed} operations`);
        }
        onSyncComplete?.(false);
      }

      // Update pending operations state
      const stillHasPending = await hasPendingOperations();
      setHasPendingOps(stillHasPending);

      return result;
    } catch (error: any) {
      console.error('Error syncing offline operations:', error);
      if (showNotifications) {
        toast.error(`Error syncing: ${error.message}`);
      }
      onSyncComplete?.(false);
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient, showNotifications, onSyncComplete]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!enableAutoSync || !onlineManager.isOnline() || !wasOffline || isRestoring || isSyncing) return;

    const autoSync = async () => {
      // Set syncing state immediately to prevent multiple sync attempts
      setIsSyncing(true);

      // Double-check if there are pending operations
      try {
        const hasPending = await hasPendingOperations();
        setHasPendingOps(hasPending);

        if (!hasPending) {
          setIsSyncing(false);
          return;
        }
      } catch (error) {
        console.error('Error checking for pending operations:', error);
        setIsSyncing(false);
        return; // Exit early if we can't check for pending operations
      }

      // Now perform the sync
      await sync();
    };

    autoSync();
  }, [enableAutoSync, wasOffline, isRestoring, isSyncing, sync]);

  // Function to manually trigger prefetch
  const prefetch = useCallback(async () => {
    if (!eventId) {
      return false;
    }

    if (!onlineManager.isOnline()) {
      if (showNotifications) {
        toast.error('Cannot prefetch while offline. Please connect to the internet and try again.');
      }
      return false;
    }

    setIsPrefetching(true);
    try {
      if (showNotifications) {
        toast.info('Prefetching event data for offline use...');
      }

      const success = await prefetchEventData(eventId);

      if (success) {
        if (showNotifications) {
          toast.success('Event data prefetched successfully');
        }
        setIsDataCached(true);
        onPrefetchComplete?.(true);
      } else {
        if (showNotifications) {
          toast.error('Failed to prefetch event data');
        }
        onPrefetchComplete?.(false);
      }

      return success;
    } catch (error: any) {
      console.error('Error prefetching data:', error);
      if (showNotifications) {
        toast.error(`Error prefetching data: ${error.message}`);
      }
      onPrefetchComplete?.(false);
      return false;
    } finally {
      setIsPrefetching(false);
    }
  }, [eventId, showNotifications, onPrefetchComplete]);

  return {
    isPrefetching,
    isSyncing,
    hasPendingOps,
    isDataCached,
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    isRestoring,
    prefetch,
    sync,
  };
}