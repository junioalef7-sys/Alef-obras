(()=>{
  'use strict';
  if(window.__OBRIX_OBRAS_PAGAMENTOS)return;
  window.__OBRIX_OBRAS_PAGAMENTOS=true;

  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dataBR=v=>{if(!v)return '—';const p=String(v).slice(0,10).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(v)};
  const pct=(v,total)=>total>0?(Number(v||0)/total*100):0;

  function obraPorId(id){try{return (window.obras||[]).find(o=>String(o.id)===String(id))||null}catch(_){return null}}
  function extrasLocais(id){try{return (window.extras||[]).filter(x=>String(x.obra_id)===String(id)).reduce((s,x)=>s+Number(x.valor||0),0)}catch(_){return 0}}

  async function carregar(id){
    const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),eid=p.empresa_id;
    const [fr,er]=await Promise.all([
      sb.from('financeiro').select('id,obra_id,tipo,categoria,subcategoria,forma_pagamento,descricao,valor,data,status_lancamento,criado_em').eq('empresa_id',eid).eq('obra_id',id).eq('tipo','receita').order('data',{ascending:false}).order('criado_em',{ascending:false}),
      sb.from('servicos_extras').select('valor').eq('empresa_id',eid).eq('obra_id',id)
    ]);
    if(fr.error)throw fr.error;if(er.error)throw er.error;
    return {receitas:(fr.data||[]).filter(x=>!x.status_lancamento||x.status_lancamento==='ativo'),extras:(er.data||[]).reduce((s,x)=>s+Number(x.valor||0),0)};
  }

  async function abrir(id){
    const obra=obraPorId(id);if(!obra)return alert('Obra não encontrada.');
    const back=document.createElement('div');back.className='modalBack obrix-pagamentos-obra-back';
    back.innerHTML=`<div class="modal obrix-pagamentos-obra-modal"><div class="obrix-pagamentos-head"><div><h2>Pagamentos recebidos</h2><p class="muted">${esc(obra.nome||'Obra')}</p></div><button type="button" class="obrix-pagamentos-x" aria-label="Fechar">×</button></div><div class="obrix-pagamentos-loading muted">Carregando histórico...</div></div>`;
    document.body.appendChild(back);back.querySelector('.obrix-pagamentos-x').onclick=()=>back.remove();back.addEventListener('click',e=>{if(e.target===back)back.remove()});
    try{
      const {receitas,extras}=await carregar(id),total=Number(obra.valor_contrato||0)+Number(extras||0),recebido=receitas.reduce((s,x)=>s+Number(x.valor||0),0),percentual=pct(recebido,total),aReceber=Math.max(0,total-recebido),modal=back.querySelector('.obrix-pagamentos-obra-modal');
      const lista=receitas.length?receitas.map(x=>{const tipo=x.forma_pagamento||x.subcategoria||(x.categoria==='entrada'?'Entrada':'Recebimento'),percentualItem=pct(x.valor,total);return `<div class="obrix-pagamento-item"><div class="obrix-pagamento-item-top"><strong>${money(x.valor)}</strong><span>${percentualItem.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</span></div><div class="obrix-pagamento-dados"><div><small>Data</small><b>${dataBR(x.data)}</b></div><div><small>Tipo de pagamento</small><b>${esc(tipo)}</b></div></div>${x.descricao?`<div class="obrix-pagamento-desc">${esc(x.descricao)}</div>`:''}</div>`}).join(''):'<div class="obrix-pagamentos-vazio">Nenhum pagamento recebido registrado para esta obra.</div>';
      modal.innerHTML=`<div class="obrix-pagamentos-head"><div><h2>Pagamentos recebidos</h2><p class="muted">${esc(obra.nome||'Obra')}</p></div><button type="button" class="obrix-pagamentos-x" aria-label="Fechar">×</button></div><div class="obrix-pagamentos-resumo"><div><small>Total atualizado</small><strong>${money(total)}</strong></div><div><small>Total recebido</small><strong>${money(recebido)}</strong></div><div><small>Percentual recebido</small><strong>${percentual.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</strong></div><div><small>A receber</small><strong>${money(aReceber)}</strong></div></div><div class="obrix-pagamentos-bar"><i style="width:${Math.max(0,Math.min(100,percentual))}%"></i></div><h3 class="obrix-pagamentos-titulo">Histórico</h3><div class="obrix-pagamentos-lista">${lista}</div>`;
      modal.querySelector('.obrix-pagamentos-x').onclick=()=>back.remove();
    }catch(e){const box=back.querySelector('.obrix-pagamentos-loading');if(box){box.className='status';box.textContent=e?.message||'Não foi possível carregar o histórico de pagamentos.'}}
  }

  function instalarBotoes(){
    document.querySelectorAll('#listaObras .card.item[data-obra-id]').forEach(card=>{
      const id=card.dataset.obraId,actions=card.querySelector('.actions');if(!id||!actions)return;
      let b=actions.querySelector('[data-pagamentos-obra]');if(!b){b=document.createElement('button');b.type='button';b.dataset.pagamentosObra=id;b.textContent='Pagamentos recebidos';actions.insertBefore(b,actions.firstChild)}else b.dataset.pagamentosObra=id;
    });
  }

  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-pagamentos-obra]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();abrir(b.dataset.pagamentosObra)},true);
  const obs=new MutationObserver(()=>requestAnimationFrame(instalarBotoes));
  function iniciar(){const lista=document.getElementById('listaObras');if(!lista)return setTimeout(iniciar,200);obs.observe(lista,{childList:true,subtree:true});instalarBotoes()}

  const css=document.createElement('style');css.textContent=`
    .obrix-pagamentos-obra-modal{width:min(720px,100%);max-height:88vh;overflow:auto}.obrix-pagamentos-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.obrix-pagamentos-head h2{margin:0 0 4px}.obrix-pagamentos-head p{margin:0}.obrix-pagamentos-x{border:0;background:transparent;color:inherit;font-size:30px;line-height:1}.obrix-pagamentos-resumo{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:16px 0 10px}.obrix-pagamentos-resumo>div{border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc}.obrix-pagamentos-resumo small,.obrix-pagamento-dados small{display:block;color:#64748b;font-size:11px;font-weight:800}.obrix-pagamentos-resumo strong{display:block;margin-top:4px;font-size:18px}.obrix-pagamentos-bar{height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden}.obrix-pagamentos-bar i{display:block;height:100%;background:#ff5a00;border-radius:inherit}.obrix-pagamentos-titulo{margin:18px 0 10px}.obrix-pagamentos-lista{display:grid;gap:9px}.obrix-pagamento-item{border:1px solid #e2e8f0;border-radius:13px;padding:13px}.obrix-pagamento-item-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.obrix-pagamento-item-top strong{font-size:19px}.obrix-pagamento-item-top span{font-weight:900;background:#e2e8f0;border-radius:999px;padding:5px 9px}.obrix-pagamento-dados{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.obrix-pagamento-dados b{display:block;margin-top:3px}.obrix-pagamento-desc{margin-top:9px;padding-top:9px;border-top:1px solid #e2e8f0;color:#475569}.obrix-pagamentos-vazio{padding:18px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;border-radius:12px}
    html[data-theme="dark"] .obrix-pagamentos-resumo>div,body.dark .obrix-pagamentos-resumo>div,html[data-theme="dark"] .obrix-pagamento-item,body.dark .obrix-pagamento-item{background:#111827;border-color:#334155;color:#f8fafc}html[data-theme="dark"] .obrix-pagamentos-bar,body.dark .obrix-pagamentos-bar{background:#334155}html[data-theme="dark"] .obrix-pagamento-item-top span,body.dark .obrix-pagamento-item-top span{background:#334155}html[data-theme="dark"] .obrix-pagamento-desc,body.dark .obrix-pagamento-desc{border-color:#334155;color:#cbd5e1}
    @media(max-width:480px){.obrix-pagamentos-resumo{grid-template-columns:1fr 1fr}.obrix-pagamento-dados{grid-template-columns:1fr}}
  `;document.head.appendChild(css);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
  window.OBRIX_OBRAS_PAGAMENTOS={open:abrir,refresh:instalarBotoes};
})();
