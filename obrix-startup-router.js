(()=>{'use strict';
if(window.__OBRIX_STARTUP_ROUTER)return;window.__OBRIX_STARTUP_ROUTER=true;
const loaded=new Set(),pathOf=s=>{try{return new URL(s,location.href).pathname}catch{return s}};
function has(src){const p=pathOf(src);return loaded.has(p)||[...document.scripts].some(s=>s.src&&pathOf(s.src)===p)}
function load(src,tag){if(has(src))return Promise.resolve(true);return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;if(tag)s.dataset.obrixStartup=tag;let done=false;const end=ok=>{if(done)return;done=true;if(ok)loaded.add(pathOf(src));resolve(ok)};s.onload=()=>end(true);s.onerror=()=>end(false);document.body.appendChild(s);setTimeout(()=>end(false),7000)})}
async function online(){
  await load('./obrix-offline-v3.js?v=20261024offline-v3-1','offline-v3');
  await load('./obrix-offline-v2.js?v=20261024offline-v2-1','offline-v2-engine');
  await load('./obrix-erros-ptbr.js?v=20261023ptbr2','erros-ptbr');
  await load('./obrix-pos-login-loader.js?v=20261031perf3','online');
  await load('./obrix-audit-fixes-v1.js?v=20261031perfgeral1','audit-fixes');
  await load('./obrix-lazy-extras-perf.js?v=20261031perfgeral1','lazy-extras');
  setTimeout(()=>{window.OBRIX_THEME?.refresh?.();window.OBRIX_UI_STABILITY?.repairScroll?.()},80);
  return true
}
async function offline(){await load('./obrix-offline-v3.js?v=20261024offline-v3-1','offline-v3');await load('./obrix-offline-v3-nav.js?v=20261024offline-v3-nav1','offline-v3-nav');const ok=await window.OBRIX_OFFLINE_V3?.start?.('startup-router-v3');window.OBRIX_OFFLINE_V3_NAV?.ensure?.();setTimeout(()=>window.OBRIX_OFFLINE_V3_NAV?.ensure?.(),250);setTimeout(()=>window.OBRIX_OFFLINE_V3_NAV?.ensure?.(),900);return ok}
function route(){return navigator.onLine?online():offline()}
route();
window.addEventListener('online',()=>{if(window.__OBRIX_FORCE_OFFLINE)return offline();online()});
window.addEventListener('offline',()=>offline());
window.OBRIX_STARTUP_ROUTER={route,online,offline,status:()=>({online:navigator.onLine,offlineV3:!!window.__OBRIX_OFFLINE_V3,pos:!!window.OBRIX_POS_LOGIN_LOADER,offlineV2:!!window.__OBRIX_OFFLINE_V2,prefetch:!!window.OBRIX_OFFLINE_PREFETCH,equipeRealtimeSync:!!window.__OBRIX_EQUIPE_REALTIME_SYNC,cobrancasEfi:!!window.__OBRIX_ASSINATURAS_COBRANCAS_EFI})};
})();