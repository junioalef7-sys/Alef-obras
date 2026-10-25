(()=>{'use strict';
if(window.__OBRIX_NO_GOLD_FINAL)return;window.__OBRIX_NO_GOLD_FINAL=true;
const STYLE_ID='obrix-no-gold-final-style';
const css=`
html[data-theme="dark"] #app button,body.dark #app button,html[data-theme="dark"] .modalBack button,body.dark .modalBack button{transition:none!important;animation:none!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] #app button.obrixNoGoldDanger,body.dark #app button.obrixNoGoldDanger,html[data-theme="dark"] .modalBack button.obrixNoGoldDanger,body.dark .modalBack button.obrixNoGoldDanger{background:#0d1722!important;background-color:#0d1722!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid #ef4444!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] #app button.obrixNoGoldNeutral,body.dark #app button.obrixNoGoldNeutral,html[data-theme="dark"] .modalBack button.obrixNoGoldNeutral,body.dark .modalBack button.obrixNoGoldNeutral{background:#0d1722!important;background-color:#0d1722!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#293b4d!important;box-shadow:none!important;text-shadow:none!important}
`;
function style(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;(document.head||document.documentElement).appendChild(s)}
function scan(root=document){root.querySelectorAll?.('#app button,.modalBack button').forEach(b=>{const tx=String(b.textContent||'').replace(/\s+/g,' ').trim();const danger=/\b(apagar|excluir|remover|deletar)\b/i.test(tx)||b.matches('[data-check-del],.danger,.perigo,.orcPerigo,.diarioPerigo,.excluir,.accountDeleteBtn,#cfgExcluirConta');b.classList.toggle('obrixNoGoldDanger',danger);if(danger){b.classList.remove('obrixApprovedGold','obrixApprovedSecondary','obrixPermanentGoldText');b.removeAttribute('data-obrix-approved-color')}const vale=/\bvale(s)?\b/i.test(tx);b.classList.toggle('obrixNoGoldNeutral',vale)})}
let queued=false;function apply(){queued=false;style();scan()}function queue(){if(queued)return;queued=true;requestAnimationFrame(apply)}
style();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
const app=document.getElementById('app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});
window.addEventListener('obrix:modules-ready',queue);window.addEventListener('obrix:modules-online-ready',queue);window.addEventListener('obrix:grupo-pronto',queue);window.addEventListener('obrix:feature-pronto',queue);window.addEventListener('pageshow',queue);
window.OBRIX_NO_GOLD_FINAL={apply:queue};
})();