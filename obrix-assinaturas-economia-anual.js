(()=>{
'use strict';
if(window.__OBRIX_ASSINATURAS_ECONOMIA_ANUAL)return;window.__OBRIX_ASSINATURAS_ECONOMIA_ANUAL=true;
const css=document.createElement('style');css.id='obrixLightStableNoFlicker';css.textContent=`
/* Online claro estático: sem reescrita de DOM durante navegação. */
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) body,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app main,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app .page,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app .view,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app .screen{background:#EEF2F6!important;background-color:#EEF2F6!important;color:#111827!important}
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app :is(.card,.panel,.box,.section,.bloco,.wrap,.forObra,.forCheck,.forKpi,.kpi,.mini,.tile,.menuCard,.menuItem,.assPlano){background:#FFFFFF!important;background-color:#FFFFFF!important;background-image:none!important;border-color:#D7DEE8!important;color:#111827!important}
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app :is(.card,.panel,.box,.section,.bloco,.wrap,.forObra,.forCheck,.forKpi,.kpi,.mini,.tile,.menuCard,.menuItem,.assPlano) :is(.card,.panel,.box,.section,.bloco,.forCheck,.forKpi,.kpi,.mini,.tile,.menuCard,.menuItem){background:#F5F7FA!important;background-color:#F5F7FA!important;background-image:none!important;border-color:#D7DEE8!important;color:#111827!important}
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app *,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app *::before,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #app *::after{transition:none!important;animation:none!important}
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #cfgExcluirConta{background:transparent!important;background-color:transparent!important;background-image:none!important;color:#DC2626!important;-webkit-text-fill-color:#DC2626!important;border:1.5px solid #DC2626!important;box-shadow:none!important;text-shadow:none!important;filter:none!important}
`;
document.head.appendChild(css);
/* Economia anual agora é apenas visual por CSS/HTML existente. Não toca nos cards após carregarem. */
window.OBRIX_ASSINATURAS_ECONOMIA_ANUAL={aplicar:()=>{},refresh:()=>{}};
})();