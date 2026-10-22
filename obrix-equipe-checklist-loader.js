(()=>{'use strict';
if(window.__OBRIX_EQUIPE_CHECKLIST_LOADER)return;window.__OBRIX_EQUIPE_CHECKLIST_LOADER=true;
let promise=null;
function loaded(){return !!document.querySelector('script[data-obrix-equipe-checklist-dados]')||!!window.equipeAcao?.__checklistDados}
function load(){
  if(loaded())return Promise.resolve(true);
  if(promise)return promise;
  promise=new Promise(resolve=>{
    const s=document.createElement('script');
    s.src='./obrix-equipe-checklist-dados.js?v=20261022restore1';
    s.async=false;
    s.dataset.obrixEquipeChecklistDados='1';
    s.onload=()=>resolve(true);
    s.onerror=()=>{console.warn('OBRIX: Checklist da Equipe não carregou.');promise=null;resolve(false)};
    document.body.appendChild(s);
  });
  return promise;
}
function equipeAberta(){const sec=document.getElementById('equipe');return !!(sec&&!sec.classList.contains('hidden'))}
function check(){if(equipeAberta())load()}
function observe(){
  const sec=document.getElementById('equipe');
  if(sec&&!sec.dataset.obrixChecklistObserved){sec.dataset.obrixChecklistObserved='1';new MutationObserver(check).observe(sec,{attributes:true,attributeFilter:['class']})}
  check();
}
document.addEventListener('click',e=>{const el=e.target.closest?.('#bEquipe,[data-go="equipe"]');if(el)setTimeout(load,0)},true);
window.addEventListener('pageshow',()=>setTimeout(observe,100));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(observe,100));else setTimeout(observe,100);
setTimeout(observe,900);
window.OBRIX_EQUIPE_CHECKLIST_LOADER={load,status:()=>({loaded:loaded(),loading:!!promise,equipeAberta:equipeAberta()})};
})();