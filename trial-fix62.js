(function(){
  'use strict';
  const VERSION='62';
  let authHooked=false,trialBusy=false,trialUid='';

  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
  const fmtDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')};
  const daysLeft=s=>{const end=s?.trial_fim||s?.periodo_fim;if(!end)return null;return Math.max(0,Math.ceil((new Date(end).getTime()-Date.now())/86400000))};
  const trialActive=s=>!!(s&&String(s.status||'').toLowerCase()==='trial'&&s.trial_fim&&new Date(s.trial_fim).getTime()>Date.now());

  function removeTrialPromoFromLogin62(){
    const auth=document.getElementById('auth');
    if(!auth)return;
    const re=/(?:\b7\s*dias?\s*(?:de\s*)?teste\s*gr[áa]tis\b|\bteste\s*gr[áa]tis(?:\s*por\s*7\s*dias?)?\b|\b7\s*dias?\s*gr[áa]tis\b)/gi;
    const walker=document.createTreeWalker(auth,NodeFilter.SHOW_TEXT);
    const nodes=[];let node;
    while((node=walker.nextNode()))nodes.push(node);
    nodes.forEach(n=>{
      if(!re.test(String(n.nodeValue||''))){re.lastIndex=0;return}
      re.lastIndex=0;
      n.nodeValue=String(n.nodeValue||'').replace(re,'').replace(/^[\s•|—–-]+|[\s•|—–-]+$/g,' ').trim();
      re.lastIndex=0;
    });
    auth.querySelectorAll('p,small,.sub,.note,.hint,.badge').forEach(el=>{
      if(!normalize(el.textContent)&&!el.querySelector('input,button,a'))el.style.display='none';
    });
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
      let current=await client.rpc('edifiq_assinatura_atual');
      if(current.error)throw current.error;
      let data=current.data;
      if(!data){
        const started=await client.rpc('edifiq_iniciar_trial');
        if(started.error)throw started.error;
        data=started.data;
      }
      if(data){
        data.dias_restantes=daysLeft(data);
        window.__edifiqSubscription=data;
        trialUid=uid;
        try{localStorage.setItem('edifiq_subscription_cache_v1',JSON.stringify(data))}catch(_){}
        patchPlanSummary62();
      }
      return data||null;
    }catch(e){console.warn('EDIFIQ trial 62:',e);return window.__edifiqSubscription||null}
    finally{trialBusy=false}
  }
  window.edifiqEnsureTrial62=ensureTrialForSession62;

  function attachTrialAuthHook62(){
    if(authHooked||typeof sb==='undefined'||!sb?.auth?.onAuthStateChange)return;
    authHooked=true;
    try{
      sb.auth.onAuthStateChange((event,session)=>{
        if(session?.user?.id&&['SIGNED_IN','INITIAL_SESSION','TOKEN_REFRESHED'].includes(String(event))){
          setTimeout(()=>ensureTrialForSession62(session,true).catch(()=>{}),0);
        }
      });
      sb.auth.getSession().then(({data})=>{
        if(data?.session?.user?.id)setTimeout(()=>ensureTrialForSession62(data.session).catch(()=>{}),0);
      }).catch(()=>{});
    }catch(e){authHooked=false;console.warn('EDIFIQ auth trial hook 62:',e)}
  }

  function hideBillingInsideSettings62(){
    ['edSubConfig10','edSubscriptionConfigCard','edBillingConfig11'].forEach(id=>{
      const el=document.getElementById(id);if(el){el.hidden=true;el.style.setProperty('display','none','important')}
    });
    ['settingsM','configM','openSettingsM','openConfigM'].forEach(id=>{
      const root=document.getElementById(id);if(!root)return;
      root.querySelectorAll('button,a,[role="button"],.edifiqDataRow').forEach(el=>{
        const t=normalize(el.textContent).toLowerCase();
        if((/planos?\s*(?:e|&)\s*assinaturas?/.test(t)||/^assinaturas?$/.test(t))&&t.length<140){
          el.hidden=true;el.style.setProperty('display','none','important');
        }
      });
    });
  }

  function openPlans62(){
    const fn=window.openPlanosEdifiq11||window.openPlanosEdifiq10||window.openBilling14;
    if(typeof fn==='function')fn();
  }

  function ensurePlansMenu62(){
    const menu=document.getElementById('menuPasta');if(!menu)return;
    let btn=document.getElementById('menuPlanosAssinaturas');
    if(!btn){
      const buttons=[...menu.querySelectorAll('button')];
      const config=buttons.find(b=>/configurações|configuracoes/i.test(normalize(b.textContent)));
      btn=document.createElement('button');
      btn.id='menuPlanosAssinaturas';btn.type='button';btn.className=config?.className||'edifiqDataRow';
      btn.innerHTML='<span>💳</span><b>Planos e assinaturas</b><span class="edifiqChevron">›</span>';
      if(config)config.insertAdjacentElement('afterend',btn);else (menu.querySelector('.card,.modalBox')||menu).appendChild(btn);
    }
    if(btn.dataset.edifiqTrial62!=='1'){
      btn.dataset.edifiqTrial62='1';
      btn.addEventListener('click',ev=>{
        ev.preventDefault();ev.stopPropagation();
        menu.classList.remove('open');document.getElementById('menuPastaBackdrop')?.classList.remove('open');
        ensureTrialForSession62(null,true).finally(()=>openPlans62());
      });
    }
    btn.hidden=false;btn.style.removeProperty('display');
  }

  function patchPlanSummary62(){
    const modal=document.getElementById('edPlanosModal');if(!modal)return;
    const sub=window.__edifiqSubscription||{};
    let box=document.getElementById('edTrial60Summary')||document.getElementById('edTrial62Summary');
    if(!box){
      box=document.createElement('div');box.id='edTrial62Summary';box.className='card';
      const head=modal.querySelector('.modalHead');if(head)head.insertAdjacentElement('afterend',box);else modal.querySelector('.modalBox')?.prepend(box);
    }
    const days=daysLeft(sub);
    if(trialActive(sub)){
      box.innerHTML=`<div class="financeRow"><span>🎁 Teste grátis</span><b>${days} dia${days===1?'':'s'} restante${days===1?'':'s'}</b></div><div class="financeRow"><span>Início do teste</span><b>${fmtDate(sub.trial_inicio)}</b></div><div class="financeRow"><span>Fim do teste</span><b>${fmtDate(sub.trial_fim)}</b></div><div class="financeRow"><span>Primeira cobrança</span><b>${fmtDate(sub.trial_fim)}</b></div><div class="note" style="margin-top:10px">A cobrança começa somente depois dos 7 dias grátis. Se o plano for escolhido durante o teste, a primeira cobrança continua programada para o fim do período gratuito.</div>`;
    }else if(String(sub.status||'').toLowerCase()==='trial'){
      box.innerHTML='<div class="financeRow"><span>Teste grátis</span><b>Encerrado</b></div><div class="note" style="margin-top:10px">O período gratuito terminou. A cobrança do plano pode começar a partir de agora.</div>';
    }
  }

  function tick62(){
    removeTrialPromoFromLogin62();
    hideBillingInsideSettings62();
    ensurePlansMenu62();
    patchPlanSummary62();
    attachTrialAuthHook62();
    if(typeof user!=='undefined'&&user?.id&&trialUid!==String(user.id))ensureTrialForSession62(null).catch(()=>{});
  }

  function init62(){
    tick62();
    new MutationObserver(()=>{removeTrialPromoFromLogin62();hideBillingInsideSettings62();ensurePlansMenu62();patchPlanSummary62();attachTrialAuthHook62()}).observe(document.documentElement,{childList:true,subtree:true});
    setInterval(tick62,1800);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init62,{once:true});else init62();
})();
