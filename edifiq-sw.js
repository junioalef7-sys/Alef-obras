const CACHE='edifiq-shell-v57-billing-trial-logo';
const SHELL=['./','./manifest.webmanifest','./edifiq-icon-192.png','./edifiq-menu-logo.jpg','./edific-icon.svg','./exclusao-conta.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(url=>cache.add(url)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('edifiq-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
function isDynamic(url){return url.hostname.endsWith('supabase.co')||url.hostname.includes('mercadopago')||url.hostname==='asaas.com'||url.hostname.endsWith('.asaas.com')||url.pathname.includes('/functions/v1/');}
const BILLING_FIX_URL=new URL('./billing-fix57.js',self.location.href).href;
function injectFix(html){if(html.includes('billing-fix57.js'))return html;return html.replace(/<\/body>/i,'<script src="./billing-fix57.js?v=57"></script></body>');}
self.addEventListener('fetch',event=>{
 const req=event.request;const url=new URL(req.url);
 if(req.method!=='GET')return;
 if(url.href===BILLING_FIX_URL||url.pathname.endsWith('/billing-fix57.js')){
   event.respondWith(fetch(new URL('./billing-fix57.js',self.location.href),{cache:'no-store'}).catch(()=>new Response('',{status:404})));
   return;
 }
 if(isDynamic(url))return;
 const root=new URL('./',self.location.href),appPage=url.origin===root.origin&&(url.pathname===root.pathname||url.pathname===root.pathname+'index.html');
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(async res=>{
    if(!res.ok)return res;
    const type=(res.headers.get('content-type')||'').toLowerCase();
    if(!type.includes('text/html'))return res;
    const html=injectFix(await res.text());
    const headers=new Headers(res.headers);headers.delete('content-length');
    const out=new Response(html,{status:res.status,statusText:res.statusText,headers});
    caches.open(CACHE).then(cache=>cache.put(appPage?'./':req,out.clone())).catch(()=>{});
    return out;
  }).catch(async()=>{
    const cached=(await caches.match(req))||(appPage?await caches.match('./'):null);if(!cached)return Response.error();
    const type=(cached.headers.get('content-type')||'').toLowerCase();if(!type.includes('text/html'))return cached;
    const html=injectFix(await cached.text());const headers=new Headers(cached.headers);headers.delete('content-length');return new Response(html,{status:cached.status,statusText:cached.statusText,headers});
  }));return;
 }
 const cacheable=url.origin===self.location.origin||url.hostname==='cdn.jsdelivr.net'||url.hostname==='cdnjs.cloudflare.com';if(!cacheable)return;
 event.respondWith(caches.match(req).then(cached=>{const network=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});}return res;}).catch(()=>cached||Response.error());return cached||network;}));
});