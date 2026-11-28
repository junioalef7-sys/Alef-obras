(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const pt=e=>window.OBRIX_PT_ERROR?.(e)||e?.message||String(e||'Não foi possível concluir a operação.');
  const hml=()=>window.__OBRIX_HML_PROJECT_REF==='xavwkfgrnowmusbkbiea';
  // Somente a tela da Preview: nenhum prazo ou registro é modificado no servidor.
  const previewTrialExpirado=()=>{
    try{return hml()&&new URLSearchParams(location.search).get('obrix_hml_trial_visual')==='expirado'}
    catch(_){return false}
  };
  const K={id:'obrix_efi_pagamento_id',plano:'obrix_efi_pagamento_plano',req:'obrix_efi_request_id',pix:'obrix_efi_pix_copia_cola',qr:'obrix_efi_qr_code',venc:'obrix_efi_pix_vencimento'};
  const KB={id:'obrix_efi_boleto_pagamento_id',plano:'obrix_efi_boleto_plano',req:'obrix_efi_boleto_request_id',url:'obrix_efi_boleto_url',venc:'obrix_efi_boleto_vencimento'};
  let main=null,planoSelecionado='mensal',pagamentoId='',boletoPagamentoId='';
  function fmtDate(v){if(!v)return '—';try{return new Date(v).toLocaleString('pt-BR')}catch(_){return '—'}}
  function diasRestantes(v){if(!v)return 0;return Math.max(0,Math.ceil((new Date(v).getTime()-Date.now())/86400000))}
  function limparPagamento(){Object.values(K).forEach(k=>localStorage.removeItem(k));pagamentoId=''}
  function limparBoleto(){Object.values(KB).forEach(k=>localStorage.removeItem(k));boletoPagamentoId=''}
  function ensure(){if(main)return main;const app=$('app'),bottom=app?.querySelector('.bottom');if(!app||!bottom)return null;main=document.createElement('main');main.id='assinaturaMain';main.className='hidden';main.innerHTML=`<div class="hero"><h1>Planos e Assinaturas</h1><p>Gerencie o acesso ao OBRIX</p></div><div id="assStatus" class="card">Carregando assinatura...</div><div class="sectionHead"><strong>Planos disponíveis</strong></div><div id="assPlanos" class="assGrid"></div><div id="assPgModal" class="assModal hidden"><div class="assModalCard"><button type="button" id="assPgFechar" class="assClose" aria-label="Fechar">×</button><h3 id="assPgTitulo">Pagamento com Pix — Efí</h3><p class="muted">Gere o Pix e pague pelo QR Code ou Pix Copia e Cola. O acesso só é liberado depois da confirmação do pagamento.</p><button type="button" id="assPgGerar" class="btn assGerar">Gerar Pix</button><div id="assPixArea" class="assPixArea hidden"><img id="assPixQr" class="assPixQr hidden" alt="QR Code Pix"><label for="assPixCopia">Pix Copia e Cola</label><textarea id="assPixCopia" readonly rows="4"></textarea><button type="button" id="assPixCopiar" class="assCopy">Copiar Pix</button><small id="assPixVencimento" class="muted"></small></div><div id="assPgStatus" class="status hidden"></div><button type="button" id="assPgVerificar" class="btn assVerify hidden">Verificar pagamento</button></div></div><div id="assBolModal" class="assModal hidden"><div class="assModalCard"><button type="button" id="assBolFechar" class="assClose" aria-label="Fechar">×</button><h3 id="assBolTitulo">Pagamento com boleto — Efí</h3><p class="muted">Emita o boleto pela Efí. A emissão não libera o OBRIX; o acesso só é liberado depois que a Efí confirmar o pagamento.</p><button type="button" id="assBolGerar" class="btn assGerar">Gerar boleto</button><div id="assBolArea" class="assBoletoArea hidden"><a id="assBolAbrir" class="btn assBoletoLink" target="_blank" rel="noopener noreferrer">Abrir boleto / página de pagamento</a><small id="assBolVencimento" class="muted"></small></div><div id="assBolStatus" class="status hidden"></div><button type="button" id="assBolVerificar" class="btn assVerify hidden">Verificar pagamento</button></div></div>`;app.insertBefore(main,bottom);if(hml()){
    const avisoPix=main.querySelector('#assPgModal .assModalCard > p.muted');
    const avisoBoleto=main.querySelector('#assBolModal .assModalCard > p.muted');
    if(avisoPix)avisoPix.textContent='HOMOLOGAÇÃO: cobrança Pix simulada (R$ 1,00), sem dinheiro real. Não pague nem use dados reais. A assinatura não será ativada.';
    if(avisoBoleto)avisoBoleto.textContent='HOMOLOGAÇÃO: esta emissão é somente para teste técnico. Não pague nem use dados reais. A assinatura não será ativada.';
    const linkBoleto=main.querySelector('#assBolAbrir');
    if(linkBoleto)linkBoleto.textContent='Abrir link de teste da Efí';
  }$('assPgFechar').onclick=fecharPagamento;$('assPgGerar').onclick=()=>criarPix($('assPgGerar'));$('assPixCopiar').onclick=copiarPix;$('assPgVerificar').onclick=verificarPagamento;$('assBolFechar').onclick=fecharBoleto;$('assBolGerar').onclick=()=>criarBoleto($('assBolGerar'));$('assBolVerificar').onclick=verificarBoleto;return main}
  function restaurarPix(){const pix=localStorage.getItem(K.pix)||'',qr=localStorage.getItem(K.qr)||'',venc=localStorage.getItem(K.venc)||'';const area=$('assPixArea'),ta=$('assPixCopia'),img=$('assPixQr'),vt=$('assPixVencimento');if(!area||!ta||!img||!vt)return;if(!pix&&!qr){area.classList.add('hidden');return}area.classList.remove('hidden');ta.value=pix;if(qr){img.src=qr;img.classList.remove('hidden')}else{img.removeAttribute('src');img.classList.add('hidden')}vt.textContent=venc?`Válido até ${fmtDate(venc)}`:''}
  function restaurarBoleto(){const url=localStorage.getItem(KB.url)||'',venc=localStorage.getItem(KB.venc)||'',area=$('assBolArea'),link=$('assBolAbrir'),vt=$('assBolVencimento');if(!area||!link||!vt)return;if(!url){area.classList.add('hidden');link.removeAttribute('href');return}link.href=url;area.classList.remove('hidden');vt.textContent=venc?`Válido até ${fmtDate(venc)}`:''}
  function abrirPagamento(plano){ensure();planoSelecionado=plano||'mensal';const planoSalvo=localStorage.getItem(K.plano)||'';if(planoSalvo&&planoSalvo!==planoSelecionado)limparPagamento();pagamentoId=localStorage.getItem(K.id)||'';$('assPgTitulo').textContent=`${planoSelecionado==='anual'?'Plano Anual':'Plano Mensal'} — Pix Efí`;$('assPgStatus').classList.add('hidden');$('assPgVerificar').classList.toggle('hidden',!pagamentoId);$('assPgGerar').textContent=(hml()?(pagamentoId?'Reabrir Pix de teste':'Gerar Pix de teste'):(pagamentoId?'Gerar novo Pix':'Gerar Pix'));restaurarPix();$('assPgModal').classList.remove('hidden')}
  function abrirBoleto(plano){ensure();planoSelecionado=plano||'mensal';const salvo=localStorage.getItem(KB.plano)||'';if(salvo&&salvo!==planoSelecionado)limparBoleto();boletoPagamentoId=localStorage.getItem(KB.id)||'';$('assBolTitulo').textContent=`${planoSelecionado==='anual'?'Plano Anual':'Plano Mensal'} — Boleto Efí`;$('assBolStatus').classList.add('hidden');$('assBolVerificar').classList.toggle('hidden',!boletoPagamentoId);$('assBolGerar').textContent=(hml()?(boletoPagamentoId?'Reabrir boleto de teste':'Gerar boleto de teste'):(boletoPagamentoId?'Abrir/Gerar boleto':'Gerar boleto'));restaurarBoleto();$('assBolModal').classList.remove('hidden')}
  function fecharPagamento(){$('assPgModal')?.classList.add('hidden')}
  function fecharBoleto(){$('assBolModal')?.classList.add('hidden')}
  function pgStatus(texto,ok=true){const box=$('assPgStatus');if(!box)return;box.textContent=texto;box.className='status '+(ok?'assOk':'assErr')}
  function bolStatus(texto,ok=true){const box=$('assBolStatus');if(!box)return;box.textContent=texto;box.className='status '+(ok?'assOk':'assErr')}
  async function copiarPix(){const ta=$('assPixCopia'),texto=ta?.value||'';if(!texto)return pgStatus('Gere um Pix primeiro.',false);try{await navigator.clipboard.writeText(texto);pgStatus('Pix Copia e Cola copiado.')}catch(_){ta.focus();ta.select();document.execCommand?.('copy');pgStatus('Pix Copia e Cola copiado.')}}
  async function criarPix(btn){try{if(btn){btn.disabled=true;btn.textContent='Gerando Pix...'}pgStatus('Gerando cobrança Pix na Efí...');const sb=await OBRIX_BACKEND.init();let requestId=localStorage.getItem(K.req)||'';const planoSalvo=localStorage.getItem(K.plano)||'';if(!requestId||planoSalvo!==planoSelecionado){requestId=crypto.randomUUID();localStorage.setItem(K.req,requestId)}localStorage.setItem(K.plano,planoSelecionado);const {data,error}=await sb.functions.invoke('efi-criar-pix',{body:{plano:planoSelecionado,requestId}});if(error)throw error;if(data?.error)throw new Error(data.error);if(!data?.pagamentoId)throw new Error('A Efí não retornou a identificação do pagamento.');const pix=String(data.pixCopiaCola||''),qr=String(data.qrCodeImage||''),venc=String(data.vencimento||'');pagamentoId=String(data.pagamentoId);localStorage.setItem(K.id,pagamentoId);if(pix)localStorage.setItem(K.pix,pix);else localStorage.removeItem(K.pix);if(qr)localStorage.setItem(K.qr,qr);else localStorage.removeItem(K.qr);if(venc)localStorage.setItem(K.venc,venc);else localStorage.removeItem(K.venc);restaurarPix();$('assPgVerificar').classList.remove('hidden');if(!hml()&&data.status==='aprovado'&&data.aplicado){pgStatus('Pagamento confirmado. Assinatura OBRIX ativada com sucesso.');limparPagamento();setTimeout(async()=>{fecharPagamento();await load()},600);return}pgStatus(hml()?'Pix de teste gerado na Efí. Não efetue pagamento. Você pode consultar o status sem ativar a assinatura.':'Pix gerado. Faça o pagamento e depois toque em “Verificar pagamento”.')}catch(e){pgStatus(pt(e),false)}finally{if(btn){btn.disabled=false;btn.textContent=hml()?(pagamentoId?'Reabrir Pix de teste':'Gerar Pix de teste'):(pagamentoId?'Gerar novo Pix':'Gerar Pix')}}}
  async function criarBoleto(btn){try{if(btn){btn.disabled=true;btn.textContent='Gerando boleto...'}bolStatus('Gerando boleto na Efí...');const sb=await OBRIX_BACKEND.init();let requestId=localStorage.getItem(KB.req)||'';const planoSalvo=localStorage.getItem(KB.plano)||'';if(!requestId||planoSalvo!==planoSelecionado){requestId=crypto.randomUUID();localStorage.setItem(KB.req,requestId)}localStorage.setItem(KB.plano,planoSelecionado);const {data,error}=await sb.functions.invoke('efi-criar-cobranca-link',{body:{plano:planoSelecionado,metodo:'boleto',requestId}});if(error)throw error;if(data?.error)throw new Error(data.error);if(!data?.pagamentoId||!data?.checkoutUrl)throw new Error('A Efí não retornou o boleto.');boletoPagamentoId=String(data.pagamentoId);localStorage.setItem(KB.id,boletoPagamentoId);localStorage.setItem(KB.url,String(data.checkoutUrl));if(data.vencimento)localStorage.setItem(KB.venc,String(data.vencimento));else localStorage.removeItem(KB.venc);restaurarBoleto();$('assBolVerificar').classList.remove('hidden');bolStatus(hml()?'Link de boleto de teste criado. Não efetue pagamento; nenhuma assinatura será ativada.':'Boleto emitido. O acesso continuará bloqueado até a Efí confirmar o pagamento.')}catch(e){bolStatus(pt(e),false)}finally{if(btn){btn.disabled=false;btn.textContent=hml()?(boletoPagamentoId?'Reabrir boleto de teste':'Gerar boleto de teste'):(boletoPagamentoId?'Abrir/Gerar boleto':'Gerar boleto')}}}
  async function verificarPagamento(){const btn=$('assPgVerificar');try{if(btn){btn.disabled=true;btn.textContent='Verificando...'}const sb=await OBRIX_BACKEND.init();const id=pagamentoId||localStorage.getItem(K.id)||'';if(!id)throw new Error('Nenhum pagamento Pix foi gerado ainda.');const {data,error}=await sb.functions.invoke('efi-reconciliar-pix',{body:{pagamentoId:id}});if(error)throw error;if(data?.error)throw new Error(data.error);if(!hml()&&data?.status==='aprovado'&&data?.aplicado){limparPagamento();pgStatus('Pagamento confirmado. Assinatura OBRIX ativada com sucesso.');setTimeout(async()=>{fecharPagamento();await load()},700)}else{const st=String(data?.status||'pendente');pgStatus(hml()?`Status do Pix de teste: ${st}. Nenhuma assinatura será ativada.`:`Status do pagamento: ${st}. O acesso só será liberado quando a Efí confirmar o Pix.`,st!=='rejeitado'&&st!=='cancelado')}}catch(e){pgStatus(pt(e),false)}finally{if(btn){btn.disabled=false;btn.textContent='Verificar pagamento'}}}
  async function verificarBoleto(){const btn=$('assBolVerificar');try{if(btn){btn.disabled=true;btn.textContent='Verificando...'}const sb=await OBRIX_BACKEND.init();const id=boletoPagamentoId||localStorage.getItem(KB.id)||'';if(!id)throw new Error('Nenhum boleto foi gerado ainda.');const {data,error}=await sb.functions.invoke('efi-reconciliar-cobranca',{body:{pagamentoId:id}});if(error)throw error;if(data?.error)throw new Error(data.error);if(!hml()&&data?.status==='aprovado'&&data?.aplicado){limparBoleto();bolStatus('Pagamento confirmado pela Efí. Assinatura OBRIX ativada com sucesso.');setTimeout(async()=>{fecharBoleto();await load()},700)}else{const st=String(data?.status||'pendente');bolStatus(hml()?`Status do boleto de teste: ${st}. Nenhuma assinatura será ativada.`:`Status do boleto: ${st}. O acesso só será liberado quando a Efí confirmar o pagamento.`,st!=='rejeitado'&&st!=='cancelado')}}catch(e){bolStatus(pt(e),false)}finally{if(btn){btn.disabled=false;btn.textContent='Verificar pagamento'}}}
  async function solicitacoesHml(sb,perfil,a){
    if(!hml())return;
    let box=$('assSolicitacoesHml');
    if(!box){box=document.createElement('section');box.id='assSolicitacoesHml';box.className='card';$('assPlanos').insertAdjacentElement('afterend',box);}
    box.replaceChildren();
    const add=(tag,txt,parent=box)=>{const e=document.createElement(tag);e.textContent=txt;parent.appendChild(e);return e;};
    add('h3','Cancelamento e reembolso');
    add('p','Homologação: registra solicitações de teste. Não cancela cobranças, não devolve valores e não exclui a conta.');
    const msg=add('p','Carregando solicitações…');msg.setAttribute('role','status');
    const link=add('a','Consultar política de cancelamento e reembolso');link.href='./obrix-cancelamento-reembolso.html';link.target='_blank';link.rel='noopener noreferrer';
    try{
      const {data:auth,error:ae}=await sb.auth.getUser();if(ae||!auth?.user)throw ae||new Error('Sessão indisponível.');
      const uid=auth.user.id;
      const {data:own,error:oe}=await sb.from('perfis').select('id,empresa_id,papel').eq('id',uid).single();
      if(oe||!own||own.empresa_id!==perfil.empresa_id)throw oe||new Error('Perfil indisponível.');
      const {data:rows,error:re}=await sb.from('obrix_solicitacoes_assinatura').select('id,tipo,status,criado_em,assinatura_id,pagamento_id').eq('user_id',uid).order('criado_em',{ascending:false});
      if(re)throw re;
      msg.textContent='';
      if(own.papel==='proprietario'){
        const {data:payments,error:pe}=await sb.from('pagamentos_assinatura').select('id,assinatura_id,valor,aprovado_em,metodo').eq('empresa_id',own.empresa_id).eq('status','aprovado').not('aplicado_em','is',null).is('revertido_em',null).order('aprovado_em',{ascending:false});
        if(pe)throw pe;
        const actions=add('div','');actions.style.cssText='display:grid;gap:10px;margin:12px 0';
        function button(label,kind,subscription,payment,disabled){
          const b=add('button',label,actions);b.type='button';b.className='btn';b.disabled=disabled;
          b.onclick=()=>{
            const dialog=document.createElement('dialog');dialog.style.cssText='width:min(440px,calc(100% - 32px));max-height:85vh;overflow:auto;border-radius:14px;background:var(--surface,#fff);color:var(--text,#0f172a);padding:20px';
            add('h3',label,dialog);add('p','Confirma o envio desta solicitação de teste? Nenhum pagamento será devolvido e sua assinatura não será alterada.',dialog);
            const feedback=add('p','',dialog);feedback.setAttribute('role','alert');
            const no=add('button','Voltar',dialog);no.type='button';no.className='btn';
            const yes=add('button','Confirmar solicitação',dialog);yes.type='button';yes.className='btn';yes.style.cssText='background:#ea580c;color:#fff;margin:8px';
            const close=()=>{dialog.close();dialog.remove();};no.onclick=close;
            dialog.addEventListener('cancel',e=>{e.preventDefault();if(!yes.disabled)close();});
            yes.onclick=async()=>{yes.disabled=true;no.disabled=true;try{
              const current=await sb.auth.getUser();if(current.error||current.data?.user?.id!==uid)throw new Error('Sessão alterada.');
              const {data,error}=await sb.from('obrix_solicitacoes_assinatura').insert({user_id:uid,empresa_id:own.empresa_id,assinatura_id:subscription,pagamento_id:payment,tipo:kind}).select('id').single();
              if(error)throw error;
              close();await solicitacoesHml(sb,perfil,a);const fresh=$('assSolicitacoesHml');if(fresh){const p=add('p','Solicitação recebida. Protocolo: '+data.id,fresh);p.setAttribute('role','status');}
            }catch(e){feedback.textContent=e?.code==='23505'?'Já existe uma solicitação para esta operação.':'Não foi possível registrar a solicitação. Confira sua conexão e tente novamente.';yes.disabled=false;no.disabled=false;}};
            document.body.appendChild(dialog);dialog.showModal();
          };
        }
        if(a&&['mensal','anual'].includes(a.plano)){button('Cancelar assinatura','cancelamento',a.id,null,(rows||[]).some(x=>x.tipo==='cancelamento'&&x.assinatura_id===a.id&&['recebida','em_analise'].includes(x.status)));}
        else add('p','Não há assinatura mensal ou anual disponível para solicitar cancelamento.',actions);
        for(const pg of payments||[]){if(!pg.assinatura_id)continue;button('Solicitar reembolso — '+money(pg.valor)+' · '+fmtDate(pg.aprovado_em),'reembolso',pg.assinatura_id,pg.id,(rows||[]).some(x=>x.tipo==='reembolso'&&x.pagamento_id===pg.id&&['recebida','em_analise','concluida'].includes(x.status)));}
        if(!(payments||[]).length)add('p','Nenhum pagamento aprovado disponível para solicitar reembolso.',actions);
      }
      add('h4','Histórico de solicitações');
      if(!(rows||[]).length)add('p','Nenhuma solicitação registrada.');
      const labels={recebida:'Recebida',em_analise:'Em análise',concluida:'Concluída',indeferida:'Indeferida'};
      for(const row of rows||[]){const p=add('p',(row.tipo==='cancelamento'?'Cancelamento':'Reembolso')+' — '+(labels[row.status]||'Indisponível')+' · '+fmtDate(row.criado_em));p.appendChild(document.createElement('br'));const small=add('small','Protocolo: '+row.id,p);small.style.overflowWrap='anywhere';}
    }catch(_){msg.textContent='Não foi possível consultar as solicitações. Tente novamente.';}
  }
  async function adminSolicitacoesHml(sb){
    $('assAdminHml')?.remove();
    if(!hml())return;
    const auth=await sb.rpc('obrix_hml_admin_autorizado');
    if(auth.error||auth.data!==true)return;
    const box=document.createElement('section');box.id='assAdminHml';box.className='card';$('assSolicitacoesHml')?.insertAdjacentElement('afterend',box);
    const add=(parent,tag,txt)=>{const e=document.createElement(tag);e.textContent=txt;parent.appendChild(e);return e;};
    add(box,'h3','Administração OBRIX — homologação');add(box,'p','Análise administrativa. Não movimenta dinheiro nem encerra assinaturas.');
    const msg=add(box,'p','');msg.setAttribute('role','status');
    const diag=add(box,'button','Consultar Pix de homologação na Efí');diag.type='button';diag.className='btn';diag.style.cssText='margin:8px 0;max-width:100%;white-space:normal';
    const diagResult=add(box,'div','');diagResult.setAttribute('role','status');diagResult.style.cssText='white-space:normal;overflow-wrap:anywhere;min-height:24px;margin:8px 0';
    function confirmarAdmin(texto){return new Promise(resolve=>{const d=document.createElement('dialog');d.style.cssText='width:min(440px,calc(100% - 32px));box-sizing:border-box;border:1px solid currentColor;border-radius:14px;padding:20px;background:var(--surface,#fff);color:var(--text,#0f172a)';if(document.documentElement.dataset.theme==='dark'||document.body.classList.contains('dark')){d.style.background='#0f172a';d.style.color='#f8fafc';}add(d,'h3','Confirmar operação');add(d,'p',texto);const actions=add(d,'div','');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end';const no=add(actions,'button','Cancelar');no.type='button';no.className='btn';const yes=add(actions,'button','Confirmar');yes.type='button';yes.className='btn';yes.style.cssText='background:#ea580c!important;color:#fff!important';let done=false;function finish(v){if(done)return;done=true;d.close();d.remove();resolve(v);}no.onclick=()=>finish(false);yes.onclick=()=>finish(true);d.addEventListener('cancel',e=>{e.preventDefault();finish(false);});document.body.appendChild(d);d.showModal();});}
    const prep=add(box,'button','Preparar devolução Pix mensal de R$ 1,00');prep.type='button';prep.className='btn';prep.style.cssText='margin:8px 0;max-width:100%;white-space:normal';
    prep.onclick=async()=>{if(!await confirmarAdmin('Preparar somente a reserva de teste? Nenhum valor será devolvido nesta etapa.'))return;prep.disabled=true;diagResult.textContent='Validando Pix mensal na Efí...';try{const r=await sb.functions.invoke('obrix-hml-diagnostico-devolucao',{body:{acao:'preparar_mensal'}});if(r.error||!r.data?.preparado){let m=r.data?.error;try{if(!m&&r.error?.context instanceof Response)m=(await r.error.context.json()).error;}catch(_){}diagResult.textContent=m||'Não foi possível preparar a devolução.';return;}diagResult.textContent='Pix mensal preparado — R$ 1,00 — Identificador: '+r.data.devolucaoId+' — Nenhum valor devolvido.';}catch(_){diagResult.textContent='Preparação inconclusiva; consulte antes de repetir.';}finally{prep.disabled=false;}};

    {
    const integralBox=add(box,'div','')
    add(integralBox,'h3','Pagamento integral de homologação')
    const period=add(integralBox,'select','')
    period.setAttribute('aria-label','Plano de teste')
    for(const [value,title] of [['mensal','Mensal — R$ 39,90'],['anual','Anual — R$ 399,00']]){const opt=add(period,'option',title);opt.value=value}
    const method=add(integralBox,'select','')
    method.setAttribute('aria-label','Forma de pagamento')
    for(const [value,title] of [['pix','Pix'],['boleto','Boleto por link'],['direto','Boleto direto'],['cartao','Cartão na página da Efí']]){const opt=add(method,'option',title);opt.value=value}
    const start=add(integralBox,'button','Emitir no sandbox');start.type='button';start.className='btn'
    const open=add(integralBox,'a','Abrir cobrança na Efí');open.hidden=true;open.target='_blank';open.rel='noopener noreferrer'
    const note=add(integralBox,'p','Use dados fictícios no ambiente da Efí.');note.setAttribute('role','status')
    start.onclick=async()=>{
      start.disabled=true;open.hidden=true
      try{
        const {data:session,error:sessionError}=await sb.auth.getUser()
        if(sessionError||!session.user)throw Error('Entre com sua conta de teste.')
        const key=['obrix-integral-v1',session.user.id,period.value,method.value].join(':')
        let requestId=localStorage.getItem(key)
        if(!requestId){requestId=crypto.randomUUID();localStorage.setItem(key,requestId)}
        const pix=method.value==='pix'
        const body={serie:'bloco1-hml-v1',requestId,plano:period.value,metodo:method.value==='direto'?'boleto':method.value,forma:method.value}
        const {data,error}=await sb.functions.invoke(pix?'efi-criar-pix':'efi-criar-cobranca-link',{body})
        if(error||!data?.pagamentoId)throw Error('Emissão inconclusiva. Consulte o mesmo pedido antes de repetir.')
        if(data.checkoutUrl && new URL(data.checkoutUrl).protocol==='https:'){open.href=data.checkoutUrl;open.hidden=false}
        note.textContent='Pedido '+data.pagamentoId+' · '+data.status+(pix?' · A Efí mantém este valor pendente no sandbox.':' · Acompanhe a confirmação no sandbox.')
        if(['aprovado','cancelado','expirado','rejeitado','reembolsado','estornado'].includes(data.status))localStorage.removeItem(key)
      }catch(e){note.textContent=e.message}finally{start.disabled=false}
    }
    }
    const boletoBox=add(box,'div','');add(boletoBox,'h3','Consulta de boletos de homologação');add(boletoBox,'p','Somente cobranças da sua conta. Nenhuma assinatura será ativada.');
    const boletoSelect=add(boletoBox,'select','');boletoSelect.setAttribute('aria-label','Cobrança de boleto');boletoSelect.style.cssText='max-width:100%;display:block;margin:8px 0';
    const boletoMsg=add(boletoBox,'p','');boletoMsg.setAttribute('role','status');
    const boletoBtn=add(boletoBox,'button','Consultar boleto na Efí');boletoBtn.type='button';boletoBtn.className='btn';boletoBtn.disabled=true;
    try{
      const auth=await sb.auth.getUser();if(auth.error||!auth.data?.user)throw Error('Sessão indisponível.');
      const perfil=await sb.from('perfis').select('empresa_id').eq('id',auth.data.user.id).single();if(perfil.error||!perfil.data?.empresa_id)throw Error('Empresa indisponível.');
      const pagamentos=await sb.from('pagamentos_assinatura').select('id,plano,valor,provedor_pagamento_id').eq('empresa_id',perfil.data.empresa_id).eq('provedor','efi').eq('metodo','boleto').eq('provedor_recurso_tipo','payment_link').order('criado_em',{ascending:false}).limit(50);
      if(pagamentos.error)throw pagamentos.error;
      for(const p of pagamentos.data||[]){const op=add(boletoSelect,'option',p.provedor_pagamento_id+' — '+p.plano+' — '+money(p.valor));op.value=p.id;}
      boletoBtn.disabled=!boletoSelect.options.length;boletoMsg.textContent=boletoBtn.disabled?'Nenhum boleto encontrado nesta conta.':'Selecione uma cobrança existente.';
    }catch(_){boletoMsg.textContent='Não foi possível listar os boletos desta conta.';}
    boletoBtn.onclick=async()=>{if(!boletoSelect.value)return;boletoBtn.disabled=true;boletoSelect.disabled=true;boletoMsg.textContent='Consultando Efí de homologação...';try{const r=await sb.functions.invoke('efi-reconciliar-cobranca',{body:{pagamentoId:boletoSelect.value}});if(r.error||r.data?.error){let m=r.data?.error;try{if(!m&&r.error?.context instanceof Response)m=(await r.error.context.json()).error;}catch(_){}boletoMsg.textContent=m||'Consulta indisponível.';return;}boletoMsg.textContent='Efí: '+String(r.data.provedorStatus||'indefinido')+' — OBRIX: '+String(r.data.status||'indefinido')+' — Somente leitura; nenhuma assinatura ativada.';}catch(_){boletoMsg.textContent='Consulta indisponível.';}finally{boletoBtn.disabled=false;boletoSelect.disabled=false;}};
    const refundStatus=add(box,'p','Consultando situação registrada...');refundStatus.setAttribute('role','status');
    const executeRefund=add(box,'button','Executar devolução Pix mensal de teste — R$ 1,00');
    const consultRefund=add(box,'button','Consultar resultado da devolução mensal');
    for(const btn of [executeRefund,consultRefund]){btn.type='button';btn.className='btn';btn.style.cssText='margin:8px 0;max-width:100%;white-space:normal;display:block';}
    executeRefund.disabled=true;
    let busy=false;
    async function refundAction(acao){
      if(busy)return;
      busy=true;executeRefund.disabled=true;consultRefund.disabled=true;
      let allowExecute=false;
      try{
        if(acao==='executar'&&!await confirmarAdmin('Executar devolução exclusivamente em homologação?')){await readRefundState();return;}
        const r=await sb.functions.invoke('obrix-hml-executar-devolucao-mensal',{body:{acao}});
        if(r.error||r.data?.error){let m=r.data?.error;try{if(!m&&r.error?.context instanceof Response)m=(await r.error.context.json()).error;}catch(_){}refundStatus.textContent=m||'Operação inconclusiva. Consulte antes de repetir.';return;}
        const d=r.data;refundStatus.textContent=({preparado:'Reserva preparada',DEVOLVIDO:'Devolução confirmada pela Efí',EM_PROCESSAMENTO:'Devolução em processamento',NAO_REALIZADO:'Devolução não realizada'}[d.status]||'Estado indefinido')+' — R$ 1,00 — Homologação — Identificador: '+d.devolucaoId;
        allowExecute=d.status==='preparado'&&acao==='estado';
      }catch(_){refundStatus.textContent='Operação inconclusiva. Consulte antes de repetir.';}
      finally{busy=false;executeRefund.disabled=!allowExecute;consultRefund.disabled=false;}
    }
    async function readRefundState(){const r=await sb.functions.invoke('obrix-hml-executar-devolucao-mensal',{body:{acao:'estado'}});if(!r.error&&r.data?.status==='preparado')refundStatus.textContent='Reserva preparada. Atualize a tela para habilitar a execução.';}
    executeRefund.onclick=()=>refundAction('executar');consultRefund.onclick=()=>refundAction('consultar');
    await refundAction('estado');
    diag.onclick=async()=>{diag.disabled=true;diagResult.textContent='Consultando cobranças de teste...';try{const r=await sb.functions.invoke('obrix-hml-diagnostico-devolucao',{body:{}});if(r.error||r.data?.error)throw new Error('Consulta indisponível');diagResult.replaceChildren();for(const item of r.data?.resultados||[]){add(diagResult,'p',(item.plano==='mensal'?'Mensal':'Anual')+' — '+money(item.valor)+' — '+(item.confirmado?'Pix confirmado pela Efí':item.status)+(item.possuiDevolucao?' — Possui devolução':''));}if(!r.data?.resultados?.length)add(diagResult,'p','Nenhum Pix de teste encontrado.');}catch(_){diagResult.textContent='Não foi possível consultar a Efí de homologação.';}finally{diag.disabled=false;}};

    const labels={recebida:'Recebida',em_analise:'Em análise',indeferida:'Indeferida',concluida:'Concluída',cancelamento:'Cancelamento',reembolso:'Reembolso'};const label=v=>labels[v]||v;const filters=add(box,'div','');filters.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:12px;margin:12px 0';const search=add(filters,'input','');search.placeholder='Nome, e-mail ou protocolo';search.setAttribute('aria-label',search.placeholder);
    const filter=add(filters,'select','');filter.setAttribute('aria-label','Situação');for(const [v,t] of [['','Todas'],['recebida','Recebida'],['em_analise','Em análise'],['indeferida','Indeferida'],['concluida','Concluída']]){const o=add(filter,'option',t);o.value=v;}
    const start=add(filters,'input','');start.type='date';start.setAttribute('aria-label','Data inicial');const end=add(filters,'input','');end.type='date';end.setAttribute('aria-label','Data final');
    for(const e of [search,filter,start,end])e.style.cssText='width:100%;min-width:0;box-sizing:border-box;padding:10px;border:1px solid currentColor;border-radius:8px;font:inherit;background:transparent;color:inherit';const list=add(box,'div','');list.style.cssText='display:grid;gap:12px';let rows=[];
    const render=()=>{
      list.replaceChildren();
      const q=search.value.trim().toLowerCase();
      for(const row of rows.filter(x=>(!q||[x.id,x.user_id,x.nome,x.email].join(' ').toLowerCase().includes(q))&&(!filter.value||x.status===filter.value)&&(!start.value||new Date(x.criado_em)>=new Date(start.value+'T00:00:00'))&&(!end.value||new Date(x.criado_em)<=new Date(end.value+'T23:59:59.999')))){
        const card=add(list,'article','');card.className='card';card.style.cssText='min-width:0;overflow-wrap:anywhere';add(card,'strong',label(row.tipo)+' — '+label(row.status));add(card,'p','Protocolo: '+row.id);add(card,'p','Cliente: '+(row.nome||'Nome indisponível'));add(card,'p','E-mail: '+(row.email||'Indisponível'));if(row.valor!=null)add(card,'p','Valor do reembolso: '+money(row.valor));add(card,'p',fmtDate(row.criado_em));
        const hist=add(card,'button','Histórico das decisões');hist.type='button';hist.className='btn';
        hist.onclick=async()=>{const h=await sb.rpc('obrix_hml_admin_historico',{p_id:row.id});const prior=card.querySelector('[data-historico]');prior?.remove();const log=add(card,'div','');log.dataset.historico='1';if(h.error){add(log,'p','Histórico indisponível.');return;}for(const d of h.data||[])add(log,'p',fmtDate(d.criado_em)+' — '+label(d.anterior)+' → '+label(d.novo)+': '+d.justificativa);if(!h.data?.length)add(log,'p','Sem decisões registradas.');};
        if(row.tipo==='reembolso'&&row.status==='em_analise'){
          const retorno=add(card,'p','');retorno.setAttribute('role','status');
          for(const [acao,txt] of [['solicitar','Processar devolução Pix de teste'],['consultar','Consultar devolução Pix de teste']]){
            const btn=add(card,'button',txt);btn.type='button';btn.className='btn';btn.style.cssText='margin:4px 8px 4px 0;max-width:100%;white-space:normal';
            btn.onclick=async()=>{if(acao==='solicitar'&&!await confirmarAdmin('Enviar devolução exclusivamente à Efí de homologação? Nenhum valor real será devolvido.'))return;btn.disabled=true;retorno.textContent='Consultando...';try{const r=await sb.functions.invoke('obrix-hml-devolucao-pix',{body:{solicitacaoId:row.id,acao}});if(r.error||r.data?.error){let m=r.data?.error;try{if(!m&&r.error?.context instanceof Response)m=(await r.error.context.json()).error;}catch(_){}retorno.textContent=m||'Operação inconclusiva; consulte antes de repetir.';return;}const d=r.data;retorno.textContent='Efí: '+({DEVOLVIDO:'Devolução confirmada',EM_PROCESSAMENTO:'Em processamento',NAO_REALIZADO:'Não realizada'}[d.status]||'Estado indefinido')+' — '+money(d.valor)+' — Somente teste; situação da solicitação não alterada.';}catch(_){retorno.textContent='Operação inconclusiva; consulte antes de repetir.';}finally{btn.disabled=false;}};
          }
        }
        if(['recebida','em_analise'].includes(row.status)){
          const reason=add(card,'textarea','');reason.placeholder='Justificativa obrigatória (10 a 2000 caracteres)';reason.maxLength=2000;reason.rows=4;reason.style.cssText='display:block;width:100%;box-sizing:border-box;margin:12px 0;padding:12px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;resize:vertical';reason.setAttribute('aria-label','Justificativa');
          if(row.tipo==='cancelamento'&&row.status==='em_analise'){
            const cancel=add(card,'button','Registrar cancelamento ao vencimento');cancel.type='button';cancel.className='btn';cancel.style.cssText='margin:4px 8px 4px 0;max-width:100%;white-space:normal';
            cancel.onclick=async()=>{if(reason.value.trim().length<10){msg.textContent='Informe uma justificativa com pelo menos 10 caracteres.';return;}if(!await confirmarAdmin('Registrar cancelamento de teste, preservando o acesso até o vencimento? Esta operação não cancela cobranças externas.'))return;cancel.disabled=true;try{const a=await sb.rpc('obrix_hml_programar_cancelamento',{p_id:row.id,p_justificativa:reason.value.trim()});if(a.error){msg.textContent=a.error.message||'Não foi possível registrar o cancelamento.';return;}await loadRows();msg.textContent='Cancelamento registrado. Acesso contratado até '+fmtDate(a.data.acesso_ate)+'.';}catch(_){msg.textContent='Não foi possível confirmar o registro. Consulte o histórico.';}finally{cancel.disabled=false;}};
          }
          for(const [st,label] of [['em_analise','Encaminhar para análise'],['indeferida','Recusar solicitação']]){
            if(st===row.status)continue;
            const b=add(card,'button',label);b.type='button';b.className='btn';b.style.cssText='margin:4px 8px 4px 0;max-width:100%;white-space:normal';b.onclick=async()=>{if(reason.value.trim().length<10){msg.textContent='Informe uma justificativa com pelo menos 10 caracteres.';return;}if(!await confirmarAdmin('Confirma esta decisão administrativa de teste?'))return;b.disabled=true;const a=await sb.rpc('obrix_hml_admin_decidir',{p_id:row.id,p_status:st,p_justificativa:reason.value.trim()});if(a.error){msg.textContent='Não foi possível registrar a decisão.';b.disabled=false;return;}await loadRows();};
          }
        }
      }
      if(!list.childElementCount)add(list,'p','Nenhuma solicitação encontrada.');
    };
    async function loadRows(){const res=await sb.rpc('obrix_hml_admin_listar');if(res.error){rows=[];msg.textContent='Consulta indisponível.';render();return;}rows=res.data||[];msg.textContent='Registros carregados: '+rows.length+' (até 500) | Cancelamentos pendentes: '+rows.filter(x=>x.tipo==='cancelamento'&&['recebida','em_analise'].includes(x.status)).length+' | Reembolsos pendentes: '+rows.filter(x=>x.tipo==='reembolso'&&['recebida','em_analise'].includes(x.status)).length;render();}
    for(const e of [search,filter,start,end])e.addEventListener('input',render);
    await loadRows();
  }
  let carregandoAssinatura=null;
  const htmlEstavel=(node,html)=>{if(!node)return;const assinatura=String(html);if(node.__obrixAssMarkup===assinatura&&node.childNodes.length)return;node.innerHTML=assinatura;node.__obrixAssMarkup=assinatura};
  async function load(){
    if(carregandoAssinatura)return carregandoAssinatura;
    const exec=(async()=>{
      const area=ensure(),status=$('assStatus'),planosBox=$('assPlanos');
      if(!area||!status||!planosBox)return;
      try{
        const sb=await OBRIX_BACKEND.init();
        const perfil=typeof profile!=='undefined'&&profile?profile:await OBRIX_BACKEND.profile();
        if(!perfil?.empresa_id)throw Error('Empresa não identificada.');
        const [pr,sr]=await Promise.all([
          sb.from('planos_assinatura').select('codigo,nome,descricao,valor,periodo,destaque').eq('ativo',true).order('ordem'),
          sb.from('assinaturas').select('*').eq('empresa_id',perfil.empresa_id).order('atualizado_em',{ascending:false}).limit(1)
        ]);
        if(pr.error)throw pr.error;if(sr.error)throw sr.error;
        const a=sr.data?.[0]||null;
        const simulacaoVisual=previewTrialExpirado()&&a?.status==='teste';
        let statusHtml='';
        const pagamentoVigente=!!(a&&a.status==='ativo'&&(a.plano==='permanente'||((a.plano==='mensal'||a.plano==='anual')&&a.periodo_fim&&new Date(a.periodo_fim).getTime()>Date.now())));
        if(!a)statusHtml='<h3>Assinatura</h3><p class="muted">Nenhuma assinatura encontrada para esta empresa.</p>';
        else if(a.status==='teste'){
          const dias=simulacaoVisual?0:diasRestantes(a.trial_fim);
          statusHtml=dias>0?`<h3>Teste grátis</h3><div class="assBig">${dias} dia${dias===1?'':'s'} restante${dias===1?'':'s'}</div><p class="muted">Teste válido até ${fmtDate(a.trial_fim)}. Após o teste, sem pagamento, o acesso fica limitado a 1 obra e 1 funcionário.</p>`:'<h3>Teste encerrado</h3><div class="assBig">Plano limitado</div><p class="muted">É possível usar uma obra e um funcionário. Escolha um plano para recuperar o acesso completo.</p>';
        }else if(a.status==='ativo'&&a.plano==='permanente')
          statusHtml='<h3>Plano permanente</h3><div class="assBig">Acesso completo</div><p class="muted">Sem data de vencimento.</p>';
        else if(pagamentoVigente)
          statusHtml=`<h3>Assinatura ativa</h3><div class="assBig">${a.plano==='anual'?'Plano Anual':'Plano Mensal'}</div><p class="muted">Acesso completo${a.periodo_fim?' até '+fmtDate(a.periodo_fim):''}.</p>`;
        else if(a.status==='ativo') statusHtml='<h3>Assinatura</h3><div class="assBig">Renovação necessária</div><p class="muted">O período pago terminou ou está sem vencimento definido. Escolha um plano para recuperar o acesso completo.</p>';
        else statusHtml=`<h3>Assinatura</h3><div class="assBig">${String(a.status||'inativa').replace('_',' ')}</div><p class="muted">Escolha um plano para liberar o acesso completo.</p>`;
        const planosHtml=(a?.status==='ativo'&&a.plano==='permanente')?'<div class="card muted">Acesso permanente ativo. Nenhuma nova assinatura é necessária.</div>':(pr.data||[]).map(p=>{
          const anual=p.periodo==='anual'||p.codigo==='anual';
          const acoesPagamento = hml()
            ? `<div class="assPayActions"><button type="button" class="btn obrixPermanentNeutral obrixPayMethod" data-ass-plano="${p.codigo}">Testar Pix</button><button type="button" class="btn obrixPermanentNeutral obrixPayMethod" data-ass-boleto="${p.codigo}">Testar boleto</button></div><p class="muted" style="margin:8px 0 0">Somente homologação Efí: cobranças simuladas, sem pagamento real e sem liberação de assinaturas.</p>`
            : `<div class="assPayActions"><button type="button" class="btn obrixPermanentNeutral obrixPayMethod" data-ass-plano="${p.codigo}">Pagar com Pix</button><button type="button" class="btn obrixPermanentNeutral obrixPayMethod" data-ass-boleto="${p.codigo}">Pagar com boleto</button></div>`;
          return `<div class="card assPlano ${anual?'assDestaque':''}"><div class="assPlanoTop"><h3>${p.nome||p.codigo}</h3>${anual?'<span class="assEconomiaBadge">Economize 17%</span>':''}</div><div class="assPreco">${money(p.valor)}<small>/${anual?'ano':'mês'}</small></div><p class="muted">${p.descricao||''}</p>${acoesPagamento}</div>`
        }).join('')||'<div class="card muted">Nenhum plano disponível.</div>';
        if(simulacaoVisual)statusHtml='<p role="status" style="margin:0 0 12px;padding:10px;border:1px solid currentColor;border-radius:10px;font-weight:700">SIMULAÇÃO VISUAL — teste grátis vencido. A assinatura continua ativa no banco de homologação. Nenhuma escolha será gravada.</p>'+statusHtml;
        htmlEstavel(status,statusHtml);htmlEstavel(planosBox,planosHtml);if(window.__OBRIX_HML_PROJECT_REF==='xavwkfgrnowmusbkbiea'){await window.OBRIX_HML_LIMIT_PANEL?.refresh?.(sb,perfil,a);window.OBRIX_HML_EFI_DIAGNOSTICO?.mount?.(sb,perfil);}
        planosBox.querySelectorAll('[data-ass-plano]').forEach(btn=>btn.onclick=()=>abrirPagamento(btn.dataset.assPlano));
        planosBox.querySelectorAll('[data-ass-boleto]').forEach(btn=>btn.onclick=()=>abrirBoleto(btn.dataset.assBoleto));
        pagamentoId=localStorage.getItem(K.id)||'';
        boletoPagamentoId=localStorage.getItem(KB.id)||'';
        if(hml()){await solicitacoesHml(sb,perfil,a);await adminSolicitacoesHml(sb);}
      }catch(e){
        console.warn('Assinaturas: consulta indisponível',e);
        if(!planosBox.childElementCount)htmlEstavel(status,'<h3>Planos e Assinaturas</h3><div class="status">'+pt(e)+'</div>');
      }
    })();
    carregandoAssinatura=exec;try{return await exec}finally{if(carregandoAssinatura===exec)carregandoAssinatura=null}
  }
  function open(){ensure();['inicio','obras','equipe','financeiroMain','estoqueMain','menuMain'].forEach(id=>$(id)?.classList.add('hidden'));main?.classList.remove('hidden');document.querySelectorAll('.bottom button').forEach(b=>b.classList.remove('active'));load();scrollTo({top:0,behavior:'smooth'})}
  const css=document.createElement('style');css.textContent=`.assGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.assPlano{position:relative}.assPlanoTop{display:flex;align-items:center;justify-content:space-between;gap:8px}.assPlanoTop h3{margin:0}.assEconomiaBadge{font-size:12px;font-weight:900;background:#166534;color:#fff;padding:6px 8px;border-radius:999px;border:1px solid #86efac}.assPreco{font-size:30px;font-weight:900;margin:14px 0 8px}.assPreco small{font-size:13px;color:#64748b}.assBig{font-size:25px;font-weight:900;margin:8px 0}.assDestaque{border-width:2px;border-color:#22c55e}.assPayActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.assModal{position:fixed;inset:0;background:rgba(2,6,23,.72);display:flex;align-items:center;justify-content:center;padding:18px;z-index:2147483000}.assModalCard{position:relative;width:min(480px,100%);max-height:92vh;overflow:auto;background:#fff;color:#0f172a;border-radius:18px;padding:22px;border:1px solid #cbd5e1;box-shadow:0 24px 80px rgba(0,0,0,.35)}.assClose{position:absolute;right:12px;top:10px;border:0;background:transparent;color:#64748b;font-size:30px;line-height:1;padding:4px 8px}.assGerar,.assVerify{width:100%;margin-top:12px}.assPixArea,.assBoletoArea{display:grid;gap:9px;margin-top:16px}.assPixArea label{font-weight:800}.assPixQr{display:block;width:min(260px,100%);margin:0 auto;border-radius:12px;border:1px solid #e2e8f0;background:#fff}.assPixArea textarea{width:100%;resize:none;border:1px solid #cbd5e1;border-radius:11px;padding:11px;font:inherit;font-size:12px}.assCopy{border:1px solid #cbd5e1;background:#f8fafc;color:#0f172a;border-radius:11px;padding:11px;font-weight:900}.assBoletoLink{text-align:center;text-decoration:none}.assOk{background:#dcfce7!important;color:#166534!important}.assErr{background:#fee2e2!important;color:#991b1b!important}html:not([data-obrix-offline-v3="1"])[data-theme="light"] #assPlanos .obrixPayMethod,html:not([data-obrix-offline-v3="1"]):not([data-theme="dark"]) body:not(.dark) #assPlanos .obrixPayMethod{background:#E2E8F0!important;background-color:#E2E8F0!important;background-image:none!important;color:#111827!important;-webkit-text-fill-color:#111827!important;border-color:#CBD5E1!important;box-shadow:none!important}html[data-theme="dark"] .assModalCard,body.dark .assModalCard{background:#0f172a;color:#f8fafc;border-color:#334155}html[data-theme="dark"] .assPixArea textarea,body.dark .assPixArea textarea,html[data-theme="dark"] .assCopy,body.dark .assCopy{background:#111827;color:#f8fafc;border-color:#334155}html[data-theme="dark"] .assEconomiaBadge,body.dark .assEconomiaBadge{background:#123524;color:#86efac;border-color:#22c55e}@media(max-width:620px){.assGrid{grid-template-columns:1fr}.assPayActions{grid-template-columns:1fr}.assModalCard{padding-bottom:calc(30px + env(safe-area-inset-bottom))}}`;document.head.appendChild(css);window.OBRIX_EFI={checkout:abrirPagamento,gerarPix:criarPix,verificar:verificarPagamento,boleto:abrirBoleto,gerarBoleto:criarBoleto,verificarBoleto};window.OBRIX_PAGBANK=window.OBRIX_EFI;window.OBRIX_ASSINATURA={open,load};
})();
