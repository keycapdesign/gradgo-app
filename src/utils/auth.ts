import { createServerFn } from '@tanstack/react-start'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Server function to check if an email exists in the contacts table
 */
export const checkEmailExists = createServerFn({ method: 'POST' })
  .validator((data: { email: string }) => ({
    email: data.email.toLowerCase()
  }))
  .handler(async (ctx) => {
    const { email } = ctx.data
    const supabase = createAdminClient()
    console.log('Checking email:', email)
    try {
      // Check if the email exists in the contacts table
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('id, email')
        .eq('email', email)
        .maybeSingle()

      if (error) {
        console.error('Error checking email:', error)
        throw new Error(`Error checking email: ${error.message}`)
      }

      return {
        exists: !!contact,
        contactId: contact?.id || null
      }
    } catch (error: any) {
      console.error('Error in checkEmailExists:', error)
      throw error
    }
  })
