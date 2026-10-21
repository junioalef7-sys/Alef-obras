(()=>{'use strict';
// Versão estável: não injeta nenhum overlay ou sincronizador experimental no módulo Obras.
// Mantém somente as proteções independentes do Financeiro e Equipe.
['./obrix-financeiro-protecao-automaticos.js?v=d943c467','./obrix-equipe-estorno-pagamentos.js?v=1ee50dd2'].forEach(src=>{const s=document.createElement('script');s.src=src;s.defer=true;document.body.appendChild(s)});
})();