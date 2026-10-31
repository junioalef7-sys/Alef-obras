(()=>{'use strict';
if(window.__OBRIX_PERFORMANCE_SAFE_3110)return;window.__OBRIX_PERFORMANCE_SAFE_3110=true;
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
function aplicar(){protegerFinanceiro();protegerEquipe()}
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(n=>window.addEventListener(n,aplicar));
window.addEventListener('pageshow',aplicar);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar,{once:true});else aplicar();
window.OBRIX_PERF_SAFE={refresh:aplicar};
})();