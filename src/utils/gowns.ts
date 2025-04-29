/**
 * Gown-related server functions
 */
import { createServerFn } from '@tanstack/react-start';
import { createClient as createServerClient } from '@/utils/supabase/server';

/**
 * Fetch all gowns for an event
 */
export const fetchGownsByEvent = createServerFn({ method: 'GET' })
  .validator((data: { eventId: number }) => ({
    eventId: data.eventId,
  }))
  .handler(async (ctx) => {
    const { eventId } = ctx.data;
    console.log(`Fetching gowns for event ${eventId}`);
    const supabase = createServerClient();

    // First, get all bookings for this event to find the EANs
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('booking_ean')
      .eq('event', eventId)
      .not('booking_ean', 'is', null);

    if (bookingsError) {
      console.error(`Error fetching bookings: ${bookingsError.message}`);
      throw new Error(`Error fetching bookings: ${bookingsError.message}`);
    }

    // Extract unique EANs
    const eans = [...new Set(bookings.map((b) => b.booking_ean).filter(Boolean))];

    if (eans.length === 0) {
      console.log(`No EANs found for event ${eventId}`);
      return [];
    }

    // Now fetch all gowns that match these EANs
    const { data: gowns, error: gownsError } = await supabase
      .from('gowns')
      .select('*')
      .in('ean', eans);

    if (gownsError) {
      console.error(`Error fetching gowns: ${gownsError.message}`);
      throw new Error(`Error fetching gowns: ${gownsError.message}`);
    }

    console.log(`Found ${gowns.length} gowns for event ${eventId}`);
    return gowns;
  });
