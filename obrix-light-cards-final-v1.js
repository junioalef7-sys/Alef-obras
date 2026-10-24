(()=>{'use strict';
if(window.__OBRIX_LIGHT_CARDS_FINAL_V1)return;window.__OBRIX_LIGHT_CARDS_FINAL_V1=true;
const STYLE_ID='obrixLightCardsFinalV1';
const CARD='#F5F7FA',TEXT='#111827',MUTED='#475569',WHITE='#FFFFFF',RED='#B91C1C',BORDER='#D9E0E8';
const SELECTOR=[
  '#login.card',
  '#app .card','#app [class*="card"]','#app [class*="Card"]','#app .kpi','#app .mini','#app .hero',
  '#app .nav button','#app .actions button','#app .menuGrid button',
  '#app #menuMain .opmGrid article','#app #menuMain .opmVersion','#app #menuMain .opmProfile',
  '#app .offFastResumo>div','#app .offFastGrid article',
  '#app .omStat','#app .omPanel','#app .omCard','#app .omHero','#app .omQuick button',
  '#app .obrix-modelo-card','#app .obrix-modelo-pagamento','#app .obrix-modelo-metrica',
  '#app .eqFuncCard','#app .checkResumo','#app .checkItem','#app [data-fin-card]',
  '.modal','.estOp .modal','.obrix-pagar-item','.obrix-pagar-todos','.obrix-pagar-total'
].join(',');
const CSS=`
/* Modo claro aprovado: cartões claros em #F5F7FA. Cartões pretos permanecem pretos. */
html:not([data-theme="dark"]) body:not(.dark) .obrixLightCardChosen.obrixLightCardChosen,
html[data-theme="light"] body .obrixLightCardChosen.obrixLightCardChosen{
  background:${CARD}!important;background-color:${CARD}!important;background-image:none!important;color:${TEXT}!important;
}
html:not([data-theme="dark"]) body:not(.dark) .obrixLightCardChosen :is(h1,h2,h3,h4,strong,b,label),
html[data-theme="light"] body .obrixLightCardChosen :is(h1,h2,h3,h4,strong,b,label){color:${TEXT}!important;-webkit-text-fill-color:${TEXT}!important}
html:not([data-theme="dark"]) body:not(.dark) .obrixLightCardChosen :is(.muted,small),
html[data-theme="light"] body .obrixLightCardChosen :is(.muted,small){color:${MUTED}!important;-webkit-text-fill-color:${MUTED}!important}

html:not([data-theme="dark"]) body:not(.dark) .obrixLightKeepDark.obrixLightKeepDark,
html[data-theme="light"] body .obrixLightKeepDark.obrixLightKeepDark{color:${WHITE}!important}
html:not([data-theme="dark"]) body:not(.dark) .obrixLightKeepDark :is(h1,h2,h3,h4,p,span,small,strong,b,label),
html[data-theme="light"] body .obrixLightKeepDark :is(h1,h2,h3,h4,p,span,small,strong,b,label){color:${WHITE}!important;-webkit-text-fill-color:${WHITE}!important}

/* Pagar da Equipe: nunca azul no modo claro. */
html:not([data-theme="dark"]) body:not(.dark) #app #equipe button.obrix-pagar-equipe-topo,
html[data-theme="light"] body #app #equipe button.obrix-pagar-equipe-topo,
html:not([data-theme="dark"]) body:not(.dark) #app #equipe button.obrix-pagar-equipe-topo.obrixEquipeAzulClaro,
html[data-theme="light"] body #app #equipe button.obrix-pagar-equipe-topo.obrixEquipeAzulClaro{
  background:${CARD}!important;background-color:${CARD}!important;background-image:none!important;color:${TEXT}!important;-webkit-text-fill-color:${TEXT}!important;border:1px solid ${BORDER}!important;box-shadow:none!important;text-shadow:none!important;
}

/* Excluir conta: vermelho cheio com letras brancas também no modo claro. */
html:not([data-theme="dark"]) body:not(.dark) #app #cfgExcluirConta,
html[data-theme="light"] body #app #cfgExcluirConta,
html:not([data-theme="dark"]) body:not(.dark) .accountDeleteModal button.excluir,
html[data-theme="light"] body .accountDeleteModal button.excluir{
  background:${RED}!important;background-color:${RED}!important;background-image:none!important;color:${WHITE}!important;-webkit-text-fill-color:${WHITE}!important;border:1px solid #991b1b!important;box-shadow:none!important;text-shadow:none!important;
}

/* Botão pequeno de tema dentro da tela Início. */
#inicio #obrixThemeInicio{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;margin:0 0 12px auto;padding:9px 12px;border-radius:11px;font-weight:850;border:1px solid ${BORDER};background:${CARD};color:${TEXT};box-shadow:none}
html[data-theme="dark"] #inicio #obrixThemeInicio,body.dark #inicio #obrixThemeInicio{background:#0F1720;color:#fff;border-color:#2A3948}
`;
function light(){return document.documentElement.dataset.theme!=='dark'&&!document.body?.classList.contains('dark')}
function rgb(bg){const m=String(bg||'').match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)(?:\D+([\d.]+))?/i);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null}
function blackCard(el){const c=rgb(getComputedStyle(el).backgroundColor);if(!c||c[3]<.45)return false;return c[0]<=45&&c[1]<=58&&c[2]<=75}
function visibleSurface(el){const c=rgb(getComputedStyle(el).backgroundColor);return !!c&&c[3]>=.45}
function classify(el){if(!(el instanceof HTMLElement)||!light())return;if(el.id==='cfgExcluirConta'||el.matches?.('.accountDeleteModal button.excluir'))return;if(blackCard(el)){el.classList.add('obrixLightKeepDark');el.classList.remove('obrixLightCardChosen');return}if(visibleSurface(el)){el.classList.add('obrixLightCardChosen');el.classList.remove('obrixLightKeepDark')}}
function scan(root=document){if(!light())return;root.matches?.(SELECTOR)&&classify(root);root.querySelectorAll?.(SELECTOR).forEach(classify);root.querySelectorAll?.('#equipe .obrix-pagar-equipe-topo').forEach(b=>b.classList.remove('obrixEquipeAzulClaro'))}
function style(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.textContent!==CSS)s.textContent=CSS;if(s!==document.head.lastElementChild)document.head.appendChild(s)}
function themeLabel(){const b=document.getElementById('obrixThemeInicio');if(!b)return;const dark=document.documentElement.dataset.theme==='dark'||document.body?.classList.contains('dark');b.textContent=dark?'☀️ Claro':'🌙 Escuro';b.setAttribute('aria-label',dark?'Ativar modo claro':'Ativar modo escuro')}
function ensureThemeButton(){const inicio=document.getElementById('inicio');if(!inicio)return;let b=document.getElementById('obrixThemeInicio');if(!b){b=document.createElement('button');b.id='obrixThemeInicio';b.type='button';b.onclick=()=>{const atual=document.documentElement.dataset.theme==='dark'?'dark':'light',prox=atual==='dark'?'light':'dark';if(window.OBRIX_THEME?.apply)window.OBRIX_THEME.apply(prox);else document.documentElement.dataset.theme=prox;setTimeout(()=>{themeLabel();style();scan(document)},0)};inicio.insertBefore(b,inicio.firstChild)}themeLabel()}
function apply(root=document){style();ensureThemeButton();scan(root)}
function start(){apply(document);if(document.body)new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)apply(n);ensureThemeButton()}).observe(document.body,{childList:true,subtree:true});new MutationObserver(()=>{apply(document);themeLabel()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});new MutationObserver(()=>style()).observe(document.head,{childList:true});['pageshow','obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-changed'].forEach(n=>window.addEventListener(n,()=>apply(document)));document.addEventListener('click',e=>{if(e.target.closest?.('#bInicio,.bottom button'))setTimeout(()=>apply(document),0)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_LIGHT_CARDS_FINAL={scan:()=>apply(document),card:CARD};
})();