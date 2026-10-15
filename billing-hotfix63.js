(function(){
  'use strict';
  const VERSION='63';
  const $=(s,r=document)=>r.querySelector(s);
  let busy=false;
  const fmt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')};
  const days=s=>s?.trial_fim?Math.max(0,Math.ceil((new Date(s.trial_fim).getTime()-Date.now())/86400000)):0;
  const trial=s=>!!(s&&String(s.status||'').toLowerCase()==='trial'&&s.trial_fim&&new Date(s.trial_fim).getTime()>Date.now());
  const digits=v=>String(v||'').replace(/\D/g,'');
  const validDoc=v=>[11,14].includes(digits(v).length);
  function toastSafe(m){try{if(typeof window.toast==='function')window.toast(m);else alert(m)}catch(_){}}
  function close(){q('#edPay63')?.remove();q('#edPay57')?.remove();q('#edPaymentMethod47')?.remove();busy=false}
  function q(sel){return document.querySelector(sel)}
  function css(){if(q('#edPay63Style'))return;const s=document.createElement('style');s.id='edPay63Style';s.textContent=`
    #edPay63{position:fixed;inset:0;z-index:2147483640;display:grid;place-items:center;padding:16px}.edPay63Back{position:absolute;inset:0;background:rgba(0,0,0,.66)}
    .edPay63Card{position:relative;width:min(560px,100%);max-height:92dvh;overflow:auto;background:#101827;color:#f8fafc;border:1px solid #34445b;border-radius:18px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.5)}
    .edPay63Close{position:absolute;right:12px;top:9px;border:0;background:transparent;color:inherit;font-size:30px}.edPay63Card h3{margin:0 42px 8px 0;font-size:23px}.edPay63Trial{margin:0 0 14px;color:#cbd5e1;line-height:1.45}
    .edPay63Methods{display:grid;gap:10px}.edPay63Methods button{padding:14px;border-radius:13px;border:1px solid #52637b;background:#1e2a3d;color:#fff;text-align:left}.edPay63Methods b{display:block;font-size:17px}.edPay63Methods small{display:block;margin-top:5px;color:#cbd5e1;line-height:1.35}
    .edPay63Payer{margin-top:14px}.edPay63Payer[hidden]{display:none!important}.edPay63Payer label{display:block;font-weight:800;margin-top:10px}.edPay63Payer input{width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border-radius:11px;border:1px solid #52637b;background:#0b1220;color:#fff;font-size:16px}.edPay63Continue{width:100%;margin-top:12px;padding:13px;border:0;border-radius:11px;background:#d8a937;color:#111827;font-weight:900}
    .edPay63Foot{display:block;margin-top:13px;color:#cbd5e1;line-height:1.4}.edPay63Pix{margin-top:14px;padding:13px;border:1px solid #52637b;border-radius:13px;background:#0b1220}.edPay63Pix img{display:block;width:min(260px,80%);margin:10px auto;background:#fff;border-radius:10px;padding:8px}.edPay63Code{word-break:break-all;padding:10px;border-radius:10px;background:#111827;border:1px solid #34445b;font-size:12px;line-height:1.4}.edPay63Copy{width:100%;margin-top:10px;padding:12px;border-radius:10px;border:1px solid #52637b;background:#1e2a3d;color:#fff;font-weight:800}
    body.edLight .edPay63Card{background:#fff;color:#111827;border-color:#d0d5dd}body.edLight .edPay63Trial,body.edLight .edPay63Foot,body.edLight .edPay63Methods small{color:#667085}body.edLight .edPay63Methods button{background:#f8fafc;color:#111827;border-color:#cbd5e1}body.edLight .edPay63Payer input,body.edLight .edPay63Pix{background:#fff;color:#111827;border-color:#cbd5e1}body.edLight .edPay63Code{background:#f8fafc;color:#111827;border-color:#d0d5dd}
  `;document.head.appendChild(s)}
  async function ensureTrial(){
    if(typeof window.edifiqEnsureTrial63==='function')return await window.edifiqEnsureTrial63(null,true);
    if(typeof window.edifiqEnsureTrial62==='function')return await window.edifiqEnsureTrial62(null,true);
    return window.__edifiqSubscription||null;
  }
  async function ensureClient(){
    if((typeof sb==='undefined'||!sb)&&typeof ensureSupabaseClient==='function')await ensureSupabaseClient();
    if(typeof sb==='undefined'||!sb)throw new Error('Sem conexão com o servidor.');
    if(typeof user==='undefined'||!user?.id)throw new Error('Sua sessão expirou. Entre novamente.');
  }
  async function checkout(plano,forma,nome='',cpf=''){
    await ensureClient();
    await ensureTrial();
    const body={plano,forma,return_url:location.href.split('#')[0]};
    if(forma==='boleto'){body.nome=nome;body.cpf_cnpj=cpf}
    const {data,error}=await sb.functions.invoke('edifiq-assinatura-checkout',{body});
    if(error){let msg=error.message||'Não foi possível iniciar o pagamento.';try{if(error.context&&typeof error.context.clone==='function'){const j=await error.context.clone().json();msg=j?.error||msg}}catch(_){}throw new Error(msg)}
    if(data?.error)throw new Error(data.error);
    return data||{};
  }
  function setDisabled(root,v){root.querySelectorAll('button').forEach(b=>b.disabled=v)}
  function showPix(root,data){
    const payload=String(data?.pix?.payload||'');
    const image=String(data?.pix?.encodedImage||'');
    if(!payload){if(data?.checkout_url){location.assign(data.checkout_url);return}throw new Error('O Asaas não retornou o código Pix.')}
    let box=$('.edPay63Pix',root);if(!box){box=document.createElement('div');box.className='edPay63Pix';root.querySelector('.edPay63Foot')?.insertAdjacentElement('beforebegin',box)}
    box.innerHTML=`<b>Pix preparado</b><small style="display:block;margin-top:5px">A cobrança continua com vencimento programado para ${fmt(data?.charge_on)}. Gerar o Pix não libera o plano antes da confirmação do pagamento.</small>${image?`<img alt="QR Code Pix" src="data:image/png;base64,${image}">`:''}<div class="edPay63Code">${payload.replace(/</g,'&lt;')}</div><button class="edPay63Copy" type="button">Copiar código Pix</button>`;
    box.querySelector('.edPay63Copy').onclick=async()=>{try{await navigator.clipboard.writeText(payload);toastSafe('Código Pix copiado.')}catch(_){const ta=document.createElement('textarea');ta.value=payload;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toastSafe('Código Pix copiado.')}};
  }
  async function pay(root,plano,forma){
    if(busy)return;let nome='',cpf='';
    if(forma==='boleto'){
      const payer=$('.edPay63Payer',root);payer.hidden=false;
      nome=$('#edPay63Nome',root)?.value.trim()||'';cpf=$('#edPay63Cpf',root)?.value.trim()||'';
      if(!nome){toastSafe('Digite o nome completo para emitir o boleto.');$('#edPay63Nome',root)?.focus();return}
      if(!validDoc(cpf)){toastSafe('Digite um CPF ou CNPJ válido para emitir o boleto.');$('#edPay63Cpf',root)?.focus();return}
    }
    busy=true;setDisabled(root,true);
    try{
      const data=await checkout(plano,forma,nome,cpf);
      try{localStorage.setItem('edifiq_billing_return_v1',JSON.stringify({at:new Date().toISOString(),plano,forma,status:'pending',charge_on:data.charge_on||null,trial_active:!!data.trial_active}))}catch(_){}
      if(forma==='pix'){showPix(root,data);busy=false;setDisabled(root,false);return}
      if(!data?.checkout_url)throw new Error('O servidor não retornou o endereço de pagamento.');
      location.assign(data.checkout_url);
    }catch(e){busy=false;setDisabled(root,false);toastSafe(String(e?.message||'Não foi possível iniciar o pagamento.'))}
  }
  async function mount(plano){
    close();css();const sub=await ensureTrial().catch(()=>window.__edifiqSubscription||null);const d=days(sub);
    const trialText=trial(sub)?`Seu teste grátis está ativo. Restam ${d} dia${d===1?'':'s'} e ele vence em ${fmt(sub.trial_fim)}. A primeira cobrança fica para depois do teste.`:'Seu teste grátis terminou. O modo gratuito limitado continua disponível até o pagamento.';
    const root=document.createElement('div');root.id='edPay63';root.innerHTML=`<div class="edPay63Back"></div><section class="edPay63Card" role="dialog" aria-modal="true"><button class="edPay63Close" type="button" aria-label="Fechar">×</button><h3>Forma de pagamento</h3><p class="edPay63Trial">${trialText}</p><div class="edPay63Methods"><button type="button" data-forma="pix"><b>◆ Pix</b><small>Abre direto o Pix. Não pede nome nem CPF nesta tela.</small></button><button type="button" data-forma="boleto"><b>▤ Boleto</b><small>Os dados são solicitados apenas para emissão do boleto.</small></button><button type="button" data-forma="cartao"><b>💳 Cartão de crédito</b><small>Cadastro e cobrança no ambiente seguro do Asaas.</small></button></div><div class="edPay63Payer" hidden><label>Nome completo<input id="edPay63Nome" autocomplete="name"></label><label>CPF ou CNPJ<input id="edPay63Cpf" inputmode="numeric" autocomplete="off"></label><button class="edPay63Continue" type="button">Emitir boleto</button></div><small class="edPay63Foot">Pix, boleto ou cartão só alteram o acesso pago depois da confirmação do Asaas. Durante o teste, a data de cobrança permanece no fim dos 7 dias.</small></section>`;document.body.appendChild(root);
    root.querySelector('.edPay63Back').onclick=close;root.querySelector('.edPay63Close').onclick=close;
    root.querySelector('[data-forma="pix"]').onclick=()=>pay(root,plano,'pix');
    root.querySelector('[data-forma="cartao"]').onclick=()=>pay(root,plano,'cartao');
    root.querySelector('[data-forma="boleto"]').onclick=()=>{const box=$('.edPay63Payer',root);box.hidden=false;$('#edPay63Nome',root)?.focus()};
    root.querySelector('.edPay63Continue').onclick=()=>pay(root,plano,'boleto');
  }
  function choose(plano){mount(String(plano||'').toLowerCase());return false}
  function override(){window.edifiqAsaasEscolher=choose;window.assinarPlanoEdifiq11=choose;window.edifiqPagar47=choose;window.edifiqEscolherPagamento47=choose}
  function init(){css();override();new MutationObserver(()=>override()).observe(document.documentElement,{childList:true,subtree:true});setInterval(override,2500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
