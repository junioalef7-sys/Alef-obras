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

  let salvando=false,realtime=null,realtimeTimer=null,polling=false,lastSync='',extrasFinanceiro=[],checklistFinanceiro=[];

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
  function signature(rows,extras,checks){
    const a=(rows||[]).map(x=>[x.id,x.atualizado_em,x.status_lancamento,x.valor,x.tipo,x.categoria,x.subcategoria,x.checklist_id].join(':')).sort().join('|');
    const b=(extras||[]).map(x=>[x.id,x.atualizado_em,x.valor,x.obra_id].join(':')).sort().join('|');
    const c=(checks||[]).map(x=>[x.id,x.atualizado_em,x.nome,x.obra_id].join(':')).sort().join('|');
    return a+'||'+b+'||'+c;
  }
  async function fetchDados(){
    const [rows,extras,checks]=await Promise.all([
      OBRIX_BACKEND.readTable('financeiro','data'),
      OBRIX_BACKEND.readTable('servicos_extras','criado_em'),
      OBRIX_BACKEND.readTable('checklist_itens','ordem')
    ]);
    window.financeiro=rows||[];extrasFinanceiro=extras||[];checklistFinanceiro=checks||[];
    lastSync=signature(rows,extras,checks);return lastSync;
  }
  function atualizarObras(){try{window.OBRIX_OBRAS?.render()}catch(_){}}
  function podeExcluir(x){return x.origem==='manual'||!!x.pagamento_equipe_id||!!x.compra_id}
  function nomeChecklist(id){return checklistFinanceiro.find(c=>String(c.id)===String(id))?.nome||''}

  async function render(){
    ensure();try{await fetchDados()}catch(_){}
    const f=active(),os=window.obras||[];
    const contratoBase=os.reduce((s,o)=>s+Number(o.valor_contrato||0),0),adicionais=extrasFinanceiro.reduce((s,x)=>s+Number(x.valor||0),0),contratoAtualizado=contratoBase+adicionais;
    const rec=f.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),des=f.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0),resultado=contratoAtualizado-des;
    const set=(id,val)=>{const el=$(id);if(el&&el.textContent!==val)el.textContent=val};
    set('fmContrato',money(contratoAtualizado));set('fmRecebido',money(rec));set('fmDespesas',money(des));set('fmResultado',money(resultado));
    const c=$('fmContrato')?.closest('.kpi')?.querySelector('small'),r=$('fmResultado')?.closest('.kpi')?.querySelector('small');if(c)c.textContent='Contrato atualizado';if(r)r.textContent='Resultado da obra';
    const lista=$('fmLista');
    const html=f.length?f.slice().sort((a,b)=>String(b.data).localeCompare(String(a.data))).map(x=>{
      const o=os.find(z=>String(z.id)===String(x.obra_id)),manual=x.origem==='manual',check=nomeChecklist(x.checklist_id);
      const meta=[o?.nome||'Sem obra',x.data||'',labels[x.categoria]||x.categoria||'',x.subcategoria||'',check?`Checklist: ${check}`:''].filter(Boolean);
      return `<div class="card item" data-fin-card="1" data-id="${esc(x.id)}" data-obra="${esc(x.obra_id||'')}" data-tipo="${esc(x.tipo||'')}" data-categoria="${esc(x.categoria||'')}" data-subcategoria="${esc(x.subcategoria||'')}" data-checklist="${esc(x.checklist_id||'')}"><h3>${esc(x.descricao||'Lançamento')}</h3><div class="muted">${meta.map(esc).join(' • ')}</div><div class="grid"><div class="mini"><small>${x.tipo==='receita'?'Receita':'Despesa'}</small><b>${money(x.valor)}</b></div></div>${podeExcluir(x)?`<div class="actions">${manual?`<button type="button" data-fin="editar" data-id="${x.id}">Editar</button>`:''}<button type="button" data-fin="excluir" data-id="${x.id}">Excluir</button></div>`:''}</div>`;
    }).join(''):'<div class="card muted">Nenhum lançamento financeiro.</div>';
    if(lista&&lista.innerHTML!==html)lista.innerHTML=html;
    atualizarObras();window.OBRIX_FIN_BUSCA?.refreshOptions?.();window.OBRIX_FIN_BUSCA?.aplicar?.();
  }

  function checklistOptions(obraId,selected=''){
    if(!obraId)return '<option value="">Selecione uma obra primeiro</option>';
    const xs=checklistFinanceiro.filter(c=>String(c.obra_id)===String(obraId)).sort((a,b)=>Number(a.ordem||0)-Number(b.ordem||0));
    return '<option value="">Sem checklist</option>'+xs.map(c=>`<option value="${esc(c.id)}" ${String(selected)===String(c.id)?'selected':''}>${esc(c.nome||'Etapa')}</option>`).join('');
  }
  function atualizarSubSugestoes(){
    const cat=$('fmCat')?.value||'outros',dl=$('fmSubLista');if(!dl)return;dl.innerHTML=(subSugestoes[cat]||subSugestoes.outros).map(x=>`<option value="${esc(x)}"></option>`).join('');
  }
  function atualizarChecklistForm(selected=''){
    const sel=$('fmChecklist'),obra=$('fmObra')?.value||'';if(!sel)return;sel.innerHTML=checklistOptions(obra,selected);sel.disabled=!obra;
  }

  function form(tipo,x){
    ensure();salvando=false;
    const cats=tipo==='receita'?[['entrada','Entrada']]:Object.entries(labels).filter(([k])=>k!=='entrada'),box=$('fmForm');
    box.innerHTML=`<h3>${x?'Editar':'Novo'} ${tipo==='receita'?'receita':'despesa'}</h3>
      <label>Obra</label><select id="fmObra"><option value="">Sem obra vinculada</option>${(window.obras||[]).map(o=>`<option value="${o.id}" ${String(x?.obra_id||'')===String(o.id)?'selected':''}>${esc(o.nome)}</option>`).join('')}</select>
      <label>Categoria</label><select id="fmCat">${cats.map(([v,l])=>`<option value="${v}" ${x?.categoria===v?'selected':''}>${esc(l)}</option>`).join('')}</select>
      <label>Subcategoria</label><input id="fmSubcat" list="fmSubLista" placeholder="Ex.: Areia / brita, Parcela, Frete..." value="${esc(x?.subcategoria||'')}"><datalist id="fmSubLista"></datalist>
      <label>Checklist / etapa</label><select id="fmChecklist"></select>
      <label>Descrição</label><input id="fmDesc" placeholder="Descrição" value="${esc(x?.descricao||'')}">
      <label>Valor</label><input id="fmValor" type="number" step="0.01" placeholder="Valor" value="${x?.valor||''}">
      <label>Data</label><input id="fmData" type="date" value="${x?.data||new Date().toISOString().slice(0,10)}">
      <div class="formActions"><button type="button" class="btn" id="fmSalvar">Salvar</button><button type="button" class="btn" id="fmCancelar">Cancelar</button></div>`;
    box.classList.remove('hidden');
    atualizarSubSugestoes();atualizarChecklistForm(x?.checklist_id||'');
    $('fmCat').onchange=atualizarSubSugestoes;
    $('fmObra').onchange=()=>atualizarChecklistForm('');
    $('fmCancelar').onclick=()=>{if(!salvando)box.classList.add('hidden')};
    $('fmSalvar').onclick=()=>save(tipo,x?.id);
    requestAnimationFrame(()=>box.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  async function save(tipo,id){
    if(salvando)return;
    const valor=Number($('fmValor').value||0),descricao=$('fmDesc').value.trim();if(!descricao||valor<=0)return alert('Informe descrição e valor maior que zero.');
    const btn=$('fmSalvar');salvando=true;if(btn){btn.disabled=true;btn.textContent='Salvando...'}
    try{
      const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile?.(),empresaId=p?.empresa_id||profile?.empresa_id;
      const payload={obra_id:$('fmObra').value||null,checklist_id:$('fmChecklist').value||null,tipo,categoria:$('fmCat').value,subcategoria:$('fmSubcat').value.trim()||null,descricao,valor,data:$('fmData').value,origem:'manual',status_lancamento:'ativo',atualizado_em:new Date().toISOString()};
      const q=id?await sb.from('financeiro').update(payload).eq('id',id).eq('empresa_id',empresaId).eq('origem','manual'):await sb.from('financeiro').insert({...payload,empresa_id:empresaId});
      if(q.error)throw q.error;$('fmForm').classList.add('hidden');await render();
    }catch(e){salvando=false;if(btn){btn.disabled=false;btn.textContent='Salvar'}alert(e.message||'Erro ao salvar lançamento')}
  }

  async function excluir(id){
    const x=(window.financeiro||[]).find(z=>String(z.id)===String(id));if(!x||!podeExcluir(x))return alert('Este lançamento não pode ser excluído por aqui.');
    const origem=x.pagamento_equipe_id?'lançamento financeiro do pagamento da equipe':x.compra_id?'lançamento financeiro da compra do estoque':'lançamento';if(!confirm(`Excluir este ${origem}?`))return;
    try{const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile?.(),q=await sb.from('financeiro').delete().eq('id',id).eq('empresa_id',p?.empresa_id||profile?.empresa_id);if(q.error)throw q.error;await render();atualizarObras()}catch(e){alert(e.message||'Erro ao excluir lançamento')}
  }
  function editar(id){const x=(window.financeiro||[]).find(z=>String(z.id)===String(id));if(!x)return alert('Lançamento não encontrado. Atualize o Financeiro e tente novamente.');form(x.tipo,x)}
  function open(){ensure();['inicio','obras','equipe'].forEach(id=>$(id)?.classList.add('hidden'));$('estoqueMain')?.classList.add('hidden');$('menuMain')?.classList.add('hidden');$('financeiroMain').classList.remove('hidden');$('bInicio')?.classList.remove('active');$('bEquipe')?.classList.remove('active');render();scrollTo({top:0,behavior:'smooth'})}
  async function startRealtime(){
    if(realtime)return;try{const sb=await OBRIX_BACKEND.init(),agendar=()=>{clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>{if($('fmForm')?.classList.contains('hidden'))render()},120)};realtime=sb.channel('obrix-financeiro-sync').on('postgres_changes',{event:'*',schema:'public',table:'financeiro'},agendar).on('postgres_changes',{event:'*',schema:'public',table:'servicos_extras'},agendar).on('postgres_changes',{event:'*',schema:'public',table:'checklist_itens'},agendar).subscribe()}catch(e){console.warn('Financeiro realtime indisponível',e)}
  }
  async function poll(){if(polling||document.visibilityState!=='visible')return;const box=$('financeiroMain');if(!box||box.classList.contains('hidden')||!$('fmForm')?.classList.contains('hidden'))return;polling=true;try{const before=lastSync;await fetchDados();if(lastSync!==before){await render();atualizarObras()}}catch(_){}finally{polling=false}}

  const css=document.createElement('style');
  css.textContent=`#fmForm label{display:block;font-weight:800;margin:6px 0 2px}#fmForm select:disabled{opacity:.65}`;
  document.head.appendChild(css);

  setInterval(poll,2500);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&$('fmForm')?.classList.contains('hidden'))render()});
  window.addEventListener('focus',()=>{if($('fmForm')?.classList.contains('hidden'))render()});window.addEventListener('pageshow',()=>render());
  document.addEventListener('click',e=>{const fin=e.target.closest('[data-fin]');if(fin){e.preventDefault();e.stopImmediatePropagation();if(fin.dataset.fin==='editar')editar(fin.dataset.id);else if(fin.dataset.fin==='excluir')excluir(fin.dataset.id);return}const b=e.target.closest('button');if(!b)return;const t=(b.textContent||'').trim();if(t==='Financeiro'){e.preventDefault();e.stopImmediatePropagation();open()}},true);
  window.OBRIX_FIN={open,render,editar,excluir,checklists:()=>checklistFinanceiro.slice(),categorias:labels};
  setTimeout(()=>{ensure();startRealtime()},0);
})();