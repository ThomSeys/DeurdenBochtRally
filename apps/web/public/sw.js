// Service Worker for offline functionality
// Version number to force updates (increment when you want to bust cache)
const VERSION = '2';
const CACHE_NAME = `ddb-rally-v${VERSION}`;
const RUNTIME_CACHE = `ddb-runtime-v${VERSION}`;
const API_CACHE = `ddb-api-v${VERSION}`;

// Static assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Only cache URLs that actually exist as static files
      return Promise.all(
        PRECACHE_URLS.map((url) => 
          fetch(url)
            .then((res) => {
              if (res.ok) {
                cache.put(url, res);
              }
            })
            .catch((err) => {
              console.log(`[SW] Could not cache ${url}:`, err);
            })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== API_CACHE)
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

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(networkFirstForAPI(request));
  }

  // Handle navigation (HTML pages)
  if (request.mode === 'navigate') {
    return event.respondWith(networkFirstForNav(request));
  }

  // Handle CSS and JS - network first to get latest styles/scripts
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    return event.respondWith(networkFirstForAssets(request));
  }

  // Cache images and other static assets (cache-first)
  event.respondWith(cacheFirstForAssets(request));
});

// Network-first strategy for API calls
async function networkFirstForAPI(request) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return cached API response if offline
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving cached API:', request.url);
      return cached;
    }
    // Return offline error
    return new Response(
      JSON.stringify({ error: 'Offline', offline: true }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Network-first strategy for navigation
async function networkFirstForNav(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return caches.match('/offline.html');
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
