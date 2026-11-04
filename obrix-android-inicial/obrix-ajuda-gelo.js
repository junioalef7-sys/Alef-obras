(()=>{'use strict';if(window.__OBRIX_AJUDA_GELO)return;window.__OBRIX_AJUDA_GELO=true;
const s=document.createElement('style');s.id='obrix-ajuda-gelo-style';s.textContent=`
html[data-theme="light"] #suporteMain,html[data-theme="light"] #suporteMain .hero,html[data-theme="light"] #suporteMain .card,html[data-theme="light"] #suporteMain .sectionHead,html[data-theme="light"] #suporteMain .supResumo>div,html[data-theme="light"] #suporteMain .supTicket,html[data-theme="light"] #suporteMain .supMsg,html[data-theme="light"] #suporteMain .supAdminActions button,html[data-theme="light"] #suporteMain .supTabs button,html[data-theme="light"] #suporteMain input,html[data-theme="light"] #suporteMain select,html[data-theme="light"] #suporteMain textarea{background:#eef2f6!important;background-color:#eef2f6!important;background-image:none!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5df!important;box-shadow:none!important}
html[data-theme="light"] #suporteMain .supTabs button.active{background:#e5eaf0!important;background-color:#e5eaf0!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5df!important}
#suporteMain #supVoltar{display:none!important}
`;
document.head.appendChild(s);
function aplicar(){const m=document.getElementById('suporteMain');if(!m)return;const b=document.getElementById('supVoltar');if(b)b.remove();if(document.head.lastElementChild!==s)document.head.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar,{once:true});else aplicar();
new MutationObserver(aplicar).observe(document.body,{childList:true,subtree:true});
['obrix:modules-ready','obrix:modules-online-ready','obrix:feature-pronto','pageshow'].forEach(x=>window.addEventListener(x,aplicar));
window.OBRIX_AJUDA_GELO={refresh:aplicar};})();