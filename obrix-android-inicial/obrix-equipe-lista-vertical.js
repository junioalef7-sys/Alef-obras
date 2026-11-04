(()=>{
  'use strict';

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const hoje=()=>new Date().toISOString().slice(0,10);
  let filtro='todos';

  function funcs(){try{return typeof funcionarios!=='undefined'&&Array.isArray(funcionarios)?funcionarios:[]}catch(_){return[]}}
  function obrasList(){try{return typeof obras!=='undefined'&&Array.isArray(obras)?obras:[]}catch(_){return[]}}
  function diariasList(){try{return typeof diarias!=='undefined'&&Array.isArray(diarias)?diarias:[]}catch(_){return[]}}
  function valesList(){try{return typeof vales!=='undefined'&&Array.isArray(vales)?vales:[]}catch(_){return[]}}
  function bonusList(){try{return typeof bonus!=='undefined'&&Array.isArray(bonus)?bonus:[]}catch(_){return[]}}
  function acharFunc(id){return funcs().find(f=>String(f.id)===String(id))||null}
  function nomeObra(id){return obrasList().find(o=>String(o.id)===String(id))?.nome||'Sem obra'}
  function tipoPagamento(v){return ({diaria:'Por diária',semana:'Por semana',quinzena:'Por quinzena',mes:'Por mês'})[String(v||'diaria')]||'Por diária'}
  function valorBase(f){return String(f.tipo_pagamento)==='mes'?Number(f.salario_mensal||0):Number(f.valor_diaria||0)}

  function resumo(f){
    const ds=diariasList().filter(x=>String(x.funcionario_id)===String(f.id)&&!x.paga);
    const vs=valesList().filter(x=>String(x.funcionario_id)===String(f.id)&&!x.quitado);
    const bs=bonusList().filter(x=>String(x.funcionario_id)===String(f.id)&&!x.pago);
    const td=ds.reduce((s,x)=>s+Number(x.valor_total||0),0);
    const tb=bs.reduce((s,x)=>s+Number(x.valor||0),0);
    const tv=vs.reduce((s,x)=>s+Number(x.valor||0),0);
    const bruto=td+tb;
    const abate=Math.min(tv,Math.max(0,bruto));
    return {
      completas:ds.filter(x=>Number(x.quantidade||1)>=1).length,
      meias:ds.filter(x=>Number(x.quantidade||0)>0&&Number(x.quantidade||0)<1).length,
      bruto,tv,tb,abate,
      liquido:Math.max(0,bruto-abate)
    };
  }

  function cardHtml(f){
    const r=resumo(f);
    return `<article class="card item obrix-modelo-card" data-id="${esc(f.id)}">
      <div class="obrix-modelo-cabecalho">
        <h3>${esc(f.nome||'Funcionário')}</h3>
        <div class="obrix-modelo-subnome">${esc(f.nome||'Funcionário')}</div>
        <span class="obrix-modelo-status ${f.ativo===false?'off':''}">${f.ativo===false?'Inativo':'Ativo'}</span>
      </div>

      <div class="obrix-modelo-pagamento">
        <small>Forma de pagamento</small>
        <strong>${esc(tipoPagamento(f.tipo_pagamento))}</strong>
        <span>${esc(nomeObra(f.obra_id))}</span>
        <b>${money(valorBase(f))}</b>
      </div>

      <div class="obrix-modelo-pilulas">
        <span>${r.completas} diária${r.completas===1?'':'s'} completa${r.completas===1?'':'s'} em aberto</span>
        <span>${r.meias} meia${r.meias===1?'':'s'} diária${r.meias===1?'':'s'} em aberto</span>
      </div>

      <div class="obrix-modelo-metricas">
        <div class="obrix-modelo-metrica azul"><small>Total bruto em aberto</small><b>${money(r.bruto)}</b></div>
        <div class="obrix-modelo-metrica ouro"><small>Vales em aberto</small><b>${money(r.tv)}</b><span>Abate nesta folha: ${money(r.abate)}</span></div>
        <div class="obrix-modelo-metrica ouro"><small>Bônus e extras em aberto</small><b>${money(r.tb)}</b></div>
        <div class="obrix-modelo-metrica liquido"><small>Líquido a pagar</small><b>${money(r.liquido)}</b></div>
      </div>

      <div class="obrix-modelo-acoes">
        <button type="button" data-acao="diaria" data-id="${esc(f.id)}">Marcar diária</button>
        <button type="button" data-acao="falta" data-id="${esc(f.id)}">Falta</button>
        <button type="button" data-acao="registros" data-id="${esc(f.id)}">Ver registros</button>
        <button type="button" data-acao="vale" data-id="${esc(f.id)}">Vale</button>
        <button type="button" data-acao="bonus" data-id="${esc(f.id)}">Bônus e Extras</button>
      </div>
    </article>`;
  }

  function renderEquipeModelo(){
    montarTopo();
    const box=document.getElementById('listaEquipe');if(!box)return;
    const fs=funcs().filter(f=>filtro==='todos'||(filtro==='ativos'&&f.ativo!==false)||(filtro==='inativos'&&f.ativo===false));
    box.innerHTML=fs.length?fs.map(cardHtml).join(''):'<div class="card muted">Nenhum funcionário encontrado.</div>';
    box.querySelectorAll('[data-acao]').forEach(btn=>btn.onclick=()=>acao(btn.dataset.id,btn.dataset.acao));
  }

  function abrirModal(titulo,conteudo,classe=''){
    const back=document.createElement('div');back.className='modalBack';
    back.innerHTML=`<div class="modal ${classe}"><div class="obrix-modal-head"><h2>${esc(titulo)}</h2><button type="button" class="obrix-modal-x" aria-label="Fechar">×</button></div>${conteudo}</div>`;
    document.body.appendChild(back);
    back.querySelector('.obrix-modal-x').onclick=()=>back.remove();
    back.addEventListener('click',e=>{if(e.target===back)back.remove()});
    return back;
  }

  async function registrarFalta(id){
    const f=acharFunc(id);if(!f)return alert('Funcionário não encontrado.');
    const opts='<option value="">Sem obra</option>'+obrasList().map(o=>`<option value="${esc(o.id)}" ${String(o.id)===String(f.obra_id||'')?'selected':''}>${esc(o.nome||'Obra')}</option>`).join('');
    const back=abrirModal('Registrar falta',`<p class="muted"><b>${esc(f.nome)}</b></p><label>Obra</label><select class="obra">${opts}</select><label>Data</label><input class="data" type="date" value="${hoje()}"><label>Tipo</label><select class="tipo"><option value="false">Falta injustificada</option><option value="true">Falta justificada</option></select><label>Motivo</label><input class="motivo" placeholder="Motivo da falta"><label>Observações</label><input class="obs" placeholder="Observações opcionais"><div class="modalActions"><button class="btn cancelar" type="button">Cancelar</button><button class="btn salvar" type="button">Registrar falta</button></div>`,'obrix-modelo-modal');
    back.querySelector('.cancelar').onclick=()=>back.remove();
    back.querySelector('.salvar').onclick=async()=>{
      const data=back.querySelector('.data').value;if(!data)return alert('Informe a data da falta.');
      const btn=back.querySelector('.salvar');btn.disabled=true;
      try{
        const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();
        const {error}=await sb.from('faltas').insert({empresa_id:p.empresa_id,funcionario_id:f.id,obra_id:back.querySelector('.obra').value||null,data,justificada:back.querySelector('.tipo').value==='true',motivo:back.querySelector('.motivo').value.trim()||null,observacoes:back.querySelector('.obs').value.trim()||null});
        if(error)throw error;back.remove();alert('Falta registrada.');
      }catch(e){alert(e.message||'Não foi possível registrar a falta.')}finally{btn.disabled=false}
    };
  }

  async function historicoFaltas(id){
    const f=acharFunc(id);if(!f)return;
    const back=abrirModal('Histórico de faltas','<div class="obrix-carregando">Carregando...</div>','obrix-modelo-modal');
    try{
      const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();
      const {data,error}=await sb.from('faltas').select('id,obra_id,data,justificada,motivo,observacoes').eq('empresa_id',p.empresa_id).eq('funcionario_id',f.id).order('data',{ascending:false});
      if(error)throw error;
      const area=back.querySelector('.obrix-carregando');
      area.innerHTML=(data||[]).length?(data||[]).map(x=>`<div class="obrix-registro-linha"><div><b>${new Date(x.data+'T12:00:00').toLocaleDateString('pt-BR')}</b><span>${esc(nomeObra(x.obra_id))}</span></div><div><strong>${x.justificada?'Justificada':'Injustificada'}</strong>${x.motivo?`<span>${esc(x.motivo)}</span>`:''}${x.observacoes?`<small>${esc(x.observacoes)}</small>`:''}</div></div>`).join(''):'<p class="muted">Nenhuma falta registrada.</p>';
    }catch(e){back.querySelector('.obrix-carregando').innerHTML=`<div class="status">${esc(e.message||'Não foi possível carregar.')}</div>`}
  }

  function verRegistros(id){
    const f=acharFunc(id);if(!f)return;
    const rows=[];
    diariasList().filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({data:x.data,tipo:Number(x.quantidade||1)<1?'Meia diária':'Diária',obra:nomeObra(x.obra_id),valor:Number(x.valor_total||0),status:x.paga?'Quitada':'Em aberto'}));
    valesList().filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({data:x.data,tipo:'Vale',obra:nomeObra(x.obra_id),valor:-Number(x.valor||0),status:x.quitado?'Quitado':'Em aberto'}));
    bonusList().filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({data:x.data,tipo:x.tipo==='extra'?'Extra':'Bônus',obra:nomeObra(x.obra_id),valor:Number(x.valor||0),status:x.pago?'Pago':'Em aberto'}));
    rows.sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
    const html=`<p class="muted"><b>${esc(f.nome)}</b></p><div class="obrix-registros-lista">${rows.length?rows.map(x=>`<div class="obrix-registro-linha"><div><b>${x.data?new Date(x.data+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</b><span>${esc(x.tipo)} · ${esc(x.obra)}</span></div><div class="obrix-registro-valor"><b>${money(x.valor)}</b><small>${esc(x.status)}</small></div></div>`).join(''):'<p class="muted">Nenhum registro encontrado.</p>'}</div><div class="obrix-registros-acoes"><button type="button" data-extra="vale">Vale</button><button type="button" data-extra="bonus">Bônus e Extras</button><button type="button" class="pagar" data-extra="pagar">Pagar</button></div>`;
    const back=abrirModal('Registros do funcionário',html,'obrix-modelo-modal');
    back.querySelectorAll('[data-extra]').forEach(btn=>btn.onclick=()=>{back.remove();window.equipeAcao?.(String(id),btn.dataset.extra)});
  }

  function editarCadastro(id){
    if(!window.OBRIX_FUNCIONARIOS_PESSOAL?.open)return alert('Cadastro indisponível. Atualize a página e tente novamente.');
    window.OBRIX_FUNCIONARIOS_PESSOAL.open();
    setTimeout(()=>{
      const item=[...document.querySelectorAll('.obrix-pessoal-item')].find(x=>String(x.dataset.id)===String(id));
      if(!item)return;
      item.querySelector('.obrix-pessoal-toggle')?.click();
      setTimeout(()=>item.querySelector('.obrix-pessoal-editar-btn')?.click(),40);
    },80);
  }

  function acao(id,tipo){
    if(tipo==='diaria')return window.equipeAcao?.(String(id),'diaria');
    if(tipo==='falta')return registrarFalta(id);
    if(tipo==='registros')return verRegistros(id);
    if(tipo==='vale')return window.equipeAcao?.(String(id),'vale');
    if(tipo==='bonus')return window.equipeAcao?.(String(id),'bonus');
    if(tipo==='faltas')return historicoFaltas(id);
    if(tipo==='editar')return editarCadastro(id);
  }

  function novoFuncionario(){
    const btn=document.querySelector('#equipe .sectionHead > .btn');
    if(btn)return btn.click();
    alert('Cadastro de funcionário indisponível.');
  }

  async function atualizar(){
    const btn=document.querySelector('.obrix-atualizar-equipe');if(btn)btn.disabled=true;
    try{await window.OBRIX_EQUIPE?.refresh?.()}catch(e){alert(e.message||'Não foi possível atualizar.')}finally{if(btn)btn.disabled=false;renderEquipeModelo()}
  }

  function seletor(tipo){
    const fs=funcs().slice().sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
    if(!fs.length)return alert('Nenhum funcionário cadastrado.');
    const titulo=tipo==='toggle'?'Ativar / Desativar':'Excluir funcionário';
    const back=abrirModal(titulo,`<label>Funcionário</label><select class="func">${fs.map(f=>`<option value="${esc(f.id)}">${esc(f.nome)} — ${f.ativo===false?'Inativo':'Ativo'}</option>`).join('')}</select><div class="modalActions"><button class="btn cancelar">Cancelar</button><button class="btn continuar">Continuar</button></div>`,'obrix-modelo-modal');
    back.querySelector('.cancelar').onclick=()=>back.remove();
    back.querySelector('.continuar').onclick=async()=>{
      const f=acharFunc(back.querySelector('.func').value);if(!f)return;
      if(tipo==='delete'&&!confirm(`Excluir o funcionário “${f.nome}”?`))return;
      const btn=back.querySelector('.continuar');btn.disabled=true;
      try{
        const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();
        const r=tipo==='toggle'?await sb.from('funcionarios').update({ativo:f.ativo===false,atualizado_em:new Date().toISOString()}).eq('id',f.id).eq('empresa_id',p.empresa_id):await sb.from('funcionarios').delete().eq('id',f.id).eq('empresa_id',p.empresa_id);
        if(r.error)throw r.error;back.remove();await window.OBRIX_EQUIPE?.refresh?.();
      }catch(e){alert(e.message||'Não foi possível concluir.')}finally{btn.disabled=false}
    };
  }

  function montarTopo(){
    const sec=document.getElementById('equipe');if(!sec)return;
    sec.querySelector('.sectionHead')?.classList.add('obrix-head-original');
    let box=sec.querySelector('.obrix-equipe-controles');
    if(!box){
      box=document.createElement('div');box.className='obrix-equipe-controles';
      box.innerHTML=`<div class="obrix-equipe-botoes"><button class="obrix-cmd destaque" data-cmd="novo" type="button">Novo Funcionário</button><button class="obrix-cmd" data-cmd="lista" type="button">👥 Funcionários</button><button class="obrix-cmd" data-cmd="toggle" type="button">⏯️ Ativar / Desativar</button><button class="obrix-cmd perigo" data-cmd="excluir" type="button">🗑️ Excluir</button></div><div class="obrix-equipe-secundario"><select class="obrix-filtro-equipe" aria-label="Filtrar funcionários"><option value="todos">Todos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option></select><button class="obrix-cmd obrix-atualizar-equipe" type="button">↻ Atualizar</button></div>`;
      sec.querySelector('.hero')?.insertAdjacentElement('afterend',box);
    }
    const lista=box.querySelector('[data-cmd="lista"]');if(lista)lista.onclick=()=>window.OBRIX_FUNCIONARIOS_PESSOAL?.open?.();
    const toggle=box.querySelector('[data-cmd="toggle"]');if(toggle)toggle.onclick=()=>seletor('toggle');
    const excluir=box.querySelector('[data-cmd="excluir"]');if(excluir)excluir.onclick=()=>seletor('delete');
    const novo=box.querySelector('[data-cmd="novo"]');if(novo){novo.textContent='Novo Funcionário';novo.onclick=novoFuncionario}
    const atualizarBtn=box.querySelector('.obrix-atualizar-equipe');if(atualizarBtn)atualizarBtn.onclick=atualizar;
    const sel=box.querySelector('.obrix-filtro-equipe');if(sel){sel.value=filtro;sel.onchange=e=>{filtro=e.target.value;renderEquipeModelo()}}
  }

  function instalar(){
    montarTopo();
    window.renderEquipe=renderEquipeModelo;
    renderEquipeModelo();
    setTimeout(()=>{window.renderEquipe=renderEquipeModelo;montarTopo();renderEquipeModelo()},350);
    setTimeout(()=>{window.renderEquipe=renderEquipeModelo;montarTopo();renderEquipeModelo()},900);
  }

  const css=document.createElement('style');
  css.textContent=`
    #equipe .obrix-head-original{display:none!important}
    #equipe .obrix-equipe-controles{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin:0 0 18px!important}
    #equipe .obrix-equipe-botoes,#equipe .obrix-equipe-secundario{display:contents!important}
    #equipe .obrix-equipe-controles [data-cmd="novo"]{order:1!important;grid-column:1!important}
    #equipe .obrix-equipe-controles [data-cmd="lista"]{order:2!important;grid-column:2!important}
    #equipe .obrix-equipe-controles .obrix-pagar-equipe-topo{order:3!important;grid-column:1!important;width:100%!important}
    #equipe .obrix-equipe-controles .obrix-historico-pagamentos-topo{order:4!important;grid-column:2!important;width:100%!important}
    #equipe .obrix-equipe-controles [data-cmd="toggle"]{order:5!important;grid-column:1!important}
    #equipe .obrix-equipe-controles .obrix-filtro-equipe{order:6!important;grid-column:2!important;width:100%!important}
    #equipe .obrix-equipe-controles [data-cmd="excluir"]{order:7!important;grid-column:1/-1!important;width:100%!important}
    #equipe .obrix-atualizar-equipe{display:none!important}
    .obrix-cmd,.obrix-filtro-equipe{width:100%;min-height:58px;border:1px solid #cbd5e1;border-radius:15px;background:#fff;color:#0f172a;font:inherit;font-weight:900;padding:12px;text-align:center}
    .obrix-cmd.destaque{border-color:#c48b18;color:#a66f00}.obrix-cmd.perigo{border-color:#ef4444;color:#dc2626}
    #listaEquipe{display:flex!important;flex-direction:column;gap:18px;visibility:visible!important;opacity:1!important}
    #listaEquipe .obrix-modelo-card{border-radius:22px;padding:28px;margin:0;overflow:hidden}
    .obrix-modelo-cabecalho h3{font-size:28px;line-height:1.15;margin:0 0 8px;font-weight:900}
    .obrix-modelo-subnome{font-size:20px;color:#64748b;margin-bottom:20px}
    .obrix-modelo-status{display:inline-flex;align-items:center;border:1px solid #3b82f6;border-radius:999px;padding:8px 14px;color:#2563eb;font-weight:900;margin-bottom:24px;background:rgba(37,99,235,.06)}
    .obrix-modelo-status.off{border-color:#94a3b8;color:#64748b;background:rgba(100,116,139,.08)}
    .obrix-modelo-pagamento{border:1px solid #e2e8f0;border-radius:18px;padding:20px 22px;background:#f8fafc;margin-bottom:16px}
    .obrix-modelo-pagamento small,.obrix-modelo-pagamento span{display:block;color:#64748b}.obrix-modelo-pagamento small{font-size:15px;margin-bottom:4px}.obrix-modelo-pagamento strong{display:block;font-size:20px;margin-bottom:3px}.obrix-modelo-pagamento span{font-size:15px}.obrix-modelo-pagamento>b{display:block;font-size:30px;color:#3b82f6;margin-top:22px}
    .obrix-modelo-pilulas{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 16px}.obrix-modelo-pilulas span{border:1px solid #e2e8f0;border-radius:999px;padding:9px 15px;font-size:16px;background:#f8fafc}
    .obrix-modelo-metricas{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .obrix-modelo-metrica{min-height:116px;border:1px solid #e2e8f0;border-radius:16px;padding:16px;background:#f8fafc;animation:none!important;transition:none!important;transform:none!important}.obrix-modelo-metrica small{display:block;color:#64748b;font-size:15px;margin-bottom:7px}.obrix-modelo-metrica b{display:block;font-size:26px}.obrix-modelo-metrica span{display:block;color:#64748b;font-size:13px;margin-top:4px}.obrix-modelo-metrica.azul b{color:#3b82f6}.obrix-modelo-metrica.ouro b{color:#d59b28}.obrix-modelo-metrica.liquido{background:#fff1f2;border-color:#fecdd3}.obrix-modelo-metrica.liquido b{color:#f43f5e}
    #equipe #listaEquipe .obrix-modelo-acoes{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:8px!important;margin-top:14px!important}
    #equipe #listaEquipe .obrix-modelo-acoes [data-acao="diaria"]{order:1!important;grid-column:span 2!important}
    #equipe #listaEquipe .obrix-modelo-acoes [data-acao="falta"]{order:2!important;grid-column:span 2!important}
    #equipe #listaEquipe .obrix-modelo-acoes [data-acao="registros"]{order:3!important;grid-column:span 2!important}
    #equipe #listaEquipe .obrix-modelo-acoes [data-acao="vale"]{order:4!important;grid-column:span 3!important}
    #equipe #listaEquipe .obrix-modelo-acoes [data-acao="bonus"]{order:5!important;grid-column:span 3!important}
    #equipe #listaEquipe .obrix-modelo-acoes button{min-width:0!important;width:100%!important;min-height:48px!important;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#334155;font-weight:900;padding:7px 4px!important;font-size:12px!important;line-height:1.05!important;white-space:nowrap!important;word-break:normal!important;overflow-wrap:normal!important}
    .obrix-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.obrix-modal-head h2{margin:0}.obrix-modal-x{border:0;background:transparent;color:inherit;font-size:30px;line-height:1;padding:2px 8px}.obrix-modelo-modal label{display:block;font-weight:800;margin-top:8px}.obrix-modelo-modal input,.obrix-modelo-modal select{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:10px;margin:5px 0 9px;font:inherit}.obrix-registros-lista,.obrix-carregando{display:grid;gap:8px}.obrix-registro-linha{display:flex;justify-content:space-between;gap:12px;border:1px solid #e2e8f0;border-radius:12px;padding:12px}.obrix-registro-linha span,.obrix-registro-linha small{display:block;color:#64748b;margin-top:3px}.obrix-registro-valor{text-align:right}.obrix-registros-acoes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.obrix-registros-acoes button{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:11px;font-weight:900}.obrix-registros-acoes .pagar{background:#0f172a;color:#fff;border-color:#0f172a}
    html[data-theme="dark"] .obrix-cmd,body.dark .obrix-cmd,html[data-theme="dark"] .obrix-filtro-equipe,body.dark .obrix-filtro-equipe{background:#111827;color:#f8fafc;border-color:#334155}
    html[data-theme="dark"] #listaEquipe .obrix-modelo-card,body.dark #listaEquipe .obrix-modelo-card{background:#0f172a;color:#f8fafc;border-color:#334155}
    html[data-theme="dark"] .obrix-modelo-subnome,body.dark .obrix-modelo-subnome,html[data-theme="dark"] .obrix-modelo-pagamento small,body.dark .obrix-modelo-pagamento small,html[data-theme="dark"] .obrix-modelo-pagamento span,body.dark .obrix-modelo-pagamento span,html[data-theme="dark"] .obrix-modelo-metrica small,body.dark .obrix-modelo-metrica small,html[data-theme="dark"] .obrix-modelo-metrica span,body.dark .obrix-modelo-metrica span{color:#94a3b8}
    html[data-theme="dark"] .obrix-modelo-pagamento,body.dark .obrix-modelo-pagamento,html[data-theme="dark"] .obrix-modelo-pilulas span,body.dark .obrix-modelo-pilulas span,html[data-theme="dark"] .obrix-modelo-metrica,body.dark .obrix-modelo-metrica{background:#111827;border-color:#273449}
    html[data-theme="dark"] .obrix-modelo-metrica.liquido,body.dark .obrix-modelo-metrica.liquido{background:#231b27;border-color:#3d2934}
    html[data-theme="dark"] .obrix-modelo-acoes button,body.dark .obrix-modelo-acoes button,html[data-theme="dark"] .obrix-registros-acoes button,body.dark .obrix-registros-acoes button{background:#161d25;color:#f8fafc;border-color:#334155}
    html[data-theme="dark"] #equipe #listaEquipe .obrix-modelo-acoes [data-acao="vale"],body.dark #equipe #listaEquipe .obrix-modelo-acoes [data-acao="vale"]{background:#60a5fa!important;background-color:#60a5fa!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#3b82f6!important;animation:none!important;transition:none!important;transform:none!important}
    html[data-theme="dark"] #equipe #listaEquipe .obrix-modelo-acoes [data-acao="bonus"],body.dark #equipe #listaEquipe .obrix-modelo-acoes [data-acao="bonus"]{border-color:#f2b84b!important;box-shadow:none!important}
    html[data-theme="dark"] .obrix-registros-acoes .pagar,body.dark .obrix-registros-acoes .pagar{background:#2563eb;border-color:#2563eb}
    html[data-theme="dark"] .obrix-registro-linha,body.dark .obrix-registro-linha{border-color:#334155}
    @media(max-width:700px){
      #listaEquipe .obrix-modelo-card{padding:20px 18px}.obrix-modelo-cabecalho h3{font-size:24px}.obrix-modelo-subnome{font-size:17px}.obrix-modelo-pagamento{padding:17px}.obrix-modelo-pagamento>b{font-size:27px}.obrix-modelo-metrica{min-height:106px;padding:14px}.obrix-modelo-metrica b{font-size:22px}.obrix-cmd,.obrix-filtro-equipe{min-height:54px;font-size:14px;padding:10px 8px}
      #equipe #listaEquipe .obrix-modelo-acoes button{min-height:46px!important;font-size:11.5px!important;padding:6px 2px!important}
    }
    @media(max-width:390px){.obrix-modelo-metricas{grid-template-columns:1fr}.obrix-registros-acoes{grid-template-columns:1fr}#equipe #listaEquipe .obrix-modelo-acoes{grid-template-columns:repeat(6,minmax(0,1fr))!important}#equipe #listaEquipe .obrix-modelo-acoes button{font-size:10.5px!important;letter-spacing:-.15px!important}}
  `;
  document.head.appendChild(css);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,220));else setTimeout(instalar,220);
  window.OBRIX_EQUIPE_MODELO={render:renderEquipeModelo,refresh:atualizar};
})();