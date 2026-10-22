(()=>{'use strict';
if(window.__OBRIX_ORC_UX_V10)return;window.__OBRIX_ORC_UX_V10=true;
function cssApp(){if(document.getElementById('obrixOrcUxV10'))return;const s=document.createElement('style');s.id='obrixOrcUxV10';s.textContent=`#orcamentosMain .orcItem .qtd,#orcamentosMain .orcItem .vu{font-weight:900!important}#orcamentosMain .orcItem input.obs{min-height:56px!important;height:56px!important;line-height:1.35!important;padding:9px 10px!important}`;document.head.appendChild(s)}
function fit(o){if(!o||o.tagName!=='INPUT'||!o.matches?.('#orcamentosMain .orcItem input.obs'))return;const min=56;o.style.setProperty('height',min+'px','important')}
function apply(){cssApp();document.querySelectorAll('#orcamentosMain .orcItem input.obs').forEach(fit)}
document.addEventListener('input',e=>{if(e.target?.matches?.('#orcamentosMain .orcItem input.obs'))fit(e.target)},true);
document.addEventListener('focusin',e=>{if(e.target?.matches?.('#orcamentosMain .orcItem input.obs'))requestAnimationFrame(()=>fit(e.target))},true);
const mo=new MutationObserver(()=>apply());if(document.body)mo.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>{apply();mo.observe(document.body,{childList:true,subtree:true})},{once:true});
function decorate(w){let n=0;const t=setInterval(()=>{n++;try{if(!w||w.closed){clearInterval(t);return}if(!w.document.querySelector('.sheet')){if(n>100)clearInterval(t);return}clearInterval(t);if(!w.document.getElementById('obrixOrcUxV10Pdf')){const s=w.document.createElement('style');s.id='obrixOrcUxV10Pdf';s.textContent='tbody td:nth-child(3),tbody td:nth-child(4){font-weight:900!important}';w.document.head.appendChild(s)}}catch(_){if(n>100)clearInterval(t)}},80)}
const nativeOpen=window.open?.bind(window);if(nativeOpen&&!window.open.__obrixOrcUxV10){const f=function(){const w=nativeOpen(...arguments);if(w)decorate(w);return w};f.__obrixOrcUxV10=true;window.open=f}
apply();window.OBRIX_ORC_UX_V10={apply,fit,decorate};
})();