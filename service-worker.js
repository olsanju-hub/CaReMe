// Solo cachea recursos estáticos: nunca guarda información introducida en formularios.
// El símbolo SVG incluido es provisional; el icono aprobado en la conversación aún debe subirse.
const CACHE = 'cahreme-shell-v0-3';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './src/app.mjs', './src/model.mjs', './src/consultas.mjs', './src/styles.css',
  './public/icon-concept.svg', './public/domain-cardiovascular.svg',
  './public/domain-renal.svg', './public/domain-hepatico.svg',
  './public/domain-metabolico.svg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('cahreme-shell-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const basePath = new URL(self.registration.scope).pathname;
  const relative = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) : null;
  if (relative === null || !['', 'index.html', 'manifest.webmanifest', 'src/app.mjs', 'src/model.mjs',
    'src/styles.css', 'src/consultas.mjs', 'public/icon-concept.svg', 'public/domain-cardiovascular.svg',
    'public/domain-renal.svg', 'public/domain-hepatico.svg', 'public/domain-metabolico.svg'].includes(relative)) return;
  event.respondWith(caches.match(request, { ignoreSearch: true }).then(cached => cached || fetch(request)));
});
