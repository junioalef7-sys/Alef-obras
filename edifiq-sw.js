const CACHE='edifiq-shell-v56-planos-exclusao';
const SHELL=['./','./manifest.webmanifest','./edifiq-icon-192.png','./edifiq-menu-logo.jpg','./edific-icon.svg','./exclusao-conta.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(url=>cache.add(url)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('edifiq-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
function isDynamic(url){return url.hostname.endsWith('supabase.co')||url.hostname.includes('mercadopago')||url.hostname==='asaas.com'||url.hostname.endsWith('.asaas.com')||url.pathname.includes('/functions/v1/');}
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(isDynamic(url))return;
 const root=new URL('./',self.location.href),appPage=url.origin===root.origin&&(url.pathname===root.pathname||url.pathname===root.pathname+'index.html');
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(appPage?'./':req,copy)).catch(()=>{});}return res;}).catch(async()=>{return(await caches.match(req))||(appPage?await caches.match('./'):null)||Response.error();}));return;
 }
 const cacheable=url.origin===self.location.origin||url.hostname==='cdn.jsdelivr.net'||url.hostname==='cdnjs.cloudflare.com';if(!cacheable)return;
 event.respondWith(caches.match(req).then(cached=>{const network=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});}return res;}).catch(()=>cached||Response.error());return cached||network;}));
});
