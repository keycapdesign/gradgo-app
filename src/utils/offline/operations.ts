/**
 * Offline versions of critical operations
 */
import { storeData, getData, getAllData, STORES } from './indexeddb';
import { emitOfflineEvent, OfflineEventType } from './event-emitter';
import { Booking } from '@/types/booking';
import { BookingStats } from '@/types/booking-stats';
import { Event } from '@/types/event';
import { Gown } from '@/types/gown';

/**
 * Update booking stats in offline mode
 */
async function updateOfflineBookingStats(eventId: number): Promise<void> {
  try {
    // Get all bookings for this event
    const allBookings = await getAllData<Booking>(STORES.BOOKINGS);
    const eventBookings = allBookings.filter(booking =>
      booking.event === eventId ||
      (booking.event && typeof booking.event === 'object' && booking.event.id === eventId)
    );

    // Calculate stats
    const totalCount = eventBookings.length;
    const collectedCount = eventBookings.filter(b => b.booking_status === 'collected').length;
    const returnedCount = eventBookings.filter(b => b.booking_status === 'returned').length;
    const lateCount = eventBookings.filter(b => b.booking_status === 'late').length;
    const purchaseCount = eventBookings.filter(b => b.order_type === 'PURCHASE').length;

    // Update stats in IndexedDB
    const stats: BookingStats = {
      eventId,
      total_count: totalCount,
      collected_count: collectedCount,
      returned_count: returnedCount,
      late_count: lateCount,
      purchase_count: purchaseCount,
      _offlineUpdated: true
    };

    await storeData(STORES.BOOKING_STATS, stats);
    console.log('Updated offline booking stats for event', eventId, stats);

    // Emit event for UI updates
    emitOfflineEvent(OfflineEventType.STATS_UPDATED, stats);
  } catch (error) {
    console.error('Error updating offline booking stats:', error);
  }
}

/**
 * Fetch booking by ID in offline mode
 */
export async function offlineFetchBookingById(data: { bookingId: number }): Promise<Booking> {
  console.log('Fetching booking in offline mode:', data);

  try {
    const booking = await getData<Booking>(STORES.BOOKINGS, data.bookingId);

    if (!booking) {
      throw new Error(`Booking with ID ${data.bookingId} not found in offline storage`);
    }

    return booking;
  } catch (error) {
    console.error('Error fetching booking in offline mode:', error);
    throw error;
  }
}

/**
 * Fetch booking stats in offline mode
 */
export async function offlineFetchBookingStats(data: { eventId: number }): Promise<BookingStats> {
  console.log('Fetching booking stats in offline mode:', data);

  try {
    const stats = await getData<BookingStats>(STORES.BOOKING_STATS, data.eventId);

    if (!stats) {
      // If no stats exist, calculate them
      await updateOfflineBookingStats(data.eventId);
      const newStats = await getData<BookingStats>(STORES.BOOKING_STATS, data.eventId);
      if (!newStats) {
        throw new Error(`Could not calculate booking stats for event ${data.eventId}`);
      }
      return newStats;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching booking stats in offline mode:', error);
    throw error;
  }
}

/**
 * Fetch all bookings for an event in offline mode
 */
export async function offlineFetchAllEventBookings(data: {
  eventId: number,
  sortBy?: string,
  sortDirection?: 'asc' | 'desc'
}): Promise<Booking[]> {
  console.log('Fetching all event bookings in offline mode:', data);

  try {
    const allBookings = await getAllData<Booking>(STORES.BOOKINGS);
    const eventBookings = allBookings.filter(booking =>
      booking.event === data.eventId ||
      (booking.event && typeof booking.event === 'object' && booking.event.id === data.eventId)
    );

    // Sort the bookings
    const sortBy = data.sortBy || 'created_at';
    const sortDirection = data.sortDirection || 'desc';

    eventBookings.sort((a, b) => {
      const aValue = a[sortBy as keyof Booking];
      const bValue = b[sortBy as keyof Booking];

      if (aValue === bValue) return 0;

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

    return eventBookings;
  } catch (error) {
    console.error('Error fetching all event bookings in offline mode:', error);
    throw error;
  }
}

/**
 * Cache event data for offline use
 */
export async function cacheEventData(eventId: number, eventData: Event): Promise<void> {
  console.log('Caching event data for offline use:', eventId);

  try {
    await storeData(STORES.EVENT_DATA, {
      ...eventData,
      cachedAt: Date.now()
    });
  } catch (error) {
    console.error('Error caching event data:', error);
    throw error;
  }
}

/**
 * Get cached event data
 */
export async function getCachedEventData(eventId: number): Promise<Event | null> {
  console.log('Getting cached event data:', eventId);

  try {
    return await getData<Event>(STORES.EVENT_DATA, eventId);
  } catch (error) {
    console.error('Error getting cached event data:', error);
    throw error;
  }
}

/**
 * Fetch gown by RFID in offline mode
 */
export async function offlineFetchGownByRfid(data: { rfid: string }): Promise<Gown | null> {
  console.log('[OFFLINE_DEBUG] Starting offlineFetchGownByRfid with RFID:', data.rfid);

  try {
    // Get all bookings to find the one with this gown RFID
    console.log('[OFFLINE_DEBUG] Fetching all bookings from IndexedDB');
    const allBookings = await getAllData<Booking>(STORES.BOOKINGS);
    console.log('[OFFLINE_DEBUG] Retrieved', allBookings.length, 'bookings from IndexedDB');

    // Find a booking with this gown RFID
    console.log('[OFFLINE_DEBUG] Searching for booking with gown RFID:', data.rfid);
    const bookingWithGown = allBookings.find(booking => {
      const hasGown = !!booking.gown;
      const rfidMatches = hasGown && booking.gown?.rfid === data.rfid;
      console.log('[OFFLINE_DEBUG] Checking booking ID:', booking.id, 'Has gown:', hasGown, 'RFID matches:', rfidMatches);
      return rfidMatches;
    });

    if (bookingWithGown && bookingWithGown.gown) {
      console.log('[OFFLINE_DEBUG] Found gown in booking:', bookingWithGown.id, 'Gown details:', bookingWithGown.gown);
      return bookingWithGown.gown;
    }

    console.log('[OFFLINE_DEBUG] No gown found with RFID:', data.rfid);
    return null;
  } catch (error) {
    console.error('[OFFLINE_DEBUG] Error fetching gown by RFID in offline mode:', error);
    console.error('[OFFLINE_DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}
