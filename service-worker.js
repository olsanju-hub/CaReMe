// Solo cachea recursos estáticos: nunca guarda información introducida en formularios.
// El símbolo SVG incluido es provisional; el icono aprobado en la conversación aún debe subirse.
const CACHE_PREFIX = 'cahreme-shell-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = CACHE_PREFIX + 'v0-48';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './src/sequence-fields.mjs', './src/clinical/secuencia-terapeutica.mjs', './src/clinical/secuencia-insulina.mjs', './src/app.mjs', './src/model.mjs', './src/consultas.mjs', './src/clinical/obesidad.mjs', './src/clinical/masld.mjs', './src/clinical/dislipemia.mjs', './src/clinical/hta.mjs', './src/clinical/ckm.mjs', './src/clinical/calculadoras.mjs', './src/clinical/tratamientos-modulo.mjs', './src/clinical/insulina-dosis.mjs', './src/clinical/consulta-breve.mjs', './src/clinical/riesgo-cv.mjs', './src/clinical/renal.mjs', './src/clinical/engine.mjs', './src/clinical/integracion.mjs', './src/clinical/farmacologia.mjs', './src/clinical/continuidad.mjs', './src/clinical/incretinas.mjs', './src/clinical/basales.mjs', './src/clinical/auditoria.mjs', './src/clinical/proveniencia.mjs', './src/clinical/plan-integral.mjs', './src/clinical/plan.mjs', './src/clinical/dm2-rapida.mjs', './src/clinical/dm2-detallada.mjs', './src/clinical/insulinizacion.mjs', './src/clinical/insuficiencia-cardiaca.mjs', './src/styles.css',
  './public/icon-180.png', './public/icon-192.png', './public/icon-512.png', './public/icon-maskable-512.png', './public/icon-concept.svg', './public/domain-cardiovascular.svg',
  './public/domain-renal.svg', './public/domain-hepatico.svg',
  './public/domain-metabolico.svg'
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
