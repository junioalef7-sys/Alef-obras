(()=>{
'use strict';
if(window.__OBRIX_AJUSTES_DESKTOP_20261101)return;window.__OBRIX_AJUSTES_DESKTOP_20261101=true;

const isDesktop=()=>!window.matchMedia('(max-width:620px)').matches;
const appActive=()=>{const app=document.getElementById('app'),login=document.getElementById('login');return !!(app&&!app.classList.contains('hidden')&&(!login||login.classList.contains('hidden')))};
let mobileSummaryLoading=false,fastSyncLoading=false,applyScheduled=false;

function ensureStyle(){
  if(document.getElementById('obrix-ajustes-desktop-20261101-style'))return;
  const s=document.createElement('style');s.id='obrix-ajustes-desktop-20261101-style';s.textContent=`
@media (min-width:621px){
  .obxOnboarding{padding:10px 18px!important;overflow:hidden!important;align-items:center!important;justify-content:center!important}
  .obxOnboardCard{width:min(860px,calc(100vw - 36px))!important;height:calc(100vh - 20px)!important;max-height:calc(100vh - 20px)!important;min-height:0!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;overflow:hidden!important}
  #obxOnboardBody{min-height:0!important;overflow:auto!important;overscroll-behavior:contain!important;padding-bottom:14px!important}
  .obxOnboardFooter{position:relative!important;z-index:10!important;min-height:70px!important;display:flex!important;flex:0 0 auto!important;padding:12px 20px!important;background:#fff!important}
  .obxOnboardButtons{display:flex!important;align-items:center!important;gap:10px!important;flex:0 0 auto!important}
  #obxOnboardPrev,#obxOnboardNext{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:44px!important;min-width:112px!important;padding:10px 16px!important;line-height:1.15!important;white-space:nowrap!important;visibility:visible!important;opacity:1!important}
  button[data-obrix-back-svg="1"],a[data-obrix-back-svg="1"]{font-size:0!important;font-weight:900!important}
  button[data-obrix-back-svg="1"] svg,a[data-obrix-back-svg="1"] svg{display:block!important;width:29px!important;height:29px!important;overflow:visible!important;pointer-events:none!important}
}
@media (min-width:621px) and (max-height:760px){
  #obxOnboardBody{padding:14px 22px 10px!important}
  .obxSlideHead{grid-template-columns:56px minmax(0,1fr)!important;gap:13px!important;margin-bottom:10px!important}
  .obxSlideIcon{width:56px!important;height:56px!important;border-radius:16px!important;font-size:29px!important}
  .obxSlideHead h1{font-size:23px!important;margin-bottom:4px!important}
  .obxSlideHead p{font-size:13px!important}
  .obxFeatureGrid{gap:7px!important}
  .obxFeature{min-height:72px!important;padding:9px 11px!important}
  .obxFeature b{font-size:13px!important;margin-bottom:3px!important}
  .obxFeature span{font-size:12px!important;line-height:1.3!important}
  .obxOnboardFooter{min-height:62px!important;padding:9px 18px!important}
}
html[data-theme="dark"] .obxOnboardFooter{background:#0d1722!important;border-top-color:#293b4d!important}
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
}`;
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
  const loader=window.OBRIX_POS_LOGIN_LOADER;if(!loader?.loadGroup)return false;
  try{await loader.loadGroup('financeiro');return true}catch(e){console.warn('Financeiro: grupo complementar indisponível',e);return false}
}

async function ensureMobileSummary(){
  if(isDesktop()||window.OBRIX_FIN_MOBILE_RESUMO_OBRA||mobileSummaryLoading)return;
  mobileSummaryLoading=true;
  try{await loadScript('./obrix-financeiro-mobile-resumo-obra.js?v=20261101-desktop-fix2','obrix-fin-mobile-resumo-loader-20261101')}finally{mobileSummaryLoading=false}
}

function hookFinance(){
  const api=window.OBRIX_FIN;if(!api||typeof api.open!=='function'||api.open.__obrixDesktopFinanceHook)return false;
  const original=api.open;
  function open(){
    const r=original.apply(this,arguments);
    setTimeout(async()=>{await ensureFinanceGroup();if(isDesktop())window.dispatchEvent(new Event('obrix-financeiro-atualizado'));else await ensureMobileSummary()},0);
    return r;
  }
  open.__obrixDesktopFinanceHook=true;open.__original=original;api.open=open;return true;
}

async function ensureFastSync(){
  if(!appActive())return false;
  if(window.OBRIX_SYNC_FAST){try{window.OBRIX_SYNC_FAST.start?.()}catch(_){}return true}
  if(fastSyncLoading)return false;
  fastSyncLoading=true;
  try{
    const ok=await loadScript('./obrix-sync-fast.js?v=20261101-sync1','obrix-sync-fast-loader-20261101');
    if(ok)try{window.OBRIX_SYNC_FAST?.start?.()}catch(_){}
    return ok;
  }finally{fastSyncLoading=false}
}

function apply(){
  applyScheduled=false;
  ensureStyle();hookFinance();thickBackArrows();neutralDelete();
  if(appActive())void ensureFastSync();
}
function schedule(ms=0){
  if(ms)return setTimeout(()=>schedule(0),ms);
  if(applyScheduled)return;applyScheduled=true;requestAnimationFrame(apply);
}

ensureStyle();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
['pageshow','obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix-financeiro-atualizado','obrix:theme-applied'].forEach(n=>window.addEventListener(n,()=>schedule()));
window.addEventListener('resize',()=>schedule(80));

const app=document.getElementById('app');
if(app)new MutationObserver(()=>{if(appActive()){schedule();schedule(300);schedule(900)}}).observe(app,{attributes:true,attributeFilter:['class']});

new MutationObserver(ms=>{
  for(const m of ms)for(const n of m.addedNodes){
    if(n.nodeType!==1)continue;
    const e=n;
    if(e.matches?.('#cfgExcluirConta,.accountDeleteModal,.obrixSetaVoltar,[aria-label="Voltar"],#financeiroMain')||e.querySelector?.('#cfgExcluirConta,.accountDeleteModal,.obrixSetaVoltar,[aria-label="Voltar"],#financeiroMain')){schedule();return}
  }
}).observe(document.body,{childList:true,subtree:true});

[150,650,1600].forEach(ms=>schedule(ms));
window.OBRIX_AJUSTES_DESKTOP_20261101={refresh:apply,ensureFinanceGroup,ensureFastSync};
})();