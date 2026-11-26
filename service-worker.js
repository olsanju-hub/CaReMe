// Solo cachea recursos estáticos: nunca guarda información introducida en formularios.
// El símbolo SVG incluido es provisional; el icono aprobado en la conversación aún debe subirse.
const CACHE_PREFIX = 'cahreme-shell-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = CACHE_PREFIX + 'v0-77';
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/app.mjs?v=77",
  "./src/ic/suspicion.mjs?v=77",
  "./src/styles.css?v=77",
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
const STATIC_URLS = new Set(ASSETS.map(asset => new URL(asset, self.registration.scope).href));
const ROOT = new URL('./', self.registration.scope);
const INDEX = new URL('./index.html', self.registration.scope);
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
  // Online: obtain the current HTML, not the previous app shell. Offline: fall back to the installed release.
  if (request.mode === 'navigate' && [ROOT.pathname, INDEX.pathname].includes(url.pathname)) {
    event.respondWith(fetch(request, {cache:'no-store'}).then(response => {
      if(!response.ok) throw new Error('Shell unavailable');
      return response;
    }).catch(async()=> (await (await caches.open(CACHE)).match(INDEX.href)) || Response.error()));
    return;
  }
  // Exact version keys: never answer a request for a new JS/CSS build using an older cached file.
  if (!STATIC_URLS.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request)).then(cached => cached || fetch(request)));
});
