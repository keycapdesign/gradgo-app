import { createServerClient } from '@supabase/ssr'
import { parseCookies, setCookie } from '@tanstack/react-start/server'

/**
 * Creates a Supabase client with the anon key for standard operations
 * This client has the same permissions as an authenticated user
 */
export function createClient() {
  return createServerClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return Object.entries(parseCookies()).map(
          ([name, value]) =>
            ({
              name,
              value,
            }) as { name: string; value: string }
        )
      },
      setAll(cookies) {
        cookies.forEach((cookie) => {
          setCookie(cookie.name, cookie.value)
        })
      },
    },
  })
}

/**
 * Creates a Supabase admin client with the service role key for elevated operations
 * This client bypasses Row Level Security (RLS) and should be used carefully
 * Only use for server-side operations that require admin privileges
 */
export function createAdminClient() {
  return createServerClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return Object.entries(parseCookies()).map(
          ([name, value]) =>
            ({
              name,
              value,
            }) as { name: string; value: string }
        )
      },
      setAll(cookies) {
        cookies.forEach((cookie) => {
          setCookie(cookie.name, cookie.value)
        })
      },
    },
  })
}