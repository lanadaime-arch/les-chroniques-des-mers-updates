/* Coquille web du jeu original : ne supprime pas les caches des versions. */
const CACHE = "chroniques-mers-root-compass-20261118";
const FILES = ["./","./index.html","./fruit-data.js","./game.js","./icon.svg","./manifest.webmanifest","./roam.js","./style.css","./tactics.js","./theme-v08.css","./theme-v09.css","./theme-v091.css","./theme-v10.css","./theme-v11.css","./theme-v12.css","./theme-v121.css","./assets/harbor-portrait.webp","./assets/ocean-port.webp","./assets/wave-texture.png","./update-manager.js","./update-manager.css","./game-versions.json","./loading-screen.js","./loading-screen.css"];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>
   (k.startsWith('chroniques-mers-root-')||k==='chroniques-mers-47ae643ed99633ae') && k!==CACHE
 ).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 event.respondWith(fetch(event.request).then(response=>{
   if(response.ok&&new URL(event.request.url).origin===self.location.origin){
     const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});
   }
   return response;
 }).catch(async()=>{
   const cached=await caches.match(event.request);
   if(cached)return cached;
   if(event.request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
   return Response.error();
 }));
});
