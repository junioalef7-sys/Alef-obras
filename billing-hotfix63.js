(function(){
  'use strict';
  if(window.__EDIFIQ_BILLING_V66)return;
  window.__EDIFIQ_BILLING_V66=true;

  const VERSION='66';
  const $=(s,r=document)=>r.querySelector(s);
  let busy=false,openersWrapped=false;

  const fmt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')};
  const days=s=>s?.trial_fim?Math.max(0,Math.ceil((new Date(s.trial_fim).getTime()-Date.now())/86400000)):0;
  const trial=s=>!!(s&&String(s.status||'').toLowerCase()==='trial'&&s.trial_fim&&new Date(s.trial_fim).getTime()>Date.now());
  const digits=v=>String(v||'').replace(/\D/g,'');
  const validDoc=v=>[11,14].includes(digits(v).length);
  const timeout=(promise,ms,msg)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(msg)),ms))]);
  const setHtml=(el,html)=>{if(el&&el.innerHTML!==html)el.innerHTML=html};
  const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text};

  function toastSafe(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(_){}}
  function safeAsaasUrl(value){
    const checkout=new URL(String(value||''),location.href);
    const host=checkout.hostname.toLowerCase();
    if(checkout.protocol!=='https:'||!(host==='asaas.com'||checkout.hostname.endsWith('.asaas.com'))){
      throw new Error('O endereço de pagamento retornado não é válido.');
    }
    return checkout.href;
  }
  window.edifiqSafeAsaasUrl66=safeAsaasUrl;

  function closePayment(){
    ['edPay66','edPay65','edPay63','edPay57','edPaymentMethod47','edAsaasFormaModal'].forEach(id=>document.getElementById(id)?.remove());
    busy=false;window.__edifiqBillingBusy=false;
  }

  function css(){
    if($('#edPay66Style'))return;
    const style=document.createElement('style');style.id='edPay66Style';style.textContent=`
      #edPlanTrial66{margin:12px 0 14px;padding:14px;border:1px solid var(--line,#34445b);border-radius:14px;background:rgba(127,127,127,.05)}
      #edPlanTrial66 .ed66Title{font-size:16px;font-weight:900;margin-bottom:8px}#edPlanTrial66 .ed66Row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:8px 0;border-top:1px solid rgba(127,127,127,.15)}#edPlanTrial66 .ed66Row:first-of-type{border-top:0}#edPlanTrial66 .ed66Row span{opacity:.75}#edPlanTrial66 .ed66Row b{text-align:right;white-space:nowrap}.ed66Note{margin-top:8px;font-size:12px;line-height:1.45;opacity:.78}
      #edPay66{position:fixed;inset:0;z-index:2147483640;display:grid;place-items:center;padding:16px}.edPay66Back{position:absolute;inset:0;background:rgba(0,0,0,.68)}
      .edPay66Card{position:relative;width:min(560px,100%);max-height:92dvh;overflow:auto;-webkit-overflow-scrolling:touch;background:#101827;color:#f8fafc;border:1px solid #34445b;border-radius:18px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.5)}
      .edPay66Close{position:absolute;right:12px;top:8px;border:0;background:transparent;color:inherit;font-size:30px}.edPay66Card h3{margin:0 42px 8px 0;font-size:23px}.edPay66Trial{margin:0 0 14px;color:#cbd5e1;line-height:1.45}
      .edPay66Methods{display:grid;gap:10px}.edPay66Methods button{padding:14px;border-radius:13px;border:1px solid #52637b;background:#1e2a3d;color:#fff;text-align:left}.edPay66Methods b{display:block;font-size:17px}.edPay66Methods small{display:block;margin-top:5px;color:#cbd5e1;line-height:1.35}
      .edPay66Payer{margin-top:14px}.edPay66Payer[hidden]{display:none!important}.edPay66Payer label{display:block;font-weight:800;margin-top:10px}.edPay66Payer input{width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border-radius:11px;border:1px solid #52637b;background:#0b1220;color:#fff;font-size:16px}.edPay66Continue{width:100%;margin-top:12px;padding:13px;border:0;border-radius:11px;background:#d8a937;color:#111827;font-weight:900}
      .edPay66Status{min-height:20px;margin-top:12px;font-size:13px;color:#cbd5e1}.edPay66Foot{display:block;margin-top:13px;color:#cbd5e1;line-height:1.4}.edPay66Pix{margin-top:14px;padding:13px;border:1px solid #52637b;border-radius:13px;background:#0b1220}.edPay66Pix img{display:block;width:min(260px,80%);margin:10px auto;background:#fff;border-radius:10px;padding:8px}.edPay66Code{width:100%;box-sizing:border-box;min-height:92px;resize:none;padding:10px;border-radius:10px;background:#111827;color:#f8fafc;border:1px solid #34445b;font-size:12px;line-height:1.4}.edPay66Copy{width:100%;margin-top:10px;padding:12px;border-radius:10px;border:1px solid #52637b;background:#1e2a3d;color:#fff;font-weight:800}
      body.edLight .edPay66Card{background:#fff;color:#111827;border-color:#d0d5dd}body.edLight .edPay66Trial,body.edLight .edPay66Foot,body.edLight .edPay66Status,body.edLight .edPay66Methods small{color:#667085}body.edLight .edPay66Methods button{background:#f8fafc;color:#111827;border-color:#cbd5e1}body.edLight .edPay66Payer input,body.edLight .edPay66Pix,body.edLight .edPay66Code{background:#fff;color:#111827;border-color:#cbd5e1}
      @media(max-width:560px){.edPay66Card{padding:18px 16px}#edPlanTrial66 .ed66Row{gap:8px}}
    `;document.head.appendChild(style);
  }

  async function ensureClient(){
    if((typeof sb==='undefined'||!sb)&&typeof ensureSupabaseClient==='function')await timeout(ensureSupabaseClient(),8000,'Não foi possível conectar ao servidor.');
    if(typeof sb==='undefined'||!sb)throw new Error('Sem conexão com o servidor.');
    if(typeof user==='undefined'||!user?.id)throw new Error('Sua sessão expirou. Entre novamente.');
  }

  async function ensureTrial(force=true){
    const run=async()=>{
      if(typeof window.edifiqEnsureTrial63==='function')return window.edifiqEnsureTrial63(null,force);
      if(typeof window.edifiqEnsureTrial62==='function')return window.edifiqEnsureTrial62(null,force);
      return window.__edifiqSubscription||null;
    };
    return timeout(Promise.resolve(run()),12000,'As informações da assinatura demoraram para responder. Tente abrir Planos e assinaturas novamente.');
  }

  function renderPlanInfo(sub){
    const modal=document.getElementById('edPlanosModal');if(!modal)return;
    document.getElementById('edPlanTrial65')?.remove();
    document.getElementById('edTrial60Summary')?.remove();
    document.getElementById('edTrial62Summary')?.remove();
    let box=document.getElementById('edPlanTrial66');
    if(!box){box=document.createElement('div');box.id='edPlanTrial66';const head=modal.querySelector('.modalHead');if(head)head.insertAdjacentElement('afterend',box);else (modal.querySelector('.modalBox')||modal).prepend(box)}
    if(!sub){setHtml(box,'<div class="ed66Title">Período de acesso</div><div class="ed66Note">Carregando as informações da assinatura…</div>');return}
    if(trial(sub)){
      const d=days(sub);
      setHtml(box,`<div class="ed66Title">🎁 Teste grátis</div><div class="ed66Row"><span>Início do teste</span><b>${fmt(sub.trial_inicio)}</b></div><div class="ed66Row"><span>Dias restantes</span><b>${d}</b></div><div class="ed66Row"><span>Vencimento do teste</span><b>${fmt(sub.trial_fim)}</b></div><div class="ed66Row"><span>Primeira cobrança</span><b>${fmt(sub.trial_fim)}</b></div><div class="ed66Note">O acesso completo permanece liberado durante os 7 dias. A primeira cobrança fica programada somente para depois do vencimento do teste.</div>`);
    }else{
      const st=String(sub.status||'').toLowerCase();
      const title=st==='ativa'?'Assinatura ativa':st==='cortesia'?'Cortesia':st==='trial'?'Teste grátis encerrado':'Plano gratuito limitado';
      setHtml(box,`<div class="ed66Title">${title}</div><div class="ed66Row"><span>Início do teste</span><b>${fmt(sub.trial_inicio)}</b></div><div class="ed66Row"><span>Fim do teste</span><b>${fmt(sub.trial_fim)}</b></div>${sub.proxima_cobranca_em?`<div class="ed66Row"><span>Próxima cobrança</span><b>${fmt(sub.proxima_cobranca_em)}</b></div>`:''}<div class="ed66Note">Se o pagamento ainda não estiver confirmado, permanece disponível somente o modo gratuito limitado.</div>`);
    }
  }
  window.edifiqRenderPlanInfo66=renderPlanInfo;

  async function refreshPlanInfo(){
    renderPlanInfo(window.__edifiqSubscription||null);
    try{const sub=await ensureTrial(true);renderPlanInfo(sub||window.__edifiqSubscription||null)}catch(e){console.warn('EDIFIQ planos 66:',e);renderPlanInfo(window.__edifiqSubscription||null)}
  }

  function wrapPlanOpeners(){
    if(openersWrapped)return;
    const f11=window.openPlanosEdifiq11,f10=window.openPlanosEdifiq10;
    if(typeof f11!=='function'&&typeof f10!=='function')return;
    const wrap=fn=>function(){const result=fn.apply(this,arguments);requestAnimationFrame(refreshPlanInfo);return result};
    if(typeof f11==='function')window.openPlanosEdifiq11=wrap(f11);
    if(typeof f10==='function'&&f10!==f11)window.openPlanosEdifiq10=wrap(f10);
    openersWrapped=true;
  }

  async function checkout(plano,forma,nome='',cpf=''){
    await ensureClient();
    const sub=await ensureTrial(true).catch(()=>window.__edifiqSubscription||null);renderPlanInfo(sub);
    const body={plano,forma,return_url:location.href.split('#')[0]};
    if(forma==='boleto'){body.nome=nome;body.cpf_cnpj=cpf}
    const {data,error}=await timeout(sb.functions.invoke('edifiq-assinatura-checkout',{body}),25000,'O pagamento demorou para responder. Tente novamente.');
    if(error){let msg=error.message||'Não foi possível iniciar o pagamento.';try{if(error.context&&typeof error.context.clone==='function'){const j=await error.context.clone().json();msg=j?.error||msg}}catch(_){}throw new Error(msg)}
    if(data?.error)throw new Error(data.error);
    return data||{};
  }

  function setDisabled(root,value){root.querySelectorAll('button').forEach(b=>b.disabled=value)}
  function status(root,text){setText($('.edPay66Status',root),text||'')}

  async function copyTextIOS(text,field){
    if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(text);return true}catch(_){}}
    try{
      const ta=field||document.createElement('textarea');let temporary=false;
      if(!field){temporary=true;ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta)}
      ta.focus({preventScroll:true});ta.select();ta.setSelectionRange?.(0,text.length);
      const ok=!!(document.execCommand&&document.execCommand('copy'));if(temporary)ta.remove();if(ok)return true;
    }catch(_){}
    try{field?.focus({preventScroll:true});field?.select();field?.setSelectionRange?.(0,text.length)}catch(_){}
    return false;
  }
  window.edifiqCopyPix66=copyTextIOS;

  function showPix(root,data){
    const payload=String(data?.pix?.payload||''),image=String(data?.pix?.encodedImage||'');
    if(!payload){
      if(data?.checkout_url){busy=false;window.__edifiqBillingBusy=false;setDisabled(root,false);location.assign(safeAsaasUrl(data.checkout_url));return}
      throw new Error('O Asaas não retornou o código Pix.');
    }
    let box=$('.edPay66Pix',root);if(!box){box=document.createElement('div');box.className='edPay66Pix';root.querySelector('.edPay66Foot')?.insertAdjacentElement('beforebegin',box)}
    const safe=payload.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    setHtml(box,`<b>Pix preparado</b><small style="display:block;margin-top:5px">Cobrança programada para ${fmt(data?.charge_on)}. O acesso pago só muda após a confirmação do Asaas.</small>${image?`<img alt="QR Code Pix" src="data:image/png;base64,${image}">`:''}<textarea class="edPay66Code" readonly aria-label="Código Pix copia e cola">${safe}</textarea><button class="edPay66Copy" type="button">Copiar código Pix</button>`);
    const field=$('.edPay66Code',box),button=$('.edPay66Copy',box);
    button.onclick=async()=>{
      const ok=await copyTextIOS(payload,field);
      if(ok){button.textContent='Copiado ✓';toastSafe('Código Pix copiado.');setTimeout(()=>{if(button.isConnected)button.textContent='Copiar código Pix'},1400)}
      else toastSafe('O iPhone bloqueou a cópia automática. O código ficou selecionado; toque e segure e escolha Copiar.');
    };
    status(root,'Pix gerado. Copie o código ou utilize o QR Code.');
  }

  async function pay(root,plano,forma){
    if(busy)return;
    let nome='',cpf='';
    if(forma==='boleto'){
      const payer=$('.edPay66Payer',root);payer.hidden=false;
      nome=$('#edPay66Nome',root)?.value.trim()||'';cpf=$('#edPay66Cpf',root)?.value.trim()||'';
      if(!nome){toastSafe('Digite o nome completo para emitir o boleto.');$('#edPay66Nome',root)?.focus();return}
      if(!validDoc(cpf)){toastSafe('Digite um CPF ou CNPJ válido para emitir o boleto.');$('#edPay66Cpf',root)?.focus();return}
    }
    busy=true;window.__edifiqBillingBusy=true;setDisabled(root,true);status(root,'Conectando ao Asaas…');
    try{
      const data=await checkout(plano,forma,nome,cpf);
      try{localStorage.setItem('edifiq_billing_return_v1',JSON.stringify({at:new Date().toISOString(),plano,forma,status:'pending',charge_on:data.charge_on||null,trial_active:!!data.trial_active}))}catch(_){}
      if(forma==='pix'){showPix(root,data);busy=false;window.__edifiqBillingBusy=false;setDisabled(root,false);return}
      if(!data?.checkout_url)throw new Error('O servidor não retornou o endereço de pagamento.');
      const url=safeAsaasUrl(data.checkout_url);
      busy=false;window.__edifiqBillingBusy=false;setDisabled(root,false);status(root,'Abrindo ambiente seguro do Asaas…');location.assign(url);
    }catch(e){busy=false;window.__edifiqBillingBusy=false;setDisabled(root,false);status(root,'');toastSafe(String(e?.message||'Não foi possível iniciar o pagamento.'))}
  }

  async function mount(plano){
    closePayment();css();
    let sub=window.__edifiqSubscription||null;try{sub=await ensureTrial(true)||sub}catch(e){console.warn('EDIFIQ pagamento 66:',e)}
    const d=days(sub),trialText=trial(sub)?`Teste grátis ativo. Início: ${fmt(sub?.trial_inicio)} • faltam ${d} dia${d===1?'':'s'} • vence em ${fmt(sub?.trial_fim)} • primeira cobrança em ${fmt(sub?.trial_fim)}.`:'O teste grátis terminou. O modo gratuito limitado continua disponível até a confirmação do pagamento.';
    const root=document.createElement('div');root.id='edPay66';root.innerHTML=`<div class="edPay66Back"></div><section class="edPay66Card" role="dialog" aria-modal="true" aria-labelledby="edPay66Title"><button class="edPay66Close" type="button" aria-label="Fechar">×</button><h3 id="edPay66Title">Forma de pagamento</h3><p class="edPay66Trial">${trialText}</p><div class="edPay66Methods"><button type="button" data-forma="pix"><b>◆ Pix</b><small>Gera o Pix diretamente. Nome e CPF não são solicitados nesta tela.</small></button><button type="button" data-forma="boleto"><b>▤ Boleto</b><small>Os dados são solicitados somente para emitir o boleto.</small></button><button type="button" data-forma="cartao"><b>💳 Cartão de crédito</b><small>Cadastro e cobrança no ambiente seguro do Asaas.</small></button></div><div class="edPay66Payer" hidden><label>Nome completo<input id="edPay66Nome" autocomplete="name"></label><label>CPF ou CNPJ<input id="edPay66Cpf" inputmode="numeric" autocomplete="off"></label><button class="edPay66Continue" type="button">Emitir boleto</button></div><div class="edPay66Status" aria-live="polite"></div><small class="edPay66Foot">Pix, boleto e cartão só liberam o plano após a confirmação do Asaas. Durante o teste, a primeira cobrança continua programada para depois dos 7 dias.</small></section>`;
    document.body.appendChild(root);
    root.querySelector('.edPay66Back').onclick=closePayment;root.querySelector('.edPay66Close').onclick=closePayment;
    root.querySelector('[data-forma="pix"]').onclick=()=>pay(root,plano,'pix');
    root.querySelector('[data-forma="cartao"]').onclick=()=>pay(root,plano,'cartao');
    root.querySelector('[data-forma="boleto"]').onclick=()=>{const p=$('.edPay66Payer',root);p.hidden=false;$('#edPay66Nome',root)?.focus()};
    root.querySelector('.edPay66Continue').onclick=()=>pay(root,plano,'boleto');
  }

  function choose(plano){mount(String(plano||'').toLowerCase());return false}
  function install(){
    css();wrapPlanOpeners();
    window.edifiqAsaasEscolher=choose;window.assinarPlanoEdifiq11=choose;window.edifiqPagar47=choose;window.edifiqEscolherPagamento47=choose;
  }
  function init(){
    install();
    window.addEventListener('edifiq:subscription-updated',e=>{if(document.getElementById('edPlanosModal'))renderPlanInfo(e.detail||window.__edifiqSubscription||null)});
    window.addEventListener('pageshow',()=>{busy=false;window.__edifiqBillingBusy=false;closePayment();setTimeout(install,0)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
