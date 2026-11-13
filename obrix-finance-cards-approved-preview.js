/* OBRIX — preview exclusivamente visual do Financeiro aprovado */
(()=>{'use strict';
const platform=document.currentScript?.getAttribute('data-fin-platform');
if(platform!=='android'&&platform!=='iphone')return;
const flag='__obrix_fin_card_preview_20261112_'+platform;
if(window[flag])return;window[flag]=true;
document.documentElement.dataset.obrixPreviewFinPlatform=platform;
const style=document.createElement('style');
style.id='obrix-finance-cards-approved-'+platform;
style.textContent="\n/* Transações Financeiro: cartões externos e mini-faixas delineadas. */\nhtml[data-obrix-preview-fin-platform] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"].card.item{\n background:var(--ob-surface,#F8FAFC)!important;\n background-color:var(--ob-surface,#F8FAFC)!important;\n background-image:none!important;\n border:1px solid var(--ob-border,#CBD5E1)!important;\n border-radius:18px!important;box-shadow:none!important;\n box-sizing:border-box!important;min-width:0!important;max-width:100%!important;\n}\nhtml[data-obrix-preview-fin-platform] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > .grid > .mini{\n background:transparent!important;background-color:transparent!important;\n background-image:none!important;\n border:1px solid var(--ob-border,#CBD5E1)!important;\n border-radius:12px!important;box-shadow:none!important;\n box-sizing:border-box!important;min-width:0!important;\n}\nhtml[data-obrix-preview-fin-platform][data-theme=\"light\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"][data-tipo=\"receita\"] .mini>b{color:#15803D!important;-webkit-text-fill-color:#15803D!important}\nhtml[data-obrix-preview-fin-platform][data-theme=\"light\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"][data-tipo=\"despesa\"] .mini>b{color:#B91C1C!important;-webkit-text-fill-color:#B91C1C!important}\nhtml[data-obrix-preview-fin-platform][data-theme=\"dark\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"][data-tipo=\"receita\"] .mini>b{color:#4ADE80!important;-webkit-text-fill-color:#4ADE80!important}\nhtml[data-obrix-preview-fin-platform][data-theme=\"dark\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"][data-tipo=\"despesa\"] .mini>b{color:#FF6B6B!important;-webkit-text-fill-color:#FF6B6B!important}\n/* Tamanho e posições exclusivos do esboço Android. */\n@media(max-width:760px){\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"].card.item{\n  padding:15px!important;margin:0 0 12px!important;\n }\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > h3{\n  font-size:18px!important;line-height:1.3!important;\n  margin:0 0 5px!important;overflow-wrap:break-word!important;\n }\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > .muted{\n  font-size:14px!important;line-height:1.38!important;\n  margin:0 0 9px!important;overflow-wrap:break-word!important;\n }\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > .grid{\n  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;\n  width:100%!important;max-width:100%!important;\n  gap:8px!important;margin:8px 0 0!important;\n }\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > .grid > .mini{\n  grid-column:1!important;grid-row:auto!important;\n  min-width:0!important;max-width:100%!important;width:100%!important;\n  display:flex!important;flex-direction:column!important;\n  align-items:flex-start!important;justify-content:center!important;\n  min-height:61px!important;padding:10px 9px 10px 45px!important;\n }\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > .grid > .mini > small{\n  display:block!important;align-self:flex-start!important;\n  font-size:14px!important;font-weight:700!important;line-height:1.2!important;\n  padding:0!important;margin:0!important;max-width:100%!important;\n  text-align:left!important;white-space:nowrap!important;\n }\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > .grid > .mini > b{\n  display:block!important;align-self:flex-start!important;\n  position:static!important;width:auto!important;max-width:100%!important;\n  font-size:clamp(14px,3.9vw,18px)!important;font-weight:900!important;\n  line-height:1.25!important;margin:2px 0 0!important;\n  text-align:left!important;white-space:nowrap!important;\n }\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > .actions{\n  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;\n  width:100%!important;max-width:100%!important;gap:9px!important;\n  margin:10px 0 0!important;\n }\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > .actions > button{\n  width:100%!important;max-width:100%!important;min-width:0!important;\n  grid-column:auto!important;\n  min-height:42px!important;padding:8px 10px!important;\n  border-radius:12px!important;font-size:16px!important;font-weight:800!important;\n  background:var(--ob-surface-2,#FFFFFF)!important;\n  border:1px solid var(--ob-border,#CBD5E1)!important;\n }\n html[data-obrix-preview-fin-platform=\"android\"] body #app #financeiroMain #fmLista > [data-fin-card=\"1\"] > .actions:has(> button:only-child) > button{\n  grid-column:1/-1!important\n }\n}\n";
document.head.appendChild(style);
function apply(){
 if(platform==='iphone'&&!matchMedia('(max-width:760px)').matches)return;
 const cards=document.querySelectorAll('#app #financeiroMain #fmLista > [data-fin-card="1"].card.item');
 for(const card of cards){
  card.style.setProperty('background','var(--ob-surface,#F8FAFC)','important');
  card.style.setProperty('background-color','var(--ob-surface,#F8FAFC)','important');
  card.style.setProperty('border','1px solid var(--ob-border,#CBD5E1)','important');
  card.style.setProperty('border-radius','18px','important');
  const mini=card.querySelector(':scope > .grid > .mini');
  if(mini){
   mini.style.setProperty('background','transparent','important');
   mini.style.setProperty('background-color','transparent','important');
   mini.style.setProperty('border','1px solid var(--ob-border,#CBD5E1)','important');
   mini.style.setProperty('border-radius','12px','important');
  }
 }
}
let pending=false;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply()})}
function boot(){
 const app=document.getElementById('app');if(!app)return;
 apply();
 new MutationObserver(records=>{
  if(records.some(r=>r.type==='childList'&&(
   r.target.id==='fmLista'||r.target.closest?.('#fmLista')||
   [...r.addedNodes].some(n=>n.nodeType===1&&
    (n.matches?.('#financeiroMain,#fmLista,[data-fin-card]')||n.querySelector?.('[data-fin-card]')))
  )))schedule();
 }).observe(app,{childList:true,subtree:true});
 window.addEventListener('obrix:theme-applied',schedule,{passive:true});
 window.addEventListener('pageshow',schedule,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();