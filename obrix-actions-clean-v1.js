(()=>{'use strict';
if(window.__OBRIX_ACTIONS_CLEAN_V1)return;window.__OBRIX_ACTIONS_CLEAN_V1=true;
const ID='obrix-actions-clean-v1-style';
const css=`
/* Controles estáveis: nenhuma animação ou troca de fundo em botões. */
#app button,#app .btn,#app [role="button"],.modalBack button{transition:none!important;animation:none!important;filter:none!important;text-shadow:none!important}
/* Nenhum botão destrutivo usa fundo vermelho. */
#app button.danger,#app button.perigo,#app button.orcPerigo,#app button.diarioPerigo,#app button.excluir,#app button.obrixNoGoldDanger,#app .accountDeleteBtn,#cfgExcluirConta,.modalBack button.excluir,.modalBack button.danger,.accountDeleteModal .excluir{background:transparent!important;background-color:transparent!important;background-image:none!important;color:#b91c1c!important;-webkit-text-fill-color:#b91c1c!important;border:1.5px solid #dc2626!important;box-shadow:none!important;filter:none!important}
#app button.danger:is(:hover,:focus,:active),#app button.perigo:is(:hover,:focus,:active),#app button.orcPerigo:is(:hover,:focus,:active),#app button.diarioPerigo:is(:hover,:focus,:active),#app button.excluir:is(:hover,:focus,:active),#app button.obrixNoGoldDanger:is(:hover,:focus,:active),#cfgExcluirConta:is(:hover,:focus,:active),.modalBack button.excluir:is(:hover,:focus,:active),.accountDeleteModal .excluir:is(:hover,:focus,:active){background:transparent!important;background-color:transparent!important;background-image:none!important;color:#b91c1c!important;-webkit-text-fill-color:#b91c1c!important;border-color:#dc2626!important;box-shadow:none!important;filter:none!important}
/* Apagar de Diário e Orçamento segue cartão neutro, sem vermelho. */
#diarioMain .obrixApagarRegistro,#orcamentosMain .obrixApagarRegistro{background:#fff!important;background-color:#fff!important;background-image:none!important;color:#111827!important;-webkit-text-fill-color:#111827!important;border:1px solid #cbd5e1!important;border-radius:10px!important;box-shadow:none!important;font-weight:800!important}
html[data-theme="dark"] #diarioMain .obrixApagarRegistro,html[data-theme="dark"] #orcamentosMain .obrixApagarRegistro,body.dark #diarioMain .obrixApagarRegistro,body.dark #orcamentosMain .obrixApagarRegistro{background:#0d1722!important;background-color:#0d1722!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#293b4d!important}
`;
function style(){if(document.getElementById(ID))return;const s=document.createElement('style');s.id=ID;s.textContent=css;(document.head||document.documentElement).appendChild(s)}
function clean(){
  style();
  document.querySelectorAll('#obras .actions button,#orcamentosMain .orcActions button').forEach(b=>{if(/^enviar$/i.test(String(b.textContent||'').trim()))b.remove()});
  document.querySelectorAll('#diarioMain .diarioItem,#orcamentosMain .orcCard').forEach(card=>{
    const actions=card.querySelector('.diarioActions,.orcActions');if(!actions)return;
    const old=actions.querySelector('.excluir');if(!old)return;
    old.textContent='Apagar';old.classList.remove('excluir','danger','perigo','orcPerigo','diarioPerigo','obrixNoGoldDanger','obrixDarkDanger');old.classList.add('obrixApagarRegistro');
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(n=>window.addEventListener(n,()=>setTimeout(clean,0)));
document.addEventListener('click',e=>{const h=e.target.closest?.('#diarioMain .diarioItemHead,#orcamentosMain .orcCardHead');if(h)setTimeout(clean,0)},true);
window.OBRIX_ACTIONS_CLEAN_V1={apply:clean};
})();