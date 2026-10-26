(()=>{'use strict';
if(window.__OBRIX_ACTIONS_CLEAN_V1)return;window.__OBRIX_ACTIONS_CLEAN_V1=true;
function clean(){
  document.querySelectorAll('#obras .actions button,#orcamentosMain .orcActions button').forEach(b=>{if(/^enviar$/i.test(String(b.textContent||'').trim()))b.remove()});
  document.querySelectorAll('#diarioMain .diarioItem,#orcamentosMain .orcCard').forEach(card=>{
    const actions=card.querySelector('.diarioActions,.orcActions');if(!actions)return;
    const old=actions.querySelector('.excluir');if(!old)return;
    old.textContent='Apagar';
    old.classList.remove('excluir','danger','perigo','orcPerigo','diarioPerigo','obrixNoGoldDanger','obrixDarkDanger');
    old.classList.add('obrixApagarRegistro');
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(n=>window.addEventListener(n,()=>setTimeout(clean,0)));
document.addEventListener('click',e=>{const h=e.target.closest?.('#diarioMain .diarioItemHead,#orcamentosMain .orcCardHead');if(h)setTimeout(clean,0)},true);
window.OBRIX_ACTIONS_CLEAN_V1={apply:clean};
})();