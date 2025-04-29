/**
 * @deprecated Use useNetworkStatus from useNetworkStatus.ts instead
 */
import { toast } from 'sonner';
import { useNetworkStatus } from './useNetworkStatus';

interface OfflineManagerOptions {
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useOfflineManager(options: OfflineManagerOptions = {}) {
  const { isOnline, isOffline, wasOffline, isRestoring } = useNetworkStatus(options);

  return {
    isOnline,
    isOffline,
    isManualOfflineMode: false,
    isOfflineMode: isOffline,
    wasOffline,
    isRestoring,
    toggleOfflineMode: () => {
      toast.info('Manual offline mode has been removed');
      console.warn('Manual offline mode has been removed. The app now uses TanStack Query\'s onlineManager.');
    },
  };
}
