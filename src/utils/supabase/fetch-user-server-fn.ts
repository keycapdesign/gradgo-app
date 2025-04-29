import { createServerFn } from '@tanstack/react-start'
import { fetchUserWithRoles, SSRSafeUser } from './fetch-user-roles-server-fn'

/**
 * Fetches the current authenticated user with their roles
 * @returns Promise<SSRSafeUser | null> The user with roles or null if not authenticated
 * @deprecated Use fetchUserWithRoles instead
 */
export const fetchUser: () => Promise<SSRSafeUser | null> = createServerFn({
  method: 'GET',
}).handler(async () => {
  // Simply delegate to fetchUserWithRoles
  return fetchUserWithRoles()
})
