// Service Worker - Network-first strategy (no offline support needed)
const VERSION = '10';
const CACHE_NAME = `ddb-rally-v${VERSION}`;

// Install event - skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate - Version:', VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first for everything
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Network first for all requests
  event.respondWith(networkFirst(request));
});

// Network-first strategy - always try network first
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses for debugging
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network request failed:', request.url, error);
    // No offline fallback - just fail the request
    throw error;
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    console.log('[SW] Push event with no data');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-96.png',
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    };

    console.log('[SW] Showing notification:', { title: data.title, ...options });
    
    // Notify all open clients about the new notification
    const notificationData = {
      title: data.title || 'Notificatie',
      body: data.body || '',
      tag: data.tag || 'default',
      timestamp: Date.now(),
    };

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(data.title || 'Notificatie', options),
        // Notify all open clients
        self.clients.matchAll({ type: 'window' }).then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({
              type: 'PUSH_RECEIVED',
              notification: notificationData,
            });
          });
        }),
      ])
    );
  } catch (error) {
    console.error('[SW] Error handling push notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag, 'action:', event.action);
  event.notification.close();

  // Handle action button clicks
  if (event.action === 'dismiss') {
    // Just close the notification, no navigation
    return;
  }

  // Store notification in sessionStorage so app can display it
  const notificationData = {
    title: event.notification.title,
    body: event.notification.body,
    tag: event.notification.tag,
    data: event.notification.data,
    timestamp: Date.now(),
  };

  // Determine target URL based on notification type or action
  let targetUrl = '/';
  if (event.notification.data?.url) {
    targetUrl = event.notification.data.url;
  } else if (event.action === 'view' && event.notification.data?.type === 'emergency_sos') {
    targetUrl = '/admin/emergency-alerts';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if window is already open
      for (const client of clientList) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          // Send notification data to existing client
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notification: notificationData,
            targetUrl: targetUrl,
          });
          return client.focus();
        }
      }
      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(targetUrl + '?notification=' + encodeURIComponent(JSON.stringify(notificationData)));
      }
    })
  );
});

// Handle notification close (optional)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

