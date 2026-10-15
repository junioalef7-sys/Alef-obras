const CACHE='edifiq-shell-v71-clean';
const SHELL=[
  './',
  './manifest.webmanifest',
  './edifiq-icon-192.png',
  './edifiq-menu-logo.jpg',
  './edific-icon.svg',
  './exclusao-conta.html',
  './core-fix65.js?v=71',
  './billing-fix57.js?v=71',
  './account-delete-fix61.js?v=71',
  './trial-fix62.js?v=71',
  './billing-hotfix63.js?v=71',
  './access-limit63.js?v=71',
  './ui-fix67.js?v=71',
  './login-ui68.js?v=71'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>Promise.allSettled(SHELL.map(url=>cache.add(url))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('edifiq-shell-')&&key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

function isDynamic(url){
  return url.hostname.endsWith('supabase.co')||
    url.hostname==='asaas.com'||
    url.hostname.endsWith('.asaas.com')||
    url.pathname.includes('/functions/v1/');
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(isDynamic(url))return;

  const root=new URL('./',self.location.href);
  const appPage=url.origin===root.origin&&(url.pathname===root.pathname||url.pathname===root.pathname+'index.html');

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(res=>{
          if(res&&res.ok){
            const copy=res.clone();
            caches.open(CACHE).then(cache=>cache.put(appPage?'./':req,copy)).catch(()=>{});
          }
          return res;
        })
        .catch(async()=>{
          const cached=(await caches.match(req))||(appPage?await caches.match('./'):null);
          return cached||Response.error();
        })
    );
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(res=>{
          if(res&&res.ok){
            const copy=res.clone();
            caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
          }
          return res;
        })
        .catch(()=>caches.match(req).then(cached=>cached||Response.error()))
    );
  }
});
