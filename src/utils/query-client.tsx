import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useEffect } from 'react'

// Create a client with offline support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (longer for offline support)
      retry: 1
    },
  },
})

export function TanstackQueryProvider({ children }: { children: ReactNode }) {
  // Initialize service worker when the app loads
  useEffect(() => {
    // Only run in the browser
    if (typeof window !== 'undefined') {
      import('../utils/offline/service-worker').then(({ initServiceWorker }) => {
        initServiceWorker()
      })
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
