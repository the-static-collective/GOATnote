/* GOATnote app-shell cache only. Never cache notebook contents or JSON exports. */
const SHELL='goatnote-shell-v2';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('goatnote-shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  const url=new URL(req.url);
  if(!FILES.some(path=>url.pathname===new URL(path,self.registration.scope).pathname))return;
  event.respondWith(fetch(req).then(response=>{
    if(response.ok){const clone=response.clone();event.waitUntil(caches.open(SHELL).then(cache=>cache.put(req,clone)));}
    return response;
  }).catch(()=>caches.match(req)));
});
