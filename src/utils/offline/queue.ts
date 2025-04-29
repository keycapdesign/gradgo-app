/**
 * Offline operation queue for handling operations while offline
 */
import { storeData, getAllData, getData, deleteData, STORES } from './indexeddb';

// Operation types
export enum OperationType {
  CHECK_OUT_GOWN = 'CHECK_OUT_GOWN',
  CHECK_IN_GOWN = 'CHECK_IN_GOWN',
  UNDO_CHECK_OUT = 'UNDO_CHECK_OUT',
  UNDO_CHECK_IN = 'UNDO_CHECK_IN',
  CHANGE_GOWN = 'CHANGE_GOWN',
}

// Queue item interface
export interface QueueItem {
  id?: number;
  type: OperationType;
  data: any;
  timestamp: number;
  processed: boolean;
  error?: string;
  retryCount: number;
}

// Control flag for debug logging
const DEBUG_LOGGING = false;

// Debug log function
function debugLog(...args: any[]) {
  if (DEBUG_LOGGING) {
    console.log(...args);
  }
}

/**
 * Add an operation to the offline queue
 * @param type The type of operation
 * @param data The operation data
 */
export async function addToQueue(type: OperationType, data: any): Promise<number> {
  try {
    // Check for duplicates first
    const allItems = await getAllData<QueueItem>(STORES.OFFLINE_QUEUE);
    const pendingItems = allItems.filter(item => !item.processed);

    // Check if we already have this exact operation in the queue
    const isDuplicate = pendingItems.some(item => {
      if (item.type !== type) return false;

      // For checkout/checkin operations, check if bookingId and rfid match
      if (
        (type === OperationType.CHECK_OUT_GOWN || type === OperationType.CHECK_IN_GOWN) &&
        item.data.bookingId === data.bookingId &&
        item.data.rfid === data.rfid
      ) {
        return true;
      }

      // For undo operations, check if bookingId matches
      if (
        (type === OperationType.UNDO_CHECK_OUT || type === OperationType.UNDO_CHECK_IN) &&
        item.data.bookingId === data.bookingId
      ) {
        return true;
      }

      // For change gown operations, check if bookingId and newRfid match
      if (
        type === OperationType.CHANGE_GOWN &&
        item.data.bookingId === data.bookingId &&
        item.data.newRfid === data.newRfid
      ) {
        return true;
      }

      return false;
    });

    if (isDuplicate) {
      return -1; // Return -1 to indicate a duplicate was found
    }

    // Create and store the queue item
    const queueItem: QueueItem = {
      type,
      data,
      timestamp: Date.now(),
      processed: false,
      retryCount: 0,
    };

    // Await the id from storeData
    const id = await storeData(STORES.OFFLINE_QUEUE, queueItem) as number;
    if (typeof id === 'number') {
      queueItem.id = id;
      return id;
    } else {
      throw new Error('Failed to get queue item id after storing');
    }
  } catch (error) {
    console.error(`Error adding ${type} operation to queue:`, error);
    throw error;
  }
}

/**
 * Get all pending operations from the queue
 */
export async function getPendingOperations(): Promise<QueueItem[]> {
  const allItems = await getAllData<QueueItem>(STORES.OFFLINE_QUEUE);
  return allItems.filter(item => !item.processed);
}

/**
 * Check if there are pending operations to sync
 */
export async function hasPendingOperations(): Promise<boolean> {
  const pendingOperations = await getPendingOperations();
  return pendingOperations.length > 0;
}

/**
 * Mark an operation as processed
 * @param id The operation ID
 * @param error Optional error message if the operation failed
 */
export async function markAsProcessed(id: number, error?: string): Promise<void> {
  try {
    // Get the item directly using the key
    const item = await getData<QueueItem>(STORES.OFFLINE_QUEUE, id);

    if (item) {
      const updatedItem = {
        ...item,
        processed: true,
        error,
      };

      await storeData(STORES.OFFLINE_QUEUE, updatedItem);
      if (error) {
        console.error(`Marked operation ${id} as processed with error: ${error}`);
      }
    } else {
      console.warn(`Operation ${id} not found when trying to mark as processed`);
    }
  } catch (error) {
    console.error(`Error marking operation ${id} as processed:`, error);
  }
}

/**
 * Increment retry count for an operation
 * @param id The operation ID
 */
export async function incrementRetryCount(id: number): Promise<void> {
  try {
    // Get the item directly using the key
    const item = await getData<QueueItem>(STORES.OFFLINE_QUEUE, id);

    if (item) {
      const updatedItem = {
        ...item,
        retryCount: (item.retryCount || 0) + 1,
      };

      await storeData(STORES.OFFLINE_QUEUE, updatedItem);
    } else {
      console.warn(`Operation ${id} not found when trying to increment retry count`);
    }
  } catch (error) {
    console.error(`Error incrementing retry count for operation ${id}:`, error);
  }
}

/**
 * Remove an operation from the queue
 * @param id The operation ID
 */
export async function removeFromQueue(id: number): Promise<void> {
  await deleteData(STORES.OFFLINE_QUEUE, id);
}

/**
 * Get pending operations for a booking
 * @param bookingId The booking ID
 */
export async function getPendingOperationsForBooking(bookingId: number): Promise<QueueItem[]> {
  try {
    const allItems = await getAllData<QueueItem>(STORES.OFFLINE_QUEUE);

    // Filter for pending operations for this booking
    const pendingItems = allItems.filter(item => {
      const hasData = !!item.data;
      const matchesBookingId = hasData && item.data.bookingId === bookingId;
      // Show if not processed, OR processed with error
      const isErrored = item.processed && !!item.error;
      return ((!item.processed) || isErrored) && hasData && matchesBookingId;
    });

    // Sort by timestamp (newest first)
    pendingItems.sort((a, b) => b.timestamp - a.timestamp);

    return pendingItems;
  } catch (error) {
    console.error(`Error getting pending operations for booking ${bookingId}:`, error);
    return [];
  }
}

/**
 * Get errored operations for a booking
 * @param bookingId The booking ID
 */
export async function getErroredOperationsForBooking(bookingId: number): Promise<QueueItem[]> {
  const allItems = await getAllData<QueueItem>(STORES.OFFLINE_QUEUE);
  const errored = allItems.filter(
    item =>
      item.data?.bookingId === bookingId &&
      item.error &&
      item.processed
  );
  return errored;
}

/**
 * Remove all errored (processed) operations for a specific booking
 */
export async function removeErroredOperationsForBooking(bookingId: number): Promise<void> {
  const allItems = await getAllData<QueueItem>(STORES.OFFLINE_QUEUE);
  const erroredItems = allItems.filter(
    item =>
      item.data?.bookingId === bookingId &&
      item.processed &&
      item.error &&
      item.id
  );
  for (const item of erroredItems) {
    await removeFromQueue(item.id as number);
  }
}

/**
 * Clear all processed operations from the queue
 */
export async function clearProcessedOperations(): Promise<void> {
  try {
    const allItems = await getAllData<QueueItem>(STORES.OFFLINE_QUEUE);

    const processedItems = allItems.filter(item => item.processed && !item.error && item.id);

    for (const item of processedItems) {
      try {
        await removeFromQueue(item.id as number);
      } catch (error) {
        console.error(`Error removing item ${item.id}:`, error);
        // Continue with other items
      }
    }
  } catch (error) {
    console.error('Error clearing processed operations:', error);
  }
}