// Fantasy.AI Service Worker - PWA Support
const CACHE_NAME = 'fantasy-ai-v1.0.0';
const OFFLINE_URL = '/offline';

// Assets to cache for offline support
const CACHE_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/',
  '/_next/static/js/',
  // Add app icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🚀 Fantasy.AI Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Fantasy.AI Service Worker activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return cached response or offline message for API failures
          return new Response(
            JSON.stringify({ error: 'You are offline', offline: true }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }

  // Handle page requests
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(event.request, networkResponse.clone()));
              }
            })
            .catch(() => {
              // Network failed, cached version is still good
            });
          
          return cachedResponse;
        }

        // Try network first for new requests
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed and no cache - show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // For other resources, return a basic offline response
            return new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
      })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  let notificationData = {
    title: 'Fantasy.AI',
    body: 'You have a new fantasy update!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'fantasy-update',
    data: {
      url: '/dashboard'
    }
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  // Show notification with custom actions
  const notificationOptions = {
    ...notificationData,
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if Fantasy.AI is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            return client.navigate(urlToOpen);
          }
        }
        
        // Open new window if not already open
        return clients.openWindow(urlToOpen);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'lineup-sync') {
    event.waitUntil(syncLineupChanges());
  } else if (event.tag === 'wager-sync') {
    event.waitUntil(syncWagerActions());
  }
});

// Sync functions for offline actions
async function syncLineupChanges() {
  try {
    // Get pending lineup changes from IndexedDB
    const pendingChanges = await getFromIndexedDB('pendingLineupChanges');
    
    for (const change of pendingChanges) {
      await fetch('/api/lineup/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change)
      });
    }
    
    // Clear synced changes
    await clearFromIndexedDB('pendingLineupChanges');
    console.log('✅ Lineup changes synced');
  } catch (error) {
    console.error('❌ Failed to sync lineup changes:', error);
  }
}

async function syncWagerActions() {
  try {
    // Get pending wager actions from IndexedDB
    const pendingWagers = await getFromIndexedDB('pendingWagers');
    
    for (const wager of pendingWagers) {
      await fetch('/api/wagers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wager)
      });
    }
    
    // Clear synced wagers
    await clearFromIndexedDB('pendingWagers');
    console.log('✅ Wager actions synced');
  } catch (error) {
    console.error('❌ Failed to sync wager actions:', error);
  }
}

// IndexedDB helpers for offline storage
function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FantasyAI', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => resolve(getRequest.result || []);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

function clearFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FantasyAI', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Handle app update prompts
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🎯 Fantasy.AI Service Worker loaded successfully');