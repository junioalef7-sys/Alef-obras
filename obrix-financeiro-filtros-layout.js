(()=>{
  'use strict';
  if(window.__OBRIX_FIN_FILTROS_LAYOUT)return;
  window.__OBRIX_FIN_FILTROS_LAYOUT=true;

  let editandoId=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rows=()=>Array.isArray(window.financeiro)?window.financeiro:[];
  const checks=()=>window.OBRIX_FIN?.checklists?.()||[];

  function linhaAtual(){
    if(editandoId){
      const achou=rows().find(x=>String(x.id)===String(editandoId));
      if(achou)return achou;
    }
    const box=document.getElementById('fmForm');
    if(!box||!/^Editar\b/i.test(box.querySelector('h3')?.textContent||''))return null;
    const obra=document.getElementById('fmObra')?.value||'';
    const categoria=document.getElementById('fmCat')?.value||'';
    const subcategoria=document.getElementById('fmSubcat')?.value.trim()||'';
    const descricao=document.getElementById('fmDesc')?.value.trim()||'';
    const valor=Number(document.getElementById('fmValor')?.value||0);
    const data=document.getElementById('fmData')?.value||'';
    return rows().find(x=>x.origem==='manual'&&String(x.obra_id||'')===String(obra)&&String(x.categoria||'')===String(categoria)&&String(x.subcategoria||'')===String(subcategoria)&&String(x.descricao||'')===String(descricao)&&Number(x.valor||0)===valor&&String(x.data||'')===String(data))||null;
  }

  function idsDaLinha(x){
    if(Array.isArray(x?.checklist_ids)&&x.checklist_ids.length)return x.checklist_ids.map(String);
    return x?.checklist_id?[String(x.checklist_id)]:[];
  }

  function idsSelecionados(){
    const box=document.getElementById('fmChecklistMulti');
    if(!box)return [];
    return [...box.querySelectorAll('input[data-check-id]:checked')].map(x=>x.value).filter(Boolean);
  }

  function sincronizarSelectLegado(){
    const sel=document.getElementById('fmChecklist');
    if(!sel)return;
    const ids=idsSelecionados();
    sel.value=ids[0]||'';
  }

  function renderChecklistMulti(forcarVazio=false){
    const form=document.getElementById('fmForm'),sel=document.getElementById('fmChecklist');
    if(!form||form.classList.contains('hidden')||!sel)return;
    sel.style.display='none';
    sel.setAttribute('aria-hidden','true');
    const label=sel.previousElementSibling;
    if(label?.tagName==='LABEL')label.textContent='Checklist / etapa — selecione um ou mais';

    let box=document.getElementById('fmChecklistMulti');
    if(!box){box=document.createElement('div');box.id='fmChecklistMulti';box.className='fmChecklistMulti';sel.insertAdjacentElement('afterend',box)}

    const obraId=document.getElementById('fmObra')?.value||'';
    box.dataset.obraId=obraId;
    if(!obraId){
      box.innerHTML='<div class="fmChecklistAviso">Selecione uma obra primeiro.</div>';
      sincronizarSelectLegado();
      return;
    }

    const disponiveis=checks().filter(c=>String(c.obra_id)===String(obraId)).sort((a,b)=>Number(a.ordem||0)-Number(b.ordem||0));
    let selecionados=[];
    if(!forcarVazio){
      const atuais=[...box.querySelectorAll('input[data-check-id]:checked')].map(x=>String(x.value));
      const mesmaObra=box.dataset.renderedObra===obraId;
      selecionados=mesmaObra&&atuais.length?atuais:idsDaLinha(linhaAtual());
    }
    const set=new Set(selecionados.map(String));
    const sem=set.size===0;
    box.innerHTML=`<label class="fmChecklistOpcao fmChecklistSem"><input type="checkbox" data-sem-checklist ${sem?'checked':''}> <span>Sem checklist</span></label>`+
      (disponiveis.length?disponiveis.map(c=>`<label class="fmChecklistOpcao"><input type="checkbox" data-check-id value="${esc(c.id)}" ${set.has(String(c.id))?'checked':''}> <span>${esc(c.nome||'Etapa')}</span></label>`).join(''):'<div class="fmChecklistAviso">Nenhum checklist cadastrado para esta obra.</div>');
    box.dataset.renderedObra=obraId;

    const semEl=box.querySelector('[data-sem-checklist]');
    semEl?.addEventListener('change',()=>{
      if(semEl.checked)box.querySelectorAll('[data-check-id]').forEach(x=>x.checked=false);
      sincronizarSelectLegado();
    });
    box.querySelectorAll('[data-check-id]').forEach(ch=>ch.addEventListener('change',()=>{
      if(ch.checked&&semEl)semEl.checked=false;
      if(!idsSelecionados().length&&semEl)semEl.checked=true;
      sincronizarSelectLegado();
    }));
    sincronizarSelectLegado();
  }

  function dadosFormulario(){
    const h=document.querySelector('#fmForm h3')?.textContent||'';
    return {
      tipo:/receita/i.test(h)?'receita':'despesa',
      obra_id:document.getElementById('fmObra')?.value||'',
      categoria:document.getElementById('fmCat')?.value||'',
      subcategoria:document.getElementById('fmSubcat')?.value.trim()||'',
      descricao:document.getElementById('fmDesc')?.value.trim()||'',
      valor:Number(document.getElementById('fmValor')?.value||0),
      data:document.getElementById('fmData')?.value||''
    };
  }

  function acharSalvo(antes,dados,idPreferido){
    const atuais=rows();
    if(idPreferido){const alvo=atuais.find(x=>String(x.id)===String(idPreferido));if(alvo)return alvo}
    const mudou=atuais.filter(x=>{
      const antigo=antes.get(String(x.id));
      return !antigo||String(antigo)!==String(x.atualizado_em||'');
    });
    const candidatos=(mudou.length?mudou:atuais).filter(x=>x.origem==='manual'&&String(x.tipo||'')===dados.tipo&&String(x.obra_id||'')===String(dados.obra_id)&&String(x.categoria||'')===String(dados.categoria)&&String(x.subcategoria||'')===String(dados.subcategoria)&&String(x.descricao||'')===String(dados.descricao)&&Number(x.valor||0)===dados.valor&&String(x.data||'')===String(dados.data));
    return candidatos.sort((a,b)=>String(b.atualizado_em||'').localeCompare(String(a.atualizado_em||'')))[0]||null;
  }

  function prepararSalvar(){
    const btn=document.getElementById('fmSalvar');
    if(!btn||btn.dataset.multiChecklists==='1')return;
    btn.dataset.multiChecklists='1';
    const original=btn.onclick;
    btn.onclick=async function(ev){
      const ids=idsSelecionados();
      sincronizarSelectLegado();
      const dados=dadosFormulario(),idPreferido=editandoId||linhaAtual()?.id||null;
      const antes=new Map(rows().map(x=>[String(x.id),String(x.atualizado_em||'')]));
      await original?.call(this,ev);
      const form=document.getElementById('fmForm');
      if(!form?.classList.contains('hidden'))return;
      try{
        const alvo=acharSalvo(antes,dados,idPreferido);
        if(!alvo)return;
        const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile?.(),empresaId=p?.empresa_id||window.profile?.empresa_id;
        const {error}=await sb.from('financeiro').update({checklist_ids:ids,checklist_id:ids[0]||null,atualizado_em:new Date().toISOString()}).eq('id',alvo.id).eq('empresa_id',empresaId).eq('origem','manual');
        if(error)throw error;
        editandoId=null;
        await window.OBRIX_FIN?.render?.();
      }catch(e){
        console.error('OBRIX: falha ao salvar múltiplos checklists',e);
        alert('O lançamento foi salvo, mas não foi possível salvar todos os checklists selecionados. Tente editar o lançamento novamente.');
      }
    };
  }

  function prepararObra(){
    const obra=document.getElementById('fmObra');
    if(!obra||obra.dataset.multiChecklists==='1')return;
    obra.dataset.multiChecklists='1';
    const anterior=obra.onchange;
    obra.onchange=function(ev){
      anterior?.call(this,ev);
      setTimeout(()=>renderChecklistMulti(true),0);
    };
  }

  function pintarCards(){
    const mapa=new Map(checks().map(c=>[String(c.id),c.nome||'Etapa']));
    document.querySelectorAll('#fmLista [data-fin-card="1"]').forEach(card=>{
      const row=rows().find(x=>String(x.id)===String(card.dataset.id));
      if(!row)return;
      const ids=idsDaLinha(row),meta=card.querySelector('.muted');
      if(!meta)return;
      const partes=meta.textContent.split(' • ').filter(x=>!/^Checklists?:/i.test(x)&&x!=='Sem checklist');
      const nomes=ids.map(id=>mapa.get(String(id))).filter(Boolean);
      partes.push(nomes.length?`Checklists: ${nomes.join(', ')}`:'Sem checklist');
      const novo=partes.join(' • ');
      if(meta.textContent!==novo)meta.textContent=novo;
    });
  }

  function instalarForm(){
    renderChecklistMulti(false);
    prepararObra();
    prepararSalvar();
    pintarCards();
  }

  window.addEventListener('click',e=>{
    const edit=e.target.closest?.('[data-fin="editar"]');
    if(edit)editandoId=edit.dataset.id||null;
    const b=e.target.closest?.('button');
    if(b&&(b.id==='fmReceita'||b.id==='fmDespesa'))editandoId=null;
  },true);

  const style=document.createElement('style');
  style.textContent=`
    #fmFiltrosPanel .fmFiltrosGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;align-items:end}
    #fmFiltrosPanel .fmFiltrosGrid label{min-width:0!important}
    #fmFiltrosPanel .fmFiltrosGrid label:last-child{grid-column:auto!important}
    #fmFiltrosPanel .fmFiltrosGrid select{width:100%!important;min-width:0!important}
    .fmChecklistMulti{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:6px 0 12px;padding:10px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc}
    .fmChecklistOpcao{display:flex!important;align-items:center;gap:8px;margin:0!important;padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;font-weight:700!important;min-width:0}
    .fmChecklistOpcao input{width:20px!important;height:20px!important;margin:0!important;flex:0 0 auto}
    .fmChecklistOpcao span{min-width:0;overflow-wrap:anywhere}.fmChecklistSem{grid-column:1/-1}.fmChecklistAviso{grid-column:1/-1;color:#64748b;font-size:13px;padding:6px}
    html[data-theme="dark"] .fmChecklistMulti,body.dark .fmChecklistMulti{background:#0b1220;border-color:#334155}html[data-theme="dark"] .fmChecklistOpcao,body.dark .fmChecklistOpcao{background:#111827;border-color:#334155;color:#f8fafc}
    @media(max-width:760px){
      #fmFiltrosPanel .fmFiltrosGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      #fmFiltrosPanel .fmFiltrosHead{display:flex!important;align-items:flex-start!important}
      #fmFiltrosPanel .fmFiltrosHead button{width:auto!important;margin-top:0!important}
    }
    @media(max-width:390px){
      #fmFiltrosPanel{padding:12px!important}
      #fmFiltrosPanel .fmFiltrosGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
      #fmFiltrosPanel .fmFiltrosGrid label{font-size:11px!important}
      #fmFiltrosPanel .fmFiltrosGrid select{font-size:12px!important;padding:0 7px!important;min-height:43px!important}
      #fmFiltrosPanel .fmFiltrosHead{display:block!important}
      #fmFiltrosPanel .fmFiltrosHead button{width:100%!important;margin-top:8px!important}
      .fmChecklistMulti{grid-template-columns:1fr}
      .fmChecklistSem{grid-column:auto}
    }
  `;
  document.head.appendChild(style);

  const obs=new MutationObserver(()=>requestAnimationFrame(instalarForm));
  obs.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('change',e=>{if(e.target?.id==='fmObra')setTimeout(()=>renderChecklistMulti(true),0)},true);
  setTimeout(instalarForm,250);
  setTimeout(instalarForm,700);
})();