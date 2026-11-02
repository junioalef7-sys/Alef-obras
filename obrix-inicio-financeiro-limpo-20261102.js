(()=>{
'use strict';
if(window.__OBRIX_INICIO_FINANCEIRO_LIMPO_20261102)return;
window.__OBRIX_INICIO_FINANCEIRO_LIMPO_20261102=true;

const STYLE_ID='obrix-inicio-financeiro-limpo-20261102-css';
let scheduled=false;

function garantirCss(){
  if(document.getElementById(STYLE_ID))return;
  const st=document.createElement('style');
  st.id=STYLE_ID;
  st.textContent=`
html[data-theme="light"] #inicio #obxNovaObra,
html[data-theme="light"] #inicio .obxNova{
  background:#000!important;
  background-color:#000!important;
  background-image:none!important;
  color:#fff!important;
  -webkit-text-fill-color:#fff!important;
  border-color:#000!important;
  box-shadow:none!important;
}
html[data-theme="light"] #inicio #obxNovaObra *,
html[data-theme="light"] #inicio .obxNova *{
  color:#fff!important;
  -webkit-text-fill-color:#fff!important;
}
#financeiroMain > .kpis{
  display:none!important;
}
#financeiroMain #fmResumoObras,
#financeiroMain #obmResumoObrasAprovado{
  display:none!important;
}
`;
  document.head.appendChild(st);
}

function aplicarNovaObra(){
  const b=document.getElementById('obxNovaObra');
  if(!b)return;
  if(document.documentElement.dataset.theme==='light'){
    b.style.setProperty('background','#000','important');
    b.style.setProperty('background-color','#000','important');
    b.style.setProperty('background-image','none','important');
    b.style.setProperty('color','#fff','important');
    b.style.setProperty('-webkit-text-fill-color','#fff','important');
    b.style.setProperty('border-color','#000','important');
  }else{
    ['background','background-color','background-image','color','-webkit-text-fill-color','border-color'].forEach(p=>b.style.removeProperty(p));
  }
}

function limparFinanceiro(){
  const main=document.getElementById('financeiroMain');
  if(!main)return;
  const topo=main.querySelector(':scope > .kpis');
  if(topo){
    topo.setAttribute('aria-hidden','true');
    topo.style.setProperty('display','none','important');
  }
  main.querySelectorAll('#fmResumoObras,#obmResumoObrasAprovado').forEach(el=>el.remove());
}

function aplicar(){
  garantirCss();
  aplicarNovaObra();
  limparFinanceiro();
}
function agenda(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;aplicar()});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',agenda,{once:true});else agenda();
new MutationObserver(agenda).observe(document.getElementById('app')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
new MutationObserver(agenda).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
window.addEventListener('pageshow',agenda);
window.addEventListener('focus',agenda);
window.addEventListener('obrix-financeiro-atualizado',agenda);
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(ev=>window.addEventListener(ev,agenda));
setTimeout(agenda,250);
setTimeout(agenda,900);
window.OBRIX_INICIO_FINANCEIRO_LIMPO={refresh:agenda};
})();
