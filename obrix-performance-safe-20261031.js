(()=>{'use strict';
if(window.__OBRIX_PERFORMANCE_SAFE_3110)return;window.__OBRIX_PERFORMANCE_SAFE_3110=true;
const grupos=new Set(['equipe','obras','financeiro','estoque']);
const recursos=new Set(['diario','orcamentos','relatorios','documentos','notas','backup','assinatura','config','offline']);
function appAberto(){const app=document.getElementById('app'),login=document.getElementById('login');return !!(app&&!app.classList.contains('hidden')&&(!login||login.classList.contains('hidden')))}
function idle(fn,timeout=1800){if('requestIdleCallback'in window)return requestIdleCallback(fn,{timeout});return setTimeout(fn,350)}
function protegerFinanceiro(){
  const api=window.OBRIX_FIN;if(!api||typeof api.render!=='function'||api.render.__obrixPerfSafe)return;
  const original=api.render;
  function renderSeguro(){
    const root=document.getElementById('financeiroMain');
    if(root&&root.classList.contains('hidden'))return Promise.resolve(false);
    return original.apply(this,arguments);
  }
  renderSeguro.__obrixPerfSafe=true;renderSeguro.__original=original;api.render=renderSeguro;
}
function protegerEquipe(){
  const api=window.OBRIX_EQUIPE;if(!api||typeof api.refresh!=='function'||api.refresh.__obrixPerfSafe)return;
  const original=api.refresh;let pendente=null;
  function refreshSeguro(){
    if(pendente)return pendente;
    const self=this,args=arguments;
    pendente=Promise.resolve().then(()=>original.apply(self,args)).finally(()=>{pendente=null});
    return pendente;
  }
  refreshSeguro.__obrixPerfSafe=true;refreshSeguro.__original=original;api.refresh=refreshSeguro;
}
function coalescer(obj,chave,marca){
  const fn=obj?.[chave];if(typeof fn!=='function'||fn[marca])return;
  let quadro=0,ctx,args;
  function seguro(){ctx=this;args=arguments;if(quadro)return;quadro=requestAnimationFrame(()=>{quadro=0;const c=ctx,a=args;ctx=args=null;try{fn.apply(c,a)}catch(e){console.warn('OBRIX desempenho',chave,e)}})}
  seguro[marca]=true;seguro.__original=fn;obj[chave]=seguro;
}
function protegerRotinasVisuais(){
  coalescer(window.OBRIX_VISUAL_PADRAO_FINAL,'refresh','__obrixPerfVisual');
  coalescer(window.OBRIX_ACTIONS_CLEAN_V1,'apply','__obrixPerfActions');
  coalescer(window.OBRIX_UI_STABILITY,'repairScroll','__obrixPerfScroll');
}
function carregarRegistrosEquipe(){
  if(window.__OBRIX_EQUIPE_REGISTROS_EXCLUIR)return;
  const caminho='/obrix-equipe-registros-excluir.js';
  if([...document.scripts].some(s=>{try{return new URL(s.src,location.href).pathname===caminho}catch(_){return false}}))return;
  const s=document.createElement('script');s.src='./obrix-equipe-registros-excluir.js?v=20261031bonus2';s.async=true;s.dataset.obrixPerf='registros-equipe';document.body.appendChild(s);
}
function alvoDoToque(el){
  const go=el.closest?.('[data-go],[data-off-go]');if(go)return String(go.dataset.go||go.dataset.offGo||'');
  const b=el.closest?.('button');if(!b)return '';
  if(b.id==='bEquipe')return'equipe';if(b.id==='bInicio'||b.id==='bMenu')return'';
  const on=String(b.getAttribute('onclick')||'');
  if(/OBRIX_FIN/.test(on))return'financeiro';if(/OBRIX_EST/.test(on))return'estoque';
  const m=on.match(/abrir\(['"]([^'"]+)/);if(m)return m[1];
  const t=String(b.textContent||'').trim().toLowerCase();
  if(t==='financeiro')return'financeiro';if(t==='equipe')return'equipe';if(t==='obras')return'obras';if(t==='estoque')return'estoque';
  return'';
}
function aquecerAlvo(nome){
  const l=window.OBRIX_POS_LOGIN_LOADER;if(!l||!navigator.onLine||!nome)return;
  if(grupos.has(nome))Promise.resolve(l.loadGroup?.(nome)).catch(()=>{});
  else if(recursos.has(nome))Promise.resolve(l.loadFeature?.(nome)).catch(()=>{});
}
let aquecendo=false;
function aquecerPrincipais(){
  if(aquecendo||!navigator.onLine||!appAberto())return;
  const l=window.OBRIX_POS_LOGIN_LOADER;if(!l?.loadGroup)return;
  aquecendo=true;const fila=['equipe','financeiro','obras','estoque'];let i=0;
  const proximo=()=>{
    if(!appAberto()||!navigator.onLine){aquecendo=false;return}
    const nome=fila[i++];if(!nome){aquecendo=false;return}
    Promise.resolve(l.loadGroup(nome)).catch(()=>{}).finally(()=>idle(proximo,2200));
  };
  idle(proximo,1400);
}
function aplicar(){protegerFinanceiro();protegerEquipe();protegerRotinasVisuais();carregarRegistrosEquipe()}
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(n=>window.addEventListener(n,()=>{aplicar();if(n==='obrix:modules-ready'||n==='obrix:modules-online-ready')aquecerPrincipais()}));
window.addEventListener('pageshow',()=>{aplicar();idle(aquecerPrincipais,1200)});
window.addEventListener('online',()=>idle(aquecerPrincipais,1000));
document.addEventListener('pointerdown',e=>{const nome=alvoDoToque(e.target);if(nome)aquecerAlvo(nome)},{capture:true,passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{aplicar();idle(aquecerPrincipais,1400)},{once:true});else{aplicar();idle(aquecerPrincipais,1400)}
window.OBRIX_PERF_SAFE={refresh:aplicar,warm:aquecerPrincipais};
})();