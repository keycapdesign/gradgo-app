import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { Database } from '@/types/database.types';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Define types using Supabase generated types
type ContactWithRecentBooking = Database['public']['Views']['contacts_with_recent_booking']['Row'];

/**
 * Fetches contact data with the most recent booking from the contacts_with_recent_booking view
 * @returns Promise<ContactWithRecentBooking | null> The contact data or null if not found
 */
export const fetchStudentContact = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const supabase = createServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log(
        '[fetchStudentContact] No authenticated user found or error:',
        userError?.message
      );
      return null;
    }

    // Fetch contact data from the contacts_with_recent_booking view
    const { data: contact, error } = await supabase
      .from('contacts_with_recent_booking')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[fetchStudentContact] Error fetching contact data:', error.message);
      return null;
    }

    console.log(`[fetchStudentContact] Found contact for user ${user.id}:`, {
      id: contact.contact_id,
      name: contact.full_name,
      booking_id: contact.booking_id,
    });

    return contact as ContactWithRecentBooking;
  } catch (error) {
    console.error('[fetchStudentContact] Unexpected error:', error);
    return null;
  }
});

/**
 * TanStack Query options for fetching student contact data
 */
export const studentContactQueryOptions = () =>
  queryOptions({
    queryKey: ['student', 'contact'],
    queryFn: () => fetchStudentContact(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

// Export the type for use in components
export type { ContactWithRecentBooking };
