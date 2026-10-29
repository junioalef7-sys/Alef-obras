(()=>{'use strict';
if(window.__OBRIX_TITULOS_COMPACTOS_REAIS)return;window.__OBRIX_TITULOS_COMPACTOS_REAIS=true;
const nomes=['obras','diário de obras','diario de obras','financeiro','equipe','funcionários','funcionarios','materiais / estoque','materiais/estoque','estoque','orçamentos','orcamentos','relatórios','relatorios','documentos','notas','backup','central offline','planos e assinaturas','ajuda e feedback','configurações','configuracoes'];
const norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
const ehTitulo=e=>{const t=norm(e.textContent);return nomes.some(n=>t===n||t.startsWith(n+' '));};
function cabecalhos(){
  document.querySelectorAll('#app h1,#app h2,#app .sectionHead>strong').forEach(t=>{
    if(!ehTitulo(t))return;
    const cab=t.closest('.hero,.sectionHead,header');
    if(!cab||cab.closest('.modal,.modalBack,[role="dialog"]'))return;
    cab.querySelectorAll('button,.btn,[role="button"]').forEach(b=>b.remove());
    cab.style.setProperty('width','fit-content','important');
    cab.style.setProperty('max-width','100%','important');
    cab.style.setProperty('min-width','0','important');
    cab.style.setProperty('min-height','0','important');
    cab.style.setProperty('height','auto','important');
    cab.style.setProperty('padding','10px 14px','important');
    cab.style.setProperty('margin-left','0','important');
    cab.style.setProperty('margin-right','auto','important');
    cab.style.setProperty('display','flex','important');
    cab.style.setProperty('align-items','center','important');
    cab.style.setProperty('justify-content','flex-start','important');
    cab.style.setProperty('gap','0','important');
    t.style.setProperty('margin','0','important');
    t.style.setProperty('text-align','left','important');
    t.style.setProperty('width','auto','important');
    [...cab.children].forEach(el=>{if(el!==t&&!el.contains(t))el.style.setProperty('display','none','important');});
  });
}
function instalacaoEscura(){
  if(document.documentElement.dataset.theme!=='dark')return;
  [...document.querySelectorAll('body *')].filter(e=>norm(e.textContent)==='instalar obrix').forEach(t=>{
    let box=t.parentElement;
    for(let i=0;i<3&&box&&box.parentElement;i++){if(box.querySelectorAll('button').length)break;box=box.parentElement;}
    if(!box)return;
    box.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{
      b.style.setProperty('background','#111e2c','important');
      b.style.setProperty('background-color','#111e2c','important');
      b.style.setProperty('background-image','none','important');
      b.style.setProperty('color','#f8fafc','important');
      b.style.setProperty('-webkit-text-fill-color','#f8fafc','important');
      b.style.setProperty('border-color','#293b4d','important');
      b.style.setProperty('box-shadow','none','important');
    });
  });
}
let pendente=false;function aplicar(){pendente=false;cabecalhos();instalacaoEscura();}
function agenda(){if(pendente)return;pendente=true;requestAnimationFrame(aplicar);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar,{once:true});else aplicar();
new MutationObserver(m=>{if(m.some(x=>x.type==='childList'||x.attributeName==='class'))agenda();}).observe(document.getElementById('app')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
new MutationObserver(agenda).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(n=>window.addEventListener(n,agenda));
window.OBRIX_TITULOS_COMPACTOS_REAIS={refresh:agenda};
})();