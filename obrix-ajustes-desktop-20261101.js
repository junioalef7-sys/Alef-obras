(()=>{
'use strict';
if(window.__OBRIX_AJUSTES_DESKTOP_20261101)return;window.__OBRIX_AJUSTES_DESKTOP_20261101=true;

const isDesktop=()=>!window.matchMedia('(max-width:620px)').matches;
let financeHooked=false,financePreloaded=false,mobileSummaryLoading=false,applyScheduled=false;

function ensureStyle(){
  if(document.getElementById('obrix-ajustes-desktop-20261101-style'))return;
  const s=document.createElement('style');s.id='obrix-ajustes-desktop-20261101-style';s.textContent=`
@media (min-width:621px){
  .obxOnboarding{padding:18px!important;overflow:hidden!important}
  .obxOnboardCard{height:min(860px,calc(100dvh - 36px))!important;max-height:calc(100dvh - 36px)!important;min-height:0!important}
  #obxOnboardBody{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;overscroll-behavior:contain}
  .obxOnboardFooter{flex:0 0 auto!important;position:relative!important;z-index:3!important;padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px))!important}
  .obxOnboardButtons{display:flex!important;align-items:center!important;gap:10px!important;flex:0 0 auto!important}
  #obxOnboardPrev,#obxOnboardNext{min-height:44px!important;min-width:112px!important;padding:10px 16px!important;line-height:1.15!important;white-space:nowrap!important}
  button[data-obrix-back-svg="1"],a[data-obrix-back-svg="1"]{font-size:0!important;font-weight:900!important}
  button[data-obrix-back-svg="1"] svg,a[data-obrix-back-svg="1"] svg{display:block!important;width:29px!important;height:29px!important;overflow:visible!important;pointer-events:none!important}
}
html[data-theme="light"] #cfgExcluirConta,
html[data-theme="light"] .accountDeleteBtn,
html[data-theme="light"] .accountDeleteModal .excluir{
  background:var(--ob-surface-2,#e5eaf0)!important;
  background-color:var(--ob-surface-2,#e5eaf0)!important;
  background-image:none!important;
  color:var(--ob-text,#0f172a)!important;
  -webkit-text-fill-color:var(--ob-text,#0f172a)!important;
  border:0!important;
  outline:0!important;
  box-shadow:none!important;
  filter:none!important;
}
html[data-theme="light"] #cfgExcluirConta:is(:hover,:focus,:active),
html[data-theme="light"] .accountDeleteBtn:is(:hover,:focus,:active),
html[data-theme="light"] .accountDeleteModal .excluir:is(:hover,:focus,:active){
  background:var(--ob-surface-2,#e5eaf0)!important;
  background-color:var(--ob-surface-2,#e5eaf0)!important;
  color:var(--ob-text,#0f172a)!important;
  -webkit-text-fill-color:var(--ob-text,#0f172a)!important;
  border:0!important;
  box-shadow:none!important;
}
`;
  document.head.appendChild(s);
}

function thickBackArrows(root=document){
  if(!isDesktop())return;
  root.querySelectorAll?.('.obrixSetaVoltar,button[aria-label="Voltar"],a[aria-label="Voltar"]').forEach(b=>{
    if(b.dataset.obrixBackSvg==='1')return;
    const txt=String(b.textContent||'').trim().toLowerCase();
    if(!(b.classList.contains('obrixSetaVoltar')||txt==='←'||txt==='voltar'||b.getAttribute('aria-label')==='Voltar'))return;
    b.dataset.obrixBackSvg='1';
    b.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M18.5 6.5 9 16l9.5 9.5M9 16h14.5" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  });
}

function neutralDelete(){
  const light=document.documentElement.dataset.theme==='light';
  document.querySelectorAll('#cfgExcluirConta,.accountDeleteBtn,.accountDeleteModal .excluir').forEach(b=>{
    if(light){
      b.style.setProperty('background','var(--ob-surface-2,#e5eaf0)','important');
      b.style.setProperty('background-color','var(--ob-surface-2,#e5eaf0)','important');
      b.style.setProperty('background-image','none','important');
      b.style.setProperty('color','var(--ob-text,#0f172a)','important');
      b.style.setProperty('-webkit-text-fill-color','var(--ob-text,#0f172a)','important');
      b.style.setProperty('border','0','important');
      b.style.setProperty('box-shadow','none','important');
      b.style.setProperty('filter','none','important');
    }else{
      b.style.setProperty('background','transparent','important');
      b.style.setProperty('background-color','transparent','important');
      b.style.setProperty('background-image','none','important');
      b.style.setProperty('color','#fff','important');
      b.style.setProperty('-webkit-text-fill-color','#fff','important');
      b.style.setProperty('border','1px solid #475569','important');
      b.style.setProperty('box-shadow','none','important');
    }
  });
}

function loadScript(src,id){
  if(document.getElementById(id))return Promise.resolve(true);
  return new Promise(resolve=>{
    const s=document.createElement('script');s.id=id;s.src=src;s.async=false;
    s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.body.appendChild(s);
  });
}

async function ensureFinanceGroup(){
  const loader=window.OBRIX_POS_LOGIN_LOADER;
  if(!loader?.loadGroup)return false;
  try{await loader.loadGroup('financeiro');return true}catch(e){console.warn('Financeiro: grupo complementar indisponível',e);return false}
}

async function ensureMobileSummary(){
  if(isDesktop()||window.OBRIX_FIN_MOBILE_RESUMO_OBRA||mobileSummaryLoading)return;
  mobileSummaryLoading=true;
  try{await loadScript('./obrix-financeiro-mobile-resumo-obra.js?v=20261101-desktop-fix1','obrix-fin-mobile-resumo-loader-20261101')}finally{mobileSummaryLoading=false}
}

function hookFinance(){
  const api=window.OBRIX_FIN;if(!api||typeof api.open!=='function'||api.open.__obrixDesktopFinanceHook)return false;
  const original=api.open;
  function open(){
    const r=original.apply(this,arguments);
    setTimeout(async()=>{
      await ensureFinanceGroup();
      if(isDesktop())window.dispatchEvent(new Event('obrix-financeiro-atualizado'));
      else await ensureMobileSummary();
    },0);
    return r;
  }
  open.__obrixDesktopFinanceHook=true;open.__original=original;api.open=open;financeHooked=true;return true;
}

function preloadDesktopFinance(){
  if(financePreloaded||!isDesktop())return;
  const app=document.getElementById('app'),login=document.getElementById('login');
  if(!app||app.classList.contains('hidden')||(login&&!login.classList.contains('hidden')))return;
  const loader=window.OBRIX_POS_LOGIN_LOADER,status=loader?.status?.();
  if(!loader?.loadGroup||(!status?.baseDone&&navigator.onLine))return;
  financePreloaded=true;
  const go=()=>ensureFinanceGroup().catch(()=>{});
  if('requestIdleCallback'in window)requestIdleCallback(go,{timeout:1500});else setTimeout(go,500);
}

function apply(){
  applyScheduled=false;ensureStyle();hookFinance();thickBackArrows();neutralDelete();preloadDesktopFinance();
  if(!isDesktop())ensureMobileSummary();
}
function schedule(ms=0){
  if(ms)return setTimeout(schedule,ms,0);
  if(applyScheduled)return;applyScheduled=true;requestAnimationFrame(apply);
}

ensureStyle();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
['pageshow','obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix-financeiro-atualizado','obrix:theme-applied'].forEach(n=>window.addEventListener(n,()=>schedule()));
document.addEventListener('click',()=>{schedule(0);schedule(80);schedule(260)},true);
window.addEventListener('resize',()=>schedule());
new MutationObserver(ms=>{
  for(const m of ms){for(const n of m.addedNodes){if(n.nodeType!==1)continue;const e=n;if(e.matches?.('#cfgExcluirConta,.accountDeleteModal,.obrixSetaVoltar,[aria-label="Voltar"]')||e.querySelector?.('#cfgExcluirConta,.accountDeleteModal,.obrixSetaVoltar,[aria-label="Voltar"]')){schedule();return}}}
}).observe(document.body,{childList:true,subtree:true});
[120,500,1200,2500].forEach(ms=>schedule(ms));
window.OBRIX_AJUSTES_DESKTOP_20261101={refresh:apply,ensureFinanceGroup};
})();