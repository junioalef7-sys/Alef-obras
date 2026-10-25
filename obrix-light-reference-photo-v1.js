(()=>{'use strict';
if(window.__OBRIX_LIGHT_REFERENCE_PHOTO_V4)return;window.__OBRIX_LIGHT_REFERENCE_PHOTO_V4=true;
const offline=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const S='html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) body:not(.dark)';
const style=document.createElement('style');style.id='obrixLightReferencePhotoV4';style.textContent=`
${S}{--obrix-page:#EEF2F6;--obrix-card:#fff;--obrix-inner:#F5F7FA;--obrix-text:#111827;--obrix-muted:#64748B;--obrix-border:#D7DEE8;background:#EEF2F6!important;color:#111827!important}
${S} #app,${S} main,${S} .page,${S} .view,${S} .screen,${S} [data-page],${S} #menu,${S} #equipeMain,${S} #financeiroMain,${S} #obrasMain,${S} #inicio,${S} #home{background:#EEF2F6!important;background-image:none!important;color:#111827!important}
${S} #login,${S} .login-card,${S} .auth-card{background:#fff!important;background-image:none!important;color:#111827!important;border-color:#D7DEE8!important;box-shadow:none!important}
${S} #login h1,${S} #login h2,${S} #login h3,${S} #login label,${S} #login p{color:#111827!important;-webkit-text-fill-color:#111827!important}
${S} #app .card,${S} #app .panel,${S} #app .box,${S} #app .section,${S} #app .bloco,${S} #app .wrap,${S} #app .forObra,${S} #app .forCheck,${S} #app .equipeCard,${S} #app .obraCard,${S} #app .financeCard{background:#fff!important;background-image:none!important;border-color:#D7DEE8!important;color:#111827!important;box-shadow:none!important}
${S} #app .card .card,${S} #app .card .mini,${S} #app .card .kpi,${S} #app .card .tile,${S} #app .panel .card,${S} #app .panel .mini,${S} #app .panel .kpi,${S} #app .panel .tile,${S} #app .box .card,${S} #app .box .mini,${S} #app .box .kpi,${S} #app .box .tile,${S} #app .section .card,${S} #app .section .mini,${S} #app .section .kpi,${S} #app .section .tile,${S} #app .bloco .card,${S} #app .bloco .mini,${S} #app .bloco .kpi,${S} #app .bloco .tile,${S} #app .forKpi,${S} #app .forCheckGrid .forKpi{background:#F5F7FA!important;background-image:none!important;border-color:#D7DEE8!important;color:#111827!important;box-shadow:none!important}
${S} #menu{background:#EEF2F6!important}
${S} #menu>.card,${S} #menu>.panel,${S} #menu>.box,${S} #menu .menuCard{background:#fff!important;background-image:none!important;border-color:#D7DEE8!important;color:#111827!important;-webkit-text-fill-color:#111827!important}
${S} #menu .menuItem,${S} #menu .tile,${S} #menu .menuCard button{background:#fff!important;background-color:#fff!important;background-image:none!important;color:#111827!important;-webkit-text-fill-color:#111827!important;border-color:#D7DEE8!important}
${S} #menu .menuCard .card,${S} #menu .menuCard .tile{background:#F5F7FA!important}
${S} #app small,${S} #app .muted{color:#64748B!important}
${S} button.obrixLightDeleteAll{background:transparent!important;background-color:transparent!important;background-image:none!important;color:#DC2626!important;-webkit-text-fill-color:#DC2626!important;border:1px solid #DC2626!important;box-shadow:none!important}
${S} button.obrixLightDeleteAll *{color:#DC2626!important;-webkit-text-fill-color:#DC2626!important}
${S} #listaObras [data-obra-id] .mini:nth-child(5) b{color:#F97316!important;-webkit-text-fill-color:#F97316!important}
${S} #listaObras [data-obra-id] .mini:nth-child(7) b,${S} #listaObras [data-obra-id] .mini:nth-child(8) b{color:#DC2626!important;-webkit-text-fill-color:#DC2626!important}
${S} #listaObras [data-obra-id] .mini:nth-child(10) b{color:#2563EB!important;-webkit-text-fill-color:#2563EB!important}
${S} #financeiroMain .forGrid>.forKpi:nth-child(1) strong,${S} #financeiroMain .forCheckGrid>.forKpi:nth-child(2) strong{color:#15803D!important;-webkit-text-fill-color:#15803D!important}
${S} #financeiroMain .forGrid>.forKpi:nth-child(2) strong,${S} #financeiroMain .forCheckGrid>.forKpi:nth-child(3) strong{color:#DC2626!important;-webkit-text-fill-color:#DC2626!important}
${S} #financeiroMain .forGrid>.forKpi:nth-child(3) strong,${S} #financeiroMain .forCheckGrid>.forKpi:nth-child(4) strong{color:#2563EB!important;-webkit-text-fill-color:#2563EB!important}
${S} #cfgEscuro{background:#111!important;background-color:#111!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid #F2B84B!important;box-shadow:none!important}
${S} #cfgEscuro svg,${S} #cfgEscuro i{color:#F2B84B!important}
${S} nav,${S} .bottom,${S} .bottom-nav,${S} #bottomNav{transition:none!important}
`;
document.head.appendChild(style);
let scheduled=false;function classify(){scheduled=false;if(offline())return;document.querySelectorAll('#app button').forEach(b=>{const t=norm(b.textContent);if(/(^|\s)(excluir|apagar)(\s|$)/.test(t))b.classList.add('obrixLightDeleteAll')})}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(classify)}
['obrix:grupo-pronto','obrix:feature-pronto','obrix:modules-ready','obrix:modules-online-ready','obrix-financeiro-atualizado','pageshow'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',schedule,true);new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();