import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { DefaultCatchBoundary } from './components/default-catch-boundary'
import { NotFound } from './components/not-found'
import { routeTree } from './routeTree.gen'
import { initializeMutationDefaults } from './utils/offline/mutation-handler'
import { setupQueryPersistence } from './utils/query-persistence'

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours (longer for offline support)
        retry: 1
      },
      mutations: {
        // When offline, mutations will be paused
        networkMode: 'online'
      }
    },
  })

  // Initialize mutation defaults for offline support
  initializeMutationDefaults(queryClient)

  // Set up query persistence for offline support
  if (typeof window !== 'undefined') {
    setupQueryPersistence(queryClient)
  }

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient },
      defaultPreload: 'intent',
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
    }),
    queryClient,
  )
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}