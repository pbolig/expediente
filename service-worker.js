const CACHE_NAME = 'expedientes-cache-v12';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/assets/icon-192.png',
    '/assets/icon-512.png',
    '/js/choices.min.js',
    '/css/choices.min.css',
    '/js/image-compression.js',
    '/js/components/AutocompleteTagger.js',
    '/js/components/ReminderComponent.js',
    '/js/offlineSync.js',
    '/manifest.json',
    '/api/tipos-tramite'
];

// Evento de instalación: Almacena en caché los archivos esenciales
self.addEventListener('install', event => {
    console.log('[SW] Instalando nueva versión...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => {
                // ¡LA CLAVE 1! Fuerza al nuevo SW a activarse inmediatamente
                self.skipWaiting(); 
            })
    );
});

// --- FASE DE ACTIVACIÓN: Limpia los cachés antiguos ---
self.addEventListener('activate', event => {
    console.log('[SW] Activando nueva versión y limpiando cachés antiguos...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => {
                    // Borra cualquier caché que NO sea el actual
                    return name !== CACHE_NAME;
                }).map(name => {
                    console.log(`[SW] Eliminando caché antiguo: ${name}`);
                    return caches.delete(name);
                })
            );
        }).then(() => {
            // ¡LA CLAVE 2! Toma el control de todas las pestañas abiertas
            return self.clients.claim();
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