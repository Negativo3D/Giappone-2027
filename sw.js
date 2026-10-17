/* Service worker: tiene una copia dell'app per usarla anche senza rete
   (in Giappone, in metro o senza eSIM). Prima prova la rete, se non c'è
   usa la copia salvata. I dati del viaggio stanno nel telefono, non qui. */
const CACHE = 'giappone-2027-v35';
const FILE = ['./', './index.html', './manifest.webmanifest', './icona-180.png', './icona-192.png', './icona-512.png', './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.origin !== location.origin || u.searchParams.has('v')) return;
  e.respondWith(
    // cache:'no-cache' chiede sempre al server se la pagina è cambiata (GitHub Pages altrimenti la tiene 10 minuti)
    fetch(e.request.mode === 'navigate' ? e.request.url : e.request, { cache:'no-cache' }).then(r => {
      if(r.ok){ const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
