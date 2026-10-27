(()=>{
'use strict';
if(window.__OBRIX_FIN_VISUAL)return;window.__OBRIX_FIN_VISUAL=true;
function aplicar(){
 const main=document.getElementById('financeiroMain');if(!main)return;
 const rec=document.getElementById('fmRecebido'),des=document.getElementById('fmDespesas'),res=document.getElementById('fmResultado');
 if(rec)rec.classList.add('obxFinRecebido');if(des)des.classList.add('obxFinDespesa');if(res)res.classList.add('obxFinResultado');
 main.querySelectorAll('[data-fin-card="1"]').forEach(card=>{
   const tipo=card.dataset.tipo;
   const valor=card.querySelector('.mini b');
   if(valor){valor.classList.toggle('obxFinValorDespesa',tipo==='despesa');valor.classList.toggle('obxFinValorReceita',tipo==='receita')}
   const btn=card.querySelector('[data-fin="excluir"]');if(btn){btn.textContent='Apagar';btn.classList.add('obxFinApagar')}
 });
}
const css=document.createElement('style');css.id='obrix-financeiro-visual-style';css.textContent=`
#financeiroMain #fmRecebido.obxFinRecebido{color:#35c759!important;-webkit-text-fill-color:#35c759!important}
#financeiroMain #fmDespesas.obxFinDespesa{color:#ff3b30!important;-webkit-text-fill-color:#ff3b30!important}
#financeiroMain #fmResultado.obxFinResultado{color:#3b82f6!important;-webkit-text-fill-color:#3b82f6!important}
#financeiroMain [data-fin-card="1"][data-tipo="despesa"] .mini b,.obxFinValorDespesa{color:#ff3b30!important;-webkit-text-fill-color:#ff3b30!important}
#financeiroMain [data-fin-card="1"][data-tipo="receita"] .mini b,.obxFinValorReceita{color:#35c759!important;-webkit-text-fill-color:#35c759!important}
#financeiroMain .actions .obxFinApagar{background:transparent!important;color:#ff3b30!important;-webkit-text-fill-color:#ff3b30!important;border:1.5px solid #ff3b30!important;box-shadow:none!important}
`;
document.head.appendChild(css);
const init=()=>{aplicar();const main=document.getElementById('financeiroMain');if(main&&!main.__obxFinVisual){main.__obxFinVisual=true;new MutationObserver(()=>requestAnimationFrame(aplicar)).observe(main,{childList:true,subtree:true})}[100,400,900,1800].forEach(ms=>setTimeout(aplicar,ms))};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.OBRIX_FIN_VISUAL={refresh:aplicar};
})();