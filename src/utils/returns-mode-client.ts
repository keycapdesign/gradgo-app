import { createClient } from '@/utils/supabase/client'

/**
 * Client-side utility for managing returns mode
 * This file contains functions that should only be used in client-side code
 */

/**
 * Enter returns mode by assigning the limited role to the current user
 * @returns Promise<boolean> True if successful, false otherwise
 */
export async function enterReturnsModeClient(): Promise<boolean> {
  try {
    console.log('[enterReturnsModeClient] Entering returns mode...')
    const supabase = createClient()
    
    // Call the RPC function to enter returns mode
    const { data, error } = await supabase.rpc('enter_returns_mode')
    
    if (error) {
      console.error('[enterReturnsModeClient] Error entering returns mode:', error)
      return false
    }
    
    console.log('[enterReturnsModeClient] Successfully entered returns mode, result:', data)
    return true
  } catch (error) {
    console.error('[enterReturnsModeClient] Error in enterReturnsModeClient:', error)
    return false
  }
}

/**
 * Exit returns mode by removing the limited role from the current user
 * @returns Promise<boolean> True if successful, false otherwise
 */
export async function exitReturnsModeClient(): Promise<boolean> {
  try {
    console.log('[exitReturnsModeClient] Exiting returns mode...')
    const supabase = createClient()
    
    // Call the RPC function to exit returns mode
    const { data, error } = await supabase.rpc('exit_returns_mode')
    
    if (error) {
      console.error('[exitReturnsModeClient] Error exiting returns mode:', error)
      return false
    }
    
    console.log('[exitReturnsModeClient] Successfully exited returns mode, result:', data)
    return true
  } catch (error) {
    console.error('[exitReturnsModeClient] Error in exitReturnsModeClient:', error)
    return false
  }
}

/**
 * Check if the current user is in returns mode (has the limited role)
 * @returns Promise<boolean> True if the user is in returns mode, false otherwise
 */
export async function isInReturnsModeClient(): Promise<boolean> {
  try {
    console.log('[isInReturnsModeClient] Checking if user is in returns mode...')
    const supabase = createClient()
    
    // Call the RPC function to check if the user is in returns mode
    const { data, error } = await supabase.rpc('is_in_returns_mode')
    
    if (error) {
      console.error('[isInReturnsModeClient] Error checking returns mode:', error)
      return false
    }
    
    console.log('[isInReturnsModeClient] Returns mode check result:', data)
    return !!data
  } catch (error) {
    console.error('[isInReturnsModeClient] Error in isInReturnsModeClient:', error)
    return false
  }
}
