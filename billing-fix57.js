(function(){
  'use strict';
  const VERSION='65';
  let busy=false;

  async function ensureTrialCompat(force=false){
    if(typeof window.edifiqEnsureTrial63==='function')return window.edifiqEnsureTrial63(null,force);
    if(typeof window.edifiqEnsureTrial62==='function')return window.edifiqEnsureTrial62(null,force);
    if(busy)return window.__edifiqSubscription||null;
    if(typeof sb==='undefined'||!sb||typeof user==='undefined'||!user?.id)return window.__edifiqSubscription||null;
    busy=true;
    try{
      let {data,error}=await sb.rpc('edifiq_assinatura_atual');
      if(error)throw error;
      if(!data){const started=await sb.rpc('edifiq_iniciar_trial');if(started.error)throw started.error;data=started.data}
      if(data){
        window.__edifiqSubscription=data;
        window.__edifiqSubscriptionVerifiedOnline=true;
        window.__edifiqSubscriptionVerifiedAt=Date.now();
        try{localStorage.setItem('edifiq_subscription_cache_v1',JSON.stringify(data))}catch(_){}
        try{window.dispatchEvent(new CustomEvent('edifiq:subscription-updated',{detail:data}))}catch(_){}
      }
      return data||null;
    }catch(e){console.warn('EDIFIQ billing compat 65:',e);return window.__edifiqSubscription||null}
    finally{busy=false}
  }

  window.edifiqEnsureTrial60=ensureTrialCompat;

  function init(){
    ['edSubConfig10','edSubscriptionConfigCard','edBillingConfig11'].forEach(id=>{const el=document.getElementById(id);if(el){el.hidden=true;el.style.setProperty('display','none','important')}});
    document.querySelectorAll('.edifiqDrawerLogo img').forEach(img=>{img.src='./edifiq-menu-logo.jpg?v='+VERSION;img.alt='Edific'});
    ['edPay57','edAsaasFormaModal','edPaymentMethod47'].forEach(id=>document.getElementById(id)?.remove());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();