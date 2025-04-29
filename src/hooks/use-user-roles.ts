import { useQuery } from '@tanstack/react-query'
import { userRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn'

/**
 * Hook to get the current user's roles
 * @returns Object with roles array and helper functions
 */
export function useUserRoles() {
  const { data: roles = [], isLoading, error } = useQuery(userRolesQueryOptions())

  /**
   * Check if the user has a specific role
   * @param roleName The role name to check
   * @returns boolean True if the user has the role
   */
  const hasRole = (roleName: string): boolean => {
    return roles.includes(roleName)
  }

  /**
   * Check if the user has the limited role (returns mode)
   * @returns boolean True if the user is in returns mode
   */
  const isInReturnsMode = (): boolean => {
    return hasRole('limited')
  }

  return {
    roles,
    hasRole,
    isInReturnsMode,
    isLoading,
    error,
  }
}
