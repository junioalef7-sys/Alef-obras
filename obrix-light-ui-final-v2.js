(()=>{'use strict';
if(window.__OBRIX_LIGHT_UI_FINAL_V2)return;window.__OBRIX_LIGHT_UI_FINAL_V2=true;
const STYLE_ID='obrixLightUiFinalV2';
const CARD='#F5F7FA',GREEN='#00A63E',RED='#E0002A',BLUE='#0057FF',GOLD='#F2B84B',BLACK='#111111';
const offlineV3=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
const light=()=>!offlineV3()&&document.documentElement.dataset.theme!=='dark'&&!document.body?.classList.contains('dark');
const CSS=`
/* OBRIX modo claro refinado — isolado do modo escuro e do offline V3. */
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app .card,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app .kpi,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app .mini,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #menuMain .opmGrid article,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #menuMain .opmVersion,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #menuMain .opmProfile,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app .card,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app .kpi,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app .mini,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #menuMain .opmGrid article,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #menuMain .opmVersion,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #menuMain .opmProfile{
 background:${CARD}!important;background-color:${CARD}!important;background-image:none!important
}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #assPlanos button[data-ass-plano],
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #assPlanos button[data-ass-cob-efi],
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #assPlanos button.obrixPayMethod,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #assPlanos button[data-ass-plano],
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #assPlanos button[data-ass-cob-efi],
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #assPlanos button.obrixPayMethod{
 background:${CARD}!important;background-color:${CARD}!important;background-image:none!important;color:${BLACK}!important;-webkit-text-fill-color:${BLACK}!important;border:1px solid #D9E0E8!important;box-shadow:none!important;text-shadow:none!important
}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app .bottom :is(#bInicio,#bEquipe,#bMenu,button:nth-child(2)).active,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app .bottom :is(#bInicio,#bEquipe,#bMenu,button:nth-child(2)):active,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app .bottom :is(#bInicio,#bEquipe,#bMenu,button:nth-child(2)).active,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app .bottom :is(#bInicio,#bEquipe,#bMenu,button:nth-child(2)):active{
 background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;border-color:transparent!important;color:#334155!important;-webkit-text-fill-color:#334155!important
}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #menuMain .opmSide nav button.active,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #menuMain .opmSide nav button:active,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #menuMain .opmSide nav button.active,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #menuMain .opmSide nav button:active{
 background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;border-color:transparent!important;color:#0057C8!important;-webkit-text-fill-color:#0057C8!important
}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #menuMain .opmGrid button:active,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #menuMain .opmGrid button.active,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #menuMain .opmGrid button:active,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #menuMain .opmGrid button.active{
 background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important
}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #configMain #cfgExcluirConta,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #configMain #cfgExcluirConta{
 background:#D6001C!important;background-color:#D6001C!important;background-image:none!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;border:1px solid #B80018!important;box-shadow:none!important;text-shadow:none!important
}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #configMain #cfgEscuro,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #configMain #cfgEscuro{
 background:${BLACK}!important;background-color:${BLACK}!important;background-image:none!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;border:2px solid ${GOLD}!important;box-shadow:none!important;outline:none!important
}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #configMain #cfgEscuro::before,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #configMain #cfgEscuro::after,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #configMain #cfgEscuro::before,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #configMain #cfgEscuro::after{content:none!important;display:none!important}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #configMain #cfgEscuro .obrixMoonGold,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #configMain #cfgEscuro .obrixMoonGold{color:${GOLD}!important;-webkit-text-fill-color:${GOLD}!important;font-size:19px!important;line-height:1!important;margin-right:7px!important}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #financeiroMain #fmContrato,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #financeiroMain #fmContrato{color:${BLACK}!important;-webkit-text-fill-color:${BLACK}!important;font-weight:950!important}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #financeiroMain #fmRecebido,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #financeiroMain #fmRecebido{color:${GREEN}!important;-webkit-text-fill-color:${GREEN}!important;font-weight:950!important}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #financeiroMain #fmDespesas,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #financeiroMain #fmDespesas{color:${RED}!important;-webkit-text-fill-color:${RED}!important;font-weight:950!important}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #financeiroMain #fmResultado,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #financeiroMain #fmResultado{color:${BLUE}!important;-webkit-text-fill-color:${BLUE}!important;font-weight:950!important}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app .obrixLightSummaryGreen,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app .obrixLightSummaryGreen,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body .checkModal .obrixLightSummaryGreen,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) .checkModal .obrixLightSummaryGreen{color:${GREEN}!important;-webkit-text-fill-color:${GREEN}!important;font-weight:950!important}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app .obrixLightSummaryRed,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app .obrixLightSummaryRed,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body .checkModal .obrixLightSummaryRed,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) .checkModal .obrixLightSummaryRed{color:${RED}!important;-webkit-text-fill-color:${RED}!important;font-weight:950!important}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app .obrixLightSummaryBlue,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app .obrixLightSummaryBlue,
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body .checkModal .obrixLightSummaryBlue,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) .checkModal .obrixLightSummaryBlue{color:${BLUE}!important;-webkit-text-fill-color:${BLUE}!important;font-weight:950!important}
html:not([data-obrix-offline-v3="1"])[data-theme="light"] body #app #financeiroMain #fmLista .obrixLightSummaryNeutral,
html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #app #financeiroMain #fmLista .obrixLightSummaryNeutral{color:${BLACK}!important;-webkit-text-fill-color:${BLACK}!important;font-weight:900!important}
`;
function ensureStyle(){
 if(offlineV3())return;
 let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}
 if(s.textContent!==CSS)s.textContent=CSS;
 if(s!==document.head.lastElementChild)document.head.appendChild(s);
}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const classes=['obrixLightSummaryGreen','obrixLightSummaryRed','obrixLightSummaryBlue','obrixLightSummaryNeutral'];
function mark(el,cls){if(!el)return;classes.forEach(c=>el.classList.remove(c));if(cls)el.classList.add(cls)}
function paintBox(box){
 if(!box)return;const label=norm(box.querySelector('small,label,span')?.textContent),v=box.querySelector('b,strong');if(!label||!v)return;
 if(label.includes('recebido'))mark(v,'obrixLightSummaryGreen');
 else if(label.includes('despesa'))mark(v,'obrixLightSummaryRed');
 else if(label.includes('resultado')||label.includes('lucro'))mark(v,'obrixLightSummaryBlue');
}
function appearance(){
 if(!light())return;const b=document.getElementById('cfgEscuro');if(!b)return;
 const ok=b.querySelector('.obrixMoonGold')&&norm(b.textContent)==='☾ modo escuro';
 if(!ok)b.innerHTML='<span class="obrixMoonGold" aria-hidden="true">☾</span><span>Modo escuro</span>';
 b.setAttribute('aria-label','Modo escuro');
}
function values(){
 if(!light())return;
 mark(document.getElementById('fmContrato'),'obrixLightSummaryNeutral');mark(document.getElementById('fmRecebido'),'obrixLightSummaryGreen');mark(document.getElementById('fmDespesas'),'obrixLightSummaryRed');mark(document.getElementById('fmResultado'),'obrixLightSummaryBlue');
 document.querySelectorAll('#listaObras .mini,.checkResumoFinance>div,.checkMoneyGrid>div').forEach(paintBox);
 document.querySelectorAll('#financeiroMain #fmLista .mini b,#financeiroMain #fmLista .mini strong').forEach(v=>mark(v,'obrixLightSummaryNeutral'));
}
function apply(){ensureStyle();appearance();values()}
let timer=0;function schedule(ms=20){clearTimeout(timer);timer=setTimeout(apply,ms)}
function pulse(){[0,80,250,700,1500].forEach(ms=>setTimeout(apply,ms))}
['obrix:grupo-pronto','obrix:feature-pronto','obrix:modules-ready','obrix:modules-online-ready','obrix:theme-changed','pageshow','focus'].forEach(n=>window.addEventListener(n,pulse));
document.addEventListener('click',pulse,true);
window.addEventListener('online',pulse);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pulse,{once:true});else pulse();
window.OBRIX_LIGHT_UI_FINAL_V2={apply:()=>schedule(0),pulse};
})();