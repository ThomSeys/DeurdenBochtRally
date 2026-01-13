// Service Worker for offline functionality
// Version number to force updates (increment when you want to bust cache)
const VERSION = '9';
const CACHE_NAME = `ddb-rally-v${VERSION}`;
const RUNTIME_CACHE = `ddb-runtime-v${VERSION}`;
const API_CACHE = `ddb-api-v${VERSION}`;

// Static assets to cache on install
// These key pages will be available offline immediately
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/live-map',
  '/rally',
  '/about',
  '/manifest.json',
  '/offline.html',
];

// API endpoints to pre-cache for offline functionality
const PRECACHE_API_URLS = [
  '/api/rally-zones',
  '/api/check-ins',
  '/api/event-markers',
  '/api/gpx-route',
];

// Install event - cache core assets and API data
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    Promise.all([
      // Cache HTML pages
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.all(
          PRECACHE_URLS.map((url) => 
            fetch(url)
              .then((res) => {
                if (res.ok) {
                  cache.put(url, res);
                  console.log('[SW] Cached page:', url);
                }
              })
              .catch((err) => {
                console.log(`[SW] Could not cache page ${url}:`, err);
              })
          )
        );
      }),
      // Cache API data
      caches.open(API_CACHE).then((cache) => {
        return Promise.all(
          PRECACHE_API_URLS.map((url) =>
            fetch(url)
              .then((res) => {
                if (res.ok) {
                  cache.put(url, res);
                  console.log('[SW] Cached API:', url);
                }
              })
              .catch((err) => {
                console.log(`[SW] Could not cache API ${url}:`, err);
              })
          )
        );
      }),
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate - Version:', VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] Found caches:', cacheNames);
      return Promise.all(
        cacheNames
          .filter((name) => {
            const shouldKeep = name === CACHE_NAME || name === RUNTIME_CACHE || name === API_CACHE;
            if (!shouldKeep) {
              console.log('[SW] Deleting old cache:', name);
            }
            return !shouldKeep;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});


// Fetch event - smart strategy based on file type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests with stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(staleWhileRevalidateAPI(request));
  }

  // Handle navigation (HTML pages) - cache-first so offline pages load from cache
  if (request.mode === 'navigate') {
    return event.respondWith(cacheFirst(request));
  }

  // Handle CSS and JS - network first to get latest styles/scripts
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    return event.respondWith(networkFirstForAssets(request));
  }

  // Cache images and other static assets (cache-first)
  event.respondWith(cacheFirstForAssets(request));
});

// Cache-first strategy for HTML pages
// Always serve from cache if available (for offline support)
// If not cached, fetch from network and cache for next time
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  // Always check cache first
  const cached = await cache.match(request);
  if (cached) {
    console.log('[SW] Serving cached page:', request.url);
    return cached;
  }
  
  // Not cached, fetch from network
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      // Cache successful page responses for offline access
      cache.put(request, response.clone());
      console.log('[SW] Cached page:', request.url);
    }
    return response;
  } catch (error) {
    console.log('[SW] Failed to fetch page and not cached:', request.url);
    // Return a fallback page if neither cache nor network available
    return caches.match('/') || new Response('Page not available', { status: 503 });
  }
}

// Stale-while-revalidate strategy for API calls
// Always return cached data immediately, update in background
async function staleWhileRevalidateAPI(request) {
  const cache = await caches.open(API_CACHE);
  
  // Always check cache first - serve immediately if available
  const cached = await cache.match(request);
  if (cached) {
    // If we have cached data, return it immediately
    // Then fetch fresh data in background and update cache
    fetch(request.clone()).then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
        console.log('[SW] Updated cache for:', request.url);
      }
    }).catch(() => {
      // Silently fail background update if offline
    });
    
    return cached;
  }
  
  // No cache available, must fetch from network
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      // Cache successful API responses
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Network failed and no cache - return empty array fallback
    console.log('[SW] API fetch failed, no cache available:', request.url);
    return new Response(
      JSON.stringify([]),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
}

// Network-first strategy for CSS/JS (so you get latest styles)
async function networkFirstForAssets(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirstForAssets(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Asset not available:', request.url);
    // For images, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ccc" width="100" height="100"/></svg>`,
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// Background sync for offline submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions') {
    event.waitUntil(syncSubmissions());
  }
});

async function syncSubmissions() {
  console.log('[SW] Syncing offline submissions...');
  
  // Get offline submissions from IndexedDB
  const db = await openDB();
  const submissions = await getAllSubmissions(db);
  
  for (const submission of submissions) {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      
      if (response.ok) {
        await deleteSubmission(db, submission.id);
        console.log('[SW] Synced submission:', submission.id);
      }
    } catch (error) {
      console.error('[SW] Failed to sync submission:', error);
    }
  }
}

// IndexedDB helpers (simple implementation)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ddb-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('submissions')) {
        db.createObjectStore('submissions', { keyPath: 'id' });
      }
    };
  });
}

function getAllSubmissions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['submissions'], 'readonly');
    const store = transaction.objectStore('submissions');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteSubmission(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['submissions'], 'readwrite');
    const store = transaction.objectStore('submissions');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
