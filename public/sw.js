/**
 * ExtensioVitae Service Worker
 *
 * Provides offline support, caching, and push notifications.
 */

const CACHE_NAME = 'extensio-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// API routes to cache responses
const API_CACHE_ROUTES = [
  '/rest/v1/module_definitions',
  '/rest/v1/biomarker_references'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin) &&
      !url.origin.includes('supabase')) {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/functions/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - cache first
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache-first strategy for static assets
 */
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline fallback if available
    return caches.match('/offline.html') || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Network-first strategy for API requests
 */
async function networkFirstStrategy(request) {
  const url = new URL(request.url);
  const shouldCache = API_CACHE_ROUTES.some(route => url.pathname.includes(route));

  try {
    const response = await fetch(request);

    // Cache successful GET responses for specific routes
    if (response.ok && shouldCache) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Try to serve from cache if network fails
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving cached API response:', request.url);
      return cached;
    }

    // Return error response
    return new Response(JSON.stringify({
      error: 'Network error',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || data.body_de,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: data.tag || 'extensio-notification',
    data: {
      url: data.action_url || '/'
    },
    actions: data.actions || [],
    vibrate: [100, 50, 100]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || data.title_de, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync for offline task completions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-task-completions') {
    event.waitUntil(syncTaskCompletions());
  }
});

/**
 * Sync queued task completions when back online
 */
async function syncTaskCompletions() {
  try {
    // Get queued completions from IndexedDB
    const db = await openDB();
    const tx = db.transaction('sync-queue', 'readonly');
    const store = tx.objectStore('sync-queue');
    const items = await store.getAll();

    for (const item of items) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: JSON.stringify(item.body)
        });

        // Remove from queue on success
        const deleteTx = db.transaction('sync-queue', 'readwrite');
        deleteTx.objectStore('sync-queue').delete(item.id);
      } catch (error) {
        console.error('[SW] Sync failed for item:', item.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

/**
 * Open IndexedDB for sync queue
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('extensio-sw', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return caches.open(CACHE_NAME);
      })
    );
  }
});

console.log('[SW] Service Worker loaded');
