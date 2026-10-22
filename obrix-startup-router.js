(()=>{'use strict';
if(window.__OBRIX_STARTUP_ROUTER)return;window.__OBRIX_STARTUP_ROUTER=true;
const loaded=new Set();
const pathOf=s=>{try{return new URL(s,location.href).pathname}catch{return s}};
function has(src){const p=pathOf(src);return loaded.has(p)||[...document.scripts].some(s=>s.src&&pathOf(s.src)===p)}
function load(src,tag){if(has(src))return Promise.resolve(true);return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;if(tag)s.dataset.obrixStartup=tag;let done=false;const end=ok=>{if(done)return;done=true;if(ok)loaded.add(pathOf(src));resolve(ok)};s.onload=()=>end(true);s.onerror=()=>end(false);document.body.appendChild(s);setTimeout(()=>end(false),7000)})}
async function online(){await load('./obrix-pos-login-loader.js?v=20261022startup2','online');await load('./obrix-offline-prefetch.js?v=20261022startup2','prefetch');setTimeout(()=>window.OBRIX_OFFLINE_PREFETCH?.run?.(true),700)}
async function offline(){await load('./obrix-offline-safe-loader.js?v=20261022startup2','offline')}
function route(){return navigator.onLine?online():offline()}
route();
window.addEventListener('online',()=>online());
window.addEventListener('offline',()=>offline());
window.OBRIX_STARTUP_ROUTER={route,online,offline,status:()=>({online:navigator.onLine,pos:!!window.OBRIX_POS_LOGIN_LOADER,safe:!!window.OBRIX_OFFLINE_SAFE,prefetch:!!window.OBRIX_OFFLINE_PREFETCH})};
})();