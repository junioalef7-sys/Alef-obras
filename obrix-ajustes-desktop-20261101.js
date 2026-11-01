(()=>{
'use strict';
if(window.__OBRIX_AJUSTES_DESKTOP_20261101)return;
window.__OBRIX_AJUSTES_DESKTOP_20261101=true;

function aplicar(){
  if(document.getElementById('obrix-ajustes-desktop-20261101-style'))return;
  const s=document.createElement('style');
  s.id='obrix-ajustes-desktop-20261101-style';
  s.textContent=`
@media (min-width:621px){
  .obxOnboarding{padding:10px 18px!important;overflow:hidden!important}
  .obxOnboardCard{width:min(860px,calc(100vw - 36px))!important;height:calc(100vh - 20px)!important;max-height:calc(100vh - 20px)!important;min-height:0!important;overflow:hidden!important}
  #obxOnboardBody{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;overscroll-behavior:contain!important;padding-bottom:12px!important}
  .obxOnboardFooter{flex:0 0 auto!important;position:relative!important;z-index:5!important;min-height:62px!important;padding:10px 18px!important}
  .obxOnboardButtons{display:flex!important;align-items:center!important;gap:10px!important;flex:0 0 auto!important}
  #obxOnboardPrev,#obxOnboardNext{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:44px!important;min-width:108px!important;visibility:visible!important;opacity:1!important;white-space:nowrap!important}
}
@media (min-width:621px) and (max-height:760px){
  #obxOnboardBody{padding:14px 22px 8px!important}
  .obxSlideHead{grid-template-columns:56px minmax(0,1fr)!important;gap:12px!important;margin-bottom:9px!important}
  .obxSlideIcon{width:56px!important;height:56px!important;font-size:28px!important}
  .obxSlideHead h1{font-size:23px!important;margin-bottom:4px!important}
  .obxSlideHead p{font-size:13px!important}
  .obxFeatureGrid{gap:7px!important}
  .obxFeature{min-height:70px!important;padding:9px 11px!important}
  .obxFeature b{font-size:13px!important;margin-bottom:3px!important}
  .obxFeature span{font-size:12px!important;line-height:1.3!important}
}
`;
  document.head.appendChild(s);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar,{once:true});
else aplicar();
})();