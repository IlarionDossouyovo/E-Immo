/**
 * E-Immo Platform - Service Worker
 * PWA Functionality: Offline support, Caching, Push Notifications
 */

const CACHE_NAME = 'eimmo-v1';
const STATIC_CACHE = 'eimmo-static-v1';
const DYNAMIC_CACHE = 'eimmo-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/listings.html',
  '/dashboard.html',
  '/css/styles.css',
  '/company.css',
  '/js/platform.js',
  '/js/auth.js',
  '/js/client.js',
  '/js/search.js',
  '/js/payment.js',
  '/js/ai.js',
  '/manifest.json',
  '/assets/logo-icon.svg',
  '/assets/logo-main.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.log('[SW] Cache error:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
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
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Network first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache first for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale-while-revalidate for pages
  event.respondWith(staleWhileRevalidate(request));
});

// Cache first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise || new Response('Offline', { status: 503 });
}

// Check if request is for static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data?.json() || {
    title: 'E-Immo',
    body: 'Nouvelle notification',
    icon: '/assets/logo-icon.svg'
  };

  const options = {
    body: data.body,
    icon: data.icon || '/assets/logo-icon.svg',
    badge: '/assets/logo-icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'view', title: 'Voir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
  
  if (event.tag === 'sync-searches') {
    event.waitUntil(syncSearches());
  }
});

// Sync favorites
async function syncFavorites() {
  // Get favorites from IndexedDB and sync to server
  console.log('[SW] Syncing favorites...');
}

// Sync searches
async function syncSearches() {
  // Get saved searches and sync to server
  console.log('[SW] Syncing searches...');
}

// Message handler
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});

console.log('[SW] Service Worker loaded');