(()=>{'use strict';
/* OBRIX refresh direto v18 */
if(window.__OBRIX_REFRESH_DIRETO_20261101)return;
window.__OBRIX_REFRESH_DIRETO_20261101=true;

let executando=null;

async function atualizarTudo(){
  if(executando)return executando;
  executando=(async()=>{
    try{
      if(typeof window.carregar==='function')await window.carregar();
      else if(typeof carregar==='function')await carregar();
    }catch(e){console.warn('OBRIX: atualização geral indisponível',e)}
    try{await window.OBRIX_FIN?.render?.(true)}catch(_){}
    try{await window.OBRIX_EQUIPE?.refresh?.()}catch(_){}
    try{window.OBRIX_OBRAS?.render?.()}catch(_){}
    try{window.OBRIX_OBRAS_FIEL?.refresh?.()}catch(_){}
    try{window.OBRIX_FIN_MARGEM?.refresh?.()}catch(_){}
    try{window.OBRIX_DASH?.paint?.()}catch(_){}
    window.dispatchEvent(new CustomEvent('obrix-dados-atualizados',{detail:{at:Date.now()}}));
  })().finally(()=>{executando=null});
  return executando;
}

function acompanharFinanceiro(){
  const form=document.getElementById('fmForm');
  if(!form)return;
  let finalizado=false;
  const obs=new MutationObserver(()=>{
    if(finalizado||!form.classList.contains('hidden'))return;
    finalizado=true;
    obs.disconnect();
    setTimeout(()=>atualizarTudo(),40);
  });
  obs.observe(form,{attributes:true,attributeFilter:['class']});
  setTimeout(()=>{if(!finalizado)obs.disconnect()},8000);
}

document.addEventListener('click',e=>{
  if(e.target.closest?.('#fmSalvar'))acompanharFinanceiro();
},true);

// O checklist sincroniza seus próprios itens. Não repetir carregar()+renders
// de todos os módulos duas vezes a cada alteração de uma única etapa.
let checklistVisualTimer=null;
document.addEventListener('change',e=>{
  if(!e.target.closest?.('[data-check-range]'))return;
  clearTimeout(checklistVisualTimer);
  checklistVisualTimer=setTimeout(()=>{
    window.dispatchEvent(new CustomEvent('obrix:progresso-atualizado'));
  },450);
},true);

window.OBRIX_REFRESH_ALL=atualizarTudo;
})();