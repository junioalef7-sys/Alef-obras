(()=>{'use strict';
if(window.__OBRIX_LIGHT_CARDS_FINAL_V1)return;window.__OBRIX_LIGHT_CARDS_FINAL_V1=true;
const STYLE_ID='obrixLightCardsFinalV1';
const CARD='#F5F7FA',TEXT='#111827',WHITE='#FFFFFF';
const SELECTOR=[
  '#login.card',
  '#app .card','#app .kpi','#app .mini','#app .hero',
  '#app .nav button','#app .actions button','#app .menuGrid button',
  '#app #menuMain .opmGrid article','#app #menuMain .opmVersion','#app #menuMain .opmProfile',
  '#app .offFastResumo>div','#app .offFastGrid article',
  '#app .omStat','#app .omPanel','#app .omCard','#app .omHero','#app .omQuick button',
  '#app .obrix-modelo-card','#app .obrix-modelo-pagamento','#app .obrix-modelo-metrica',
  '#app .eqFuncCard','#app .checkResumo','#app .checkItem','#app [data-fin-card]'
].join(',');
const CSS=`
html:not([data-theme="dark"]) body:not(.dark) #app .obrixLightCardChosen.obrixLightCardChosen,
html[data-theme="light"] body #app .obrixLightCardChosen.obrixLightCardChosen,
html:not([data-theme="dark"]) body:not(.dark) #login.obrixLightCardChosen.obrixLightCardChosen,
html[data-theme="light"] body #login.obrixLightCardChosen.obrixLightCardChosen{
  background:${CARD}!important;
  background-color:${CARD}!important;
  background-image:none!important;
  color:${TEXT}!important;
}
html:not([data-theme="dark"]) body:not(.dark) #app .obrixLightKeepDark.obrixLightKeepDark,
html[data-theme="light"] body #app .obrixLightKeepDark.obrixLightKeepDark,
html:not([data-theme="dark"]) body:not(.dark) #login.obrixLightKeepDark.obrixLightKeepDark,
html[data-theme="light"] body #login.obrixLightKeepDark.obrixLightKeepDark{
  color:${WHITE}!important;
}
html:not([data-theme="dark"]) body:not(.dark) #app .obrixLightKeepDark :is(h1,h2,h3,h4,strong,b),
html[data-theme="light"] body #app .obrixLightKeepDark :is(h1,h2,h3,h4,strong,b){
  color:${WHITE}!important;
  -webkit-text-fill-color:${WHITE}!important;
}
`;
function light(){return document.documentElement.dataset.theme!=='dark'&&!document.body?.classList.contains('dark')}
function rgb(bg){const m=String(bg||'').match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)(?:\D+([\d.]+))?/i);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null}
function blackCard(el){const c=rgb(getComputedStyle(el).backgroundColor);if(!c||c[3]<.45)return false;return c[0]<=45&&c[1]<=58&&c[2]<=75}
function visibleSurface(el){const c=rgb(getComputedStyle(el).backgroundColor);return !!c&&c[3]>=.45}
function classify(el){if(!(el instanceof HTMLElement)||!light())return;if(blackCard(el)){el.classList.add('obrixLightKeepDark');el.classList.remove('obrixLightCardChosen');return}if(visibleSurface(el)){el.classList.add('obrixLightCardChosen');el.classList.remove('obrixLightKeepDark')}}
function scan(root=document){if(!light())return;root.matches?.(SELECTOR)&&classify(root);root.querySelectorAll?.(SELECTOR).forEach(classify)}
function style(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;s.textContent=CSS;document.head.appendChild(s)}else if(s.textContent!==CSS)s.textContent=CSS;if(s!==document.head.lastElementChild)document.head.appendChild(s)}
function start(){style();scan(document);if(document.body)new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)scan(n)}).observe(document.body,{childList:true,subtree:true});new MutationObserver(()=>{style();scan(document)}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});new MutationObserver(()=>style()).observe(document.head,{childList:true});['pageshow','obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-changed'].forEach(n=>window.addEventListener(n,()=>scan(document)));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_LIGHT_CARDS_FINAL={scan:()=>scan(document),card:CARD};
})();