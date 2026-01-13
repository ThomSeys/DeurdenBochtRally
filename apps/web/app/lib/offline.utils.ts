/**
 * Offline utilities for handling network requests gracefully
 */

export interface OfflineResponse<T> {
  data: T | null;
  isOffline: boolean;
  isCached: boolean;
}

/**
 * Check if the browser is currently online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Store data in IndexedDB for offline fallback
 */
export async function cacheData(key: string, data: unknown): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    await tx.store.put({
      key,
      data,
      timestamp: Date.now(),
    });
    await tx.done;
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

/**
 * Retrieve cached data from IndexedDB
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') return null;

  try {
    const db = await openDB();
    const cached = await db.get('cache', key);
    return cached ? (cached.data as T) : null;
  } catch (error) {
    console.warn('Failed to retrieve cached data:', error);
    return null;
  }
}

/**
 * Open or create IndexedDB database
 */
function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('DeuerDenBocht', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('submissions')) {
        db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Enhanced fetch that handles offline scenarios
 * Automatically caches successful responses and returns cached data when offline
 */
export async function fetchWithOfflineFallback<T>(
  url: string,
  options?: RequestInit & { cacheKey?: string }
): Promise<OfflineResponse<T>> {
  const cacheKey = options?.cacheKey || url;

  // Check if we're online
  if (!isOnline()) {
    console.warn(`Offline: Attempting to fetch from cache - ${url}`);
    const cached = await getCachedData<T>(cacheKey);
    return {
      data: cached,
      isOffline: true,
      isCached: cached !== null,
    };
  }

  try {
    // We're online, attempt the fetch
    const { cacheKey: _, ...fetchOptions } = options || {};
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as T;

    // Cache successful response
    await cacheData(cacheKey, data);

    return {
      data,
      isOffline: false,
      isCached: false,
    };
  } catch (error) {
    console.error(`Fetch failed: ${url}`, error);

    // Try to return cached data as fallback
    const cached = await getCachedData<T>(cacheKey);
    return {
      data: cached,
      isOffline: false,
      isCached: cached !== null,
    };
  }
}

/**
 * Queue data for submission when offline
 * Will be synced when back online via service worker background sync
 */
export async function queueOfflineSubmission(
  endpoint: string,
  data: unknown,
  method: 'POST' | 'PATCH' | 'PUT' = 'POST'
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    const tx = db.transaction('submissions', 'readwrite');
    await tx.store.add({
      endpoint,
      data,
      method,
      timestamp: Date.now(),
      synced: false,
    });
    await tx.done;

    // Trigger background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-submissions');
    }
  } catch (error) {
    console.error('Failed to queue offline submission:', error);
  }
}

/**
 * Get all queued submissions waiting to be synced
 */
export async function getQueuedSubmissions(): Promise<Array<any>> {
  if (typeof window === 'undefined') return [];

  try {
    const db = await openDB();
    const tx = db.transaction('submissions', 'readonly');
    const allRecords = await tx.store.getAll();
    await tx.done;
    return allRecords.filter(r => !r.synced);
  } catch (error) {
    console.error('Failed to get queued submissions:', error);
    return [];
  }
}

/**
 * Mark a submission as synced
 */
export async function markSubmissionAsSynced(submissionId: number): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openDB();
    const tx = db.transaction('submissions', 'readwrite');
    const record = await tx.store.get(submissionId);
    if (record) {
      record.synced = true;
      await tx.store.put(record);
    }
    await tx.done;
  } catch (error) {
    console.error('Failed to mark submission as synced:', error);
  }
}
