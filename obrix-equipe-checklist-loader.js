(()=>{'use strict';
if(window.__OBRIX_EQUIPE_CHECKLIST_LOADER)return;window.__OBRIX_EQUIPE_CHECKLIST_LOADER=true;
let promise=null;
const pathOf=src=>{try{return new URL(src,location.href).pathname}catch{return src}};
function hasPath(path){return [...document.scripts].some(s=>s.src&&pathOf(s.src)===path)}
function dadosLoaded(){return hasPath('/obrix-equipe-checklist-dados.js')||!!window.equipeAcao?.__checklistDados}
function patchLoaded(){return !!window.__OBRIX_EQUIPE_CHECKLIST_DIARIA_V2}
function loadScript(src,flag,force=false){return new Promise(resolve=>{if(!force&&hasPath(pathOf(src)))return resolve(true);const s=document.createElement('script');s.src=src;s.async=false;if(flag)s.dataset[flag]='1';s.onload=()=>resolve(true);s.onerror=()=>{console.warn('OBRIX: módulo do Checklist da Equipe não carregou.',src);resolve(false)};document.body.appendChild(s)})}
async function load(){
  if(!navigator.onLine)return true;
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
function check(){if(navigator.onLine&&equipeAberta())load()}
function observe(){const sec=document.getElementById('equipe');if(sec&&!sec.dataset.obrixChecklistObserved){sec.dataset.obrixChecklistObserved='1';new MutationObserver(check).observe(sec,{attributes:true,attributeFilter:['class']})}check()}
document.addEventListener('click',e=>{if(!navigator.onLine)return;const el=e.target.closest?.('#bEquipe,[data-go="equipe"]');if(el)setTimeout(load,0)},true);
window.addEventListener('obrix:grupo-pronto',e=>{if(navigator.onLine&&e.detail?.name==='equipe')setTimeout(load,0)});
window.addEventListener('online',()=>setTimeout(check,100));
window.addEventListener('pageshow',()=>setTimeout(observe,100));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(observe,100));else setTimeout(observe,100);
setTimeout(observe,900);
window.OBRIX_EQUIPE_CHECKLIST_LOADER={load,status:()=>({dados:dadosLoaded(),patch:patchLoaded(),loading:!!promise,equipeAberta:equipeAberta(),online:navigator.onLine})};
})();