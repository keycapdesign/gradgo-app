import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  enterReturnsModeClient,
  exitReturnsModeClient,
  isInReturnsModeClient
} from '@/utils/returns-mode-client'

/**
 * Hook for managing returns mode state
 */
export function useReturnsMode() {
  const queryClient = useQueryClient()

  // Query to check if user is in returns mode
  const { data, isLoading } = useQuery({
    queryKey: ['returnsMode'],
    queryFn: isInReturnsModeClient,
    // Refresh every minute to ensure state is current
    refetchInterval: 60 * 1000,
  })

  // Mutation to enter returns mode
  const enterReturnsMutation = useMutation({
    mutationFn: enterReturnsModeClient,
    onSuccess: () => {
      // Invalidate the query to refetch the latest state
      queryClient.invalidateQueries({ queryKey: ['returnsMode'] })
    },
  })

  // Mutation to exit returns mode
  const exitReturnsMutation = useMutation({
    mutationFn: exitReturnsModeClient,
    onSuccess: () => {
      // Invalidate the query to refetch the latest state
      queryClient.invalidateQueries({ queryKey: ['returnsMode'] })
    },
    onError: (error) => {
      console.error('[useReturnsMode] Exit mutation failed:', error)
    }
  })

  // Function to enter returns mode
  const enterReturnsMode = useCallback(async () => {
    return enterReturnsMutation.mutateAsync()
  }, [enterReturnsMutation])

  // Function to exit returns mode
  const exitReturnsMode = useCallback(async () => {
    try {
      console.log('[exitReturnsMode] Starting exit process')

      // Create a promise that resolves when the mutation completes or times out
      return await Promise.race([
        exitReturnsMutation.mutateAsync(),
        new Promise<boolean>(resolve => {
          // Set a timeout to resolve the promise after 3 seconds
          // This prevents the user from getting stuck if there's an issue
          setTimeout(() => {
            console.log('[exitReturnsMode] Timeout reached, resolving promise anyway')
            resolve(true)
          }, 3000)
        })
      ])
    } catch (error) {
      console.error('[exitReturnsMode] Error in exitReturnsMode:', error)
      // Return success anyway to prevent the user from getting stuck
      return true
    }
  }, [exitReturnsMutation])

  return {
    isReturnsMode: data || false,
    isLoading,
    enterReturnsMode,
    exitReturnsMode,
    isEntering: enterReturnsMutation.isPending,
    isExiting: exitReturnsMutation.isPending,
    // Expose the mutations directly for more control
    enterReturnsMutation,
    exitReturnsMutation,
  }
}
