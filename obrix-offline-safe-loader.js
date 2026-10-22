(()=>{'use strict';
if(window.__OBRIX_OFFLINE_SAFE_LOADER)return;window.__OBRIX_OFFLINE_SAFE_LOADER=true;
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const loaded=new Set();
function base(){try{return window.OBRIX_OFFLINE_BOOTSTRAP_API?.base?.()||window.__OBRIX_OFFLINE_BOOTSTRAP_BASE||null}catch{return null}}
function paint(){
  if(navigator.onLine)return false;
  const b=base();if(!b?.profile?.empresa_id)return false;
  const obras=Array.isArray(b.obras)?b.obras:[],fin=Array.isArray(b.financeiro)?b.financeiro:[],extras=Array.isArray(b.extras)?b.extras:[],funcs=Array.isArray(b.funcionarios)?b.funcionarios:[];
  window.obras=obras;window.funcionarios=funcs;window.financeiro=fin;window.extras=extras;window.diarias=Array.isArray(b.diarias)?b.diarias:[];window.vales=Array.isArray(b.vales)?b.vales:[];window.bonus=Array.isArray(b.bonus)?b.bonus:[];
  const total=obras.reduce((s,o)=>s+Number(o.valor_contrato||0),0)+extras.reduce((s,x)=>s+Number(x.valor||0),0),recebido=fin.filter(x=>x.tipo==='receita'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0);
  const c=document.getElementById('contratado'),r=document.getElementById('receber');if(c)c.textContent=money(total);if(r)r.textContent=money(Math.max(0,total-recebido));
  try{window.atualizarInicio?.()}catch{}try{window.renderObras?.()}catch{}try{window.renderEquipe?.()}catch{}
  document.documentElement.dataset.obrixOfflineSafe='1';
  return true;
}
function path(src){try{return new URL(src,location.href).pathname}catch{return src}}
function already(src){const p=path(src);return [...document.scripts].some(s=>s.src&&path(s.src)===p)}
function load(src){
  if(already(src)||loaded.has(path(src)))return Promise.resolve(true);
  return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;let done=false;const end=ok=>{if(done)return;done=true;if(ok)loaded.add(path(src));resolve(ok)};s.onload=()=>end(true);s.onerror=()=>end(false);document.body.appendChild(s);setTimeout(()=>end(false),5000)});
}
async function loadMenu(){await load('./obrix-menu-main.js?v=20261022offlinesafe1');await load('./obrix-nav-active.js?v=20261022offlinesafe1')}
async function loadFinanceiro(){const ok1=await load('./obrix-financeiro-main.js?v=20261022offlinesafe1'),ok2=await load('./obrix-financeiro-offline-basefix.js?v=20261022offlinesafe1'),ok3=await load('./obrix-financeiro-offline.js?v=20261022offlinesafe1');if(ok1&&ok2&&ok3){setTimeout(()=>window.OBRIX_FIN?.open?.(),0);return true}alert('O Financeiro offline não pôde ser aberto neste momento.');return false}
async function loadEstoque(){const ok1=await load('./obrix-estoque-main.js?v=20261022offlinesafe1'),ok2=await load('./obrix-estoque-offline.js?v=20261022offlinesafe1');if(ok1&&ok2){setTimeout(()=>window.OBRIX_EST?.open?.(),0);return true}alert('O Estoque offline não pôde ser aberto neste momento.');return false}
async function loadObras(){await load('./obrix-obras-main.js?v=20261022offlinesafe1');await load('./obrix-obras-offline.js?v=20261022offlinesafe1');await load('./obrix-checklist-offline.js?v=20261022offlinesafe1');try{window.OBRIX_OBRAS?.render?.()}catch{}}
function intercept(e){if(navigator.onLine)return;const el=e.target.closest?.('button,a,[role="button"],[data-go]');if(!el)return;const t=(el.textContent||'').trim().toLowerCase(),go=String(el.dataset?.go||'').toLowerCase();if(t.includes('financeiro')||go==='financeiro'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();loadFinanceiro();return}if(t.includes('estoque')||t.includes('materiais')||go==='estoque'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();loadEstoque();return}if(t.startsWith('obras')||go==='obras')setTimeout(loadObras,0);if(t.includes('equipe')||go==='equipe')setTimeout(paint,0)}
document.addEventListener('click',intercept,true);
window.addEventListener('pageshow',()=>setTimeout(paint,40));window.addEventListener('focus',()=>setTimeout(paint,40));window.addEventListener('obrix:offline-bootstrap',()=>setTimeout(paint,0));window.addEventListener('obrix:offline-core-restaurado',()=>setTimeout(paint,0));
window.addEventListener('online',()=>{document.documentElement.removeAttribute('data-obrix-offline-safe');load('./obrix-pos-login-loader.js?v=20261022onlineafteroffline1').then(()=>setTimeout(()=>window.OBRIX_POS_LOGIN_LOADER?.start?.('online-after-offline'),0))});
setTimeout(paint,0);setTimeout(paint,250);setTimeout(()=>{if(!navigator.onLine)loadMenu()},450);
window.OBRIX_OFFLINE_SAFE={paint,loadFinanceiro,loadEstoque,loadObras,status:()=>{const b=base();return{online:navigator.onLine,empresa_id:b?.profile?.empresa_id||null,obras:b?.obras?.length||0,funcionarios:b?.funcionarios?.length||0,financeiro:b?.financeiro?.length||0}}};
})();