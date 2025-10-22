const CACHE_NAME = 'expedientes-cache-v10';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

// Evento de instalación: Almacena en caché los archivos esenciales
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caché abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento de fetch (petición): Sirve los archivos desde el caché si están disponibles
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si el archivo está en caché, lo devuelve
                if (response) {
                    return response;
                }
                // Si no, realiza la petición de red
                return fetch(event.request);
            })
    );
});