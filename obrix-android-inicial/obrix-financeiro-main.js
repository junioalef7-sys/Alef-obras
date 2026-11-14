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
      <div id="fmIndicadoresInternos" hidden aria-hidden="true"><span id="fmContrato"></span><span id="fmResultado"></span><span id="fmRecebido"></span><span id="fmDespesas"></span></div>
      <div class="sectionHead"><strong>Lançamentos</strong><div><button class="btn" id="fmReceita">+ Receita</button> <button class="btn" id="fmDespesa">+ Despesa</button></div></div>
<div id="fmForm" class="card form hidden"></div><div id="fmLista"></div>`;
    const equipe=$('equipe');equipe.parentNode.insertBefore(main,equipe.nextSibling);
    $('fmReceita').onclick=()=>form('receita');
    $('fmDespesa').onclick=()=>form('despesa');
  }

  function active(){return (window.financeiro||[]).filter(x=>!x.status_lancamento||x.status_lancamento==='ativo')}
  function valoresChecklist(x){return x?.checklist_valores&&typeof x.checklist_valores==='object'&&!Array.isArray(x.checklist_valores)?x.checklist_valores:{}}
  function idsChecklist(x){
    const vals=valoresChecklist(x),porValor=Object.keys(vals).filter(id=>Number(vals[id]||0)>0);
    if(porValor.length)return porValor;
    return Array.isArray(x?.checklist_ids)&&x.checklist_ids.length?x.checklist_ids.map(String):(x?.checklist_id?[String(x.checklist_id)]:[]);
  }
  function assinaturaValores(v){return Object.entries(v||{}).sort(([a],[b])=>a.localeCompare(b)).map(([k,n])=>`${k}=${Number(n||0)}`).join(',')}
  function signature(rows,extras,checks){
    const a=(rows||[]).map(x=>[x.id,x.atualizado_em,x.status_lancamento,x.valor,x.tipo,x.categoria,x.subcategoria,x.checklist_id,(x.checklist_ids||[]).join(','),assinaturaValores(x.checklist_valores)].join(':')).sort().join('|');
    const b=(extras||[]).map(x=>[x.id,x.atualizado_em,x.valor,x.obra_id].join(':')).sort().join('|');
    const c=(checks||[]).map(x=>[x.id,x.atualizado_em,x.nome,x.obra_id].join(':')).sort().join('|');
    return a+'||'+b+'||'+c;
  }
  async function fetchDados(){
    const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),eid=p.empresa_id;
    const [rows,extras,checks]=await Promise.all([
      sb.from('financeiro').select('id,empresa_id,obra_id,checklist_id,checklist_ids,checklist_valores,tipo,categoria,subcategoria,descricao,valor,data,origem,pagamento_equipe_id,vale_id,compra_id,status_lancamento,criado_em,atualizado_em').eq('empresa_id',eid).order('data',{ascending:false}),
      sb.from('servicos_extras').select('id,obra_id,valor,atualizado_em').eq('empresa_id',eid),
      sb.from('checklist_itens').select('id,obra_id,nome,ordem,atualizado_em').eq('empresa_id',eid).order('ordem',{ascending:true})
    ]);
    [rows,extras,checks].forEach(r=>{if(r.error)throw r.error});
    window.financeiro=rows.data||[];extrasFinanceiro=extras.data||[];checklistFinanceiro=checks.data||[];
    lastSync=signature(window.financeiro,extrasFinanceiro,checklistFinanceiro);return lastSync;
  }
  function atualizarObras(){const sec=document.getElementById('obras');if(!sec||sec.classList.contains('hidden'))return;try{window.OBRIX_OBRAS?.render?.()}catch(_){}}
  function podeExcluir(x){return x.origem==='manual'||!!x.compra_id}
  function podeEstornar(x){return (x.origem==='pagamento_equipe'&&!!x.pagamento_equipe_id)||(x.origem==='vale_equipe'&&!!x.vale_id)}
  function resumoChecklists(x){
    const mapa=new Map(checklistFinanceiro.map(c=>[String(c.id),c.nome||'Etapa'])),vals=valoresChecklist(x);
    return idsChecklist(x).map(id=>{const nome=mapa.get(String(id));if(!nome)return null;const v=Number(vals[id]||0);return v>0?`${nome} (${money(v)})`:nome}).filter(Boolean);
  }

  // Atualização por ID: os cartões já exibidos permanecem no DOM ao registrar
  // receitas e ao chegar o mesmo lançamento por realtime. Não apagar a lista
  // inteira em cada render, pois isto pisca inclusive no computador.
  function atualizarListaEstavel(lista,html){
    if(!lista)return false;
    if(lista.__obrixMarkup===html&&lista.childElementCount>0)return false;
    const modelo=document.createElement('div');modelo.innerHTML=html;
    const antigos=new Map([...lista.children].filter(el=>el.dataset.finCard==='1').map(el=>[el.dataset.id,el]));
    let ponteiro=lista.firstElementChild,mudou=false;
    for(const candidato of [...modelo.children]){
      const chave=candidato.dataset.id||'',fonte=candidato.outerHTML;
      let node=chave?antigos.get(chave):null;
      if(node&&node.__obrixFonte!==fonte){const eraPonteiro=node===ponteiro;node.replaceWith(candidato);node=candidato;if(eraPonteiro)ponteiro=node;mudou=true}
      if(!node){node=candidato;mudou=true}
      node.__obrixFonte=fonte;
      if(node!==ponteiro){lista.insertBefore(node,ponteiro);mudou=true}
      ponteiro=node.nextElementSibling;
    }
    while(ponteiro){const proximo=ponteiro.nextElementSibling;ponteiro.remove();ponteiro=proximo;mudou=true}
    lista.__obrixMarkup=html;
    return mudou;
  }

  function renderLocal(){
    ensure();
    const f=active(),os=window.obras||[];
    const contratoBase=os.reduce((s,o)=>s+Number(o.valor_contrato||0),0),adicionais=extrasFinanceiro.reduce((s,x)=>s+Number(x.valor||0),0),contratoAtualizado=contratoBase+adicionais;
    const rec=f.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),des=f.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0),resultado=contratoAtualizado-des;
    const set=(id,val)=>{const el=$(id);if(el&&el.textContent!==val)el.textContent=val};
    set('fmContrato',money(contratoAtualizado));set('fmRecebido',money(rec));set('fmDespesas',money(des));set('fmResultado',money(resultado));
    const c=$('fmContrato')?.closest('.kpi')?.querySelector('small'),r=$('fmResultado')?.closest('.kpi')?.querySelector('small');if(c&&c.textContent!=='Contrato atualizado')c.textContent='Contrato atualizado';if(r&&r.textContent!=='Resultado da obra')r.textContent='Resultado da obra';
    const lista=$('fmLista');
    const html=f.length?f.slice().sort((a,b)=>{
      // Último registro criado primeiro. A data contábil pode ter sido
      // informada retroativamente e não determina a ordem de lançamento.
      const criadoA=Date.parse(a.criado_em||a.created_at||a.atualizado_em||a.data||'')||0;
      const criadoB=Date.parse(b.criado_em||b.created_at||b.atualizado_em||b.data||'')||0;
      return criadoB-criadoA||String(b.data||'').localeCompare(String(a.data||''));
    }).map(x=>{
      const o=os.find(z=>String(z.id)===String(x.obra_id)),manual=x.origem==='manual',checks=resumoChecklists(x);
      const totalChecks=Object.values(valoresChecklist(x)).reduce((s,v)=>s+Number(v||0),0),sem=Math.max(0,Number(x.valor||0)-totalChecks);
      const checkTxt=checks.length?`Checklists: ${checks.join(', ')}${sem>0?` • Sem checklist: ${money(sem)}`:''}`:'Sem checklist';
      const meta=[o?.nome||'Sem obra',x.data||'',labels[x.categoria]||x.categoria||'',x.subcategoria||'',checkTxt].filter(Boolean);
      return `<div class="card item" data-fin-card="1" data-id="${esc(x.id)}" data-obra="${esc(x.obra_id||'')}" data-tipo="${esc(x.tipo||'')}" data-categoria="${esc(x.categoria||'')}"><h3>${esc(x.descricao||'Lançamento')}</h3><div class="muted">${meta.map(esc).join(' • ')}</div><div class="grid"><div class="mini"><small>${x.tipo==='receita'?'Receita':'Despesa'}</small><b>${money(x.valor)}</b></div></div>${podeExcluir(x)||podeEstornar(x)?`<div class="actions">${manual?`<button type="button" data-fin="editar" data-id="${x.id}">Editar</button>`:''}${podeEstornar(x)?`<button type="button" data-fin="estornar" data-id="${x.id}">Estornar</button>`:`<button type="button" data-fin="excluir" data-id="${x.id}">Excluir</button>`}</div>`:''}</div>`;
    }).join(''):'<div class="card muted">Nenhum lançamento financeiro.</div>';
    // Atualizar somente cartões novos/alterados, preservando os existentes.
    const listaMudou=atualizarListaEstavel(lista,html);
    if(listaMudou)window.OBRIX_FIN_VISUAL?.refresh?.();
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
  function valoresSelecionados(){
    const out={},box=$('fmChecklistMulti');if(!box)return out;
    box.querySelectorAll('[data-check-id]:checked').forEach(ch=>{const inp=box.querySelector(`[data-check-valor="${CSS.escape(ch.value)}"]`),v=Number(inp?.value||0);if(v>0)out[ch.value]=Math.round(v*100)/100});
    return out;
  }
  function valorSemChecklist(){const ch=$('fmSemChecklist'),inp=$('fmSemChecklistValor');return ch?.checked?Math.max(0,Number(inp?.value||0)):0}
  function totalDistribuido(){return Object.values(valoresSelecionados()).reduce((s,v)=>s+Number(v||0),0)+valorSemChecklist()}
  function atualizarResumoDistribuicao(){
    const total=Number($('fmValor')?.value||0),dist=totalDistribuido(),rest=total-dist,box=$('fmChecklistTotal');if(!box)return;
    const ok=total>0&&Math.abs(rest)<0.005;
    box.classList.toggle('fmDistErro',total>0&&!ok);
    box.innerHTML=`<div><span>Total selecionado</span><strong>${money(dist)}</strong></div><div><span>Valor do lançamento</span><strong>${money(total)}</strong></div><div><span>${rest>=-0.004?'Falta distribuir':'Excedeu'}</span><strong>${money(Math.abs(rest))}</strong></div>`;
  }
  function sincronizarLegado(){const sel=$('fmChecklist');if(sel)sel.value=idsSelecionados()[0]||''}
  function ligarLinhaChecklist(box,ch){
    const id=ch.value,inp=box.querySelector(`[data-check-valor="${CSS.escape(id)}"]`);
    const aplicar=()=>{if(inp){inp.disabled=!ch.checked;if(!ch.checked)inp.value=''}sincronizarLegado();atualizarResumoDistribuicao()};
    ch.addEventListener('change',aplicar);inp?.addEventListener('input',atualizarResumoDistribuicao);aplicar();
  }
  function atualizarChecklistForm(x=null){
    const box=$('fmChecklistMulti'),sel=$('fmChecklist'),obra=$('fmObra')?.value||'';if(!box||!sel)return;
    const vals=valoresChecklist(x),ids=new Set(idsChecklist(x)),total=Number($('fmValor')?.value||x?.valor||0),totalChecks=Object.values(vals).reduce((s,v)=>s+Number(v||0),0),semInicial=Math.max(0,total-totalChecks),semMarcado=semInicial>0||ids.size===0;
    if(!obra){box.innerHTML='<div class="fmChecklistAviso">Selecione uma obra primeiro.</div>';sel.innerHTML='<option value="">Sem checklist</option>';sel.value='';atualizarResumoDistribuicao();return}
    const xs=checklistFinanceiro.filter(c=>String(c.obra_id)===String(obra)).sort((a,b)=>Number(a.ordem||0)-Number(b.ordem||0));
    sel.innerHTML='<option value="">Sem checklist</option>'+xs.map(c=>`<option value="${esc(c.id)}">${esc(c.nome||'Etapa')}</option>`).join('');
    box.innerHTML=`<div class="fmChecklistLinha fmChecklistSem"><label><input id="fmSemChecklist" type="checkbox" ${semMarcado?'checked':''}><span>Sem checklist</span></label><input id="fmSemChecklistValor" class="fmChecklistValor" type="number" min="0" step="0.01" inputmode="decimal" placeholder="R$ 0,00" value="${semMarcado&&semInicial>0?semInicial.toFixed(2):''}"></div>`+
      (xs.length?xs.map(c=>`<div class="fmChecklistLinha"><label><input type="checkbox" data-check-id value="${esc(c.id)}" ${ids.has(String(c.id))?'checked':''}><span>${esc(c.nome||'Etapa')}</span></label><input class="fmChecklistValor" data-check-valor="${esc(c.id)}" type="number" min="0" step="0.01" inputmode="decimal" placeholder="R$ 0,00" value="${Number(vals[c.id]||0)>0?Number(vals[c.id]).toFixed(2):''}"></div>`).join(''):'<div class="fmChecklistAviso">Nenhum checklist cadastrado para esta obra.</div>');
    const sem=$('fmSemChecklist'),semInp=$('fmSemChecklistValor');
    const aplicarSem=()=>{if(semInp){semInp.disabled=!sem?.checked;if(!sem?.checked)semInp.value=''}atualizarResumoDistribuicao()};
    sem?.addEventListener('change',aplicarSem);semInp?.addEventListener('input',atualizarResumoDistribuicao);aplicarSem();
    box.querySelectorAll('[data-check-id]').forEach(ch=>ligarLinhaChecklist(box,ch));
    sincronizarLegado();atualizarResumoDistribuicao();
  }

  // Source the work selector directly from Supabase. On first login the global
  // work list may not have loaded yet, causing "Sem obra vinculada" only.
  let obrasOpcoesCache=null,obrasOpcoesConsulta=0,obrasOpcoesPromise=null;
  async function consultarObrasParaSelecionar(){
    if(obrasOpcoesCache&&Date.now()-obrasOpcoesConsulta<60000)return obrasOpcoesCache;
    if(obrasOpcoesPromise)return obrasOpcoesPromise;
    obrasOpcoesPromise=(async()=>{
      const locais=Array.isArray(window.obras)?window.obras.filter(o=>o?.id&&o.status==='andamento'):[];
      try{
        const [sb,p]=await Promise.all([OBRIX_BACKEND.init(),OBRIX_BACKEND.profile()]);
        if(!p?.empresa_id)throw new Error('Empresa não identificada.');
        const q=await sb.from('obras').select('id,nome,status').eq('empresa_id',p.empresa_id).eq('status','andamento').order('nome',{ascending:true});
        if(q.error)throw q.error;
        obrasOpcoesCache=(q.data||[]).filter(o=>o?.id);
        obrasOpcoesConsulta=Date.now();
        return obrasOpcoesCache;
      }catch(e){
        if(locais.length){obrasOpcoesCache=locais;obrasOpcoesConsulta=Date.now()-45000;return locais}
        throw e;
      }
    })();
    try{return await obrasOpcoesPromise}finally{obrasOpcoesPromise=null}
  }
  async function carregarObrasParaLancamento(select,obraOriginal=''){
    if(!select||!select.isConnected)return;
    const initial=String(obraOriginal||'');
    select.dataset.obrixObrasStatus='carregando';
    try{
      const items=await consultarObrasParaSelecionar();
      if(!select.isConnected||$('fmObra')!==select)return;
      const completos=[...items];if(initial&&!completos.some(o=>String(o.id)===initial)){const antiga=(window.obras||[]).find(o=>String(o.id)===initial);if(antiga)completos.push(antiga)}
      const novos=[{id:'',nome:'Selecione uma obra em andamento'},...completos.map(o=>({id:String(o.id),nome:String(o.nome||'Obra')}))];
      const aplicar=()=>{
        if(!select.isConnected||$('fmObra')!==select)return;
        const anterior=String(select.value||initial);
        const iguais=select.options.length===novos.length&&
          novos.every((o,i)=>select.options[i]?.value===o.id&&select.options[i]?.text===o.nome);
        if(!iguais){
          select.replaceChildren(...novos.map(o=>new Option(o.nome,o.id)));
          select.value=novos.some(o=>o.id===anterior)?anterior:'';
        }
        select.dataset.obrixObrasStatus='pronto';
        select.disabled=false;
        if(select.value!==anterior)atualizarChecklistForm(null);
      };
      // Não desmontar o select enquanto o menu nativo está aberto.
      if(document.activeElement===select&&select.options.length>1){
        select.dataset.obrixObrasStatus='pronto';
        select.addEventListener('blur',aplicar,{once:true});
      }else aplicar();
    }catch(e){
      if(!select.isConnected||$('fmObra')!==select)return;
      select.dataset.obrixObrasStatus='erro';
      select.disabled=false;
      console.warn('Financeiro: não foi possível carregar obras para o lançamento',e);
      if(select.options.length<=1){
        const opt=new Option('Não foi possível carregar obras — toque para tentar novamente','');
        opt.disabled=true;select.add(opt);
      }
    }
  }
  function form(tipo,x){
    ensure();salvando=false;
    const cats=tipo==='receita'?[['entrada','Entrada']]:Object.entries(labels).filter(([k])=>k!=='entrada'),box=$('fmForm');
    box.innerHTML=`<h3>${x?'Editar':'Novo'} ${tipo==='receita'?'receita':'despesa'}</h3>
      <label>Obra</label><select id="fmObra"><option value="">Selecione uma obra em andamento</option>${(obrasOpcoesCache||window.obras||[]).filter(o=>o.status==='andamento'||(x?.obra_id&&String(o.id)===String(x.obra_id))).map(o=>`<option value="${o.id}" ${String(x?.obra_id||'')===String(o.id)?'selected':''}>${esc(o.nome)}</option>`).join('')}</select>
      <label>Categoria</label><select id="fmCat">${cats.map(([v,l])=>`<option value="${v}" ${x?.categoria===v?'selected':''}>${esc(l)}</option>`).join('')}</select>
      <label>Subcategoria</label><input id="fmSubcat" list="fmSubLista" placeholder="Ex.: Areia / brita, Parcela, Frete..." value="${esc(x?.subcategoria||'')}"><datalist id="fmSubLista"></datalist>
      <label>Descrição</label><input id="fmDesc" placeholder="Descrição" value="${esc(x?.descricao||'')}">
      <label>Valor total do lançamento</label><input id="fmValor" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Valor" value="${x?.valor||''}">
      <label>Checklist / etapa — distribua o valor entre um ou mais</label><select id="fmChecklist" class="hidden" aria-hidden="true"><option value="">Sem checklist</option></select><div id="fmChecklistMulti" class="fmChecklistMulti"></div><div id="fmChecklistTotal" class="fmChecklistTotal"></div>
      <label for="fmData">Data</label><div class="fmDateFrame"><span id="fmDataTexto" class="fmDateTexto" aria-hidden="true"></span><input id="fmData" type="date" aria-label="Data do lançamento" value="${x?.data||new Date().toISOString().slice(0,10)}"></div>
      <div class="formActions"><button type="button" class="btn" id="fmSalvar">Salvar</button><button type="button" class="btn" id="fmCancelar">Cancelar</button></div>`;
    box.classList.remove('hidden');
    // Apresentação independente do WebKit; o input nativo continua recebendo os toques.
    const dataCampo=$('fmData'),dataTexto=$('fmDataTexto');
    const atualizarTextoData=()=>{
      if(!dataTexto)return;
      const partes=/^(\d{4})-(\d{2})-(\d{2})$/.exec(dataCampo?.value||'');
      dataTexto.textContent=partes
        ?new Date(Number(partes[1]),Number(partes[2])-1,Number(partes[3])).toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'})
        :'Selecione uma data';
    };
    dataCampo?.addEventListener('input',atualizarTextoData);
    dataCampo?.addEventListener('change',atualizarTextoData);
    atualizarTextoData();
    atualizarSubSugestoes();atualizarChecklistForm(x||null);
    $('fmCat').onchange=atualizarSubSugestoes;
    $('fmObra').onchange=()=>atualizarChecklistForm(null);
    const escolhaObra=$('fmObra');
    escolhaObra?.addEventListener('focus',()=>{if(escolhaObra.dataset.obrixObrasStatus==='erro')void carregarObrasParaLancamento(escolhaObra,x?.obra_id||'')});
    void carregarObrasParaLancamento(escolhaObra,x?.obra_id||'');
    $('fmValor').addEventListener('input',()=>{const sem=$('fmSemChecklist'),semInp=$('fmSemChecklistValor'),algum=idsSelecionados().length>0;if(sem?.checked&&!algum&&semInp)semInp.value=Number($('fmValor').value||0)>0?Number($('fmValor').value).toFixed(2):'';atualizarResumoDistribuicao()});
    $('fmCancelar').onclick=()=>{if(!salvando)box.classList.add('hidden')};
    $('fmSalvar').onclick=()=>save(tipo,x?.id);
    requestAnimationFrame(()=>box.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  async function save(tipo,id){
    if(salvando)return;
    const valor=Number($('fmValor')?.value||0),descricao=$('fmDesc')?.value.trim()||'';if(!descricao||valor<=0)return alert('Informe descrição e valor maior que zero.');
    const ids=idsSelecionados(),valores=valoresSelecionados(),sem=valorSemChecklist(),dist=Object.values(valores).reduce((s,v)=>s+Number(v||0),0)+sem;
    if(ids.some(id=>Number(valores[id]||0)<=0))return alert('Informe um valor maior que zero para cada checklist selecionado.');
    if(Math.abs(dist-valor)>=0.005)return alert(`Distribua todo o valor do lançamento. Total selecionado: ${money(dist)}. Valor do lançamento: ${money(valor)}.`);
    const btn=$('fmSalvar');salvando=true;if(btn){btn.disabled=true;btn.textContent='Salvando...'}
    try{
      const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),empresaId=p.empresa_id;
      const obraSelecionada=$('fmObra')?.value||'';
      if(!obraSelecionada)throw Error('Selecione uma obra em andamento.');
      if(!id){
        const obraAtual=await sb.from('obras').select('status').eq('empresa_id',empresaId).eq('id',obraSelecionada).maybeSingle();
        if(obraAtual.error)throw obraAtual.error;
        if(obraAtual.data?.status!=='andamento')throw Error('Só é permitido registrar lançamentos em obras em andamento.');
      }
      const payload={obra_id:obraSelecionada,checklist_id:ids[0]||null,checklist_ids:ids,checklist_valores:valores,tipo,categoria:$('fmCat')?.value||'outros',subcategoria:$('fmSubcat')?.value.trim()||null,descricao,valor,data:$('fmData')?.value,origem:'manual',status_lancamento:'ativo',atualizado_em:new Date().toISOString()};
      const q=id?await sb.from('financeiro').update(payload).eq('id',id).eq('empresa_id',empresaId).eq('origem','manual').select('*').single():await sb.from('financeiro').insert({...payload,empresa_id:empresaId}).select('*').single();
      if(q.error)throw q.error;
      const atual=Array.isArray(window.financeiro)?window.financeiro.slice():[],idx=atual.findIndex(z=>String(z.id)===String(q.data.id));if(idx>=0)atual[idx]=q.data;else atual.unshift(q.data);window.financeiro=atual;
      $('fmForm').classList.add('hidden');renderLocal();window.OBRIX_DASH?.paint?.();
      window.OBRIX_SUCESSO?.(id?(tipo==='receita'?'Receita atualizada com sucesso.':'Despesa atualizada com sucesso.'):(tipo==='receita'?'Receita registrada com sucesso.':'Despesa registrada com sucesso.'));
    }catch(e){alert(e.message||'Erro ao salvar lançamento')}finally{salvando=false;if(btn){btn.disabled=false;btn.textContent='Salvar'}}
  }

  function confirmarExclusaoFinanceiro(){
    return new Promise(resolve=>{
      const overlay=document.createElement('div');
      overlay.className='obrixFinExcluirOverlay';
      overlay.style.cssText='position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(4,12,22,.62);box-sizing:border-box';
      overlay.innerHTML='<div role="dialog" aria-modal="true" aria-labelledby="obrixFinExcluirTitulo" style="width:min(100%,410px);border:1px solid var(--ob-border,#cbd5e1);border-radius:18px;padding:22px;background:var(--ob-surface,#fff);color:var(--ob-text,#111827);box-shadow:0 16px 55px rgba(0,0,0,.25)">'+
        '<h2 id="obrixFinExcluirTitulo" style="font-size:21px;line-height:1.3;margin:0 0 10px">Excluir este lançamento?</h2>'+
        '<p style="margin:0 0 20px;line-height:1.5;color:var(--ob-muted,#526173)">Esta ação não pode ser desfeita.</p>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        '<button type="button" data-cancelar style="min-height:47px;padding:11px;border:1px solid var(--ob-border,#cbd5e1);border-radius:11px;background:var(--ob-surface-2,#e5eaf0);color:var(--ob-text,#111827);font-size:15px;font-weight:800">Cancelar</button>'+
        '<button type="button" data-confirmar style="min-height:47px;padding:11px;border:1px solid #b91c1c;border-radius:11px;background:#b91c1c;color:#fff;-webkit-text-fill-color:#fff;font-size:15px;font-weight:800">Excluir</button></div></div>';
      const prior=document.activeElement;
      let done=false;
      const finish=value=>{
        if(done)return;
        done=true;
        document.removeEventListener('keydown',onKey);
        overlay.remove();
        if(prior&&typeof prior.focus==='function'&&prior.isConnected)prior.focus();
        resolve(value);
      };
      const onKey=e=>{if(e.key==='Escape'){e.preventDefault();finish(false)}};
      overlay.addEventListener('click',e=>{if(e.target===overlay)finish(false)});
      overlay.querySelector('[data-cancelar]').onclick=()=>finish(false);
      overlay.querySelector('[data-confirmar]').onclick=()=>finish(true);
      document.body.appendChild(overlay);
      document.addEventListener('keydown',onKey);
      overlay.querySelector('[data-cancelar]').focus();
    });
  }
async function estornarAutomatico(id){
 const x=(window.financeiro||[]).find(z=>String(z.id)===String(id));
 if(!x||!podeEstornar(x))return alert('Este lançamento não permite estorno por aqui.');
 if(!navigator.onLine)return alert('É necessário estar conectado para estornar com segurança.');
 const ehPagamento=x.origem==='pagamento_equipe';
 if(typeof window.OBRIX_CONFIRMAR_EXCLUSAO!=='function')
   return alert('Confirmação indisponível. Atualize o aplicativo.');
 const ok=await window.OBRIX_CONFIRMAR_EXCLUSAO({
   titulo:ehPagamento?'Estornar pagamento de equipe':'Estornar vale da equipe',
   mensagem:ehPagamento
     ?'Estornar este pagamento? As diárias, os vales e os bônus vinculados voltarão às pendências. O Financeiro manterá o registro como estornado.'
     :'Estornar este vale? Ele deixará de contar nas pendências e a despesa ficará registrada como estornada. Se o vale pertence a um pagamento ativo, estorne primeiro esse pagamento.',
   confirmar:'Estornar',cancelar:'Cancelar'
 });
 if(!ok)return;
 const btn=$('fmLista')?.querySelector('[data-fin="estornar"][data-id="'+CSS.escape(String(id))+'"]');
 if(btn){btn.disabled=true;btn.textContent='Estornando...'}
 try{
   const sb=await OBRIX_BACKEND.init();
   const args=ehPagamento
     ?{p_pagamento_id:x.pagamento_equipe_id,p_motivo:'Estornado pelo Financeiro do OBRIX'}
     :{p_vale_id:x.vale_id,p_motivo:'Estornado pelo Financeiro do OBRIX'};
   const func=ehPagamento?'obrix_estornar_pagamento_equipe':'obrix_estornar_vale_equipe';
   const result=await sb.rpc(func,args);
   if(result.error)throw result.error;
   if(result.data?.ok!==true)throw Error('O servidor não confirmou o estorno.');
   try{await window.OBRIX_EQUIPE?.refresh?.({force:true,financeiro:true})}catch(e){console.warn('Equipe após estorno',e)}
   await render(true);
   window.OBRIX_DASH?.paint?.();
 }catch(e){
   alert(e?.message||'Não foi possível estornar o lançamento.');
 }finally{
   if(btn?.isConnected){btn.disabled=false;btn.textContent='Estornar'}
 }
}
  async function excluir(id){
    const x=(window.financeiro||[]).find(z=>String(z.id)===String(id));if(!x||!podeExcluir(x))return alert('Este lançamento não pode ser excluído por aqui.');
    if(!await confirmarExclusaoFinanceiro())return;
    try{const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),q=await sb.from('financeiro').delete().eq('id',id).eq('empresa_id',p.empresa_id);if(q.error)throw q.error;window.financeiro=(window.financeiro||[]).filter(z=>String(z.id)!==String(id));renderLocal();window.OBRIX_DASH?.paint?.();window.OBRIX_SUCESSO?.(x.tipo==='receita'?'Receita excluída com sucesso.':'Despesa excluída com sucesso.')}catch(e){alert(e.message||'Erro ao excluir lançamento')}
  }
  function editar(id){const x=(window.financeiro||[]).find(z=>String(z.id)===String(id));if(!x)return alert('Lançamento não encontrado. Atualize o Financeiro e tente novamente.');form(x.tipo,x)}
  function visivel(){const x=$('financeiroMain');return !!x&&!x.classList.contains('hidden')}
  function open(){ensure();void consultarObrasParaSelecionar().catch(e=>console.warn('Obras disponíveis: pré-carregamento adiado',e));['inicio','obras','equipe'].forEach(id=>$(id)?.classList.add('hidden'));$('estoqueMain')?.classList.add('hidden');$('menuMain')?.classList.add('hidden');$('financeiroMain').classList.remove('hidden');$('bInicio')?.classList.remove('active');$('bEquipe')?.classList.remove('active');renderLocal();void render(true);void startRealtime();scrollTo({top:0,behavior:'smooth'})}
  async function startRealtime(){
    // A camada de sincronização principal já observa financeiro,
    // serviços extras e checklist. Evitar canal redundante por tela.
    if(window.__OBRIX_CORRECOES_REAIS_20261102)return;
    if(realtime)return;try{const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),filtro=`empresa_id=eq.${p.empresa_id}`,agendar=()=>{clearTimeout(realtimeTimer);realtimeTimer=setTimeout(()=>{if(visivel()&&$('fmForm')?.classList.contains('hidden'))render(true)},250)};realtime=sb.channel('obrix-financeiro-sync-'+p.empresa_id).on('postgres_changes',{event:'*',schema:'public',table:'financeiro',filter:filtro},agendar).on('postgres_changes',{event:'*',schema:'public',table:'servicos_extras',filter:filtro},agendar).on('postgres_changes',{event:'*',schema:'public',table:'checklist_itens',filter:filtro},agendar).subscribe()}catch(e){console.warn('Financeiro realtime indisponível',e)}
  }
  async function poll(){if(polling||document.visibilityState!=='visible'||!visivel()||!$('fmForm')?.classList.contains('hidden'))return;polling=true;try{const before=lastSync;await fetchDados();if(lastSync!==before)renderLocal()}catch(_){}finally{polling=false}}

  const css=document.createElement('style');css.textContent=`
    #fmForm label{display:block;font-weight:800;margin:6px 0 2px}#fmForm select:disabled{opacity:.65}
    .fmChecklistMulti{display:grid;gap:8px;margin:6px 0 8px;padding:10px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc}
    .fmChecklistLinha{display:grid;grid-template-columns:minmax(0,1fr) 130px;gap:10px;align-items:center;padding:9px 10px;border:1px solid #e2e8f0;border-radius:10px;background:#fff}
    .fmChecklistLinha>label{display:flex!important;align-items:center;gap:8px;margin:0!important;min-width:0}.fmChecklistLinha>label span{overflow-wrap:anywhere}.fmChecklistLinha input[type="checkbox"]{width:20px!important;height:20px!important;margin:0!important;flex:0 0 auto}
    .fmChecklistValor{width:100%!important;margin:0!important;padding:10px!important;text-align:right;font-weight:800}.fmChecklistValor:disabled{opacity:.5;background:#f1f5f9}
    .fmChecklistAviso{color:#64748b;font-size:13px;padding:6px}.fmChecklistTotal{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px}.fmChecklistTotal>div{border:1px solid #e2e8f0;border-radius:10px;padding:9px;background:#fff}.fmChecklistTotal span{display:block;color:#64748b;font-size:11px;font-weight:800}.fmChecklistTotal strong{display:block;margin-top:3px;font-size:14px}.fmChecklistTotal.fmDistErro>div:last-child{border-color:#fca5a5;background:#fff1f2;color:#991b1b}
    html[data-theme="dark"] .fmChecklistMulti,body.dark .fmChecklistMulti{background:#0b1220;border-color:#334155}html[data-theme="dark"] .fmChecklistLinha,body.dark .fmChecklistLinha,html[data-theme="dark"] .fmChecklistTotal>div,body.dark .fmChecklistTotal>div{background:#111827;border-color:#334155;color:#f8fafc}html[data-theme="dark"] .fmChecklistValor:disabled,body.dark .fmChecklistValor:disabled{background:#0f172a}
/* Ao exibir "Falta distribuir", a regra antiga era mais especifica que o tema
   escuro; preservamos a semantica de erro, mas com cores legiveis. */
html[data-theme="dark"] #fmChecklistTotal.fmDistErro>div:last-child,
body.dark #fmChecklistTotal.fmDistErro>div:last-child{background:#381b28!important;background-color:#381b28!important;border-color:#b85b70!important;color:#ffe4e6!important}
html[data-theme="dark"] #fmChecklistTotal.fmDistErro>div:last-child span,
html[data-theme="dark"] #fmChecklistTotal.fmDistErro>div:last-child strong,
body.dark #fmChecklistTotal.fmDistErro>div:last-child span,
body.dark #fmChecklistTotal.fmDistErro>div:last-child strong{color:#ffe4e6!important;-webkit-text-fill-color:#ffe4e6!important}
html[data-theme="dark"] #fmChecklistTotal>div span,body.dark #fmChecklistTotal>div span{color:#cbd5e1!important;-webkit-text-fill-color:#cbd5e1!important}
html[data-theme="light"] #fmChecklistTotal.fmDistErro>div:last-child span,
html[data-theme="light"] #fmChecklistTotal.fmDistErro>div:last-child strong{color:#7f1d1d!important;-webkit-text-fill-color:#7f1d1d!important}

    @media(max-width:520px){.fmChecklistLinha{grid-template-columns:minmax(0,1fr) 112px}.fmChecklistTotal{grid-template-columns:1fr 1fr}.fmChecklistTotal>div:last-child{grid-column:1/-1}}
  `;document.head.appendChild(css);

  setInterval(poll,60000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&visivel()&&$('fmForm')?.classList.contains('hidden'))void render(true)});
  window.addEventListener('focus',()=>{if(visivel()&&$('fmForm')?.classList.contains('hidden'))void render(true)});
  document.addEventListener('click',e=>{const fin=e.target.closest('[data-fin]');if(fin){e.preventDefault();e.stopImmediatePropagation();if(fin.dataset.fin==='editar')editar(fin.dataset.id);else if(fin.dataset.fin==='excluir')excluir(fin.dataset.id);else if(fin.dataset.fin==='estornar')void estornarAutomatico(fin.dataset.id);return}const b=e.target.closest('button');if(!b)return;const t=(b.textContent||'').trim();if(t==='Financeiro'){e.preventDefault();e.stopImmediatePropagation();open()}},true);
  window.OBRIX_FIN={open,render,editar,excluir,checklists:()=>checklistFinanceiro.slice(),categorias:labels};
  setTimeout(ensure,0);

})();