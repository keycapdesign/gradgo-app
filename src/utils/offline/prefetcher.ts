/**
 * Utility to prefetch and cache data for offline use
 */
import { toast } from 'sonner';
import { storeData, storeMultipleItems, getData, getAllData, STORES } from './indexeddb';
import { cacheEventData } from './operations';
import { cacheGownsForEvent } from './gown-cache';
import { fetchEventById } from '@/utils/events';
import { fetchBookingStats, fetchDetailedGownStats, fetchAllEventBookings } from '@/utils/bookings';
import { fetchEventCeremonies } from '@/utils/ceremonies';

/**
 * Prefetch all necessary data for an event
 * @param eventId The event ID to prefetch data for
 */
export async function prefetchEventData(eventId: number): Promise<boolean> {
  if (!eventId) {
    console.error('No event ID provided for prefetching');
    return false;
  }

  try {
    toast.info('Prefetching event data for offline use...');
    console.log(`Prefetching data for event ${eventId}`);

    // Fetch event details
    const event = await fetchEventById({ data: { eventId: String(eventId) } });
    await cacheEventData(eventId, event);

    // Fetch booking statistics
    const bookingStats = await fetchBookingStats({ data: { eventId } });
    await storeData(STORES.BOOKING_STATS, {
      eventId,
      ...bookingStats
    });

    // Fetch detailed gown statistics
    const gownStats = await fetchDetailedGownStats({ data: { eventId } });
    await storeData(STORES.GOWN_STATS, {
      eventId,
      ...gownStats
    });

    // Fetch all bookings for the event
    const bookings = await fetchAllEventBookings({
      data: { eventId, sortBy: 'created_at', sortDirection: 'desc' }
    });
    await storeMultipleItems(STORES.BOOKINGS, bookings);

    // Fetch ceremonies for the event (optional)
    try {
      const ceremonies = await fetchEventCeremonies({ data: { eventId } });
      if (ceremonies && ceremonies.length > 0) {
        await storeMultipleItems(STORES.CEREMONIES, ceremonies);
      }
    } catch (error) {
      console.warn(`Could not fetch ceremonies for event ${eventId}:`, error);
      // Continue without ceremonies - they're optional
    }

    // Fetch gowns for the event (optional)
    try {
      console.log(`Prefetching gowns for event ${eventId}`);
      // Make sure to pass the eventId in the correct format
      await cacheGownsForEvent(eventId);
      console.log(`Successfully prefetched gowns for event ${eventId}`);
    } catch (error) {
      console.warn(`Could not fetch gowns for event ${eventId}:`, error);
      // Continue without gowns - they're optional
    }

    console.log(`Successfully prefetched data for event ${eventId}`);
    toast.success('Event data prefetched successfully for offline use');
    return true;
  } catch (error: any) {
    console.error(`Error prefetching data for event ${eventId}:`, error);
    toast.error(`Failed to prefetch event data: ${error.message}`);
    return false;
  }
}

/**
 * Check if event data is already cached
 * @param eventId The event ID to check
 */
export async function isEventDataCached(eventId: number): Promise<boolean> {
  try {
    // Check if we have the event data cached
    const event = await getData(STORES.EVENT_DATA, eventId);
    if (!event) return false;

    // Check if we have bookings cached
    const bookings = await getAllData<any>(STORES.BOOKINGS);
    const eventBookings = bookings.filter((booking: any) =>
      booking.event === eventId ||
      (booking.event && typeof booking.event === 'object' && booking.event.id === eventId)
    );

    if (eventBookings.length === 0) return false;

    return true;
  } catch (error) {
    console.error(`Error checking if event ${eventId} is cached:`, error);
    return false;
  }
}
