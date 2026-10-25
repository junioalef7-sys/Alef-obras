(()=>{'use strict';
if(window.__OBRIX_UI_STABLE_BUTTONS_V1)return;window.__OBRIX_UI_STABLE_BUTTONS_V1=true;
const STYLE_ID='obrix-ui-stable-buttons-v1-style';
function installStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#app button,#app [role="button"]{transition:none!important;animation:none!important}
#app button * ,#app [role="button"] *{transition:none!important;animation:none!important}
#app .obrixEmAndamentoWhite,#app .obrixEmAndamentoWhite *{color:#fff!important;-webkit-text-fill-color:#fff!important}
`;(document.head||document.documentElement).appendChild(s)}
function fixRunning(root=document){root.querySelectorAll?.('#app button,#app [role="button"],#app a').forEach(el=>{const tx=String(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(tx==='em andamento'||tx.includes('em andamento'))el.classList.add('obrixEmAndamentoWhite')})}
function loadDarkUnified(){if(!navigator.onLine||window.__OBRIX_DARK_UNIFIED_V1||document.querySelector('script[data-obrix-dark-unified]'))return;const s=document.createElement('script');s.src='./obrix-dark-unified-v1.js?v=20261025dark2';s.async=false;s.dataset.obrixDarkUnified='1';document.body.appendChild(s)}
let queued=false;function apply(){queued=false;installStyle();fixRunning();loadDarkUnified()}
function queue(){if(queued)return;queued=true;requestAnimationFrame(apply)}
installStyle();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
const app=document.getElementById('app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});
window.addEventListener('online',queue);window.addEventListener('obrix:modules-ready',queue);window.addEventListener('obrix:modules-online-ready',queue);window.addEventListener('pageshow',queue);
})();