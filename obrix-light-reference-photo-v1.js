(()=>{'use strict';
if(window.__OBRIX_LIGHT_REFERENCE_PHOTO_V3)return;window.__OBRIX_LIGHT_REFERENCE_PHOTO_V3=true;
const offline=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const S='html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) body:not(.dark)';
const style=document.createElement('style');style.id='obrixLightReferencePhotoV3';style.textContent=`
${S}{--obrix-page:#EEF2F6;--obrix-card:#FFFFFF;--obrix-inner:#F5F7FA;--obrix-text:#111827;--obrix-muted:#64748B;--obrix-border:#D7DEE8;background:var(--obrix-page)!important;color:var(--obrix-text)!important}
${S} #app,${S} main,${S} .page,${S} .view,${S} .screen,${S} [data-page]{background-color:var(--obrix-page)!important;color:var(--obrix-text)!important}
${S} #login,${S} .login-card,${S} .auth-card{background:var(--obrix-card)!important;background-image:none!important;color:var(--obrix-text)!important;border-color:var(--obrix-border)!important;box-shadow:none!important}
${S} #login h1,${S} #login h2,${S} #login h3,${S} #login label,${S} #login p{color:var(--obrix-text)!important;-webkit-text-fill-color:var(--obrix-text)!important}
${S} #app .card,${S} #app .panel,${S} #app .box,${S} #app .section,${S} #app .bloco,${S} #app .wrap,${S} #app .forObra,${S} #app .forCheck{background:var(--obrix-card)!important;background-image:none!important;border-color:var(--obrix-border)!important;color:var(--obrix-text)!important;box-shadow:none!important}
${S} #app .card .card,${S} #app .card .mini,${S} #app .card .kpi,${S} #app .card .tile,${S} #app .panel .card,${S} #app .panel .mini,${S} #app .panel .kpi,${S} #app .panel .tile,${S} #app .box .card,${S} #app .box .mini,${S} #app .box .kpi,${S} #app .box .tile,${S} #app .section .card,${S} #app .section .mini,${S} #app .section .kpi,${S} #app .section .tile,${S} #app .bloco .card,${S} #app .bloco .mini,${S} #app .bloco .kpi,${S} #app .bloco .tile,${S} #app .forKpi,${S} #app .forCheckGrid .forKpi{background:var(--obrix-inner)!important;background-image:none!important;border-color:var(--obrix-border)!important;color:var(--obrix-text)!important;box-shadow:none!important}
${S} #app>.card,${S} #app>.panel,${S} #app>.box,${S} #app>.section,${S} #app .page>.card,${S} #app .view>.card,${S} #app [data-page]>.card{background:var(--obrix-card)!important}
${S} #menu,${S} #equipeMain,${S} #financeiroMain,${S} #obrasMain,${S} #inicio,${S} #home{background-color:var(--obrix-page)!important;color:var(--obrix-text)!important}
${S} #menu .card,${S} #menu .menuCard,${S} #menu .menuItem,${S} #menu .tile{background:var(--obrix-card)!important;background-image:none!important;color:var(--obrix-text)!important;-webkit-text-fill-color:var(--obrix-text)!important;border-color:var(--obrix-border)!important}
${S} #menu .card .card,${S} #menu .card .tile,${S} #menu .menuCard .tile{background:var(--obrix-inner)!important}
${S} #app small,${S} #app .muted{color:var(--obrix-muted)!important}
${S} #listaObras [data-obra-id] .mini:nth-child(5) b{color:#F97316!important;-webkit-text-fill-color:#F97316!important}
${S} #listaObras [data-obra-id] .mini:nth-child(7) b,${S} #listaObras [data-obra-id] .mini:nth-child(8) b{color:#DC2626!important;-webkit-text-fill-color:#DC2626!important}
${S} #listaObras [data-obra-id] .mini:nth-child(10) b{color:#2563EB!important;-webkit-text-fill-color:#2563EB!important}
${S} #financeiroMain .forGrid>.forKpi:nth-child(1) strong,${S} #financeiroMain .forCheckGrid>.forKpi:nth-child(2) strong{color:#15803D!important;-webkit-text-fill-color:#15803D!important}
${S} #financeiroMain .forGrid>.forKpi:nth-child(2) strong,${S} #financeiroMain .forCheckGrid>.forKpi:nth-child(3) strong{color:#DC2626!important;-webkit-text-fill-color:#DC2626!important}
${S} #financeiroMain .forGrid>.forKpi:nth-child(3) strong,${S} #financeiroMain .forCheckGrid>.forKpi:nth-child(4) strong{color:#2563EB!important;-webkit-text-fill-color:#2563EB!important}
${S} #financeiroMain button.obrixLightDelete{background:transparent!important;background-color:transparent!important;color:#DC2626!important;-webkit-text-fill-color:#DC2626!important;border:1px solid #DC2626!important;box-shadow:none!important}
${S} #cfgEscuro{background:#111!important;background-color:#111!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid #F2B84B!important;box-shadow:none!important}
${S} #cfgEscuro svg,${S} #cfgEscuro i{color:#F2B84B!important}
${S} button.obrixLightDangerText,${S} #cfgExcluirConta,${S} #cfgExcluirConta *{color:#fff!important;-webkit-text-fill-color:#fff!important}
${S} nav,${S} .bottom,${S} .bottom-nav,${S} #bottomNav{transition:none!important}
`;
document.head.appendChild(style);
let scheduled=false;function classify(){scheduled=false;if(offline())return;document.querySelectorAll('#financeiroMain button').forEach(b=>{if(norm(b.textContent)==='excluir')b.classList.add('obrixLightDelete')});document.querySelectorAll('#app button').forEach(b=>{const t=norm(b.textContent);if(t==='apagar tudo'||t==='excluir conta')b.classList.add('obrixLightDangerText')})}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(classify)}
['obrix:grupo-pronto','obrix:feature-pronto','obrix:modules-ready','obrix:modules-online-ready','obrix-financeiro-atualizado','pageshow'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',schedule,true);new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();