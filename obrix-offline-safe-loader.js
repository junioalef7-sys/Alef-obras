(()=>{'use strict';
if(window.__OBRIX_OFFLINE_SAFE_LOADER)return;window.__OBRIX_OFFLINE_SAFE_LOADER=true;
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const loaded=new Set();
function base(){try{return window.OBRIX_OFFLINE_BOOTSTRAP_API?.base?.()||window.__OBRIX_OFFLINE_BOOTSTRAP_BASE||null}catch{return null}}
function ensureNavCss(){
  if(document.getElementById('obrixOfflineFixedNavCss'))return;
  const s=document.createElement('style');s.id='obrixOfflineFixedNavCss';s.textContent=`html[data-obrix-offline="1"] body{padding-bottom:96px!important}html[data-obrix-offline="1"] #app{padding-bottom:96px!important}html[data-obrix-offline="1"] #app>.bottom{position:fixed!important;left:max(12px,env(safe-area-inset-left))!important;right:max(12px,env(safe-area-inset-right))!important;bottom:max(10px,env(safe-area-inset-bottom))!important;z-index:2147483000!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;margin:0!important;padding:8px!important;background:rgba(255,255,255,.96)!important;border:1px solid #dbe3ec!important;border-radius:999px!important;box-shadow:0 12px 36px rgba(15,23,42,.22)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important}html[data-obrix-offline="1"] #app>.bottom button{display:flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;height:54px!important;padding:8px 4px!important;border-radius:999px!important;font-size:14px!important;line-height:1!important;white-space:nowrap!important;position:relative!important;z-index:2147483001!important;pointer-events:auto!important}html[data-obrix-offline="1"] #app>.bottom button.active{background:#0f172a!important;color:#fff!important}@media(min-width:760px){html[data-obrix-offline="1"] #app>.bottom{left:50%!important;right:auto!important;width:min(720px,calc(100vw - 32px))!important;transform:translateX(-50%)!important}}html[data-theme="dark"][data-obrix-offline="1"] #app>.bottom{background:rgba(7,17,31,.96)!important;border-color:#26384d!important}`;document.head.appendChild(s)
}
function fixBottom(){
  ensureNavCss();
  const bs=[...document.querySelectorAll('#app>.bottom button')];
  if(bs[0]){bs[0].id='bInicio';bs[0].textContent='Início'}
  if(bs[1]){bs[1].id='bFinanceiro';bs[1].textContent='Financeiro'}
  if(bs[2]){bs[2].id='bEquipe';bs[2].textContent='Equipe'}
  if(bs[3]){bs[3].id='bMenu';bs[3].textContent='Menu'}
}
function paint(){
  if(navigator.onLine)return false;
  const b=base();if(!b?.profile?.empresa_id)return false;
  const obras=Array.isArray(b.obras)?b.obras:[],fin=Array.isArray(b.financeiro)?b.financeiro:[],extras=Array.isArray(b.extras)?b.extras:[],funcs=Array.isArray(b.funcionarios)?b.funcionarios:[];
  window.obras=obras;window.funcionarios=funcs;window.financeiro=fin;window.extras=extras;window.diarias=Array.isArray(b.diarias)?b.diarias:[];window.vales=Array.isArray(b.vales)?b.vales:[];window.bonus=Array.isArray(b.bonus)?b.bonus:[];
  const total=obras.reduce((s,o)=>s+Number(o.valor_contrato||0),0)+extras.reduce((s,x)=>s+Number(x.valor||0),0),recebido=fin.filter(x=>x.tipo==='receita'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0);
  const c=document.getElementById('contratado'),r=document.getElementById('receber');if(c)c.textContent=money(total);if(r)r.textContent=money(Math.max(0,total-recebido));
  try{window.atualizarInicio?.()}catch{}try{window.renderObras?.()}catch{}try{window.renderEquipe?.()}catch{}
  document.documentElement.dataset.obrixOfflineSafe='1';fixBottom();
  return true;
}
function path(src){try{return new URL(src,location.href).pathname}catch{return src}}
function already(src){const p=path(src);return [...document.scripts].some(s=>s.src&&path(s.src)===p)}
function load(src){if(already(src)||loaded.has(path(src)))return Promise.resolve(true);return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;let done=false;const end=ok=>{if(done)return;done=true;if(ok)loaded.add(path(src));resolve(ok)};s.onload=()=>end(true);s.onerror=()=>end(false);document.body.appendChild(s);setTimeout(()=>end(false),5000)})}
function hideAll(){['inicio','obras','equipe','financeiroMain','estoqueMain','menuMain','offlineCentralMain','diarioMain','notasMain','documentosMain','orcamentosMain','relatoriosMain','backupMain','configMain','assinaturaMain'].forEach(id=>document.getElementById(id)?.classList.add('hidden'))}
function activate(index){fixBottom();document.querySelectorAll('#app>.bottom button').forEach((b,i)=>b.classList.toggle('active',i===index))}
function showLocal(id,index){hideAll();document.getElementById(id)?.classList.remove('hidden');activate(index);if(id==='inicio')paint();if(id==='equipe'){paint();try{window.renderEquipe?.()}catch{}setTimeout(()=>window.OBRIX_EQUIPE_CHECKLIST_LOADER?.load?.(),0)}if(id==='obras'){paint();try{window.renderObras?.()}catch{}}fixBottom();scrollTo({top:0,behavior:'smooth'});return true}
async function loadMenu(){return await load('./obrix-menu-main.js?v=20261022offlinesafe3')}
async function openMenu(){const ok=await loadMenu();if(!ok)return alert('O Menu offline não pôde ser aberto neste momento.');if(window.OBRIX_MENU?.open){window.OBRIX_MENU.open();activate(3);fixBottom();return true}alert('O Menu offline não ficou disponível.');return false}
async function loadFinanceiro(){const ok1=await load('./obrix-financeiro-main.js?v=20261022offlinesafe3'),ok2=await load('./obrix-financeiro-offline-basefix.js?v=20261022offlinesafe3'),ok3=await load('./obrix-financeiro-offline.js?v=20261022offlinesafe3');if(ok1&&ok2&&ok3){setTimeout(()=>{window.OBRIX_FIN?.open?.();activate(1);fixBottom()},0);return true}alert('O Financeiro offline não pôde ser aberto neste momento.');return false}
async function loadEstoque(){const ok1=await load('./obrix-estoque-main.js?v=20261022offlinesafe3'),ok2=await load('./obrix-estoque-offline.js?v=20261022offlinesafe3');if(ok1&&ok2){setTimeout(()=>{window.OBRIX_EST?.open?.();fixBottom()},0);return true}alert('O Estoque offline não pôde ser aberto neste momento.');return false}
async function loadObras(){await load('./obrix-obras-main.js?v=20261022offlinesafe3');await load('./obrix-obras-offline.js?v=20261022offlinesafe3');await load('./obrix-checklist-offline.js?v=20261022offlinesafe3');showLocal('obras',-1);try{window.OBRIX_OBRAS?.render?.()}catch{}}
function bottomIndex(el){const btn=el.closest?.('#app>.bottom button');if(!btn)return-1;return [...document.querySelectorAll('#app>.bottom button')].indexOf(btn)}
function intercept(e){
  if(navigator.onLine)return;
  const el=e.target.closest?.('button,a,[role="button"],[data-go]');if(!el)return;
  const bi=bottomIndex(el);
  if(bi===0){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();showLocal('inicio',0);return}
  if(bi===1){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();loadFinanceiro();return}
  if(bi===2){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();showLocal('equipe',2);return}
  if(bi===3){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();openMenu();return}
  const t=(el.textContent||'').trim().toLowerCase(),go=String(el.dataset?.go||'').toLowerCase();
  if(t.includes('financeiro')||go==='financeiro'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();loadFinanceiro();return}
  if(t.includes('estoque')||t.includes('materiais')||go==='estoque'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();loadEstoque();return}
  if(t.startsWith('obras')||go==='obras'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();loadObras();return}
  if(t.includes('equipe')||go==='equipe'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();showLocal('equipe',2);return}
  if(go==='dashboard'||t==='início'||t==='inicio'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();showLocal('inicio',0);return}
}
document.addEventListener('click',intercept,true);
window.addEventListener('pageshow',()=>setTimeout(()=>{paint();fixBottom();if(!navigator.onLine&&document.getElementById('financeiroMain')?.classList.contains('hidden'))showLocal('inicio',0)},40));
window.addEventListener('focus',()=>setTimeout(()=>{paint();fixBottom()},40));window.addEventListener('obrix:offline-bootstrap',()=>setTimeout(()=>{paint();fixBottom()},0));window.addEventListener('obrix:offline-core-restaurado',()=>setTimeout(()=>{paint();fixBottom()},0));
window.addEventListener('online',()=>{document.documentElement.removeAttribute('data-obrix-offline-safe');document.getElementById('obrixOfflineFixedNavCss')?.remove();load('./obrix-pos-login-loader.js?v=20261022onlineafteroffline3').then(()=>setTimeout(()=>window.OBRIX_POS_LOGIN_LOADER?.start?.('online-after-offline'),0))});
setTimeout(()=>{paint();fixBottom();if(!navigator.onLine)showLocal('inicio',0)},0);setTimeout(()=>{paint();fixBottom()},250);setInterval(()=>{if(!navigator.onLine)fixBottom()},1200);
window.OBRIX_OFFLINE_SAFE={paint,fixBottom,showLocal,openMenu,loadFinanceiro,loadEstoque,loadObras,status:()=>{const b=base();return{online:navigator.onLine,empresa_id:b?.profile?.empresa_id||null,obras:b?.obras?.length||0,funcionarios:b?.funcionarios?.length||0,financeiro:b?.financeiro?.length||0}}};
})();