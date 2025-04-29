/**
 * Offline sync manager for processing the operation queue when coming back online
 */
import { QueryClient } from '@tanstack/react-query';
import { getPendingOperations, markAsProcessed, incrementRetryCount, OperationType, hasPendingOperations, clearProcessedOperations } from './queue';
import { emitOfflineEvent, OfflineEventType } from './event-emitter';
import { checkOutGown, checkInGown, undoCheckout, undoCheckin } from '@/utils/gown-operations';

// Re-export the hasPendingOperations function
export { hasPendingOperations };

// Maximum number of retry attempts
const MAX_RETRY_ATTEMPTS = 3;

// Sync status
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

// Sync result
export interface SyncResult {
  status: SyncStatus;
  processed: number;
  failed: number;
  total: number;
  errors: string[];
  processedBookingIds: number[]; // Track which bookings were processed
}

/**
 * Process the offline operation queue
 */
export async function syncOfflineOperations(queryClient?: QueryClient): Promise<SyncResult> {
  const result: SyncResult = {
    status: SyncStatus.SYNCING,
    processed: 0,
    failed: 0,
    total: 0,
    errors: [],
    processedBookingIds: [], // Keep track of which bookings were processed
  };

  try {
    // Clear any processed operations first to avoid potential duplicates
    await clearProcessedOperations();

    // Get all pending operations
    const pendingOperations = await getPendingOperations();

    // Sort operations by timestamp to ensure proper order
    pendingOperations.sort((a, b) => a.timestamp - b.timestamp);

    result.total = pendingOperations.length;

    if (pendingOperations.length === 0) {
      result.status = SyncStatus.COMPLETED;
      return result;
    }

    // Process each operation
    for (const operation of pendingOperations) {
      try {
        // Skip operations that have exceeded the retry limit
        if (operation.retryCount >= MAX_RETRY_ATTEMPTS) {
          console.warn(`Operation ${operation.id} has exceeded retry attempts`);
          await markAsProcessed(operation.id as number, 'Exceeded maximum retry attempts');
          result.failed++;
          result.errors.push(`Operation ${operation.id} (${operation.type}): Exceeded maximum retry attempts`);
          continue;
        }

        // Check if this operation might conflict with a previous one
        // For example, if we're trying to check out a gown that's already been checked out
        if (operation.type === OperationType.CHECK_OUT_GOWN) {
          // Check if the gown is already checked out in a previous operation
          const rfid = operation.data.rfid;
          const isAlreadyProcessed = pendingOperations
            .filter(op => op.id !== operation.id) // Exclude current operation
            .filter(op => op.type === OperationType.CHECK_OUT_GOWN) // Only check checkout operations
            .filter(op => op.data.rfid === rfid) // Same RFID
            .some(op => op.processed); // Already processed

          if (isAlreadyProcessed) {
            await markAsProcessed(operation.id as number, 'Gown already processed in previous operation');
            result.failed++;
            result.errors.push(`Operation ${operation.id} (${operation.type}): Gown already processed`);
            continue;
          }
        }

        // Get the booking ID before marking as processed
        const bookingId = operation.data?.bookingId;
        if (bookingId && !result.processedBookingIds.includes(bookingId)) {
          result.processedBookingIds.push(bookingId);
        }

        // Mark the operation as processed before executing it to prevent duplicates
        try {
          await markAsProcessed(operation.id as number);
        } catch (markError) {
          console.error(`Error marking operation ${operation.id} as processed:`, markError);
          // Continue with execution anyway
        }

        try {
          // Process the operation based on its type
          switch (operation.type) {
            case OperationType.CHECK_OUT_GOWN:
              await checkOutGown({ data: operation.data });
              break;

            case OperationType.CHECK_IN_GOWN:
              await checkInGown({ data: operation.data });
              break;

            case OperationType.UNDO_CHECK_OUT:
              await undoCheckout({ data: operation.data });
              break;

            case OperationType.UNDO_CHECK_IN:
              await undoCheckin({ data: operation.data });
              break;

            case OperationType.CHANGE_GOWN:
              // For gown changes, we need to check in the old gown and check out the new one
              await checkInGown({
                data: {
                  bookingId: operation.data.bookingId,
                  rfid: operation.data.oldRfid,
                  skipRfidCheck: true
                }
              });
              await checkOutGown({
                data: {
                  bookingId: operation.data.bookingId,
                  rfid: operation.data.newRfid,
                  ean: operation.data.ean
                }
              });
              break;

            default:
              throw new Error(`Unknown operation type: ${operation.type}`);
          }

          result.processed++;
        } catch (error) {
          // If there's an error, we'll handle it in the outer catch block
          // We'll re-throw it to be caught by the outer catch block
          throw error;
        }
      } catch (error: any) {
        console.error(`Error processing operation ${operation.id} (${operation.type}):`, error);

        // Check if this is a permanent error that shouldn't be retried
        const isPermanentError =
          error.message.includes('already checked out') ||
          error.message.includes('not found') ||
          error.message.includes('invalid') ||
          error.message.includes('does not exist');

        if (isPermanentError) {
          // Mark as processed with error to prevent further retries
          await markAsProcessed(operation.id as number, error.message);
        } else {
          // Increment retry count for temporary errors
          await incrementRetryCount(operation.id as number);
        }

        result.failed++;
        result.errors.push(`Operation ${operation.id} (${operation.type}): ${error.message}`);
      }
    }

    // Clear processed operations again to ensure clean state
    await clearProcessedOperations();

    // If we have a query client, invalidate the relevant queries
    if (queryClient && result.processedBookingIds.length > 0) {
      // Invalidate each booking's pending operations query
      result.processedBookingIds.forEach(bookingId => {
        queryClient.invalidateQueries({ queryKey: ['pendingOperation', bookingId] });
      });
      // Also invalidate all pendingOperation queries to ensure UI refresh
      queryClient.invalidateQueries({ queryKey: ['pendingOperation'] });
      // Invalidate general queries
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] });
    }

    result.status = SyncStatus.COMPLETED;

    // Emit sync completed event
    emitOfflineEvent(OfflineEventType.SYNC_COMPLETED, result);

    return result;
  } catch (error: any) {
    console.error('Error syncing offline operations:', error);
    result.status = SyncStatus.ERROR;
    result.errors.push(`Sync error: ${error.message}`);
    return result;
  }
}