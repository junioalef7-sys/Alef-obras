/* Android preview: ocultar as setas internas duplicadas sem perder a navegação. */
(()=>{'use strict';
if(window.__obrixPreviewAndroidBack2)return;window.__obrixPreviewAndroidBack2=true;
const style=document.createElement('style');style.id='obrixPreviewAndroidBack2';
style.textContent="\n/* A seta do cabeçalho é única nas páginas com navegação interna. */\n@media(max-width:760px){\n html body #app.obrixPreviewHeaderVisible #obras:not(.hidden) .obxDetalhe #obxVoltarObras,\n html body #app.obrixPreviewHeaderVisible #resumoGeralMain:not(.hidden) .rgHead .rgBack,\n html body #app.obrixPreviewHeaderVisible #financeiroMain:not(.hidden)>.hero button[aria-label=\"Voltar\"],\n html body #app.obrixPreviewHeaderVisible #estoqueMain:not(.hidden)>.hero button[aria-label=\"Voltar\"],\n html body #app.obrixPreviewHeaderVisible #diarioMain:not(.hidden)>.hero button[aria-label=\"Voltar\"]{\n display:none!important;visibility:hidden!important;pointer-events:none!important\n }\n}\n";document.head.appendChild(style);
const app=()=>document.getElementById('app');
const head=()=>app()?.querySelector(':scope>.top #obrixHeaderVoltar');
function visible(el){
 if(!el||!el.isConnected||el.classList.contains('hidden'))return false;
 const cs=getComputedStyle(el),box=el.getBoundingClientRect();
 return cs.display!=='none'&&cs.visibility!=='hidden'&&box.width>0&&box.height>0;
}
function update(){
 const a=app();if(!a)return;
 const yes=visible(head());
 if(a.classList.contains('obrixPreviewHeaderVisible')!==yes)a.classList.toggle('obrixPreviewHeaderVisible',yes);
}
document.addEventListener('click',event=>{
 const button=head();if(!button||!button.contains(event.target)||!visible(button))return;
 const inner=app()?.querySelector('#obras:not(.hidden) .obxDetalhe #obxVoltarObras');
 if(!inner)return;
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
 inner.click();requestAnimationFrame(update);
},true);
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update()})}
function init(){
 const a=app();if(!a)return;update();
 const mo=new MutationObserver(()=>schedule()),top=a.querySelector(':scope>.top');
 if(top)mo.observe(top,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 ['obras','resumoGeralMain','financeiroMain','estoqueMain','diarioMain','menuMain','inicio'].forEach(id=>{
  const el=document.getElementById(id);if(el)mo.observe(el,{attributes:true,attributeFilter:['class'],childList:true});
 });
 document.addEventListener('click',()=>{schedule();setTimeout(schedule,120)},true);
 window.addEventListener('pageshow',schedule,{passive:true});
 window.addEventListener('obrix:modules-ready',schedule,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
