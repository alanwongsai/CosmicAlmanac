// Bump CACHE version whenever app shell files change.
// Example: 'cosmic-v2', 'cosmic-v3', etc.
const CACHE = 'cosmic-v2';

// Keep URLs relative to the Service Worker scope.
// This avoids install failures on GitHub Pages project paths like /StarGate/.
const ASSETS = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './content.en.js',
  './content.zh.js',
  './manifest.json',
  './cosmic-daily-icon-192.png',
  './cosmic-daily-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
