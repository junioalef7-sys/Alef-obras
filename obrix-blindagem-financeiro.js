(()=>{'use strict';
// Blindagem: carrega somente integrações necessárias. O visual aprovado e os ajustes atuais de Obras
// são carregados uma única vez pelo obrix.html; não carregar overlays antigos que possam sobrescrevê-los.
['./obrix-financeiro-protecao-automaticos.js?v=d943c467','./obrix-equipe-estorno-pagamentos.js?v=1ee50dd2','./obrix-obras-interligacao.js?v=20261021link4'].forEach(src=>{const s=document.createElement('script');s.src=src;s.defer=true;document.body.appendChild(s)});
})();