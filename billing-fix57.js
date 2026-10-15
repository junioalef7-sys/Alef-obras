(function(){
  'use strict';
  const VERSION='64';
  const LOGO='./edifiq-menu-logo.jpg?v='+VERSION;
  const $=(s,r=document)=>r.querySelector(s);
  let trialBusy=false,trialUser='',plansWrapped=false;

  function toastSafe(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(_){}}
  function closePay(){document.getElementById('edPay57')?.remove();document.getElementById('edAsaasFormaModal')?.classList?.remove('open');window.__edifiqBillingBusy=false}
  function fixLogo(){document.querySelectorAll('.edifiqDrawerLogo img').forEach(img=>{if(!String(img.src||'').includes('edifiq-menu-logo.jpg'))img.src=LOGO;img.alt='Edific'})}
  function onlyDigits(v){return String(v||'').replace(/\D/g,'')}
  function validDoc(v){const n=onlyDigits(v);return n.length===11||n.length===14}
  function fmtDate(v){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')}
  function daysLeft(s){if(!s)return null;const end=String(s.status||'').toLowerCase()==='trial'?s.trial_fim:s.periodo_fim;if(!end)return null;const ms=new Date(end).getTime()-Date.now();return Math.max(0,Math.ceil(ms/86400000))}
  function trialActive(s){return !!(s&&String(s.status||'').toLowerCase()==='trial'&&s.trial_fim&&new Date(s.trial_fim).getTime()>Date.now())}
  function setHtmlStable(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}

  async function ensureClient(){
    if((typeof sb==='undefined'||!sb)&&typeof ensureSupabaseClient==='function')await ensureSupabaseClient();
    if(typeof sb==='undefined'||!sb)throw new Error('Sem conexão com o servidor.');
    if(typeof user==='undefined'||!user?.id)throw new Error('Sua sessão expirou. Entre novamente no aplicativo.');
  }

  async function ensureTrialNow(force=false){
    try{
      if(typeof user==='undefined'||!user?.id)return null;
      const uid=String(user.id);
      if(!force&&trialUser===uid&&window.__edifiqSubscription)return window.__edifiqSubscription;
      if(trialBusy)return window.__edifiqSubscription||null;
      trialBusy=true;
      await ensureClient();
      let {data,error}=await sb.rpc('edifiq_assinatura_atual');
      if(error)throw error;
      if(!data){
        const started=await sb.rpc('edifiq_iniciar_trial');
        if(started.error)throw started.error;
        data=started.data;
      }else if(String(data.status||'').toLowerCase()==='trial'&&(!data.trial_inicio||!data.trial_fim)){
        const repaired=await sb.rpc('edifiq_iniciar_trial');
        if(!repaired.error&&repaired.data)data=repaired.data;
      }
      if(data){
        data.dias_restantes=daysLeft(data);
        window.__edifiqSubscription=data;
        window.__edifiqSubscriptionVerifiedOnline=true;
        window.__edifiqSubscriptionVerifiedAt=Date.now();
        try{localStorage.setItem('edifiq_subscription_cache_v1',JSON.stringify(data))}catch(_){}
      }
      trialUser=uid;
      patchPlansModal();
      return data||null;
    }catch(e){console.warn('EDIFIQ trial 64:',e);return window.__edifiqSubscription||null}
    finally{trialBusy=false}
  }
  window.edifiqEnsureTrial60=ensureTrialNow;

  function hideConfigBilling(){
    ['edSubConfig10','edSubscriptionConfigCard','edBillingConfig11'].forEach(id=>{const el=document.getElementById(id);if(el){el.hidden=true;el.style.setProperty('display','none','important')}});
  }

  function ensureMenuPlans(){
    const menu=document.getElementById('menuPasta');if(!menu)return;
    let btn=document.getElementById('menuPlanosAssinaturas');
    if(!btn){
      const config=[...menu.querySelectorAll('button')].find(b=>/configurações|configuracoes/i.test(String(b.textContent||'')));
      if(!config)return;
      btn=document.createElement('button');
      btn.id='menuPlanosAssinaturas';btn.type='button';btn.className=config.className||'edifiqDataRow';
      btn.innerHTML='<span>💳</span><b>Planos e assinaturas</b><span class="edifiqChevron">›</span>';
      btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();menu.classList.remove('open');document.getElementById('menuPastaBackdrop')?.classList.remove('open');window.openPlanosEdifiq11?.()||window.openPlanosEdifiq10?.()});
      config.insertAdjacentElement('afterend',btn);
    }
  }

  function patchPlansModal(){
    const modal=document.getElementById('edPlanosModal');if(!modal)return;
    const s=window.__edifiqSubscription||{};
    let summary=document.getElementById('edTrial60Summary');
    if(!summary){summary=document.createElement('div');summary.id='edTrial60Summary';summary.className='card';const head=modal.querySelector('.modalHead');if(head)head.insertAdjacentElement('afterend',summary);else modal.querySelector('.modalBox')?.prepend(summary)}
    const days=daysLeft(s);let html='';
    if(trialActive(s)){
      html=`<div class="financeRow"><span>🎁 Teste grátis</span><b>${days} dia${days===1?'':'s'} restante${days===1?'':'s'}</b></div><div class="financeRow"><span>Início do teste</span><b>${fmtDate(s.trial_inicio)}</b></div><div class="financeRow"><span>Vencimento do teste</span><b>${fmtDate(s.trial_fim)}</b></div><div class="financeRow"><span>Primeira cobrança</span><b>${fmtDate(s.trial_fim)}</b></div><div class="note" style="margin-top:10px">A assinatura pode ser escolhida agora, mas a primeira cobrança fica programada para depois dos 7 dias grátis.</div>`;
    }else if(String(s.status||'').toLowerCase()==='trial'){
      html='<div class="financeRow"><span>Teste grátis</span><b>Encerrado</b></div><div class="note" style="margin-top:10px">O período gratuito terminou. O modo gratuito limitado permanece disponível até o pagamento.</div>';
    }else{
      html=`<div class="financeRow"><span>Status da assinatura</span><b>${String(s.status||'—')}</b></div>${s.proxima_cobranca_em?`<div class="financeRow"><span>Próxima cobrança</span><b>${fmtDate(s.proxima_cobranca_em)}</b></div>`:''}`;
    }
    setHtmlStable(summary,html);
    modal.querySelectorAll('*').forEach(el=>{if(el.children.length)return;const t=String(el.textContent||'');let next=t;if(/Mercado Pago/i.test(next))next=next.replace(/Mercado Pago/gi,'Asaas');if(next.trim().toLowerCase()==='cortesia')next='Teste grátis';if(next!==t)el.textContent=next});
  }

  function wrapPlanOpeners(){
    if(plansWrapped)return;
    const original=window.openPlanosEdifiq11||window.openPlanosEdifiq10;
    if(typeof original!=='function')return;
    plansWrapped=true;
    const wrapped=async function(){await ensureTrialNow(true);const r=await original.apply(this,arguments);requestAnimationFrame(()=>patchPlansModal());return r};
    window.openPlanosEdifiq11=wrapped;window.openPlanosEdifiq10=wrapped;
  }

  async function invokeCheckout(plano,forma,nome='',cpf=''){
    await ensureTrialNow(true);await ensureClient();
    const body={plano,forma,return_url:location.href.split('#')[0]};
    if(forma==='boleto'){body.nome=nome;body.cpf_cnpj=cpf}
    const {data,error}=await sb.functions.invoke('edifiq-assinatura-checkout',{body});
    if(error){let msg=error.message||'Não foi possível iniciar o pagamento.';try{if(error.context&&typeof error.context.clone==='function'){const j=await error.context.clone().json();msg=j?.error||msg}}catch(_){}throw new Error(msg)}
    if(data?.error)throw new Error(data.error);
    if(!data?.checkout_url)throw new Error('O servidor não retornou o endereço de pagamento.');
    return data;
  }
  function openUrl(url){const u=new URL(String(url),location.href);if(u.protocol!=='https:'||!(u.hostname==='asaas.com'||u.hostname.endsWith('.asaas.com')))throw new Error('Endereço de pagamento inválido.');window.location.assign(u.href)}
  function setBusy(wrap,busy){window.__edifiqBillingBusy=busy;wrap.querySelectorAll('button').forEach(b=>b.disabled=busy)}
  async function startPayment(wrap,plano,forma){
    if(window.__edifiqBillingBusy)return;
    let nome='',cpf='';
    if(forma==='boleto'){
      const box=$('.edPay57Payer',wrap);box.hidden=false;
      nome=$('#edPay57Nome',wrap)?.value.trim()||'';cpf=$('#edPay57Cpf',wrap)?.value.trim()||'';
      if(!nome){toastSafe('Digite seu nome completo para emitir o boleto.');$('#edPay57Nome',wrap)?.focus();return}
      if(!validDoc(cpf)){toastSafe('Digite um CPF ou CNPJ válido para emitir o boleto.');$('#edPay57Cpf',wrap)?.focus();return}
    }
    setBusy(wrap,true);
    try{
      const sub=await ensureTrialNow(true);const charge=trialActive(sub)?fmtDate(sub.trial_fim):null;
      toastSafe(charge?`Pagamento preparado. Primeira cobrança em ${charge}.`:(forma==='pix'?'Abrindo Pix seguro...':forma==='cartao'?'Abrindo cartão de crédito...':'Gerando boleto...'));
      const data=await invokeCheckout(plano,forma,nome,cpf);
      try{localStorage.setItem('edifiq_billing_return_v1',JSON.stringify({at:new Date().toISOString(),plano,forma,status:'pending',charge_on:data?.charge_on||null,trial_active:!!data?.trial_active}))}catch(_){}
      openUrl(data.checkout_url);
    }catch(e){console.error('EDIFIQ billing 64',e);setBusy(wrap,false);toastSafe(String(e?.message||'Não foi possível iniciar o pagamento.'))}
  }

  function mount(plano){
    closePay();fixLogo();document.getElementById('edPaymentMethod47')?.remove();
    const s=window.__edifiqSubscription||{},days=daysLeft(s),trialText=trialActive(s)?`Seu teste grátis está ativo: ${days} dia${days===1?'':'s'} restante${days===1?'':'s'}. A primeira cobrança será em ${fmtDate(s.trial_fim)}.`:'O teste grátis é de 7 dias e a primeira cobrança ocorre somente depois desse período.';
    const wrap=document.createElement('div');wrap.id='edPay57';
    wrap.innerHTML=`<div class="edPay57Backdrop"></div><section class="edPay57Card" role="dialog" aria-modal="true" aria-labelledby="edPay57Title"><button class="edPay57Close" type="button" aria-label="Fechar">×</button><h3 id="edPay57Title">Forma de pagamento</h3><p class="edPay57Trial">${trialText}</p><div class="edPay57Methods"><button type="button" data-forma="cartao"><b>💳 Cartão de crédito</b><small>Cadastro seguro no Asaas. Cobrança programada para depois do teste.</small></button><button type="button" data-forma="pix"><b>◆ Pix</b><small>Abre direto no ambiente do Asaas, sem pedir nome ou CPF no Edific.</small></button><button type="button" data-forma="boleto"><b>▤ Boleto</b><small>Dados de identificação são exigidos somente para emitir o boleto.</small></button></div><div class="edPay57Payer" hidden><label>Nome completo<input id="edPay57Nome" autocomplete="name" placeholder="Digite seu nome completo"></label><label>CPF ou CNPJ<input id="edPay57Cpf" inputmode="numeric" autocomplete="off" placeholder="Digite seu CPF ou CNPJ"></label><button class="edPay57Continue" type="button">Emitir boleto</button></div><small class="edPay57Foot">Gerar Pix ou boleto não marca a assinatura como paga. O acesso pago só muda depois que o Asaas confirmar o pagamento.</small></section>`;
    document.body.appendChild(wrap);
    wrap.querySelector('.edPay57Close').onclick=closePay;wrap.querySelector('.edPay57Backdrop').onclick=closePay;
    wrap.querySelector('[data-forma="cartao"]').onclick=()=>startPayment(wrap,plano,'cartao');
    wrap.querySelector('[data-forma="pix"]').onclick=()=>startPayment(wrap,plano,'pix');
    wrap.querySelector('[data-forma="boleto"]').onclick=()=>{const box=$('.edPay57Payer',wrap);box.hidden=false;$('#edPay57Nome',wrap)?.focus()};
    wrap.querySelector('.edPay57Continue').onclick=()=>startPayment(wrap,plano,'boleto');
  }
  window.edifiqAsaasEscolher=function(plano){ensureTrialNow(true).finally(()=>mount(String(plano||'').toLowerCase()));return false};
  window.assinarPlanoEdifiq11=window.edifiqAsaasEscolher;
  window.edifiqPagar47=window.edifiqAsaasEscolher;
  window.edifiqEscolherPagamento47=window.edifiqAsaasEscolher;

  const css=document.createElement('style');css.id='edPay57Style';css.textContent=`#edSubConfig10,#edSubscriptionConfigCard,#edBillingConfig11{display:none!important}#edPay57{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px}.edPay57Backdrop{position:absolute;inset:0;background:rgba(0,0,0,.62)}.edPay57Card{position:relative;width:min(560px,100%);background:#111827;color:#fff;border:1px solid #334155;border-radius:18px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.edPay57Card h3{margin:0 36px 8px 0}.edPay57Trial{margin:0 0 14px;color:#cbd5e1;line-height:1.4}.edPay57Methods{display:grid;grid-template-columns:1fr;gap:10px}.edPay57Methods button{padding:14px;border-radius:12px;border:1px solid #475569;background:#fff;color:#0f172a;text-align:left}.edPay57Methods button b{display:block;font-size:17px}.edPay57Methods button small{display:block;margin-top:5px;color:#64748b}.edPay57Payer{margin-top:14px}.edPay57Payer[hidden]{display:none!important}.edPay57Card label{display:block;font-weight:700;margin:10px 0 0}.edPay57Card input{width:100%;box-sizing:border-box;margin-top:6px;padding:12px 13px;border-radius:11px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:16px}.edPay57Continue{width:100%;margin-top:12px;padding:12px;border-radius:11px;border:1px solid #d8a937;background:#d8a937;color:#111827;font-weight:800}.edPay57Close{position:absolute;right:12px;top:10px;border:0;background:transparent;color:#fff;font-size:28px}.edPay57Foot{display:block;margin-top:12px;color:#cbd5e1;line-height:1.35}body.edLight .edPay57Card{background:#fff;color:#111827;border-color:#d8dee9}body.edLight .edPay57Trial,body.edLight .edPay57Foot{color:#667085}body.edLight .edPay57Card input{background:#fff;color:#111827;border-color:#cbd5e1}@media(max-width:560px){.edPay57Card{padding:18px 16px}}`;document.head.appendChild(css);

  function backgroundTrialTick(){
    try{hideConfigBilling();ensureMenuPlans();wrapPlanOpeners();fixLogo();if(document.getElementById('edPlanosModal')?.classList.contains('open'))patchPlansModal()}catch(_){ }
    if(typeof user!=='undefined'&&user?.id&&trialUser!==String(user.id))ensureTrialNow().catch(()=>{});
  }
  const init=()=>{backgroundTrialTick();setInterval(backgroundTrialTick,5000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();