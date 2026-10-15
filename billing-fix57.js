(function(){
  'use strict';
  const VERSION='58';
  const LOGO='./edifiq-menu-logo.jpg?v='+VERSION;
  const $=(s,r=document)=>r.querySelector(s);
  function toastSafe(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(_){}}
  function closePay(){document.getElementById('edPay57')?.remove();document.getElementById('edAsaasFormaModal')?.classList?.remove('open');window.__edifiqBillingBusy=false}
  function fixLogo(){document.querySelectorAll('.edifiqDrawerLogo img').forEach(img=>{if(!String(img.src||'').includes('edifiq-menu-logo.jpg'))img.src=LOGO;img.alt='Edific'})}
  function onlyDigits(v){return String(v||'').replace(/\D/g,'')}
  function validDoc(v){const n=onlyDigits(v);return n.length===11||n.length===14}
  async function ensureClient(){if((typeof sb==='undefined'||!sb)&&typeof ensureSupabaseClient==='function')await ensureSupabaseClient();if(typeof sb==='undefined'||!sb)throw new Error('Sem conexão com o servidor.');if(typeof user==='undefined'||!user?.id)throw new Error('Sua sessão expirou. Entre novamente no aplicativo.')}
  async function invokeCheckout(plano,forma,nome='',cpf=''){
    await ensureClient();
    const body={plano,forma,return_url:location.href.split('#')[0]};
    if(forma==='boleto'){body.nome=nome;body.cpf_cnpj=cpf}
    const {data,error}=await sb.functions.invoke('edifiq-assinatura-checkout',{body});
    if(error){let msg=error.message||'Não foi possível iniciar o pagamento.';try{if(error.context&&typeof error.context.clone==='function'){const j=await error.context.clone().json();msg=j?.error||msg}}catch(_){}throw new Error(msg)}
    if(data?.error)throw new Error(data.error);
    if(!data?.checkout_url)throw new Error('O servidor não retornou o endereço de pagamento.');
    return data;
  }
  function openUrl(url){const u=new URL(String(url),location.href);if(u.protocol!=='https:')throw new Error('Endereço de pagamento inválido.');window.location.assign(u.href)}
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
      toastSafe(forma==='pix'?'Abrindo Pix seguro...':forma==='cartao'?'Abrindo cartão de crédito...':'Gerando boleto...');
      const data=await invokeCheckout(plano,forma,nome,cpf);
      try{localStorage.setItem('edifiq_billing_return_v1',JSON.stringify({at:new Date().toISOString(),plano,forma,status:'pending',charge_on:data?.charge_on||null,trial_active:!!data?.trial_active}))}catch(_){}
      openUrl(data.checkout_url);
    }catch(e){console.error('EDIFIQ billing 58',e);setBusy(wrap,false);toastSafe(String(e?.message||'Não foi possível iniciar o pagamento.'))}
  }
  function mount(plano){
    closePay();fixLogo();document.getElementById('edPaymentMethod47')?.remove();
    const wrap=document.createElement('div');wrap.id='edPay57';
    wrap.innerHTML=`<div class="edPay57Backdrop"></div><section class="edPay57Card" role="dialog" aria-modal="true" aria-labelledby="edPay57Title"><button class="edPay57Close" type="button" aria-label="Fechar">×</button><h3 id="edPay57Title">Forma de pagamento</h3><p class="edPay57Trial">7 dias de teste grátis. A cobrança só fica válida depois do fim do teste e a liberação depende da confirmação do pagamento.</p><div class="edPay57Methods"><button type="button" data-forma="cartao"><b>💳 Cartão de crédito</b><small>Abre direto no ambiente seguro do Asaas.</small></button><button type="button" data-forma="pix"><b>◆ Pix</b><small>Abre direto no Pix do Asaas, sem pedir nome ou CPF no Edific.</small></button><button type="button" data-forma="boleto"><b>▤ Boleto</b><small>Dados de identificação são exigidos somente para emitir o boleto.</small></button></div><div class="edPay57Payer" hidden><label>Nome completo<input id="edPay57Nome" autocomplete="name" placeholder="Digite seu nome completo"></label><label>CPF ou CNPJ<input id="edPay57Cpf" inputmode="numeric" autocomplete="off" placeholder="Digite seu CPF ou CNPJ"></label><button class="edPay57Continue" type="button">Emitir boleto</button></div><small class="edPay57Foot">Gerar Pix ou boleto não marca a assinatura como paga. O acesso só muda após confirmação do pagamento pelo servidor.</small></section>`;
    document.body.appendChild(wrap);
    wrap.querySelector('.edPay57Close').onclick=closePay;wrap.querySelector('.edPay57Backdrop').onclick=closePay;
    wrap.querySelector('[data-forma="cartao"]').onclick=()=>startPayment(wrap,plano,'cartao');
    wrap.querySelector('[data-forma="pix"]').onclick=()=>startPayment(wrap,plano,'pix');
    wrap.querySelector('[data-forma="boleto"]').onclick=()=>{const box=$('.edPay57Payer',wrap);box.hidden=false;$('#edPay57Nome',wrap)?.focus()};
    wrap.querySelector('.edPay57Continue').onclick=()=>startPayment(wrap,plano,'boleto');
  }
  window.edifiqAsaasEscolher=function(plano){mount(String(plano||'').toLowerCase());return false};
  function relabelStatus(){document.querySelectorAll('#edPlanosModal,#edSubscriptionModal,#edPlansModal,.modal').forEach(root=>{root.querySelectorAll('*').forEach(el=>{if(el.children.length)return;const t=(el.textContent||'').trim();if(t.toLowerCase()==='cortesia')el.textContent='Teste grátis';})})}
  const css=document.createElement('style');css.id='edPay57Style';css.textContent=`#edPay57{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px}.edPay57Backdrop{position:absolute;inset:0;background:rgba(0,0,0,.62)}.edPay57Card{position:relative;width:min(560px,100%);background:#111827;color:#fff;border:1px solid #334155;border-radius:18px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.edPay57Card h3{margin:0 36px 8px 0}.edPay57Trial{margin:0 0 14px;color:#cbd5e1;line-height:1.4}.edPay57Methods{display:grid;grid-template-columns:1fr;gap:10px}.edPay57Methods button{padding:14px;border-radius:12px;border:1px solid #475569;background:#fff;color:#0f172a;text-align:left}.edPay57Methods button b{display:block;font-size:17px}.edPay57Methods button small{display:block;margin-top:5px;color:#64748b}.edPay57Payer{margin-top:14px}.edPay57Payer[hidden]{display:none!important}.edPay57Card label{display:block;font-weight:700;margin:10px 0 0}.edPay57Card input{width:100%;box-sizing:border-box;margin-top:6px;padding:12px 13px;border-radius:11px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:16px}.edPay57Continue{width:100%;margin-top:12px;padding:12px;border-radius:11px;border:1px solid #d8a937;background:#d8a937;color:#111827;font-weight:800}.edPay57Close{position:absolute;right:12px;top:10px;border:0;background:transparent;color:#fff;font-size:28px}.edPay57Foot{display:block;margin-top:12px;color:#cbd5e1;line-height:1.35}body.edLight .edPay57Card{background:#fff;color:#111827;border-color:#d8dee9}body.edLight .edPay57Trial,body.edLight .edPay57Foot{color:#667085}body.edLight .edPay57Card input{background:#fff;color:#111827;border-color:#cbd5e1}@media(max-width:560px){.edPay57Card{padding:18px 16px}}`;document.head.appendChild(css);
  const init=()=>{fixLogo();relabelStatus();const mo=new MutationObserver(()=>{fixLogo();relabelStatus()});mo.observe(document.documentElement,{childList:true,subtree:true});setInterval(()=>{fixLogo();relabelStatus()},2500)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();