(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const pt=e=>window.OBRIX_PT_ERROR?.(e)||e?.message||String(e||'Não foi possível concluir a operação.');
  const K={
    id:'obrix_efi_pagamento_id',
    plano:'obrix_efi_pagamento_plano',
    req:'obrix_efi_request_id',
    pix:'obrix_efi_pix_copia_cola',
    qr:'obrix_efi_qr_code',
    venc:'obrix_efi_pix_vencimento'
  };
  let main=null,planoSelecionado='mensal',pagamentoId='';
  function fmtDate(v){if(!v)return '—';try{return new Date(v).toLocaleString('pt-BR')}catch(_){return '—'}}
  function diasRestantes(v){if(!v)return 0;return Math.max(0,Math.ceil((new Date(v).getTime()-Date.now())/86400000))}
  function limparPagamento(){Object.values(K).forEach(k=>localStorage.removeItem(k));pagamentoId=''}
  function ensure(){
    if(main)return main;
    const app=$('app'),bottom=app?.querySelector('.bottom');if(!app||!bottom)return null;
    main=document.createElement('main');main.id='assinaturaMain';main.className='hidden';
    main.innerHTML=`<div class="hero"><h1>Planos e Assinaturas</h1><p>Gerencie o acesso ao OBRIX</p></div>
      <div id="assStatus" class="card">Carregando assinatura...</div>
      <div class="sectionHead"><strong>Planos disponíveis</strong></div>
      <div id="assPlanos" class="assGrid"></div>
      <div id="assPgModal" class="assModal hidden"><div class="assModalCard">
        <button type="button" id="assPgFechar" class="assClose" aria-label="Fechar">×</button>
        <h3 id="assPgTitulo">Pagamento com Pix — Efí</h3>
        <p class="muted">Gere o Pix e pague pelo QR Code ou Pix Copia e Cola. O acesso só é liberado depois da confirmação do pagamento.</p>
        <button type="button" id="assPgGerar" class="btn assGerar">Gerar Pix</button>
        <div id="assPixArea" class="assPixArea hidden">
          <img id="assPixQr" class="assPixQr hidden" alt="QR Code Pix">
          <label for="assPixCopia">Pix Copia e Cola</label>
          <textarea id="assPixCopia" readonly rows="4"></textarea>
          <button type="button" id="assPixCopiar" class="assCopy">Copiar Pix</button>
          <small id="assPixVencimento" class="muted"></small>
        </div>
        <div id="assPgStatus" class="status hidden"></div>
        <button type="button" id="assPgVerificar" class="btn assVerify hidden">Verificar pagamento</button>
      </div></div>`;
    app.insertBefore(main,bottom);
    $('assPgFechar').onclick=fecharPagamento;
    $('assPgGerar').onclick=()=>criarPix($('assPgGerar'));
    $('assPixCopiar').onclick=copiarPix;
    $('assPgVerificar').onclick=verificarPagamento;
    return main;
  }
  function restaurarPix(){
    const pix=localStorage.getItem(K.pix)||'',qr=localStorage.getItem(K.qr)||'',venc=localStorage.getItem(K.venc)||'';
    const area=$('assPixArea'),ta=$('assPixCopia'),img=$('assPixQr'),vt=$('assPixVencimento');
    if(!area||!ta||!img||!vt)return;
    if(!pix&&!qr){area.classList.add('hidden');return}
    area.classList.remove('hidden');ta.value=pix;
    if(qr){img.src=qr;img.classList.remove('hidden')}else{img.removeAttribute('src');img.classList.add('hidden')}
    vt.textContent=venc?`Válido até ${fmtDate(venc)}`:'';
  }
  function abrirPagamento(plano){
    ensure();planoSelecionado=plano||'mensal';pagamentoId=localStorage.getItem(K.id)||'';
    $('assPgTitulo').textContent=`${planoSelecionado==='anual'?'Plano Anual':'Plano Mensal'} — Pix Efí`;
    $('assPgStatus').classList.add('hidden');
    $('assPgVerificar').classList.toggle('hidden',!pagamentoId);
    $('assPgGerar').textContent=pagamentoId?'Gerar novo Pix':'Gerar Pix';
    restaurarPix();$('assPgModal').classList.remove('hidden');
  }
  function fecharPagamento(){$('assPgModal')?.classList.add('hidden')}
  function pgStatus(texto,ok=true){const box=$('assPgStatus');if(!box)return;box.textContent=texto;box.className='status '+(ok?'assOk':'assErr')}
  async function copiarPix(){
    const ta=$('assPixCopia'),texto=ta?.value||'';if(!texto)return pgStatus('Gere um Pix primeiro.',false);
    try{await navigator.clipboard.writeText(texto);pgStatus('Pix Copia e Cola copiado.')}catch(_){ta.focus();ta.select();document.execCommand?.('copy');pgStatus('Pix Copia e Cola copiado.')}
  }
  async function criarPix(btn){
    try{
      if(btn){btn.disabled=true;btn.textContent='Gerando Pix...'}
      pgStatus('Gerando cobrança Pix na Efí...');
      const sb=await OBRIX_BACKEND.init();
      let requestId=localStorage.getItem(K.req)||'';
      const planoSalvo=localStorage.getItem(K.plano)||'';
      if(!requestId||planoSalvo!==planoSelecionado){requestId=crypto.randomUUID();localStorage.setItem(K.req,requestId)}
      localStorage.setItem(K.plano,planoSelecionado);
      const {data,error}=await sb.functions.invoke('efi-criar-pix',{body:{plano:planoSelecionado,requestId}});
      if(error)throw error;if(data?.error)throw new Error(data.error);
      if(!data?.pagamentoId)throw new Error('A Efí não retornou a identificação do pagamento.');
      const pix=String(data.pixCopiaCola||''),qr=String(data.qrCodeImage||''),venc=String(data.vencimento||'');
      pagamentoId=String(data.pagamentoId);localStorage.setItem(K.id,pagamentoId);
      if(pix)localStorage.setItem(K.pix,pix);else localStorage.removeItem(K.pix);
      if(qr)localStorage.setItem(K.qr,qr);else localStorage.removeItem(K.qr);
      if(venc)localStorage.setItem(K.venc,venc);else localStorage.removeItem(K.venc);
      restaurarPix();$('assPgVerificar').classList.remove('hidden');
      if(data.status==='aprovado'&&data.aplicado){pgStatus('Pagamento confirmado. Assinatura OBRIX ativada com sucesso.');limparPagamento();setTimeout(async()=>{fecharPagamento();await load()},600);return}
      pgStatus('Pix gerado. Faça o pagamento e depois toque em “Verificar pagamento”.');
    }catch(e){pgStatus(pt(e),false)}finally{if(btn){btn.disabled=false;btn.textContent=pagamentoId?'Gerar novo Pix':'Gerar Pix'}}
  }
  async function verificarPagamento(){
    const btn=$('assPgVerificar');
    try{
      if(btn){btn.disabled=true;btn.textContent='Verificando...'}
      const sb=await OBRIX_BACKEND.init();
      const id=pagamentoId||localStorage.getItem(K.id)||'';
      if(!id)throw new Error('Nenhum pagamento Pix foi gerado ainda.');
      const {data,error}=await sb.functions.invoke('efi-reconciliar-pix',{body:{pagamentoId:id}});
      if(error)throw error;if(data?.error)throw new Error(data.error);
      if(data?.status==='aprovado'&&data?.aplicado){
        limparPagamento();pgStatus('Pagamento confirmado. Assinatura OBRIX ativada com sucesso.');
        setTimeout(async()=>{fecharPagamento();await load()},700);
      }else{
        const st=String(data?.status||'pendente');
        pgStatus(`Status do pagamento: ${st}. O acesso só será liberado quando a Efí confirmar o Pix.`,st!=='rejeitado'&&st!=='cancelado');
      }
    }catch(e){pgStatus(pt(e),false)}finally{if(btn){btn.disabled=false;btn.textContent='Verificar pagamento'}}
  }
  async function load(){
    ensure();const status=$('assStatus'),planosBox=$('assPlanos');
    try{
      const sb=await OBRIX_BACKEND.init();
      const [{data:plans,error:pe},{data:subs,error:se}]=await Promise.all([
        sb.from('planos_assinatura').select('codigo,nome,descricao,valor,periodo,destaque').eq('ativo',true).order('ordem'),
        sb.from('assinaturas').select('*').eq('empresa_id',profile.empresa_id).order('atualizado_em',{ascending:false}).limit(1)
      ]);
      if(pe)throw pe;if(se)throw se;const a=subs?.[0]||null;
      if(!a)status.innerHTML='<h3>Assinatura</h3><p class="muted">Nenhuma assinatura encontrada para esta empresa.</p>';
      else if(a.status==='teste'){
        const dias=diasRestantes(a.trial_fim);
        status.innerHTML=`<h3>Teste grátis</h3><div class="assBig">${dias} dia${dias===1?'':'s'} restante${dias===1?'':'s'}</div><p class="muted">Teste válido até ${fmtDate(a.trial_fim)}. Após o teste, sem pagamento, o acesso fica limitado a 1 obra e 1 funcionário.</p>`;
      }else if(a.status==='ativo')status.innerHTML=`<h3>Assinatura ativa</h3><div class="assBig">${a.plano==='anual'?'Plano Anual':'Plano Mensal'}</div><p class="muted">Acesso completo${a.periodo_fim?` até ${fmtDate(a.periodo_fim)}`:''}.</p>`;
      else status.innerHTML=`<h3>Assinatura</h3><div class="assBig">${String(a.status||'inativa').replace('_',' ')}</div><p class="muted">Escolha um plano para liberar o acesso completo.</p>`;
      planosBox.innerHTML=(plans||[]).map(p=>`<div class="card assPlano ${p.destaque?'assDestaque':''}"><div class="assPlanoTop"><h3>${p.nome||p.codigo}</h3>${p.destaque?'<span>Mais escolhido</span>':''}</div><div class="assPreco">${money(p.valor)}<small>/${p.periodo==='anual'?'ano':'mês'}</small></div><p class="muted">${p.descricao||''}</p><button type="button" class="btn obrixPermanentNeutral obrixPayMethod" data-ass-plano="${p.codigo}">Pagar com Pix</button></div>`).join('')||'<div class="card muted">Nenhum plano disponível.</div>';
      planosBox.querySelectorAll('[data-ass-plano]').forEach(b=>b.onclick=()=>abrirPagamento(b.dataset.assPlano));
      pagamentoId=localStorage.getItem(K.id)||'';
    }catch(e){status.innerHTML=`<h3>Planos e Assinaturas</h3><div class="status">${pt(e)}</div>`;planosBox.innerHTML=''}
  }
  function open(){ensure();['inicio','obras','equipe','financeiroMain','estoqueMain','menuMain'].forEach(id=>$(id)?.classList.add('hidden'));main?.classList.remove('hidden');document.querySelectorAll('.bottom button').forEach(b=>b.classList.remove('active'));load();scrollTo({top:0,behavior:'smooth'})}
  const css=document.createElement('style');
  css.textContent=`.assGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.assPlano{position:relative}.assPlanoTop{display:flex;align-items:center;justify-content:space-between;gap:8px}.assPlanoTop h3{margin:0}.assPlanoTop span{font-size:12px;font-weight:900;background:#dbeafe;color:#1d4ed8;padding:6px 8px;border-radius:999px}.assPreco{font-size:30px;font-weight:900;margin:14px 0 8px}.assPreco small{font-size:13px;color:#64748b}.assBig{font-size:25px;font-weight:900;margin:8px 0}.assDestaque{border-width:2px;border-color:#2563eb}.assModal{position:fixed;inset:0;background:rgba(2,6,23,.72);display:flex;align-items:center;justify-content:center;padding:18px;z-index:9999}.assModalCard{position:relative;width:min(480px,100%);max-height:92vh;overflow:auto;background:#fff;color:#0f172a;border-radius:18px;padding:22px;border:1px solid #cbd5e1;box-shadow:0 24px 80px rgba(0,0,0,.35)}.assClose{position:absolute;right:12px;top:10px;border:0;background:transparent;color:#64748b;font-size:30px;line-height:1;padding:4px 8px}.assGerar,.assVerify{width:100%;margin-top:12px}.assPixArea{display:grid;gap:9px;margin-top:16px}.assPixArea label{font-weight:800}.assPixQr{display:block;width:min(260px,100%);margin:0 auto;border-radius:12px;border:1px solid #e2e8f0;background:#fff}.assPixArea textarea{width:100%;resize:none;border:1px solid #cbd5e1;border-radius:11px;padding:11px;font:inherit;font-size:12px}.assCopy{border:1px solid #cbd5e1;background:#f8fafc;color:#0f172a;border-radius:11px;padding:11px;font-weight:900}.assOk{background:#dcfce7!important;color:#166534!important}.assErr{background:#fee2e2!important;color:#991b1b!important}html:not([data-obrix-offline-v3="1"])[data-theme="light"] #assPlanos .obrixPayMethod,html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #assPlanos .obrixPayMethod{background:#E2E8F0!important;background-color:#E2E8F0!important;background-image:none!important;color:#111827!important;-webkit-text-fill-color:#111827!important;border-color:#CBD5E1!important;box-shadow:none!important}html[data-theme="dark"] .assModalCard,body.dark .assModalCard{background:#0f172a;color:#f8fafc;border-color:#334155}html[data-theme="dark"] .assPixArea textarea,body.dark .assPixArea textarea,html[data-theme="dark"] .assCopy,body.dark .assCopy{background:#111827;color:#f8fafc;border-color:#334155}@media(max-width:620px){.assGrid{grid-template-columns:1fr}}`;
  document.head.appendChild(css);
  window.OBRIX_EFI={checkout:abrirPagamento,gerarPix:criarPix,verificar:verificarPagamento};
  window.OBRIX_PAGBANK=window.OBRIX_EFI;
  window.OBRIX_ASSINATURA={open,load};
})();
