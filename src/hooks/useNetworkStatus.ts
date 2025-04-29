/**
 * Hook to monitor network connectivity status using TanStack Query's onlineManager
 */
import { useState, useEffect } from 'react';
import { onlineManager, useIsRestoring } from '@tanstack/react-query';

interface NetworkStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useNetworkStatus(options: NetworkStatusOptions = {}) {
  // Check if we're restoring from query cache
  const isRestoring = useIsRestoring();

  // Track if we were recently offline (for syncing operations)
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  // Get current online status
  const isCurrentlyOnline = onlineManager.isOnline();

  // Debug logging only when status changes
  useEffect(() => {
    console.log(`[NETWORK_DEBUG] useNetworkStatus: isOnline=${isCurrentlyOnline}, isRestoring=${isRestoring}`);
  }, [isCurrentlyOnline, isRestoring]);

  // Subscribe to TanStack Query's online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[NETWORK] Connection restored');
      setWasOffline(true);
      options.onOnline?.();

      // Reset wasOffline after a delay
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 5000);

      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      console.log('[NETWORK] Connection lost');
      options.onOffline?.();
    };

    // Subscribe to TanStack Query's online/offline events
    const unsubscribe = onlineManager.subscribe((online) => {
      if (online) {
        handleOnline();
      } else {
        handleOffline();
      }
    });



    return () => {
      unsubscribe();
    };
  }, [options]);

  const isOnline = isCurrentlyOnline && !isRestoring;
  const isOffline = !isCurrentlyOnline || isRestoring;



  return {
    isOnline,
    isOffline,
    wasOffline,
    isRestoring,
  };
}

/**
 * @deprecated Use useNetworkStatus instead
 */
export function useOfflineMode() {
  const { isOnline, isOffline } = useNetworkStatus();

  return {
    isOnline,
    isOffline,
    isManualOfflineMode: false,
    isOfflineMode: isOffline,
    toggleOfflineMode: () => {
      console.warn('Manual offline mode has been removed. The app now uses TanStack Query\'s onlineManager.');
    },
  };
}
