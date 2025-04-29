/**
 * Gown cache utilities for offline mode
 * This module provides functions to cache and retrieve gown data for offline use
 */
import { storeData, getData, getAllData, STORES } from './indexeddb';
import { Gown } from '@/types/gown';
import { fetchGownByRfid } from '@/utils/gown-operations';
import { fetchGownsByEvent } from '@/utils/gowns';

/**
 * Fetch and cache gowns for an event
 * @param eventId The event ID
 */
export async function cacheGownsForEvent(eventId: number): Promise<void> {
  try {
    // Fetch gowns for the event
    const gowns = await fetchGownsByEvent({ data: { eventId } });

    if (!gowns || !Array.isArray(gowns)) {
      console.warn(`No gowns found for event ${eventId}`);
      return;
    }

    // Store each gown in IndexedDB
    for (const gown of gowns) {
      await storeData(STORES.GOWNS, gown);
    }
  } catch (error) {
    console.error(`Error caching gowns for event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Check if a gown exists in the cache
 * @param rfid The RFID to check
 */
export async function checkGownExistsInCache(rfid: string): Promise<boolean> {
  console.log(`[OFFLINE_DEBUG] checkGownExistsInCache: Checking if gown with RFID ${rfid} exists in cache`);

  try {
    // Try to get the gown from IndexedDB
    const gown = await getData<Gown>(STORES.GOWNS, rfid);

    return !!gown;
  } catch (error) {
    console.error(`[OFFLINE_DEBUG] checkGownExistsInCache: Error checking if gown exists:`, error);
    return false;
  }
}

/**
 * Get a gown from the cache by RFID
 * @param rfid The RFID to look up
 */
export async function getGownFromCache(rfid: string): Promise<Gown | null> {
  console.log(`[OFFLINE_DEBUG] getGownFromCache: Getting gown with RFID ${rfid} from cache`);

  try {
    // Try to get the gown from IndexedDB
    const gown = await getData<Gown>(STORES.GOWNS, rfid);

    return gown;
  } catch (error) {
    console.error(`[OFFLINE_DEBUG] getGownFromCache: Error getting gown from cache:`, error);
    return null;
  }
}

/**
 * Fetch a gown by RFID and cache it
 * @param rfid The RFID to fetch
 */
export async function fetchAndCacheGown(rfid: string): Promise<Gown | null> {
  console.log(`[OFFLINE_DEBUG] fetchAndCacheGown: Fetching and caching gown with RFID ${rfid}`);

  try {
    // First check if the gown is already in the cache
    const cachedGown = await getGownFromCache(rfid);

    if (cachedGown) {
      console.log(`[OFFLINE_DEBUG] fetchAndCacheGown: Gown with RFID ${rfid} already in cache`);
      return cachedGown;
    }

    // Fetch the gown from the server
    const gown = await fetchGownByRfid({ data: { rfid } });

    if (!gown) {
      console.warn(`[OFFLINE_DEBUG] fetchAndCacheGown: No gown found with RFID ${rfid}`);
      return null;
    }

    // Store the gown in IndexedDB
    await storeData(STORES.GOWNS, gown);

    console.log(`[OFFLINE_DEBUG] fetchAndCacheGown: Successfully cached gown with RFID ${rfid}`);

    return gown;
  } catch (error) {
    console.error(`[OFFLINE_DEBUG] fetchAndCacheGown: Error fetching and caching gown:`, error);
    return null;
  }
}

/**
 * Get all gowns from the cache
 */
export async function getAllGownsFromCache(): Promise<Gown[]> {
  console.log(`[OFFLINE_DEBUG] getAllGownsFromCache: Getting all gowns from cache`);

  try {
    // Get all gowns from IndexedDB
    const gowns = await getAllData<Gown>(STORES.GOWNS);

    console.log(`[OFFLINE_DEBUG] getAllGownsFromCache: Found ${gowns.length} gowns in cache`);

    return gowns;
  } catch (error) {
    console.error(`[OFFLINE_DEBUG] getAllGownsFromCache: Error getting all gowns from cache:`, error);
    return [];
  }
}

/**
 * Update a gown in the cache
 * @param gown The gown to update
 */
export async function updateGownInCache(gown: Gown): Promise<void> {
  try {
    // Store the updated gown in IndexedDB
    await storeData(STORES.GOWNS, gown);
  } catch (error) {
    console.error(`Error updating gown in cache:`, error);
    throw error;
  }
}
