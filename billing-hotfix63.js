(function(){
  'use strict';
  const VERSION='65';
  const $=(s,r=document)=>r.querySelector(s);
  let busy=false,openersWrapped=false;

  const fmt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')};
  const days=s=>s?.trial_fim?Math.max(0,Math.ceil((new Date(s.trial_fim).getTime()-Date.now())/86400000)):0;
  const trial=s=>!!(s&&String(s.status||'').toLowerCase()==='trial'&&s.trial_fim&&new Date(s.trial_fim).getTime()>Date.now());
  const digits=v=>String(v||'').replace(/\D/g,'');
  const validDoc=v=>[11,14].includes(digits(v).length);
  const sleepTimeout=(promise,ms,msg)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(msg)),ms))]);
  function q(sel){return document.querySelector(sel)}
  function toastSafe(m){try{if(typeof window.toast==='function')window.toast(m);else alert(m)}catch(_){}}
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function setHtml(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}
  function closeLegacy(){['edPay65','edPay63','edPay57','edPaymentMethod47','edAsaasFormaModal'].forEach(id=>document.getElementById(id)?.remove());busy=false;window.__edifiqBillingBusy=false}

  function css(){
    if(q('#edPay65Style'))return;
    const s=document.createElement('style');s.id='edPay65Style';s.textContent=`
      #edPlanTrial65{margin:12px 0 14px;padding:14px;border:1px solid var(--line,#34445b);border-radius:14px;background:rgba(127,127,127,.05)}
      #edPlanTrial65 .edPlan65Title{font-weight:900;font-size:15px;margin-bottom:8px}#edPlanTrial65 .edPlan65Row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:8px 0;border-top:1px solid rgba(127,127,127,.15)}#edPlanTrial65 .edPlan65Row:first-of-type{border-top:0}#edPlanTrial65 .edPlan65Row span{opacity:.78}#edPlanTrial65 .edPlan65Row b{text-align:right;white-space:nowrap}.edPlan65Note{margin-top:8px;font-size:12px;line-height:1.4;opacity:.76}
      #edPay65{position:fixed;inset:0;z-index:2147483640;display:grid;place-items:center;padding:16px}.edPay65Back{position:absolute;inset:0;background:rgba(0,0,0,.66)}
      .edPay65Card{position:relative;width:min(560px,100%);max-height:92dvh;overflow:auto;-webkit-overflow-scrolling:touch;background:#101827;color:#f8fafc;border:1px solid #34445b;border-radius:18px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.5)}
      .edPay65Close{position:absolute;right:12px;top:9px;border:0;background:transparent;color:inherit;font-size:30px}.edPay65Card h3{margin:0 42px 8px 0;font-size:23px}.edPay65Trial{margin:0 0 14px;color:#cbd5e1;line-height:1.45}
      .edPay65Methods{display:grid;gap:10px}.edPay65Methods button{padding:14px;border-radius:13px;border:1px solid #52637b;background:#1e2a3d;color:#fff;text-align:left}.edPay65Methods b{display:block;font-size:17px}.edPay65Methods small{display:block;margin-top:5px;color:#cbd5e1;line-height:1.35}
      .edPay65Payer{margin-top:14px}.edPay65Payer[hidden]{display:none!important}.edPay65Payer label{display:block;font-weight:800;margin-top:10px}.edPay65Payer input{width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border-radius:11px;border:1px solid #52637b;background:#0b1220;color:#fff;font-size:16px}.edPay65Continue{width:100%;margin-top:12px;padding:13px;border:0;border-radius:11px;background:#d8a937;color:#111827;font-weight:900}
      .edPay65Status{min-height:20px;margin:12px 0 0;font-size:13px;color:#cbd5e1}.edPay65Foot{display:block;margin-top:13px;color:#cbd5e1;line-height:1.4}.edPay65Pix{margin-top:14px;padding:13px;border:1px solid #52637b;border-radius:13px;background:#0b1220}.edPay65Pix img{display:block;width:min(260px,80%);margin:10px auto;background:#fff;border-radius:10px;padding:8px}.edPay65Code{width:100%;box-sizing:border-box;min-height:88px;resize:none;word-break:break-all;padding:10px;border-radius:10px;background:#111827;color:#f8fafc;border:1px solid #34445b;font-size:12px;line-height:1.4}.edPay65Copy{width:100%;margin-top:10px;padding:12px;border-radius:10px;border:1px solid #52637b;background:#1e2a3d;color:#fff;font-weight:800}
      body.edLight .edPay65Card{background:#fff;color:#111827;border-color:#d0d5dd}body.edLight .edPay65Trial,body.edLight .edPay65Foot,body.edLight .edPay65Status,body.edLight .edPay65Methods small{color:#667085}body.edLight .edPay65Methods button{background:#f8fafc;color:#111827;border-color:#cbd5e1}body.edLight .edPay65Payer input,body.edLight .edPay65Pix,body.edLight .edPay65Code{background:#fff;color:#111827;border-color:#cbd5e1}
      @media(max-width:560px){.edPay65Card{padding:18px 16px}#edPlanTrial65 .edPlan65Row{grid-template-columns:1fr auto;gap:8px}}
    `;document.head.appendChild(s);
  }

  async function ensureTrial(force=true){
    const call=async()=>{
      if(typeof window.edifiqEnsureTrial63==='function')return await window.edifiqEnsureTrial63(null,force);
      if(typeof window.edifiqEnsureTrial62==='function')return await window.edifiqEnsureTrial62(null,force);
      return window.__edifiqSubscription||null;
    };
    return await sleepTimeout(call(),12000,'A assinatura demorou para responder. Feche e abra Planos e assinaturas novamente.');
  }

  async function ensureClient(){
    if((typeof sb==='undefined'||!sb)&&typeof ensureSupabaseClient==='function')await sleepTimeout(ensureSupabaseClient(),8000,'Não foi possível conectar ao servidor.');
    if(typeof sb==='undefined'||!sb)throw new Error('Sem conexão com o servidor.');
    if(typeof user==='undefined'||!user?.id)throw new Error('Sua sessão expirou. Entre novamente.');
  }

  function renderPlanInfo(sub){
    const modal=document.getElementById('edPlanosModal');if(!modal)return;
    let box=document.getElementById('edPlanTrial65');
    if(!box){box=document.createElement('div');box.id='edPlanTrial65';const head=modal.querySelector('.modalHead');if(head)head.insertAdjacentElement('afterend',box);else (modal.querySelector('.modalBox')||modal).prepend(box)}
    if(!sub){setHtml(box,'<div class="edPlan65Title">Período de acesso</div><div class="edPlan65Note">Carregando informações da assinatura…</div>');return}
    if(trial(sub)){
      const d=days(sub);
      setHtml(box,`<div class="edPlan65Title">🎁 Teste grátis</div><div class="edPlan65Row"><span>Início</span><b>${fmt(sub.trial_inicio)}</b></div><div class="edPlan65Row"><span>Dias restantes</span><b>${d}</b></div><div class="edPlan65Row"><span>Termina em</span><b>${fmt(sub.trial_fim)}</b></div><div class="edPlan65Row"><span>Primeira cobrança</span><b>${fmt(sub.trial_fim)}</b></div><div class="edPlan65Note">Durante o teste o acesso permanece completo. A primeira cobrança fica programada somente para depois do fim dos 7 dias.</div>`);
    }else{
      const status=String(sub.status||'').toLowerCase();
      const label=status==='ativa'?'Assinatura ativa':status==='trial'?'Teste encerrado':status==='cortesia'?'Cortesia':'Plano gratuito limitado';
      setHtml(box,`<div class="edPlan65Title">${label}</div><div class="edPlan65Row"><span>Teste iniciou</span><b>${fmt(sub.trial_inicio)}</b></div><div class="edPlan65Row"><span>Teste terminou</span><b>${fmt(sub.trial_fim)}</b></div>${sub.proxima_cobranca_em?`<div class="edPlan65Row"><span>Próxima cobrança</span><b>${fmt(sub.proxima_cobranca_em)}</b></div>`:''}<div class="edPlan65Note">Se o pagamento ainda não foi confirmado, permanece disponível somente o modo gratuito limitado.</div>`);
    }
  }
  window.edifiqRenderPlanInfo65=renderPlanInfo;

  async function refreshPlanInfo(){
    renderPlanInfo(window.__edifiqSubscription||null);
    try{const sub=await ensureTrial(true);renderPlanInfo(sub||window.__edifiqSubscription||null)}catch(e){console.warn('EDIFIQ planos 65:',e);renderPlanInfo(window.__edifiqSubscription||null)}
  }

  function wrapOpeners(){
    if(openersWrapped)return;
    const original11=window.openPlanosEdifiq11,original10=window.openPlanosEdifiq10;
    if(typeof original11!=='function'&&typeof original10!=='function')return;
    const wrap=original=>function(){const r=original.apply(this,arguments);requestAnimationFrame(()=>refreshPlanInfo());return r};
    if(typeof original11==='function')window.openPlanosEdifiq11=wrap(original11);
    if(typeof original10==='function'&&original10!==original11)window.openPlanosEdifiq10=wrap(original10);
    openersWrapped=true;
  }

  async function checkout(plano,forma,nome='',cpf=''){
    await ensureClient();
    const sub=await ensureTrial(true).catch(()=>window.__edifiqSubscription||null);
    renderPlanInfo(sub);
    const body={plano,forma,return_url:location.href.split('#')[0]};
    if(forma==='boleto'){body.nome=nome;body.cpf_cnpj=cpf}
    const invoke=sb.functions.invoke('edifiq-assinatura-checkout',{body});
    const {data,error}=await sleepTimeout(invoke,25000,'O pagamento demorou para responder. Tente novamente. Nenhuma cobrança foi confirmada por esta tela.');
    if(error){let msg=error.message||'Não foi possível iniciar o pagamento.';try{if(error.context&&typeof error.context.clone==='function'){const j=await error.context.clone().json();msg=j?.error||msg}}catch(_){}throw new Error(msg)}
    if(data?.error)throw new Error(data.error);
    return data||{};
  }

  function setDisabled(root,v){root.querySelectorAll('button').forEach(b=>b.disabled=v)}
  function status(root,text){setText($('.edPay65Status',root),text||'')}

  async function copyTextIOS(text,field){
    if(navigator.clipboard&&window.isSecureContext){
      try{await navigator.clipboard.writeText(text);return true}catch(_){}
    }
    try{
      const ta=field||document.createElement('textarea');
      let temporary=false;
      if(!field){temporary=true;ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';ta.style.top='0';document.body.appendChild(ta)}
      ta.focus({preventScroll:true});ta.select();if(typeof ta.setSelectionRange==='function')ta.setSelectionRange(0,text.length);
      const ok=document.execCommand&&document.execCommand('copy');
      if(temporary)ta.remove();
      if(ok)return true;
    }catch(_){}
    try{field?.focus({preventScroll:true});field?.select();field?.setSelectionRange?.(0,text.length)}catch(_){}
    return false;
  }

  function showPix(root,data){
    const payload=String(data?.pix?.payload||'');
    const image=String(data?.pix?.encodedImage||'');
    if(!payload){if(data?.checkout_url){busy=false;window.__edifiqBillingBusy=false;setDisabled(root,false);location.assign(data.checkout_url);return}throw new Error('O Asaas não retornou o código Pix.')}
    let box=$('.edPay65Pix',root);if(!box){box=document.createElement('div');box.className='edPay65Pix';root.querySelector('.edPay65Foot')?.insertAdjacentElement('beforebegin',box)}
    const safe=payload.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    setHtml(box,`<b>Pix preparado</b><small style="display:block;margin-top:5px">Vencimento programado para ${fmt(data?.charge_on)}. Gerar o Pix não libera o plano antes da confirmação do pagamento.</small>${image?`<img alt="QR Code Pix" src="data:image/png;base64,${image}">`:''}<textarea class="edPay65Code" readonly aria-label="Código Pix copia e cola">${safe}</textarea><button class="edPay65Copy" type="button">Copiar código Pix</button>`);
    const field=$('.edPay65Code',box),btn=$('.edPay65Copy',box);
    btn.onclick=async()=>{
      const ok=await copyTextIOS(payload,field);
      if(ok){const old=btn.textContent;btn.textContent='Copiado ✓';toastSafe('Código Pix copiado.');setTimeout(()=>{if(btn.isConnected)btn.textContent=old},1400)}
      else{toastSafe('O iPhone bloqueou a cópia automática. O código ficou selecionado; toque e segure e escolha Copiar.')}
    };
    status(root,'Pix gerado. Copie o código ou use o QR Code.');
  }

  async function pay(root,plano,forma){
    if(busy)return;let nome='',cpf='';
    if(forma==='boleto'){
      const payer=$('.edPay65Payer',root);payer.hidden=false;
      nome=$('#edPay65Nome',root)?.value.trim()||'';cpf=$('#edPay65Cpf',root)?.value.trim()||'';
      if(!nome){toastSafe('Digite o nome completo para emitir o boleto.');$('#edPay65Nome',root)?.focus();return}
      if(!validDoc(cpf)){toastSafe('Digite um CPF ou CNPJ válido para emitir o boleto.');$('#edPay65Cpf',root)?.focus();return}
    }
    busy=true;window.__edifiqBillingBusy=true;setDisabled(root,true);status(root,'Conectando ao Asaas…');
    try{
      const data=await checkout(plano,forma,nome,cpf);
      try{localStorage.setItem('edifiq_billing_return_v1',JSON.stringify({at:new Date().toISOString(),plano,forma,status:'pending',charge_on:data.charge_on||null,trial_active:!!data.trial_active}))}catch(_){}
      if(forma==='pix'){showPix(root,data);busy=false;window.__edifiqBillingBusy=false;setDisabled(root,false);return}
      if(!data?.checkout_url)throw new Error('O servidor não retornou o endereço de pagamento.');
      busy=false;window.__edifiqBillingBusy=false;setDisabled(root,false);status(root,'Abrindo ambiente seguro do Asaas…');
      location.assign(data.checkout_url);
    }catch(e){busy=false;window.__edifiqBillingBusy=false;setDisabled(root,false);status(root,'');toastSafe(String(e?.message||'Não foi possível iniciar o pagamento.'))}
  }

  async function mount(plano){
    closeLegacy();css();
    let sub=window.__edifiqSubscription||null;
    try{sub=await ensureTrial(true)||sub}catch(e){console.warn('EDIFIQ pagamento 65 trial:',e)}
    const d=days(sub);
    const trialText=trial(sub)?`Teste grátis ativo. Restam ${d} dia${d===1?'':'s'}. Início: ${fmt(sub?.trial_inicio)} • término: ${fmt(sub?.trial_fim)} • primeira cobrança: ${fmt(sub?.trial_fim)}.`:'O teste grátis terminou. O modo gratuito limitado continua disponível até a confirmação do pagamento.';
    const root=document.createElement('div');root.id='edPay65';root.innerHTML=`<div class="edPay65Back"></div><section class="edPay65Card" role="dialog" aria-modal="true" aria-labelledby="edPay65Title"><button class="edPay65Close" type="button" aria-label="Fechar">×</button><h3 id="edPay65Title">Forma de pagamento</h3><p class="edPay65Trial">${trialText}</p><div class="edPay65Methods"><button type="button" data-forma="pix"><b>◆ Pix</b><small>Gera o Pix diretamente. Nome e CPF não são solicitados nesta tela.</small></button><button type="button" data-forma="boleto"><b>▤ Boleto</b><small>Os dados são solicitados apenas para emissão do boleto.</small></button><button type="button" data-forma="cartao"><b>💳 Cartão de crédito</b><small>Cadastro e cobrança no ambiente seguro do Asaas.</small></button></div><div class="edPay65Payer" hidden><label>Nome completo<input id="edPay65Nome" autocomplete="name"></label><label>CPF ou CNPJ<input id="edPay65Cpf" inputmode="numeric" autocomplete="off"></label><button class="edPay65Continue" type="button">Emitir boleto</button></div><div class="edPay65Status" aria-live="polite"></div><small class="edPay65Foot">Pix, boleto ou cartão só alteram o acesso pago depois da confirmação do Asaas. Durante o teste, a primeira cobrança permanece programada para o fim dos 7 dias.</small></section>`;
    document.body.appendChild(root);
    root.querySelector('.edPay65Back').onclick=closeLegacy;root.querySelector('.edPay65Close').onclick=closeLegacy;
    root.querySelector('[data-forma="pix"]').onclick=()=>pay(root,plano,'pix');
    root.querySelector('[data-forma="cartao"]').onclick=()=>pay(root,plano,'cartao');
    root.querySelector('[data-forma="boleto"]').onclick=()=>{const box=$('.edPay65Payer',root);box.hidden=false;$('#edPay65Nome',root)?.focus()};
    root.querySelector('.edPay65Continue').onclick=()=>pay(root,plano,'boleto');
  }

  function choose(plano){mount(String(plano||'').toLowerCase());return false}
  function install(){
    css();wrapOpeners();
    window.edifiqAsaasEscolher=choose;window.assinarPlanoEdifiq11=choose;window.edifiqPagar47=choose;window.edifiqEscolherPagamento47=choose;
    if(document.getElementById('edPlanosModal'))refreshPlanInfo();
  }
  function init(){install();window.addEventListener('edifiq:subscription-updated',ev=>{if(document.getElementById('edPlanosModal'))renderPlanInfo(ev.detail||window.__edifiqSubscription||null)});window.addEventListener('pageshow',()=>{busy=false;window.__edifiqBillingBusy=false;closeLegacy();setTimeout(install,0)})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();