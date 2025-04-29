/**
 * TanStack Query persistence configuration
 * This enables offline support by persisting queries and mutations to localStorage
 */
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

/**
 * Create a persister that uses localStorage
 */
export function createQueryPersister() {
  // Create a persister that uses localStorage
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'GRADGO_QUERY_CACHE', // Key for localStorage
    throttleTime: 1000, // Only persist at most once per second
    serialize: (data) => JSON.stringify(data),
    deserialize: (data) => JSON.parse(data),
  });

  return persister;
}

/**
 * Configure persistence for the query client
 * @param queryClient The query client to persist
 */
export function setupQueryPersistence(queryClient: QueryClient) {
  if (typeof window === 'undefined') return; // Skip on server

  const persister = createQueryPersister();

  // Set up persistence
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    buster: import.meta.env.VITE_APP_VERSION || 'v1', // Cache buster
    dehydrateOptions: {
      shouldDehydrateMutation: (mutation) => {
        // Only persist mutations with specific keys
        const mutationKey = mutation.options.mutationKey;
        if (!mutationKey) return false;
        
        // Check if it's one of our offline mutations
        const isOfflineMutation = 
          // Check if the mutation key is an array and has the right structure
          Array.isArray(mutationKey) && 
          mutationKey.length > 0 && 
          mutationKey[0] === 'mutations' &&
          mutationKey.length > 2;
        
        return isOfflineMutation;
      },
    },
  });
}
