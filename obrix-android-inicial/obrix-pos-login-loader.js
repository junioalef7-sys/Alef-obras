(()=>{
'use strict';
if(window.__OBRIX_POS_LOGIN_LOADER)return;window.__OBRIX_POS_LOGIN_LOADER=true;
const BASE=['./obrix-financeiro-main.js?v=20261113-contraste-temas1','./obrix-financeiro-visual.js?v=20261113-canonico3','./obrix-estoque-main.js?v=20261113-titulos-exclusao7','./obrix-equipe-main.js?v=20261113-titulos-exclusao7','./obrix-obras-main.js?v=20261113-titulos-exclusao7','./obrix-obras-fiel.js?v=20261113-progresso-sem-oscilacao1','./obrix-checklist-v2.js?v=20261113-titulos-exclusao7','./obrix-checklist-progress-core.js?v=20261113-progresso-sem-oscilacao1','./obrix-checklist-offline.js?v=20261022offlinefix1','./obrix-menu-main.js?v=20261111-tela-unica1','./obrix-nav-active.js?v=20261019docs1','./obrix-home-clean.js?v=20261106-sem-reset-atalhos1','./obrix-brand-main.js?v=20261113-titulos-cabecalho6','./obrix-ajustes-ui-final.js?v=20261026faxina1','./obrix-theme-main.js?v=20261108-tema-sem-piscar1','./obrix-mobile-clean.js?v=20261026faxina2','./obrix-ui-correcoes-equipe-tema.js?v=20261027modaldiaria3'];
const BASE_OFFLINE=['./obrix-financeiro-main.js?v=20261113-contraste-temas1','./obrix-financeiro-visual.js?v=20261113-canonico3','./obrix-estoque-main.js?v=20261113-titulos-exclusao7','./obrix-obras-main.js?v=20261113-titulos-exclusao7','./obrix-obras-fiel.js?v=20261113-progresso-sem-oscilacao1','./obrix-checklist-v2.js?v=20261113-titulos-exclusao7','./obrix-checklist-offline.js?v=20261022offlinefix1','./obrix-menu-main.js?v=20261111-tela-unica1','./obrix-nav-active.js?v=20261019docs1','./obrix-brand-main.js?v=20261113-titulos-cabecalho6','./obrix-ajustes-ui-final.js?v=20261026faxina1','./obrix-theme-main.js?v=20261108-tema-sem-piscar1','./obrix-mobile-clean.js?v=20261026faxina2','./obrix-ui-correcoes-equipe-tema.js?v=20261027modaldiaria3'];
const GROUPS={financeiro:['./obrix-financeiro-offline-basefix.js?v=20261022offlinefix1','./obrix-financeiro-offline.js?v=20261112-largura-fixada-componente5','./obrix-financeiro-resumo-obras.js?v=20261026restaura1','./obrix-financeiro-resumo-geral.js?v=20261101margem2','./obrix-financeiro-protecao-estoque.js?v=357','./obrix-financeiro-busca.js?v=20261019filtros3','./obrix-financeiro-filtros-layout.js?v=20261108-observador-leve3','./obrix-financeiro-mobile-dates-core.js?v=20261102core1','./obrix-financeiro-grafico-receitas.js?v=20261019grafico1','./obrix-blindagem-financeiro.js?v=2864a637'],equipe:['./obrix-equipe-controles-guard.js?v=20261108-sem-varredura8','./obrix-equipe-offline.js?v=20261022offlinefix1','./obrix-equipe-total-pago.js?v=20261019fix4','./obrix-equipe-pagamento-seguro.js?v=20261018dados1','./obrix-equipe-lista-vertical.js?v=20261112-busca-visivel2','./obrix-equipe-diretorio-pessoal.js?v=20261019pessoal1','./obrix-equipe-folha-install.js?v=20261019folha2','./obrix-equipe-pagar-selecao.js?v=20261111-historico-busca1','./obrix-equipe-visual-final.js?v=20261106-coalescer-render1'],estoque:['./obrix-estoque-offline.js?v=20261022offlinefix1','./obrix-estoque-saida-obra.js?v=349','./obrix-estoque-operacoes-main.js?v=20261111-busca-movimentacoes1','./obrix-estoque-estorno-final.js?v=350'],obras:['./obrix-obras-offline.js?v=20261113-exact-cache64','./obrix-checklist-offline.js?v=20261022offlinefix1','./obrix-obras-busca.js?v=20261021semTodas1','./obrix-obras-pagamentos.js?v=20261019pagobra1','./obrix-relatorio-fotografico.js?v=20261105-inapp-confirm-1','./obrix-relatorio-fotografico-realtime.js?v=20261020rt2','./obrix-checklist-v2.js?v=20261113-titulos-exclusao7']};
const OFFLINE_GROUPS={financeiro:['./obrix-financeiro-offline-basefix.js?v=20261022offlinefix1','./obrix-financeiro-offline.js?v=20261112-largura-fixada-componente5'],equipe:[],estoque:['./obrix-estoque-offline.js?v=20261022offlinefix1','./obrix-estoque-operacoes-main.js?v=20261111-busca-movimentacoes1'],obras:['./obrix-obras-offline.js?v=20261113-exact-cache64','./obrix-checklist-offline.js?v=20261022offlinefix1']};
const FEATURES={diario:['./obrix-offline-diario.js?v=20261108-sem-sync-dupla9','./obrix-diario-main.js?v=20261113-contraste-temas1','./obrix-diario-equipe.js?v=20261108-sem-duplicidade8'],orcamentos:['./obrix-orcamentos-main.js?v=20261113-contraste-temas1','./obrix-orcamentos-itens-topo.js?v=20261022sharepdf1','./obrix-orcamentos-rascunho-print.js?v=20261022obs3'],relatorios:['./obrix-relatorios-v2.js?v=20261110-buscas-obra-equipe1','./obrix-relatorios-mobile-fix.js?v=20261110-abas-tres2','./obrix-relatorios-complementos.js?v=20261022menuroute1','./obrix-relatorio-financeiro-obra.js?v=20261024pdf2','./obrix-relatorio-diario.js?v=20261110-busca-obra2'],documentos:['./obrix-documentos-main.js?v=20261113-titulos-exclusao7','./obrix-documentos-direto.js?v=20261020viewer1'],notas:['./obrix-notas-main.js?v=20261113-contraste-temas1','./obrix-notas-offline.js?v=20261021offline2'],backup:['./obrix-backup-v2.js?v=20261108-feed-backup3','./obrix-backup-import-run.js?v=20261018restore1','./obrix-backup-completo.js?v=20261020full2'],assinatura:['./obrix-assinaturas-main.js?v=20261113-assinatura-sem-remontar1'],config:['./obrix-config-main.js?v=20261113-botoes-cartao-tema1','./obrix-account-delete.js?v=20261113-cartao-dois-temas1'],offline:['./obrix-offline-central-lite.js?v=20261022central-lite1'],offlineSync:['./obrix-offline-diario.js?v=20261108-sem-sync-dupla9','./obrix-notas-offline.js?v=20261021offline2','./obrix-checklist-offline.js?v=20261022offlinefix1','./obrix-obras-offline.js?v=20261113-exact-cache64','./obrix-equipe-offline.js?v=20261022offlinefix1','./obrix-estoque-offline.js?v=20261022offlinefix1','./obrix-offline-conflicts.js?v=20261021resolve1'],offlineTools:[]};
const groupPromises=new Map(),groupDone=new Set(),offlineGroupDone=new Set(),featurePromises=new Map(),featureDone=new Set(),warmLinks=new Set();let started=false,baseDone=false,baseMode=null,prewarmScheduled=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const desktop=()=>window.matchMedia?window.matchMedia('(min-width:621px)').matches:window.innerWidth>620;
const appOpen=()=>{const app=document.getElementById('app'),login=document.getElementById('login');return !!(app&&!app.classList.contains('hidden')&&(!login||login.classList.contains('hidden')))};
const pathOf=src=>{try{return new URL(src,location.href).pathname}catch(_){return src}};
const loadedPaths=new Set([...document.scripts].filter(s=>s.src).map(s=>pathOf(s.src)));
const inFlightScripts=new Map();
function loaded(src){
  const p=pathOf(src);
  if(loadedPaths.has(p))return true;
  const ready=[...document.scripts].some(s=>s.src&&pathOf(s.src)===p&&!s.dataset.obrixPosLogin);
  if(ready)loadedPaths.add(p);
  return ready;
}
function loadOne(src,scope='base'){
  const p=pathOf(src);
  if(loaded(src))return Promise.resolve(true);
  if(inFlightScripts.has(p))return inFlightScripts.get(p);
  const task=new Promise(resolve=>{
    const s=document.createElement('script');s.src=src;s.async=false;
    s.dataset.obrixPosLogin=scope;let done=false,timer=null;
    const finish=ok=>{
      if(done)return;done=true;if(timer)clearTimeout(timer);
      if(ok){loadedPaths.add(p);s.dataset.obrixPosLogin='loaded'}
      else s.remove();
      resolve(ok);
    };
    s.onload=()=>finish(true);s.onerror=()=>finish(false);
    document.body.appendChild(s);
    timer=setTimeout(()=>finish(false),20000);
  });
  inFlightScripts.set(p,task);
  // Evita acumular promessas concluídas após abrir várias telas.
  void task.finally(()=>{if(inFlightScripts.get(p)===task)inFlightScripts.delete(p)});
  return task;
}
function primeList(list,scope='base'){
  // Somente os quatro primeiros scripts essenciais podem iniciar download
  // antecipado; carregar todas as dependências provoca picos no iPhone/Android.
  if(!navigator.onLine||!scope.startsWith('base'))return;
  let n=0;
  for(const src of list){
    if(n>=4)break;
    if(loaded(src))continue;
    try{
      const href=new URL(src,location.href).href;
      if(warmLinks.has(href))continue;
      warmLinks.add(href);n++;
      const l=document.createElement('link');l.rel='preload';l.as='script';l.href=href;
      l.dataset.obrixPerfPrime=scope;document.head.appendChild(l)
    }catch(_){}
  }
}
async function yieldUI(){
  // requestAnimationFrame pode parar em aba oculta; fallback impede deadlock.
  await new Promise(resolve=>{
    if(document.hidden){setTimeout(resolve,0);return}
    let done=false;
    const fallback=setTimeout(()=>{if(!done){done=true;resolve()}},180);
    requestAnimationFrame(()=>{if(!done){done=true;clearTimeout(fallback);resolve()}});
  });
}
async function loadList(list,scope){
  primeList(list,scope);await yieldUI();
  let ok=true;
  // Script async=false garante a ordem de execução, mas solicitações em pequenos
  // lotes permitem download concorrente sem bloquear a interface por cada arquivo.
  for(let i=0;i<list.length;i+=3){
    const pendentes=list.slice(i,i+3).filter(src=>!loaded(src));
    if(!pendentes.length)continue;
    const resultados=await Promise.all(pendentes.map(src=>loadOne(src,scope)));
    if(resultados.some(v=>!v))ok=false;
    await yieldUI();
  }
  return ok;
}
async function loadGroup(name){const offline=!navigator.onLine;if(!offline&&groupDone.has(name))return true;if(offline&&offlineGroupDone.has(name))return true;const key=(offline?'offline:':'online:')+name;if(groupPromises.has(key))return groupPromises.get(key);const list=offline?(OFFLINE_GROUPS[name]||[]):GROUPS[name];if(!list)return false;const p=(async()=>{const ok=await loadList(list,key);if(ok){if(offline)offlineGroupDone.add(name);else groupDone.add(name)}if(name==='obras')setTimeout(()=>window.OBRIX_OBRAS_FIEL?.refresh?.(),50);if(name==='financeiro')setTimeout(()=>{window.OBRIX_FIN_VISUAL?.refresh?.();window.OBRIX_FIN_MARGEM?.refresh?.();window.OBRIX_FIN_MOBILE_DATES_CORE?.refresh?.()},50);return ok})();groupPromises.set(key,p);try{return await p}finally{groupPromises.delete(key)}}
async function loadFeature(name){if(featureDone.has(name))return true;if(featurePromises.has(name))return featurePromises.get(name);const list=FEATURES[name];if(!list)return false;const p=(async()=>{const ok=await loadList(list,'feature:'+name);if(ok)featureDone.add(name);window.OBRIX_THEME?.refresh?.();return ok})();featurePromises.set(name,p);try{return await p}finally{featurePromises.delete(name)}}
function instalarLazyHooks(){if(window.__OBRIX_LAZY_HOOKS)return;window.__OBRIX_LAZY_HOOKS=true;const oldAbrir=window.abrir;if(typeof oldAbrir==='function'){window.abrir=function(id){const r=oldAbrir.apply(this,arguments);if(id==='equipe'||id==='obras'||id==='financeiro')setTimeout(()=>loadGroup(id),0);if(id==='obras')setTimeout(()=>window.OBRIX_OBRAS_FIEL?.refresh?.(),70);if(id==='financeiro')setTimeout(()=>{window.OBRIX_FIN_VISUAL?.refresh?.();window.OBRIX_FIN_MARGEM?.refresh?.();window.OBRIX_FIN_MOBILE_DATES_CORE?.refresh?.()},70);return r}}}
function warmOne(src){if(desktop()||!navigator.onLine||loaded(src))return;try{const href=new URL(src,location.href).href;if(warmLinks.has(href))return;warmLinks.add(href);const l=document.createElement('link');l.rel='preload';l.as='script';l.href=href;l.dataset.obrixPerfWarm='1';try{l.fetchPriority='low'}catch(_){ }document.head.appendChild(l)}catch(_){}}
async function warmMobilePrimary(){if(desktop()||!navigator.onLine||!appOpen())return false;const list=[...GROUPS.financeiro,...GROUPS.equipe,...GROUPS.obras,...GROUPS.estoque];let n=0;for(const src of [...new Set(list)]){warmOne(src);n++;if(n%3===0)await sleep(120)}return true}
const idlePause=(timeout=220)=>new Promise(r=>{if('requestIdleCallback'in window)requestIdleCallback(()=>r(),{timeout});else setTimeout(r,80)});
async function prewarmPrimary(){if(!desktop()||!navigator.onLine||!appOpen())return false;for(const name of ['financeiro','obras','estoque','equipe']){try{await loadGroup(name)}catch(_){ }await idlePause(220)}return true}
function schedulePrewarm(){
  if(prewarmScheduled||!navigator.onLine||!appOpen())return;
  prewarmScheduled=true;
  // Somente quatro scripts leves e frequentes. Pré-busca sem executar código,
  // com baixa prioridade e pausas; nenhum download em massa durante o login.
  const prioritarios=[...FEATURES.config,FEATURES.notas[0],FEATURES.diario[1]].filter(Boolean);
  (async()=>{
    await sleep(1500);
    for(const src of prioritarios){
      if(document.hidden||!appOpen()||!navigator.onLine)return;
      try{
        const href=new URL(src,location.href).href;
        if(!loaded(src)&&!warmLinks.has(href)){
          warmLinks.add(href);
          const l=document.createElement('link');l.rel='prefetch';l.as='script';l.href=href;
          l.dataset.obrixPerfWarm='idle';
          try{l.fetchPriority='low'}catch(_){}
          document.head.appendChild(l);
        }
      }catch(_){}
      await sleep(280);
    }
  })().catch(()=>{});
}
async function loadBase(list,scope){const ok=await loadList(list,scope);instalarLazyHooks();window.OBRIX_THEME?.refresh?.();window.OBRIX_OBRAS_FIEL?.refresh?.();window.OBRIX_FIN_VISUAL?.refresh?.();return ok}
async function start(){if(started||!appOpen())return false;started=true;baseMode=navigator.onLine?'online':'offline';await sleep(10);const ok=await loadBase(navigator.onLine?BASE:BASE_OFFLINE,'base:'+baseMode);baseDone=navigator.onLine&&ok;if(!ok)console.warn('OBRIX: módulos básicos incompletos, novas tentativas disponíveis');schedulePrewarm();return ok}
async function upgradeOnline(){if(!started||!navigator.onLine||baseDone||!appOpen())return false;await loadBase(BASE,'base:online-upgrade');baseDone=true;schedulePrewarm();return true}
function watch(){if(appOpen())start()}
const app=document.getElementById('app');if(app)new MutationObserver(watch).observe(app,{attributes:true,attributeFilter:['class']});
window.addEventListener('online',()=>{prewarmScheduled=false;setTimeout(upgradeOnline,60)});
window.addEventListener('pageshow',()=>setTimeout(watch,0));
setTimeout(watch,40);setTimeout(watch,250);
window.OBRIX_POS_LOGIN_LOADER={start,upgradeOnline,loadGroup,loadFeature,status:()=>({started,baseDone,baseMode,groups:[...groupDone]})};
})();