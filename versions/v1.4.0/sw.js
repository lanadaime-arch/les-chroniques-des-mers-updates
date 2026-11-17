/* Service worker de la version 1.4.0; ne supprime pas les autres versions. */
const CACHE = "chroniques-version-1-4-0-20261117";
const PREFIX = "chroniques-version-1-4-0-";
const FILES = ["./","./index.html","./fruit-data.js","./game.js","./icon.svg","./manifest.webmanifest","./roam.js","./style.css","./tactics.js","./theme-v08.css","./theme-v09.css","./theme-v091.css","./theme-v10.css","./theme-v11.css","./theme-v12.css","./theme-v121.css","./assets/harbor-portrait.webp","./assets/ocean-port.webp","./assets/wave-texture.png","./theme-v122.css","./theme-v123.css","./theme-v130.css","./theme-v133.css","./theme-v134.css","./assets/chibi-captain.webp","./theme-v135.css","./assets/ocean-port-ponton.webp","./assets/chibi-capitaine-azur.webp","./assets/chibi-capitaine-flamme.webp","./assets/chibi-capitaine-brume.webp","./theme-v136.css","./assets/chibi-avatar-azur.webp","./assets/chibi-avatar-flamme.webp","./assets/chibi-avatar-brume.webp","./theme-v137.css","./theme-v138.css","./theme-v140.css","./assets/fuchsia-aube-quai.webp"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request,clone)).catch(() => {});
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    if (event.request.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
    return Response.error();
  }));
});
