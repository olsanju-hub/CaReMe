// Solo cachea recursos estáticos: nunca guarda información introducida en formularios.
// El símbolo SVG incluido es provisional; el icono aprobado en la conversación aún debe subirse.
const CACHE_PREFIX = 'cahreme-shell-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = CACHE_PREFIX + 'v0-73';
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/app.mjs",
  "./src/ic/suspicion.mjs",
  "./src/styles.css",
  "./public/domain-cardiovascular.svg",
  "./public/domain-hepatico.svg",
  "./public/domain-metabolico.svg",
  "./public/domain-renal.svg",
  "./public/icon-180.png",
  "./public/icon-192.png",
  "./public/icon-512.png",
  "./public/icon-concept.svg",
  "./public/icon-maskable-512.png"
];
const STATIC_PATHS = new Set(ASSETS.map(asset => new URL(asset, self.registration.scope).pathname));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(asset => new Request(new URL(asset, self.registration.scope), { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!STATIC_PATHS.has(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request, { ignoreSearch: true })).then(cached => cached || fetch(request)));
});
