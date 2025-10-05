const CACHE_NAME = 'phone-lookie-v6';
const urlsToCache = [
    '/',
    '/index.html',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://code.jquery.com/jquery-3.6.0.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // Always fetch JavaScript files from network
    if (event.request.url.endsWith('.js')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    console.error('Failed to fetch:', event.request.url);
                    return new Response('', {
                        status: 404,
                        statusText: 'Not Found'
                    });
                })
        );
        return;
    }

    // For other files, try network first, then cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
}); 