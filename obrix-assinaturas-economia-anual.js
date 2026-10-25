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
/* Botões que ainda alternavam aparência no modo claro: estado totalmente fixo. */
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assPlanos button,
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assinaturaMain button[data-ass-plano],
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assinaturaMain .obrixPayMethod,
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assinaturaMain button[data-metodo],
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assinaturaMain button[data-payment-method]{background:#E2E8F0!important;background-color:#E2E8F0!important;background-image:none!important;color:#111827!important;-webkit-text-fill-color:#111827!important;border:1px solid #CBD5E1!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;opacity:1!important}
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assPlanos button:hover,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assPlanos button:focus,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assPlanos button:active,
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assinaturaMain .obrixPayMethod:hover,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assinaturaMain .obrixPayMethod:focus,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #assinaturaMain .obrixPayMethod:active{background:#E2E8F0!important;background-color:#E2E8F0!important;background-image:none!important;color:#111827!important;-webkit-text-fill-color:#111827!important;border-color:#CBD5E1!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;opacity:1!important}
/* Modo escuro, quando visto dentro do tema claro: preto estável com borda dourada. */
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #cfgTema,
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #cfgTheme,
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) [data-action="theme"],
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) .cfgThemeBtn{background:#111111!important;background-color:#111111!important;background-image:none!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;border:1.5px solid #F2B84B!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;opacity:1!important}
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #cfgTema:hover,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #cfgTema:focus,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #cfgTema:active,
html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #cfgTheme:hover,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #cfgTheme:focus,html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) #cfgTheme:active{background:#111111!important;background-color:#111111!important;background-image:none!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;border-color:#F2B84B!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;opacity:1!important}
`;
document.head.appendChild(css);
window.OBRIX_ASSINATURAS_ECONOMIA_ANUAL={aplicar:()=>{},refresh:()=>{}};
})();