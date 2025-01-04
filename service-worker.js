const CACHE_NAME = 'paper-duck-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
];

// Service Worker Kurulumu
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache açıldı');
                return cache.addAll(ASSETS);
            })
            .catch((error) => {
                console.error('Cache yükleme hatası:', error);
            })
    );
});

// Cache Aktivasyonu ve Eski Cache'lerin Temizlenmesi
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Eski cache siliniyor:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
});

// Fetch İsteklerini Yönetme
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache'de varsa cache'den döndür
                if (response) {
                    return response;
                }

                // Cache'de yoksa ağdan al ve cache'e ekle
                return fetch(event.request)
                    .then((response) => {
                        // Geçersiz yanıt veya CORS olmayan istekler için direkt döndür
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Yanıtı cache'e ekle
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Ağ hatası durumunda offline sayfasını göster
                        return caches.match('/offline.html');
                    });
            })
    );
});
