const CACHE_NAME = 'external-images-v1';
const ALLOWED_HOSTS = ['raw.githubusercontent.com'];

self.addEventListener('install', (event) => {
    // Force this service worker to become the active one, bypassing the waiting state
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Claim any clients immediately, so they don't have to reload to be controlled
    event.waitUntil(clients.claim());
    
    // Clean up old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Check if the request is for one of our allowed external hosts
    if (ALLOWED_HOSTS.includes(url.hostname)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // Return cached response if found
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise, fetch from network
                return fetch(event.request).then((networkResponse) => {
                    // Check if we received a valid response
                    // Note: Opaque responses (type: 'opaque') have status 0, which is fine for images
                    if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
                        return networkResponse;
                    }

                    // Clone the response because it's a stream and can only be consumed once
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                });
            })
        );
    }
});
