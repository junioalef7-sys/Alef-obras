(()=>{
  'use strict';
  const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const ativo=x=>!x.status_lancamento||x.status_lancamento==='ativo';
  const isReceita=x=>String(x.tipo||'').toLowerCase()==='receita';
  const isDespesa=x=>String(x.tipo||'').toLowerCase()==='despesa';
  let extras=[];

  function resumoDaObra(obra){
    const itens=(typeof financeiro!=='undefined'?financeiro:[]).filter(x=>x.obra_id===obra.id&&ativo(x));
    const recebidos=itens.filter(isReceita).reduce((s,x)=>s+Number(x.valor||0),0);
    const despesas=itens.filter(isDespesa).reduce((s,x)=>s+Number(x.valor||0),0);
    const contrato=Number(obra.valor_contrato||0);
    const extrasObra=extras.filter(x=>x.obra_id===obra.id);
    const totalExtras=extrasObra.reduce((s,x)=>s+Number(x.valor||0),0);
    const atualizado=contrato+totalExtras;
    return {contrato,totalExtras,atualizado,recebidos,despesas,aReceber:Math.max(0,atualizado-recebidos),resultado:recebidos-despesas,extrasObra};
  }

  function modalExtra(obra,extra){
    const back=document.createElement('div');back.className='modalBack';
    back.innerHTML=`<div class="modal"><h2>${extra?'Editar':'Novo'} serviço extra</h2>
      <label>Descrição</label><input class="ex-desc" maxlength="180" value="${String(extra?.descricao||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">
      <div class="grid2"><div><label>Valor</label><input class="ex-valor" type="number" min="0" step="0.01" value="${Number(extra?.valor||0)||''}"></div><div><label>Data</label><input class="ex-data" type="date" value="${extra?.data||new Date().toISOString().slice(0,10)}"></div></div>
      <label>Observações</label><textarea class="ex-obs">${extra?.observacoes||''}</textarea>
      <div class="modalActions"><button class="btn light cancel">Cancelar</button><button class="btn save">Salvar</button></div></div>`;
    document.body.appendChild(back);
    back.querySelector('.cancel').onclick=()=>back.remove();
    back.querySelector('.save').onclick=async()=>{
      const descricao=back.querySelector('.ex-desc').value.trim();
      const valor=Number(back.querySelector('.ex-valor').value||0);
      if(!descricao||valor<=0){alert('Informe a descrição e um valor maior que zero.');return}
      const sb=await OBRIX_BACKEND.init();
      const payload={empresa_id:profile.empresa_id,obra_id:obra.id,descricao,valor,data:back.querySelector('.ex-data').value||null,observacoes:back.querySelector('.ex-obs').value.trim()||null};
      const q=extra?sb.from('servicos_extras').update(payload).eq('id',extra.id):sb.from('servicos_extras').insert(payload);
      const {error}=await q;if(error){alert('Não foi possível salvar o serviço extra: '+error.message);return}
      back.remove();await carregarExtras();renderObras();
    };
  }

  async function excluirExtra(extra){
    if(!confirm('Excluir este serviço extra?'))return;
    const sb=await OBRIX_BACKEND.init();
    const {error}=await sb.from('servicos_extras').delete().eq('id',extra.id);
    if(error){alert('Não foi possível excluir: '+error.message);return}
    await carregarExtras();renderObras();
  }

  function aplicarResumo(){
    const host=document.getElementById('works');
    if(!host||typeof obras==='undefined'||!Array.isArray(obras))return;
    const cards=[...host.querySelectorAll('.item')];
    obras.forEach((obra,i)=>{
      const card=cards[i];if(!card)return;
      let box=card.querySelector('.obrix-resumo-obra');
      if(!box){box=document.createElement('div');box.className='obrix-resumo-obra';card.insertBefore(box,card.querySelector('.actions')||null)}
      const r=resumoDaObra(obra);
      box.innerHTML=`<div class="obrix-resumo-title">Resumo da obra</div><div class="obrix-resumo-grid">
        <div><small>Contrato original</small><strong>${brl(r.contrato)}</strong></div><div><small>Serviços extras</small><strong>${brl(r.totalExtras)}</strong></div><div><small>Total atualizado</small><strong>${brl(r.atualizado)}</strong></div><div><small>Recebido</small><strong>${brl(r.recebidos)}</strong></div><div><small>A receber</small><strong>${brl(r.aReceber)}</strong></div><div><small>Despesas</small><strong>${brl(r.despesas)}</strong></div><div><small>Resultado atual</small><strong>${brl(r.resultado)}</strong></div></div>
        <div class="obrix-extras-head"><strong>Serviços extras</strong><button class="btn add-extra">+ Adicionar extra</button></div><div class="obrix-extras-list"></div>`;
      box.querySelector('.add-extra').onclick=()=>modalExtra(obra,null);
      const list=box.querySelector('.obrix-extras-list');
      if(!r.extrasObra.length)list.innerHTML='<div class="obrix-extra-empty">Nenhum serviço extra nesta obra.</div>';
      r.extrasObra.forEach(ex=>{const row=document.createElement('div');row.className='obrix-extra-row';row.innerHTML='<div><strong class="d"></strong><small class="dt"></small></div><strong class="v"></strong><div class="obrix-extra-actions"><button class="btn light edit">Editar</button><button class="btn danger del">Excluir</button></div>';row.querySelector('.d').textContent=ex.descricao;row.querySelector('.dt').textContent=ex.data?new Date(ex.data+'T12:00:00').toLocaleDateString('pt-BR'):'';row.querySelector('.v').textContent=brl(ex.valor);row.querySelector('.edit').onclick=()=>modalExtra(obra,ex);row.querySelector('.del').onclick=()=>excluirExtra(ex);list.appendChild(row)});
    });
  }

  async function carregarExtras(){try{extras=await OBRIX_BACKEND.readTable('servicos_extras','data')}catch(e){console.error('Serviços extras:',e);extras=[]}}
  const css=document.createElement('style');css.textContent=`.obrix-resumo-obra{margin-top:14px;padding-top:14px;border-top:1px solid #e5e7eb}.obrix-resumo-title{font-size:13px;font-weight:900;color:#344054;margin-bottom:9px}.obrix-resumo-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.obrix-resumo-grid>div{background:#f8fafc;border:1px solid #e5e7eb;border-radius:11px;padding:10px}.obrix-resumo-grid small{display:block;color:#667085;font-size:11px;font-weight:700;margin-bottom:4px}.obrix-resumo-grid strong{display:block;color:#111827;font-size:14px}.obrix-extras-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px}.obrix-extras-head .btn{padding:8px 10px}.obrix-extras-list{display:grid;gap:7px;margin-top:8px}.obrix-extra-row{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:9px}.obrix-extra-row small{display:block;color:#667085;margin-top:2px}.obrix-extra-actions{display:flex;gap:5px}.obrix-extra-actions .btn{padding:7px 9px;font-size:12px}.obrix-extra-empty{font-size:13px;color:#667085;padding:8px 0}@media(max-width:760px){.obrix-resumo-grid{grid-template-columns:1fr 1fr}.obrix-extra-row{grid-template-columns:1fr auto}.obrix-extra-actions{grid-column:1/-1}}@media(max-width:420px){.obrix-resumo-grid{grid-template-columns:1fr}}`;document.head.appendChild(css);

  async function iniciar(){await carregarExtras();if(typeof renderObras==='function'){const original=renderObras;window.renderObras=function(){original();aplicarResumo()};aplicarResumo()}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(iniciar,250));else setTimeout(iniciar,250);
})();
