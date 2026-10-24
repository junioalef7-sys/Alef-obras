(()=>{'use strict';
if(window.__OBRIX_BUTTON_COLORS_V1)return;window.__OBRIX_BUTTON_COLORS_V1=true;
function clean(root=document){
 const s=document.getElementById('obrixButtonColorsV1');if(s)s.remove();
 root.querySelectorAll?.('#app button,.modalBack button').forEach(b=>{
  b.classList.remove('obrixApprovedGold','obrixApprovedSecondary');
  b.removeAttribute('data-obrix-approved-color');
 });
 try{window.OBRIX_OFFLINE_ONLINE_VISUAL?.repaint?.()}catch(_){}
}
function start(){
 clean(document);
 ['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-changed','pageshow','focus','online'].forEach(n=>window.addEventListener(n,()=>setTimeout(()=>clean(document),40)));
 document.addEventListener('click',()=>setTimeout(()=>clean(document),90),true);
 setTimeout(()=>clean(document),250);setTimeout(()=>clean(document),800);setTimeout(()=>clean(document),1600);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_BUTTON_COLORS={scan:()=>clean(document),gold:null};
})();