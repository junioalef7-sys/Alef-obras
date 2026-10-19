(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={entrada:'Entrada',material:'Material',mao_de_obra:'Mão de obra',servico_terceirizado:'Serviço terceirizado',ferramentas_equipamentos:'Ferramentas e Equipamentos',locacao:'Locação',transporte:'Transporte',combustivel:'Combustível',outros:'Outros'};
  const subSugestoes={
    entrada:['Sinal / entrada','Parcela','Medição','Serviço extra','Reembolso','Outros'],
    material:['Cimento / argamassa','Areia / brita','Blocos / tijolos','Aço / ferragem','Madeira','Hidráulica','Elétrica','Pintura','Acabamento','Outros'],
    mao_de_obra:['Diária','Semana','Quinzena','Mensal','Empreitada','Outros'],
    servico_terceirizado:['Elétrica','Hidráulica','Serralheria','Gesso','Pintura','Limpeza','Outros'],
    ferramentas_equipamentos:['Compra','Manutenção','Reposição','EPI','Outros'],
    locacao:['Equipamento','Caçamba','Andaime','Imóvel','Outros'],
    transporte:['Frete','Entrega','Deslocamento','Outros'],
    combustivel:['Gasolina','Etanol','Diesel','Outros'],
    outros:['Alimentação','Hospedagem','Taxas / impostos','Telefone / internet','Outros']
  };

  let salvando=false,realtime=null,realtimeTimer=null,polling=false,renderPromise=null,lastSync='',extrasFinanceiro=[],checklistFinanceiro=[];

  function ensure(){
    if($('financeiroMain'))return;
    const main=document.createElement('main');
    main.id='financeiroMain';main.className='hidden';
    main.innerHTML=`<div class="hero"><h1>Financeiro</h1><p>Receitas, despesas e resultado das obras</p></div>
      <div class="kpis"><div class="kpi"><small>Contrato atualizado</small><strong id="fmContrato">R$ 0,00</strong></div><div class="kpi"><small>Recebido</small><strong id="fmRecebido">R$ 0,00</strong></div><div class="kpi"><small>Despesas</small><strong id="fmDespesas">R$ 0,00</strong></div><div class="kpi"><small>Resultado da obra</small><strong id="fmResultado">R$ 0,00</strong></div></div>
      <div class="sectionHead"><strong>Lançamentos</strong><div><button class="btn" id="fmReceita">+ Receita</button> <button class="btn" id="fmDespesa">+ Despesa</button></div></div>
      <div id="fmForm" class="card form hidden"></div><div id="fmLista"></div>`;
    const equipe=$('equipe');equipe.parentNode.insertBefore(main,equipe.nextSibling);
    $('fmReceita').onclick=()=>form('receita');
    $('fmDespesa').onclick=()=>form('despesa');
  }

  function active(){return (window.financeiro||[]).filter(x=>!x.status_lancamento||x.status_lancamento==='ativo')}
  function idsChecklist(x){return Array.isArray(x?.checklist_ids)&&x.checklist_ids.length?x.checklist_ids.map(String):(x?.checklist_id?[String(x.checklist_id)]:[])}
  function signature(rows,extras,checks){
    const a=(rows||[]).map(x=>[x.id,x.atualizado_em,x.status_lancamento,x.valor,x.tipo,x.categoria,x.subcategoria,x.checklist_id,(x.checklist_ids||[]).join(',')].join(':')).sort().join('|');
    const b=(extras||[]).map(x=>[x.id,x.atualizado_em,x.valor,x.obra_id].join(':')).sort().join('|');
    const c=(checks||[]).map(x=>[x.id,x.atualizado_em,x.nome,x.obra_id].join(':')).sort().join('|');
    return a+'||'+b+'||'+c;
  }
  async function fetchDados(){
    const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),eid=p.empresa_id;
    const [rows,extras,checks]=await Promise.all([
      sb.from('financeiro').select('id,empresa_id,obra_id,checklist_id,checklist_ids,tipo,categoria,subcategoria,descricao,valor,data,origem,pagamento_equipe_id,compra_id,status_lancamento,atualizado_em').eq('empresa_id',eid).order('data',{ascending:false}),
      sb.from('servicos_extras').select('id,obra_id,valor,atualizado_em').eq('empresa_id',eid),
      sb.from('checklist_itens').select('id,obra_id,nome,ordem,atualizado_em').eq('empresa_id',eid).order('ordem',{ascending:true})
    ]);
    [rows,extras,checks].forEach(r=>{if(r.error)throw r.error});
    window.financeiro=rows.data||[];extrasFinanceiro=extras.data||[];checklistFinanceiro=checks.data||[];
    lastSync=signature(window.financeiro,extrasFinanceiro,checklistFinanceiro);return lastSync;
  }
  function atualizarObras(){try{window.OBRIX_OBRAS?.render?.()}catch(_){}}
  function podeExcluir(x){return x.origem==='manual'||!!x.pagamento_equipe_id||!!x.compra_id}
  function nomesChecklist(x){
    const mapa=new Map(checklistFinanceiro.map(c=>[String(c.id),c.nome||'Etapa']));
    return idsChecklist(x).map(id=>mapa.get(String(id))).filter(Boolean);
  }

  function renderLocal(){
    ensure();
    const f=active(),os=window.obras||[];
    const contratoBase=os.reduce((s,o)=>s+Number(o.valor_contrato||0),0),adicionais=extrasFinanceiro.reduce((s,x)=>s+Number(x.valor||0),0),contratoAtualizado=contratoBase+adicionais;
    const rec=f.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),des=f.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0),resultado=contratoAtualizado-des;
    const set=(id,val)=>{const el=$(id);if(el&&el.textContent!==val)el.textContent=val};
    set('fmContrato',money(contratoAtualizado));set('fmRecebido',money(rec));set('fmDespesas',money(des));set('fmResultado',money(resultado));
    const c=$('fmContrato')?.closest('.kpi')?.querySelector('small'),r=$('fmResultado')?.closest('.kpi')?.querySelector('small');if(c)c.textContent='Contrato atualizado';if(r)r.textContent='Resultado da obra';
    const lista=$('fmLista');
    const html=f.length?f.slice().sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))).map(x=>{
      const o=os.find(z=>String(z.id)===String(x.obra_id)),manual=x.origem==='manual',nomes=nomesChecklist(x);
      const meta=[o?.nome||'Sem obra',x.data||'',labels[x.categoria]||x.categoria||'',x.subcategoria||'',nomes.length?`Checklists: ${nomes.join(', ')}`:'Sem checklist'].filter(Boolean);
      return `<div class="card item" data-fin-card="1" data-id="${esc(x.id)}" data-obra="${esc(x.obra_id||'')}" data-tipo="${esc(x.tipo||'')}" data-categoria="${esc(x.categoria||'')}"><h3>${esc(x.descricao||'Lançamento')}</h3><div class="muted">${meta.map(esc).join(' • ')}</div><div class="grid"><div class="mini"><small>${x.tipo==='receita'?'Receita':'Despesa'}</small><b>${money(x.valor)}</b></div></div>${podeExcluir(x)?`<div class="actions">${manual?`<button type="button" data-fin="editar" data-id="${x.id}">Editar</button>`:''}<button type="button" data-fin="excluir" data-id="${x.id}">Excluir</button></div>`:''}</div>`;
    }).join(''):'<div class="card muted">Nenhum lançamento financeiro.</div>';
    if(lista&&lista.innerHTML!==html)lista.innerHTML=html;
    atualizarObras();window.OBRIX_FIN_BUSCA?.refreshOptions?.();window.OBRIX_FIN_BUSCA?.aplicar?.();
  }

  async function render(refresh=true){
    ensure();
    if(renderPromise)return renderPromise;
    renderPromise=(async()=>{try{if(refresh)await fetchDados()}catch(e){console.warn('Financeiro: atualização indisponível',e)}renderLocal()})();
    try{return await renderPromise}finally{renderPromise=null}
  }

  function atualizarSubSugestoes(){const cat=$('fmCat')?.value||'outros',dl=$('fmSubLista');if(dl)dl.innerHTML=(subSugestoes[cat]||subSugestoes.outros).map(x=>`<option value="${esc(x)}"></option>`).join('')}
  function idsSelecionados(){const box=$('fmChecklistMulti');return box?[...box.querySelectorAll('[data-check-id]:checked')].map(x=>x.value):[]}
  function sincronizarLegado(){const sel=$('fmChecklist');if(sel)sel.value=idsSelecionados()[0]||''}
  function atualizarChecklistForm(selecionados=[]){
    const box=$('fmChecklistMulti'),sel=$('fmChecklist'),obra=$('fmObra')?.value||'';if(!box||!sel)return;
    const setSel=new Set((selecionados||[]).map(String));
    if(!obra){box.innerHTML='<div class="fmChecklistAviso">Selecione uma obra primeiro.</div>';sel.innerHTML='<option value="">Sem checklist</option>';sel.value='';return}
    const xs=checklistFinanceiro.filter(c=>String(c.obra_id)===String(obra)).sort((a,b)=>Number(a.ordem||0)-Number(b.ordem||0));
    sel.innerHTML='<option value="">Sem checklist</option>'+xs.map(c=>`<option value="${esc(c.id)}">${esc(c.nome||'Etapa')}</option>`).join('');
    box.innerHTML=`<label class="fmChecklistOpcao fmChecklistSem"><input type="checkbox" data-sem-checklist ${setSel.size?'':'checked'}><span>Sem checklist</span></label>`+(xs.length?xs.map(c=>`<label class="fmChecklistOpcao"><input type="checkbox" data-check-id value="${esc(c.id)}" ${setSel.has(String(c.id))?'checked':''}><span>${esc(c.nome||'Etapa')}</span></label>`).join(''):'<div class="fmChecklistAviso">Nenhum checklist cadastrado para esta obra.</div>');
    const sem=box.querySelector('[data-sem-checklist]');
    sem?.addEventListener('change',()=>{if(sem.checked)box.querySelectorAll('[data-check-id]').forEach(x=>x.checked=false);sincronizarLegado()});
    box.querySelectorAll('[data-check-id]').forEach(ch=>ch.addEventListener('change',()=>{if(ch.checked&&sem)sem.checked=false;if(!idsSelecionados().length&&sem)sem.checked=true;sincronizarLegado()}));
    sincronizarLegado();
  }

  function form(tipo,x){
    ensure();salvando=false;
    const cats=tipo==='receita'?[['entrada','Entrada']]:Object.entries(labels).filter(([k])=>k!=='entrada'),box=$('fmForm');
    box.innerHTML=`<h3>${x?'Editar':'Novo'} ${tipo==='receita'?'receita':'despesa'}</h3>
      <label>Obra</label><select id="fmObra"><option value="">Sem obra vinculada</option>${(window.obras||[]).map(o=>`<option value="${o.id}" ${String(x?.obra_id||'')===String(o.id)?'selected':''}>${esc(o.nome)}</option>`).join('')}</select>
      <label>Categoria</label><select id="fmCat">${cats.map(([v,l])=>`<option value="${v}" ${x?.categoria===v?'selected':''}>${esc(l)}</option>`).join('')}</select>
      <label>Subcategoria</label><input id="fmSubcat" list="fmSubLista" placeholder="Ex.: Areia / brita, Parcela, Frete..." value="${esc(x?.subcategoria||'')}"><datalist id="fmSubLista"></datalist>
      <label>Checklist / etapa — selecione um ou mais</label><select id="fmChecklist" class="hidden" aria-hidden="true"><option value="">Sem checklist</option></select><div id="fmChecklistMulti" class="fmChecklistMulti"></div>
      <label>Descrição</label><input id="fmDesc" placeholder="Descrição" value="${esc(x?.descricao||'')}">
      <label>Valor</label><input id="fmValor" type="number" step="0.01" placeholder="Valor" value="${x?.valor||''}">
      <label>Data</label><input id="fmData" type="date" value="${x?.data||new Date().toISOString().slice(0,10)}">
      <div class="formActions"><button type="button" class="btn" id="fmSalvar">Salvar</button><button type="button" class="btn" id="fmCancelar">Cancelar</button></div>`;
    box.classList.remove('hidden');
    atualizarSubSugestoes();atualizarChecklistForm(idsChecklist(x));
    $('fmCat').onchange=atualizarSubSugestoes;
    $('fmObra').onchange=()=>atualizarChecklistForm([]);
    $('fmCancelar').onclick=()=>{if(!salvando)box.classList.add('hidden')};
    $('fmSalvar').onclick=()=>save(tipo,x?.id);
    requestAnimationFrame(()=>box.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  async function save(tipo,id){
    if(salvando)return;
    const valor=Number($('fmValor')?.value||0),descricao=$('fmDesc')?.value.trim()||'';if(!descricao||valor<=0)return alert('Informe descrição e valor maior que zero.');
    const btn=$('fmSalvar');salvando=true;if(btn){btn.disabled=true;btn.textContent='Salvando...'}
    try{
      const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),empresaId=p.empresa_id,ids=idsSelecionados();
      const payload={obra_id:$('fmObra')?.value||null,checklist_id:ids[0]||null,checklist_ids:ids,tipo,categoria:$('fmCat')?.value||'outros',subcategoria:$('fmSubcat')?.value.trim()||null,descricao,valor,data:$('fmData')?.value,origem:'manual',status_lancamento:'ativo',atualizado_em:new Date().toISOString()};
      const q=id?await sb.from('financeiro').update(payload).eq('id',id).eq('empresa_id',empresaId).eq('origem','manual').select('*').single():await sb.from('financeiro').insert({...payload,empresa_id:empresaId}).select('*').single();
      if(q.error)throw q.error;
      const atual=Array.isArray(window.financeiro)?window.financeiro.slice():[],idx=atual.findIndex(z=>String(z.id)===String(q.data.id));if(idx>=0)atual[idx]=q.data;else atual.unshift(q.data);window.financeiro=atual;
      $('fmForm').classList.add('hidden');renderLocal();window.OBRIX_DASH?.paint?.();
    }catch(e){alert(e.message||'Erro ao salvar lançamento')}finally{salvando=false;if(btn){btn.disabled=false;btn.textContent='Salvar'}}
  }

  async function excluir(id){
    const x=(window.financeiro||[]).find(z=>String(z.id)===String(id));if(!x||!podeExcluir(x))return alert('Este lançamento não pode ser excluído por aqui.');
    const origem=x.pagamento_equipe_id?'lançamento financeiro do pagamento da equipe':x.compra_id?'lançamento financeiro da compra do estoque':'lançamento';if(!confirm(`Excluir este ${origem}?`))return;
    try{const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),q=await sb.from('financeiro').delete().eq('id',id).eq('empresa_id',p.empresa_id);if(q.error)throw q.error;window.financeiro=(window.financeiro||[]).filter(z=>String(z.id)!==String(id));renderLocal();window.OBRIX_DASH?.paint?.()}catch(e){alert(e.message||'Erro ao excluir lançamento')}
  }
  function editar(id){const x=(window.financeiro||[]).find(z=>String(z.id)===String(id));if(!x)return alert('Lançamento não encontrado. Atualize o Financeiro e tente novamente.');form(x.tipo,x)}
  function visivel(){const x=$('financeiroMain');return !!x&&!x.classList.contains('hidden')}
  function open(){ensure();['inicio','obras','equipe'].forEach(id=>$(id)?.classList.add('hidden'));$('estoqueMain')?.classList.add('hidden');$('menuMain')?.classList.add('hidden');$('financeiroMain').classList.remove('hidden');$('bInicio')?.classList.remove('active');$('bEquipe')?.classList.remove('active');renderLocal();void render(true);void startRealtime();scrollTo({top:0,behavior:'smooth'})}
  async function startRealtime(){
    if(realtime)return;try{const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),filtro=`empresa_id=eq.${p.empresa_id}`,agendar=()=>{clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>{if(visivel()&&$('fmForm')?.classList.contains('hidden'))render(true)},250)};realtime=sb.channel('obrix-financeiro-sync-'+p.empresa_id).on('postgres_changes',{event:'*',schema:'public',table:'financeiro',filter:filtro},agendar).on('postgres_changes',{event:'*',schema:'public',table:'servicos_extras',filter:filtro},agendar).on('postgres_changes',{event:'*',schema:'public',table:'checklist_itens',filter:filtro},agendar).subscribe()}catch(e){console.warn('Financeiro realtime indisponível',e)}
  }
  async function poll(){if(polling||document.visibilityState!=='visible'||!visivel()||!$('fmForm')?.classList.contains('hidden'))return;polling=true;try{const before=lastSync;await fetchDados();if(lastSync!==before)renderLocal()}catch(_){}finally{polling=false}}

  const css=document.createElement('style');css.textContent=`#fmForm label{display:block;font-weight:800;margin:6px 0 2px}#fmForm select:disabled{opacity:.65}.fmChecklistMulti{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:6px 0 12px;padding:10px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc}.fmChecklistOpcao{display:flex!important;align-items:center;gap:8px;margin:0!important;padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;font-weight:700!important}.fmChecklistOpcao input{width:20px!important;height:20px!important;margin:0!important;flex:0 0 auto}.fmChecklistSem{grid-column:1/-1}.fmChecklistAviso{grid-column:1/-1;color:#64748b;font-size:13px;padding:6px}html[data-theme="dark"] .fmChecklistMulti,body.dark .fmChecklistMulti{background:#0b1220;border-color:#334155}html[data-theme="dark"] .fmChecklistOpcao,body.dark .fmChecklistOpcao{background:#111827;border-color:#334155;color:#f8fafc}@media(max-width:390px){.fmChecklistMulti{grid-template-columns:1fr}.fmChecklistSem{grid-column:auto}}`;document.head.appendChild(css);

  setInterval(poll,60000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&visivel()&&$('fmForm')?.classList.contains('hidden'))void render(true)});
  window.addEventListener('focus',()=>{if(visivel()&&$('fmForm')?.classList.contains('hidden'))void render(true)});
  document.addEventListener('click',e=>{const fin=e.target.closest('[data-fin]');if(fin){e.preventDefault();e.stopImmediatePropagation();if(fin.dataset.fin==='editar')editar(fin.dataset.id);else if(fin.dataset.fin==='excluir')excluir(fin.dataset.id);return}const b=e.target.closest('button');if(!b)return;const t=(b.textContent||'').trim();if(t==='Financeiro'){e.preventDefault();e.stopImmediatePropagation();open()}},true);
  window.OBRIX_FIN={open,render,editar,excluir,checklists:()=>checklistFinanceiro.slice(),categorias:labels};
  setTimeout(ensure,0);
})();