(()=>{'use strict';
if(window.__OBRIX_ORC_ITENS_TOPO_V3)return;window.__OBRIX_ORC_ITENS_TOPO_V3=true;
let salvando=false,timerSalvar=0;
function moverNovoParaTopo(){const box=document.getElementById('orcItens');if(!box||box.children.length<2)return;const novo=box.lastElementChild;if(!novo?.classList.contains('orcItem'))return;box.prepend(novo);novo.querySelector('.desc')?.focus()}
function prepararObservacoes(){document.querySelectorAll('#orcItens .orcItem .obs').forEach(c=>{if(!c.placeholder||c.placeholder==='Opcional')c.placeholder='Esta observação aparecerá logo abaixo da descrição do serviço no orçamento/PDF.'})}
function destravarSalvar(force=false){const b=document.getElementById('orcSalvar');if(!b)return;if(force||!salvando){b.disabled=false;b.removeAttribute('disabled');if(b.dataset.obrixTextoSalvar){b.textContent=b.dataset.obrixTextoSalvar;delete b.dataset.obrixTextoSalvar}}}
function finalizarSalvar(){salvando=false;clearTimeout(timerSalvar);timerSalvar=0;destravarSalvar(true)}
function instalar(){prepararObservacoes();if(!salvando)destravarSalvar()}
document.addEventListener('click',e=>{
  if(e.target.closest?.('#orcAddItem')){setTimeout(()=>{moverNovoParaTopo();prepararObservacoes()},0);return}
  const b=e.target.closest?.('#orcSalvar');if(!b)return;
  const salvar=window.OBRIX_ORC_PROFISSIONAL?.salvar;
  if(typeof salvar!=='function'){destravarSalvar(true);return}
  e.preventDefault();e.stopImmediatePropagation();
  if(salvando)return;
  salvando=true;
  b.dataset.obrixTextoSalvar=b.textContent||'Salvar orçamento';
  b.disabled=true;b.textContent='Salvando...';
  timerSalvar=setTimeout(()=>{if(salvando)finalizarSalvar()},20000);
  Promise.resolve().then(()=>salvar()).catch(()=>{}).finally(finalizarSalvar);
},true);
const obs=new MutationObserver(()=>instalar());
if(document.body)obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
else document.addEventListener('DOMContentLoaded',()=>obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']}));
setInterval(()=>{if(!salvando)destravarSalvar();prepararObservacoes()},1500);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,50));else setTimeout(instalar,50);
})();