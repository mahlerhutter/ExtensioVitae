/**
 * Offline Service
 *
 * Manages service worker registration, offline detection, and sync queue.
 */

// =====================================================
// SERVICE WORKER REGISTRATION
// =====================================================

/**
 * Register service worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            dispatchUpdateEvent();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
  }
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaiting() {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

// =====================================================
// OFFLINE DETECTION
// =====================================================

let isOffline = !navigator.onLine;
const offlineListeners = new Set();

/**
 * Check if currently offline
 */
export function checkOffline() {
  return isOffline;
}

/**
 * Subscribe to online/offline changes
 * @param {Function} callback - Called with (isOffline) when status changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToOfflineStatus(callback) {
  offlineListeners.add(callback);

  // Immediate callback with current status
  callback(isOffline);

  return () => offlineListeners.delete(callback);
}

// Setup listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOffline = false;
    offlineListeners.forEach(cb => cb(false));

    // Trigger background sync
    triggerSync('sync-task-completions');
  });

  window.addEventListener('offline', () => {
    isOffline = true;
    offlineListeners.forEach(cb => cb(true));
  });
}

// =====================================================
// SYNC QUEUE (IndexedDB)
// =====================================================

const DB_NAME = 'extensio-offline';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

/**
 * Open IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Queue a request for later sync
 * @param {Object} requestData - { url, method, headers, body }
 */
export async function queueForSync(requestData) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.add({
        ...requestData,
        timestamp: Date.now()
      });
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });

    console.log('Request queued for sync:', requestData.url);

    // Register for background sync
    triggerSync('sync-task-completions');
  } catch (error) {
    console.error('Failed to queue request:', error);
  }
}

/**
 * Get all queued requests
 */
export async function getQueuedRequests() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get queued requests:', error);
    return [];
  }
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (error) {
    console.error('Failed to clear sync queue:', error);
  }
}

// =====================================================
// BACKGROUND SYNC
// =====================================================

/**
 * Trigger background sync
 */
async function triggerSync(tag) {
  if (!('serviceWorker' in navigator) || !('sync' in window.SyncManager?.prototype || {})) {
    // Fallback: try immediate sync
    await manualSync();
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log('Background sync registered:', tag);
  } catch (error) {
    console.warn('Background sync not available, using fallback:', error);
    await manualSync();
  }
}

/**
 * Manual sync fallback when background sync isn't available
 */
async function manualSync() {
  if (isOffline) return;

  const requests = await getQueuedRequests();
  if (requests.length === 0) return;

  console.log('Running manual sync for', requests.length, 'requests');

  const db = await openDB();

  for (const item of requests) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: typeof item.body === 'string' ? item.body : JSON.stringify(item.body)
      });

      // Remove from queue on success
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(item.id);
      console.log('Synced request:', item.url);
    } catch (error) {
      console.error('Sync failed for:', item.url, error);
    }
  }
}

// =====================================================
// UPDATE NOTIFICATION
// =====================================================

const updateListeners = new Set();

/**
 * Subscribe to app update events
 */
export function subscribeToUpdates(callback) {
  updateListeners.add(callback);
  return () => updateListeners.delete(callback);
}

function dispatchUpdateEvent() {
  updateListeners.forEach(cb => cb());
}

// =====================================================
// CACHE MANAGEMENT
// =====================================================

/**
 * Pre-cache URLs
 */
export function precacheUrls(urls) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      urls
    });
  }
}

/**
 * Clear all cached data
 */
export function clearCache() {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }
}

// =====================================================
// OFFLINE-AWARE FETCH
// =====================================================

/**
 * Fetch with offline fallback
 * Queues requests when offline for later sync
 */
export async function offlineFetch(url, options = {}) {
  if (!isOffline) {
    return fetch(url, options);
  }

  // Queue mutation requests for later
  if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
    await queueForSync({
      url,
      method: options.method,
      headers: options.headers,
      body: options.body
    });

    // Return fake success response
    return new Response(JSON.stringify({ queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // For GET requests, throw offline error
  throw new Error('Network request failed: offline');
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  skipWaiting,
  checkOffline,
  subscribeToOfflineStatus,
  queueForSync,
  getQueuedRequests,
  clearSyncQueue,
  subscribeToUpdates,
  precacheUrls,
  clearCache,
  offlineFetch
};
