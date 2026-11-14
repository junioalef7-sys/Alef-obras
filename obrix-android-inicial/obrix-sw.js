const CACHE='obrix-offline-v78-instalar-posicionado-20261114';
const BUILD='20261114-preview-instalar-posicionado-v78';
const CDN_SUPABASE='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1';
const CDN_HTML2CANVAS='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
const CDN_JSPDF='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
const APP=[
'./obrix.html','./obrix-startup-router.js','./obrix-offline-v3.js','./obrix-offline-v3-nav.js','./obrix-offline-v3-guard.js','./obrix-offline-bootstrap.js','./obrix-session-offline-fix.js','./obrix-offline-v2.js','./obrix-backend-adapter.js','./obrix-core-main.js','./obrix-ui-stability.js','./obrix-pos-login-loader.js','./obrix-login-rescue.js','./obrix-login-eye-lite.js','./obrix-auth-main.js','./obrix-login-profissional.js',
'./obrix-financeiro-main.js','./obrix-financeiro-visual.js','./obrix-visual-padrao-final.js','./obrix-obras-fiel.js','./obrix-estoque-operacoes-main.js','./obrix-equipe-registros-faltas.js','./obrix-estoque-main.js','./obrix-equipe-main.js','./obrix-obras-main.js','./obrix-menu-main.js','./obrix-nav-active.js','./obrix-home-clean.js','./obrix-theme-main.js','./obrix-light-polish.js','./obrix-brand-main.js','./obrix-ajustes-ui-final.js',
'./obrix-financeiro-resumo-obras.js','./obrix-financeiro-resumo-geral.js','./obrix-financeiro-protecao-estoque.js','./obrix-financeiro-busca.js','./obrix-financeiro-filtros-layout.js','./obrix-financeiro-grafico-receitas.js','./obrix-blindagem-financeiro.js',
'./obrix-equipe-controles-guard.js','./obrix-equipe-total-pago.js','./obrix-equipe-lista-vertical.js','./obrix-equipe-diretorio-pessoal.js','./obrix-equipe-botoes-neutros-v1.js','./obrix-equipe-estoque-fix-v1.js',
'./obrix-estoque-saida-obra.js','./obrix-estoque-operacoes-main.js','./obrix-estoque-estorno-final.js','./obrix-obras-busca.js','./obrix-obras-pagamentos.js','./obrix-checklist-v2.js',
'./obrix-diario-main.js','./obrix-diario-equipe.js','./obrix-orcamentos-main.js','./obrix-orcamentos-itens-topo.js','./obrix-orcamentos-rascunho-print.js','./obrix-relatorios-v2.js','./obrix-relatorios-mobile-fix.js','./obrix-relatorios-complementos.js','./obrix-relatorio-financeiro-obra.js','./obrix-relatorio-diario.js','./obrix-documentos-main.js','./obrix-documentos-direto.js','./obrix-notas-main.js','./obrix-backup-v2.js','./obrix-backup-import-run.js','./obrix-backup-completo.js','./obrix-config-main.js',
'./obrix-erros-ptbr.js','./obrix-avatar-dark-fix.js','./obrix-audit-fixes-v1.js','./obrix-button-colors-v1.js','./obrix-ui-cleanup-v5.js','./obrix-equipe-realtime-sync.js','./obrix-equipe-registros-faltas.js','./obrix-equipe-ajustes-20261023.js','./obrix-offline-prefetch.js',
'./obrix-assinaturas-cobrancas-efi.js','./obrix-assinaturas-economia-anual.js','./obrix-suporte-main.js','./obrix-suporte-permissoes-ui.js','./obrix-notificacoes.js','./obrix-suporte-admin-notif.js','./obrix-onboarding.js','./obrix-global-ui-report-fix.js','./obrix-pagamentos-ui-alinhamento.js','./obrix-equipe-checklist-loader.js',
'./obrix-icon.svg','./obrix-manifest.webmanifest',CDN_SUPABASE,CDN_HTML2CANVAS,CDN_JSPDF
];
const FRESH_CRITICAL=['/obrix.html','/obrix-startup-router.js','/obrix-offline-v3.js','/obrix-offline-v3-nav.js','/obrix-offline-v3-guard.js','/obrix-offline-bootstrap.js','/obrix-session-offline-fix.js','/obrix-offline-v2.js','/obrix-core-main.js','/obrix-theme-main.js','/obrix-menu-main.js','/obrix-financeiro-main.js','/obrix-equipe-main.js','/obrix-obras-main.js'];
function isFreshCritical(p){return FRESH_CRITICAL.some(x=>p.endsWith(x))}
async function directResponse(r){if(!r||r.type==='opaque'||!r.redirected)return r;try{const b=await r.clone().arrayBuffer(),h=new Headers(r.headers);h.delete('content-encoding');h.delete('content-length');h.delete('transfer-encoding');return new Response(b,{status:r.status,statusText:r.statusText,headers:h})}catch(_){return r}}
async function cachedDirect(q,allowOfflineSnapshot=false){
  const u=new URL(typeof q==='string'?q:q.url);
  const cache=await caches.open(CACHE);
  const exact=await cache.match(q);
  if(exact)return directResponse(exact);
  if(u.searchParams.has('v')&&/\.(?:js|css)$/i.test(u.pathname)){
    // Só em falha da rede: aceitar bytes sem ?v= quando a versão solicitada
    // estiver declarada pelo próprio shell/loader precacheado nesta instalação.
    // Isso preserva o offline sem confundir scripts de builds diferentes.
    if(!allowOfflineSnapshot)return null;
    const basename=u.pathname.split('/').pop();
    const tag=basename+'?v='+u.searchParams.get('v');
    const dirname=u.href;
    const shell=await cache.match(new URL('./obrix.html',dirname).href);
    const loader=await cache.match(new URL('./obrix-pos-login-loader.js',dirname).href);
    for(const registro of [shell,loader]){
      if(!registro)continue;
      const content=await registro.text();
      const tags=content.match(/obrix-[\w-]+\.(?:js|css)\?v=[\w.-]+/g)||[];
      if(tags.includes(tag)){
        const snapshot=await cache.match(new URL('./'+basename,dirname).href);
        if(snapshot)return directResponse(snapshot);
      }
    }
    return null;
  }
  const fallback=await cache.match(q,{ignoreSearch:true});
  return fallback?directResponse(fallback):null;
}
async function cachePut(q,r){if(!r)return r;const s=await directResponse(r);if(s&&(s.ok||s.type==='opaque'))(await caches.open(CACHE)).put(q,s.clone()).catch(()=>{});return s}
async function networkFirst(q,ms=4500){
  // Uma requisição que estourou tempo deve ser cancelada, não ficar
  // baixando arquivos em segundo plano enquanto novas telas abrem.
  const abort=new AbortController();
  const timer=setTimeout(()=>abort.abort(),ms);
  try{
    const r=await fetch(new Request(q,{cache:'reload',signal:abort.signal}));
    return await cachePut(q,r);
  }catch(_){return cachedDirect(q,true)}
  finally{clearTimeout(timer)}
}
async function precoletar(c,url){
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),9000);
  try{
    const q=new Request(url,{cache:'reload',signal:abort.signal});
    const r=await fetch(q),s=await directResponse(r);
    if(s&&(s.ok||s.type==='opaque'))await c.put(q,s.clone());
  }catch(_){}
  finally{clearTimeout(timer)}
}
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  // O cache offline anterior tentava baixar todos os arquivos simultaneamente.
  // Seis workers mantêm a cobertura offline, sem pico de 80+ requests.
  let index=0;
  const worker=async()=>{
    while(index<APP.length){
      const n=index++;
      await precoletar(c,APP[n]);
    }
  };
  await Promise.all(Array.from({length:Math.min(6,APP.length)},()=>worker()));
  await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('obrix-offline-v')&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url),same=u.origin===location.origin;
  const cdn=[CDN_SUPABASE,CDN_HTML2CANVAS,CDN_JSPDF].includes(u.href);
  if(!same&&!cdn)return;
  e.respondWith((async()=>{
    // Código com ?v= deve servir apenas o arquivo dessa versão.
    // Em navegação repetida, a versão exata pode ser aberta do cache sem 4,5s de espera.
    if(same&&u.searchParams.has('v')&&/\.(?:js|css)$/i.test(u.pathname)){
      const hit=await cachedDirect(e.request);
      if(hit)return hit;
      const fresh=await networkFirst(e.request,3500);
      return fresh||Response.error();
    }
    // HTML e arquivos não versionados continuam network-first.
    if(same&&(e.request.mode==='navigate'||isFreshCritical(u.pathname)||/^\/.*obrix-[^/]+\.js$/.test(u.pathname))){
      const fresh=await networkFirst(e.request,3500);
      if(fresh)return fresh;
    }
    try{return await cachePut(e.request,await fetch(e.request))}
    catch(_){
      const hit=await cachedDirect(e.request);
      if(hit)return hit;
      if(e.request.mode==='navigate'){
        const fallback=await caches.match('./obrix.html',{ignoreSearch:true});
        if(fallback)return directResponse(fallback);
      }
      return Response.error();
    }
  })());
});