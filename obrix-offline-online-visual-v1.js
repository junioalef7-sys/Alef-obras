(()=>{'use strict';
if(window.__OBRIX_OFFLINE_ONLINE_VISUAL_V1)return;window.__OBRIX_OFFLINE_ONLINE_VISUAL_V1=true;
let timer=0,headMo=null,bodyMo=null;
const EXTRA_STYLE=`html[data-obrix-offline="1"] #offlineQuickMenu,html[data-obrix-offline="1"] #financeiroOfflineStatus,html[data-obrix-offline="1"] #financeiroOfflineResumoExtra,html[data-obrix-offline="1"] .offlineBadge{display:none!important}`;
function removeLegacy(){
 const s=document.getElementById('obrixOfflineParityCss');
 if(s&&s.textContent.includes('#app>.bottom'))s.remove();
}
function extraCss(){
 let s=document.getElementById('obrixOfflineOnlineVisualV1');
 if(!s){s=document.createElement('style');s.id='obrixOfflineOnlineVisualV1';document.head.appendChild(s)}
 if(s.textContent!==EXTRA_STYLE)s.textContent=EXTRA_STYLE;
 if(s!==document.head.lastElementChild)document.head.appendChild(s);
}
function loadFinalVisual(){
 if(!navigator.onLine)return;
 if(window.__OBRIX_NO_GOLD_FINAL||document.querySelector('script[data-obrix-final-visual="1"]'))return;
 const s=document.createElement('script');
 s.src='./obrix-no-gold-final.js?v=20261024visualfinal4';
 s.async=false;
 s.dataset.obrixFinalVisual='1';
 document.body.appendChild(s);
}
function repaint(){
 removeLegacy();extraCss();
 try{window.OBRIX_BUTTON_COLORS?.scan?.()}catch(_){}
 try{window.OBRIX_UI_CLEANUP_V5?.scan?.()}catch(_){}
}
function schedule(){clearTimeout(timer);timer=setTimeout(repaint,20)}
function start(){
 repaint();
 setTimeout(loadFinalVisual,0);
 if(document.head&&!headMo){headMo=new MutationObserver(schedule);headMo.observe(document.head,{childList:true})}
 if(document.body&&!bodyMo){bodyMo=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||m.attributeName==='class'||m.attributeName==='style'))schedule()});bodyMo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']})}
 ['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:offline-bootstrap','obrix:offline-core-restaurado','pageshow','focus','offline'].forEach(n=>window.addEventListener(n,schedule));
 window.addEventListener('online',()=>{document.getElementById('obrixOfflineOnlineVisualV1')?.remove();removeLegacy();setTimeout(loadFinalVisual,0);setTimeout(()=>{try{window.OBRIX_UI_CLEANUP_V5?.scan?.()}catch(_){}},30)});
 document.addEventListener('click',()=>setTimeout(schedule,0),true);
 setTimeout(repaint,120);setTimeout(repaint,500);setTimeout(repaint,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_OFFLINE_ONLINE_VISUAL={repaint:schedule};
})();
