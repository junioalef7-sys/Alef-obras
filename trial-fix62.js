(function(){
  'use strict';
  const VERSION='64';
  let authHooked=false,trialBusy=false,trialUid='';
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();

  function removeTrialPromoFromLogin62(){
    const auth=document.getElementById('auth');if(!auth)return;
    const re=/(?:\b7\s*dias?\s*(?:de\s*)?teste\s*gr[áa]tis\b|\bteste\s*gr[áa]tis(?:\s*por\s*7\s*dias?)?\b|\b7\s*dias?\s*gr[áa]tis\b)/gi;
    const walker=document.createTreeWalker(auth,NodeFilter.SHOW_TEXT),nodes=[];let node;
    while((node=walker.nextNode()))nodes.push(node);
    nodes.forEach(n=>{re.lastIndex=0;const old=String(n.nodeValue||'');if(!re.test(old))return;re.lastIndex=0;const next=old.replace(re,'').replace(/^[\s•|—–-]+|[\s•|—–-]+$/g,' ').trim();if(next!==old)n.nodeValue=next});
    auth.querySelectorAll('p,small,.sub,.note,.hint,.badge').forEach(el=>{if(!normalize(el.textContent)&&!el.querySelector('input,button,a'))el.style.display='none'});
  }
  window.removeTrialPromoFromLogin62=removeTrialPromoFromLogin62;

  async function ensureTrialForSession62(session,force=false){
    const client=(typeof sb!=='undefined'&&sb)?sb:null;
    const uid=String(session?.user?.id||((typeof user!=='undefined'&&user?.id)?user.id:''));
    if(!client||!uid)return null;
    if(!force&&trialUid===uid&&window.__edifiqSubscription)return window.__edifiqSubscription;
    if(trialBusy)return window.__edifiqSubscription||null;
    trialBusy=true;
    try{
      let current=await client.rpc('edifiq_assinatura_atual');if(current.error)throw current.error;
      window.__edifiqSubscriptionVerifiedOnline=true;window.__edifiqSubscriptionVerifiedAt=Date.now();
      let data=current.data;
      if(!data){const started=await client.rpc('edifiq_iniciar_trial');if(started.error)throw started.error;data=started.data;window.__edifiqSubscriptionVerifiedOnline=true;window.__edifiqSubscriptionVerifiedAt=Date.now()}
      if(data){window.__edifiqSubscription=data;trialUid=uid;try{localStorage.setItem('edifiq_subscription_cache_v1',JSON.stringify(data))}catch(_){}try{window.dispatchEvent(new CustomEvent('edifiq:subscription-updated',{detail:data}))}catch(_){}}
      return data||null;
    }catch(e){console.warn('EDIFIQ trial 64:',e);return window.__edifiqSubscription||null}
    finally{trialBusy=false}
  }
  window.edifiqEnsureTrial62=ensureTrialForSession62;window.edifiqEnsureTrial63=ensureTrialForSession62;

  function attachTrialAuthHook62(){
    if(authHooked||typeof sb==='undefined'||!sb?.auth?.onAuthStateChange)return;authHooked=true;
    try{
      sb.auth.onAuthStateChange((event,session)=>{if(session?.user?.id&&['SIGNED_IN','INITIAL_SESSION','TOKEN_REFRESHED'].includes(String(event)))setTimeout(()=>ensureTrialForSession62(session,true).catch(()=>{}),0)});
      sb.auth.getSession().then(({data})=>{if(data?.session?.user?.id)setTimeout(()=>ensureTrialForSession62(data.session).catch(()=>{}),0)}).catch(()=>{});
    }catch(e){authHooked=false;console.warn('EDIFIQ auth trial hook 64:',e)}
  }

  function hideBillingInsideSettings62(){
    ['edSubConfig10','edSubscriptionConfigCard','edBillingConfig11'].forEach(id=>{const el=document.getElementById(id);if(el){el.hidden=true;el.style.setProperty('display','none','important')}});
  }
  function ensurePlansMenu62(){
    const menu=document.getElementById('menuPasta');if(!menu)return;
    let btn=document.getElementById('menuPlanosAssinaturas');
    if(!btn){const config=[...menu.querySelectorAll('button')].find(b=>/configurações|configuracoes/i.test(normalize(b.textContent)));if(!config)return;btn=document.createElement('button');btn.id='menuPlanosAssinaturas';btn.type='button';btn.className=config.className||'edifiqDataRow';btn.innerHTML='<span>💳</span><b>Planos e assinaturas</b><span class="edifiqChevron">›</span>';btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();menu.classList.remove('open');document.getElementById('menuPastaBackdrop')?.classList.remove('open');ensureTrialForSession62(null,true).finally(()=>{const fn=window.openPlanosEdifiq11||window.openPlanosEdifiq10||window.openBilling14;if(typeof fn==='function')fn()})});config.insertAdjacentElement('afterend',btn)}
  }
  function tick62(){removeTrialPromoFromLogin62();hideBillingInsideSettings62();ensurePlansMenu62();attachTrialAuthHook62();if(typeof user!=='undefined'&&user?.id&&trialUid!==String(user.id))ensureTrialForSession62(null).catch(()=>{})}
  function init62(){tick62();setInterval(tick62,5000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init62,{once:true});else init62();
})();