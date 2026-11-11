(()=>{'use strict';if(window.__OBRIX_EQUIPE_PAGAMENTO_COMPAT)return;window.__OBRIX_EQUIPE_PAGAMENTO_COMPAT=true;
// OBRIX_EQUIPE_MAIN fornece o pagamento atual; não sobrescrever com RPC antigo que bloqueia vales entre obras.
})();

(()=>{if(document.querySelector('script[data-obrix-equipe-lote]'))return;const s=document.createElement('script');s.dataset.obrixEquipeLote='1';s.src='./obrix-equipe-pagamento-lote.js?v=20261018lote1';document.head.appendChild(s)})();
(()=>{if(document.querySelector('script[data-obrix-equipe-dados]'))return;const s=document.createElement('script');s.dataset.obrixEquipeDados='1';s.src='./obrix-equipe-checklist-dados.js?v=20261018dados1';document.head.appendChild(s)})();
