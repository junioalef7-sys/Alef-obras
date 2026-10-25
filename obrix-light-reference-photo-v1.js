(()=>{'use strict';
if(window.__OBRIX_LIGHT_REFERENCE_PHOTO_V7)return;window.__OBRIX_LIGHT_REFERENCE_PHOTO_V7=true;
const offline=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
const light=()=>!offline()&&document.documentElement.dataset.theme!=='dark'&&!document.body?.classList.contains('dark');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const S='html:not([data-theme="dark"]):not([data-obrix-offline-v3="1"]) body:not(.dark)';
const style=document.createElement('style');style.id='obrixLightReferencePhotoV7';style.textContent=`
${S}{--page:#EEF2F6;--card:#FFFFFF;--inner:#F5F7FA;--text:#111827;--border:#D7DEE8;background:var(--page)!important;color:var(--text)!important}
${S} #app,${S} main,${S} .page,${S} .view,${S} .screen,${S} [data-page],${S} #inicio,${S} #home,${S} #menu,${S} #equipeMain,${S} #financeiroMain,${S} #obrasMain{background:var(--page)!important;color:var(--text)!important}
${S} #login,${S} .login-card,${S} .auth-card{background:var(--card)!important;background-image:none!important;color:var(--text)!important;border-color:var(--border)!important;box-shadow:none!important}
${S} #login h1,${S} #login h2,${S} #login h3,${S} #login label,${S} #login p{color:var(--text)!important;-webkit-text-fill-color:var(--text)!important}
${S} #app .card,${S} #app .panel,${S} #app .box,${S} #app .section,${S} #app .bloco,${S} #app .wrap,${S} #app .forObra,${S} #app .forCheck,${S} #app .kpi,${S} #app .mini,${S} #app .tile,${S} #app .forKpi,${S} #app .menuCard,${S} #app .menuItem{background:var(--card)!important;background-image:none!important;border-color:var(--border)!important;color:var(--text)!important;box-shadow:none!important}
${S} #app .card .card,${S} #app .card .panel,${S} #app .card .box,${S} #app .card .mini,${S} #app .card .kpi,${S} #app .card .tile,${S} #app .card .forKpi,${S} #app .panel .card,${S} #app .panel .box,${S} #app .panel .mini,${S} #app .panel .kpi,${S} #app .panel .tile,${S} #app .panel .forKpi,${S} #app .box .card,${S} #app .box .mini,${S} #app .box .kpi,${S} #app .box .tile,${S} #app .box .forKpi,${S} #app .section .card,${S} #app .section .mini,${S} #app .section .kpi,${S} #app .section .tile,${S} #app .section .forKpi,${S} #app .bloco .card,${S} #app .bloco .mini,${S} #app .bloco .kpi,${S} #app .bloco .tile,${S} #app .bloco .forKpi,${S} #app .forObra .mini,${S} #app .forObra .kpi,${S} #app .forObra .forKpi,${S} #app .forCheck .mini,${S} #app .forCheck .kpi,${S} #app .forCheck .forKpi,${S} #app .menuCard .card,${S} #app .menuCard .tile,${S} #app .menuCard .menuItem{background:var(--inner)!important;background-image:none!important;border-color:var(--border)!important;color:var(--text)!important;box-shadow:none!important}
${S} button.obrixLightDanger,${S} a.obrixLightDanger,[data-theme="light"] button.obrixLightDanger{background:transparent!important;background-color:transparent!important;background-image:none!important;color:#DC2626!important;-webkit-text-fill-color:#DC2626!important;border:1px solid #DC2626!important;box-shadow:none!important}
${S} button.obrixLightDanger *,${S} a.obrixLightDanger *{color:#DC2626!important;-webkit-text-fill-color:#DC2626!important;fill:currentColor!important}
${S} #listaObras [data-obra-id] .mini:nth-child(5) b{color:#F97316!important;-webkit-text-fill-color:#F97316!important}
${S} #listaObras [data-obra-id] .mini:nth-child(7) b,${S} #listaObras [data-obra-id] .mini:nth-child(8) b{color:#DC2626!important;-webkit-text-fill-color:#DC2626!important}
${S} #listaObras [data-obra-id] .mini:nth-child(10) b{color:#2563EB!important;-webkit-text-fill-color:#2563EB!important}
${S} #financeiroMain .forGrid>.forKpi:nth-child(1) strong,${S} #financeiroMain .forCheckGrid>.forKpi:nth-child(2) strong{color:#15803D!important;-webkit-text-fill-color:#15803D!important}
${S} #financeiroMain .forGrid>.forKpi:nth-child(2) strong,${S} #financeiroMain .forCheckGrid>.forKpi:nth-child(3) strong{color:#DC2626!important;-webkit-text-fill-color:#DC2626!important}
${S} #financeiroMain .forGrid>.forKpi:nth-child(3) strong,${S} #financeiroMain .forCheckGrid>.forKpi:nth-child(4) strong{color:#2563EB!important;-webkit-text-fill-color:#2563EB!important}
${S} #cfgEscuro{background:#111!important;background-color:#111!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid #F2B84B!important;box-shadow:none!important}
${S} #cfgEscuro svg,${S} #cfgEscuro i{color:#F2B84B!important}
${S} *,${S} *:before,${S} *:after{animation-duration:0s!important}
`;
document.head.appendChild(style);
let scheduled=false;function classify(){scheduled=false;if(!light())return;document.querySelectorAll('#app button,#app a[role="button"],#app .btn').forEach(b=>{const t=norm(b.textContent);const aria=norm(b.getAttribute('aria-label'));const title=norm(b.getAttribute('title'));const action=norm(b.dataset?.action||b.dataset?.acao||'');if(/\b(excluir|apagar)\b/.test([t,aria,title,action].join(' ')))b.classList.add('obrixLightDanger')})}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(classify)}
['obrix:grupo-pronto','obrix:feature-pronto','obrix:modules-ready','obrix:modules-online-ready','obrix-financeiro-atualizado','pageshow'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',schedule,true);new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();setTimeout(schedule,250);setTimeout(schedule,1000);
})();