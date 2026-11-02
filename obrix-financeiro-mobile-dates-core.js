(()=>{
'use strict';
if(window.__OBRIX_FIN_MOBILE_DATES_CORE)return;
window.__OBRIX_FIN_MOBILE_DATES_CORE=true;
const css=document.createElement('style');
css.id='obrix-fin-mobile-dates-core-style';
css.textContent=`@media(max-width:620px){#fmFiltrosPanel .fmFiltrosGrid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;width:100%!important;max-width:100%!important;overflow:visible!important}#fmFiltrosPanel .fmFiltrosGrid>label{min-width:0!important;max-width:100%!important;width:100%!important}#fmFiltrosPanel .fmFiltrosGrid>label:not(.obrixDateLabel){grid-column:1/-1!important}#fmFiltrosPanel .fmFiltrosGrid>label.obrixDateLabel{grid-column:auto!important;overflow:hidden!important}#fmFiltroDataInicio,#fmFiltroDataFim{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;inline-size:100%!important;max-inline-size:100%!important;min-inline-size:0!important;height:42px!important;min-height:42px!important;box-sizing:border-box!important;font-size:12px!important;padding:0 4px!important;letter-spacing:-.25px!important;overflow:hidden!important}}`;
function aplicar(){const a=document.getElementById('fmFiltroDataInicio'),b=document.getElementById('fmFiltroDataFim');for(const el of [a,b]){if(!el)continue;const lab=el.closest('label');if(lab)lab.classList.add('obrixDateLabel')}if((a||b)&&css.parentNode!==document.head)document.head.appendChild(css);else if(css.parentNode===document.head&&document.head.lastElementChild!==css)document.head.appendChild(css)}
const obs=new MutationObserver(()=>requestAnimationFrame(aplicar));obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('resize',aplicar);window.addEventListener('pageshow',aplicar);document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b&&(b.textContent||'').trim()==='Financeiro')setTimeout(aplicar,80)},true);
setTimeout(aplicar,50);setTimeout(aplicar,300);
window.OBRIX_FIN_MOBILE_DATES_CORE={refresh:aplicar};
})();
