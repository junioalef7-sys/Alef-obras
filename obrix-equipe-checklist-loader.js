(()=>{'use strict';
if(window.__OBRIX_EQUIPE_CHECKLIST_LOADER)return;window.__OBRIX_EQUIPE_CHECKLIST_LOADER=true;
let promise=null;
const pathOf=src=>{try{return new URL(src,location.href).pathname}catch{return src}};
function hasPath(path){return [...document.scripts].some(s=>s.src&&pathOf(s.src)===path)}
function dadosLoaded(){return hasPath('/obrix-equipe-checklist-dados.js')||!!window.equipeAcao?.__checklistDados}
function patchLoaded(){return !!window.__OBRIX_EQUIPE_CHECKLIST_DIARIA_V2}
function loadScript(src,flag,force=false){return new Promise(resolve=>{if(!force&&hasPath(pathOf(src)))return resolve(true);const s=document.createElement('script');s.src=src;s.async=false;if(flag)s.dataset[flag]='1';s.onload=()=>resolve(true);s.onerror=()=>{console.warn('OBRIX: módulo não carregou.',src);resolve(false)};document.body.appendChild(s)})}
async function ensureOfflineSafe(){if(navigator.onLine||window.__OBRIX_OFFLINE_SAFE_LOADER)return true;return await loadScript('./obrix-offline-safe-loader.js?v=20261022offlinesuite1','obrixOfflineSafe')}
async function ensurePrefetch(){if(!navigator.onLine||window.__OBRIX_OFFLINE_PREFETCH)return true;return await loadScript('./obrix-offline-prefetch.js?v=20261022offlinesuite1','obrixOfflinePrefetch')}
async function load(){
  if(!navigator.onLine)return ensureOfflineSafe();
  if(dadosLoaded()&&patchLoaded())return true;
  if(promise)return promise;
  promise=(async()=>{
    let ok=true;
    if(!dadosLoaded())ok=await loadScript('./obrix-equipe-checklist-dados.js?v=20261022restore2','obrixEquipeChecklistDados')&&ok;
    if(!patchLoaded())ok=await loadScript('./obrix-equipe-checklist-diaria.js?v=20261022checkdiaria2','obrixEquipeChecklistDiaria',true)&&ok;
    return ok;
  })();
  try{return await promise}finally{promise=null}
}
function equipeAberta(){const sec=document.getElementById('equipe');return !!(sec&&!sec.classList.contains('hidden'))}
function check(){if(navigator.onLine&&equipeAberta())load();else if(!navigator.onLine)ensureOfflineSafe()}
function observe(){const sec=document.getElementById('equipe');if(sec&&!sec.dataset.obrixChecklistObserved){sec.dataset.obrixChecklistObserved='1';new MutationObserver(check).observe(sec,{attributes:true,attributeFilter:['class']})}check()}
document.addEventListener('click',e=>{if(!navigator.onLine)return;const el=e.target.closest?.('#bEquipe,[data-go="equipe"]');if(el)setTimeout(load,0)},true);
window.addEventListener('obrix:grupo-pronto',e=>{if(navigator.onLine&&e.detail?.name==='equipe')setTimeout(load,0)});
window.addEventListener('online',()=>{setTimeout(check,100);setTimeout(ensurePrefetch,700)});
window.addEventListener('offline',()=>setTimeout(ensureOfflineSafe,0));
window.addEventListener('pageshow',()=>{setTimeout(observe,100);setTimeout(()=>navigator.onLine?ensurePrefetch():ensureOfflineSafe(),300)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(observe,100);setTimeout(()=>navigator.onLine?ensurePrefetch():ensureOfflineSafe(),300)});else{setTimeout(observe,100);setTimeout(()=>navigator.onLine?ensurePrefetch():ensureOfflineSafe(),300)}
setTimeout(observe,900);
window.OBRIX_EQUIPE_CHECKLIST_LOADER={load,status:()=>({dados:dadosLoaded(),patch:patchLoaded(),loading:!!promise,equipeAberta:equipeAberta(),online:navigator.onLine})};
})();

;(()=>{'use strict';
if(window.__OBRIX_LIGHT_UI_BOOT_V2)return;window.__OBRIX_LIGHT_UI_BOOT_V2=true;
const offlineV3=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
function hasLightUi(){return !!window.__OBRIX_LIGHT_UI_FINAL_V2||[...document.scripts].some(s=>/obrix-light-ui-final-v2\.js(?:\?|$)/.test(String(s.src||'')))}
function loadLightUi(){if(offlineV3()||hasLightUi())return;const s=document.createElement('script');s.src='./obrix-light-ui-final-v2.js?v=20261024lightui-final2';s.async=false;s.dataset.obrixLightUiFinal='1';document.body.appendChild(s)}
function preloadConfig(){if(offlineV3())return;const l=window.OBRIX_POS_LOGIN_LOADER;if(l?.loadFeature)setTimeout(()=>l.loadFeature('config').catch?.(()=>{}),650)}
function boot(){loadLightUi();preloadConfig()}
window.addEventListener('online',()=>setTimeout(boot,120));window.addEventListener('pageshow',()=>setTimeout(boot,120));window.addEventListener('obrix:modules-ready',()=>setTimeout(boot,120));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,120),{once:true});else setTimeout(boot,120);
})();