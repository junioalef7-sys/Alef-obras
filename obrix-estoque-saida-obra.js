(()=>{'use strict';
if(window.__OBRIX_SAIDA_OBRA_FIX)return;window.__OBRIX_SAIDA_OBRA_FIX=true;
async function abrir(){
  if(window.OBRIX_EST_OP?.abrir)return window.OBRIX_EST_OP.abrir('saida');
  throw new Error('Módulo de saída de estoque ainda não está disponível.');
}
window.OBRIX_SAIDA_OBRA={abrir};
})();
