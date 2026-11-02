(()=>{
'use strict';
if(window.__OBRIX_RESUMO_GERAL_INTEGRACAO)return;window.__OBRIX_RESUMO_GERAL_INTEGRACAO=true;
function normalizarValorBusca(v){return String(v||'').replace(/(\d)[.](?=\d{3}(?:\D|$))/g,'$1').replace(/(\d),(?=\d{2}(?:\D|$))/g,'$1.')}
document.addEventListener('click',e=>{const b=e.target.closest?.('#rgVoltarMenu');if(!b)return;e.preventDefault();e.stopImmediatePropagation();document.getElementById('resumoGeralMain')?.classList.add('hidden');window.OBRIX_MENU?.open?.()},true);
document.addEventListener('input',e=>{const inp=e.target?.closest?.('#rgBusca');if(!inp)return;const n=normalizarValorBusca(inp.value);if(n!==inp.value){const pos=inp.selectionStart;inp.value=n;try{inp.setSelectionRange(pos,pos)}catch(_){}}},true);
})();