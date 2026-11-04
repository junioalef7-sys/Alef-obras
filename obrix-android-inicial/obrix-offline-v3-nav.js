(()=>{'use strict';
if(window.__OBRIX_OFFLINE_V3_NAV)return;window.__OBRIX_OFFLINE_V3_NAV=true;
const STYLE_ID='obrixOfflineV3NavStyle',NAV_ID='obrixOfflineV3Bottom';
const ROUTES=['inicio','financeiro','equipe','menu'];
const LABELS=['Início','Financeiro','Equipe','Menu'];
const offline=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
function style(){
 let s=document.getElementById(STYLE_ID);if(s)return s;
 s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#${NAV_ID}{display:none}
html[data-obrix-offline-v3="1"] body{padding-bottom:calc(92px + env(safe-area-inset-bottom))!important}
html[data-obrix-offline-v3="1"] #app{padding-bottom:calc(92px + env(safe-area-inset-bottom))!important}
html[data-obrix-offline-v3="1"] #app>.bottom:not(#${NAV_ID}){display:none!important}
html[data-obrix-offline-v3="1"] #${NAV_ID}{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;position:fixed!important;left:10px!important;right:10px!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;z-index:2147483000!important;margin:0!important;padding:7px!important;visibility:visible!important;opacity:1!important;transform:none!important;pointer-events:auto!important;background:var(--surface,#fff)!important;border:1px solid var(--border,#dce3ec)!important;border-radius:20px!important;box-shadow:0 10px 32px rgba(15,23,42,.18)!important;backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important}
html[data-obrix-offline-v3="1"] #${NAV_ID} button{display:flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;min-height:46px!important;margin:0!important;padding:8px 4px!important;border:0!important;border-radius:14px!important;background:transparent!important;color:var(--muted,#475569)!important;-webkit-text-fill-color:currentColor!important;font-size:12px!important;font-weight:850!important;line-height:1.1!important;box-shadow:none!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
html[data-obrix-offline-v3="1"] #${NAV_ID} button.active{background:var(--brand,#0f172a)!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
html[data-theme="dark"][data-obrix-offline-v3="1"] #${NAV_ID}{background:#0f1720!important;border-color:#2a3948!important;box-shadow:0 14px 36px rgba(0,0,0,.38)!important}
html[data-theme="dark"][data-obrix-offline-v3="1"] #${NAV_ID} button{color:#d4dde8!important;-webkit-text-fill-color:#d4dde8!important}
html[data-theme="dark"][data-obrix-offline-v3="1"] #${NAV_ID} button.active{background:#243241!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
@media(min-width:760px){html[data-obrix-offline-v3="1"] #${NAV_ID}{left:50%!important;right:auto!important;width:min(720px,calc(100% - 24px))!important;transform:translateX(-50%)!important}}
`;
 document.head.appendChild(s);return s;
}
function setActive(route){const i=Math.max(0,ROUTES.indexOf(route));document.querySelectorAll(`#${NAV_ID} button`).forEach((b,j)=>b.classList.toggle('active',j===i));}
function ensure(){
 if(!offline())return null;
 style();document.documentElement.dataset.obrixOfflineV3='1';
 const app=document.getElementById('app');if(!app)return null;
 let box=document.getElementById(NAV_ID);
 if(!box){box=document.createElement('nav');box.id=NAV_ID;box.className='bottom';box.setAttribute('aria-label','Navegação offline');app.appendChild(box)}
 if(box.parentElement!==app)app.appendChild(box);
 for(let i=0;i<4;i++){
  let b=box.children[i];if(!(b instanceof HTMLButtonElement)){b=document.createElement('button');box.insertBefore(b,box.children[i]||null)}
  b.type='button';b.textContent=LABELS[i];b.dataset.offlineV3Route=ROUTES[i];b.removeAttribute('onclick');
 }
 while(box.children.length>4)box.lastElementChild?.remove();
 if(!box.querySelector('button.active'))setActive('inicio');
 return box;
}
function go(route){ensure();setActive(route);try{const p=window.OBRIX_OFFLINE_V3?.route?.(route);if(p&&typeof p.catch==='function')p.catch(()=>{})}catch(_){}}
document.addEventListener('click',e=>{const b=e.target?.closest?.(`#${NAV_ID} button`);if(!b||!offline())return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();go(b.dataset.offlineV3Route||'inicio')},true);
['obrix:offline-v3-ready','obrix:offline-bootstrap','obrix:offline-core-restaurado','pageshow','focus'].forEach(n=>window.addEventListener(n,()=>{if(offline()){ensure();setTimeout(ensure,120);setTimeout(ensure,700)}}));
window.addEventListener('offline',()=>{setTimeout(ensure,0);setTimeout(ensure,300)});
window.addEventListener('online',()=>{document.getElementById(NAV_ID)?.remove();document.getElementById(STYLE_ID)?.remove()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&offline())setTimeout(ensure,0)});
setTimeout(()=>{if(offline())ensure()},50);setTimeout(()=>{if(offline())ensure()},400);setTimeout(()=>{if(offline())ensure()},1200);
setInterval(()=>{if(offline())ensure()},1500);
window.OBRIX_OFFLINE_V3_NAV={ensure,go,setActive};
})();
