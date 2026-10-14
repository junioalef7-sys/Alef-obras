const CACHE='edifiq-shell-v55-exclusao-real';
const SHELL=['./','./manifest.webmanifest','./edifiq-icon-192.png','./edifiq-menu-logo.jpg','./edific-icon.svg','./exclusao-conta.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{await Promise.allSettled(SHELL.map(url=>cache.add(url)));}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('edifiq-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
function isDynamic(url){return url.hostname.endsWith('supabase.co')||url.hostname.includes('mercadopago')||url.pathname.includes('/functions/v1/');}

const ACCOUNT_DELETE_PATCH=`<script id="edifiq-delete-account-route-v55">(function(){
  if(/exclusao-conta\\.html$/i.test(location.pathname))return;
  function isDeleteAccountControl(el){
    if(!el)return false;
    var text=String(el.textContent||'').replace(/\\s+/g,' ').trim().toLowerCase();
    return text==='excluir conta'||text==='exclusão de conta'||text==='exclusao de conta'||text.includes('excluir minha conta')||text==='solicitar exclusão'||text==='solicitar exclusao';
  }
  document.addEventListener('click',function(ev){
    var el=ev.target&&ev.target.closest?ev.target.closest('button,a,[role="button"]'):null;
    if(!isDeleteAccountControl(el))return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
    location.assign(new URL('./exclusao-conta.html',location.href).href);
  },true);
})();<\/script>`;

async function patchNavigationResponse(res,url){
  try{
    if(!res||!res.ok||url.origin!==self.location.origin||/exclusao-conta\\.html$/i.test(url.pathname))return res;
    const type=(res.headers.get('content-type')||'').toLowerCase();
    if(!type.includes('text/html'))return res;
    const html=await res.text();
    if(html.includes('edifiq-delete-account-route-v55'))return new Response(html,{status:res.status,statusText:res.statusText,headers:res.headers});
    const lower=html.toLowerCase();
    const pos=lower.lastIndexOf('</body>');
    const patched=pos>=0?html.slice(0,pos)+ACCOUNT_DELETE_PATCH+html.slice(pos):html+ACCOUNT_DELETE_PATCH;
    const headers=new Headers(res.headers);
    headers.delete('content-length');
    return new Response(patched,{status:res.status,statusText:res.statusText,headers});
  }catch(_){return res;}
}

self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(isDynamic(url))return;if(req.mode==='navigate'){event.respondWith(fetch(req).then(async res=>{const copy=res.clone();caches.open(CACHE).then(cache=>cache.put('./',copy)).catch(()=>{});return await patchNavigationResponse(res,url);}).catch(async()=>{const cached=(await caches.match(req))||(await caches.match('./'));return cached?await patchNavigationResponse(cached,url):Response.error();}));return;}const cacheable=url.origin===self.location.origin||url.hostname==='cdn.jsdelivr.net'||url.hostname==='cdnjs.cloudflare.com';if(!cacheable)return;event.respondWith(caches.match(req).then(cached=>{const network=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});}return res;}).catch(()=>cached);return cached||network;}));});
