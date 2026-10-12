const CACHE='edifiq-shell-v42';
const SHELL=['./','./manifest.webmanifest','./edifiq-icon-192.png','./edifiq-icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await Promise.allSettled(SHELL.map(url=>cache.add(url)));
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('edifiq-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
function isDynamic(url){
  return url.hostname.endsWith('supabase.co') ||
         url.hostname.includes('mercadopago') ||
         url.pathname.includes('/functions/v1/');
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(isDynamic(url)) return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(cache=>cache.put('./',copy)).catch(()=>{});
        return res;
      }).catch(async()=>{
        return (await caches.match(req)) || (await caches.match('./')) || Response.error();
      })
    );
    return;
  }

  const cacheable = url.origin===self.location.origin ||
                    url.hostname==='cdn.jsdelivr.net' ||
                    url.hostname==='cdnjs.cloudflare.com';
  if(!cacheable) return;

  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req).then(res=>{
        if(res && (res.ok || res.type==='opaque')){
          const copy=res.clone();
          caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});
