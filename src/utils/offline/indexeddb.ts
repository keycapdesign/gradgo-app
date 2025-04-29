/**
 * IndexedDB utility functions for offline support
 */

// Database configuration
const DB_NAME = 'gradgo-offline-db';
const DB_VERSION = 2; // Increased version to trigger schema update

// Store names
export const STORES = {
  BOOKINGS: 'bookings',
  BOOKING_STATS: 'bookingStats',
  GOWN_STATS: 'gownStats',
  CEREMONIES: 'ceremonies',
  OFFLINE_QUEUE: 'offlineQueue',
  EVENT_DATA: 'eventData',
  GOWNS: 'gowns',
};

/**
 * Initialize the IndexedDB database
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Error opening IndexedDB');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.BOOKINGS)) {
        db.createObjectStore(STORES.BOOKINGS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.BOOKING_STATS)) {
        db.createObjectStore(STORES.BOOKING_STATS, { keyPath: 'eventId' });
      }

      if (!db.objectStoreNames.contains(STORES.GOWN_STATS)) {
        db.createObjectStore(STORES.GOWN_STATS, { keyPath: 'eventId' });
      }

      if (!db.objectStoreNames.contains(STORES.CEREMONIES)) {
        db.createObjectStore(STORES.CEREMONIES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const offlineQueueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, {
          keyPath: 'id',
          autoIncrement: true
        });
        offlineQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
        offlineQueueStore.createIndex('processed', 'processed', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.EVENT_DATA)) {
        db.createObjectStore(STORES.EVENT_DATA, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.GOWNS)) {
        db.createObjectStore(STORES.GOWNS, { keyPath: 'rfid' });
      }
    };
  });
}

/**
 * Get a database connection
 */
export async function getDB(): Promise<IDBDatabase> {
  return initDB();
}

/**
 * Store data in IndexedDB
 * @param storeName The name of the object store
 * @param data The data to store
 */
export async function storeData<T>(storeName: string, data: T): Promise<number | void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onerror = (event) => {
      console.error(`Error storing data in ${storeName}:`, event);
      reject(`Error storing data in ${storeName}`);
    };

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      // Update the ID in the original object if it's an auto-increment field
      if (typeof result === 'number' && data && typeof data === 'object') {
        (data as any).id = result;
        resolve(result); // Return the generated ID
      } else {
        resolve();
      }
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = (event) => {
      console.error(`Transaction error for ${storeName}:`, event);
    };
  });
}

/**
 * Store multiple items in IndexedDB
 * @param storeName The name of the object store
 * @param items Array of items to store
 */
export async function storeMultipleItems<T>(storeName: string, items: T[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    let completed = 0;

    items.forEach((item) => {
      const request = store.put(item);

      request.onerror = (event) => {
        console.error(`Error storing item in ${storeName}:`, event);
        reject(`Error storing item in ${storeName}`);
      };

      request.onsuccess = () => {
        completed++;
        if (completed === items.length) {
          resolve();
        }
      };
    });

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = (event) => {
      console.error(`Transaction error in ${storeName}:`, event);
      reject(`Transaction error in ${storeName}`);
    };
  });
}

/**
 * Retrieve data from IndexedDB
 * @param storeName The name of the object store
 * @param key The key to retrieve
 */
export async function getData<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = (event) => {
      console.error(`Error retrieving data from ${storeName}:`, event);
      reject(`Error retrieving data from ${storeName}`);
    };

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      resolve(result || null);
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = (event) => {
      console.error(`Transaction error for ${storeName}:`, event);
    };
  });
}

/**
 * Retrieve all data from an object store
 * @param storeName The name of the object store
 */
export async function getAllData<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = (event) => {
      console.error(`Error retrieving all data from ${storeName}:`, event);
      reject(`Error retrieving all data from ${storeName}`);
    };

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      resolve(result || []);
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = (event) => {
      console.error(`Transaction error for ${storeName}:`, event);
    };
  });
}

/**
 * Delete data from IndexedDB
 * @param storeName The name of the object store
 * @param key The key to delete
 */
export async function deleteData(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = (event) => {
      console.error(`Error deleting data from ${storeName}:`, event);
      reject(`Error deleting data from ${storeName}`);
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Clear all data from an object store
 * @param storeName The name of the object store
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = (event) => {
      console.error(`Error clearing store ${storeName}:`, event);
      reject(`Error clearing store ${storeName}`);
    };

    request.onsuccess = () => {
      resolve();
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get data by index
 * @param storeName The name of the object store
 * @param indexName The name of the index
 * @param key The key to search for
 */
export async function getDataByIndex<T>(
  storeName: string,
  indexName: string,
  key: IDBValidKey
): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(key);

    request.onerror = (event) => {
      console.error(`Error retrieving data by index from ${storeName}:`, event);
      reject(`Error retrieving data by index from ${storeName}`);
    };

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      resolve(result || []);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}
