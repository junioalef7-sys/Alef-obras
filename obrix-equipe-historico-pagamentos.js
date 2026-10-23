(()=>{
  'use strict';
  if(window.__OBRIX_EQUIPE_HIST_PAG)return;
  window.__OBRIX_EQUIPE_HIST_PAG=true;

  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]||c));
  const dataBR=v=>{if(!v)return '—';const [y,m,d]=String(v).slice(0,10).split('-');return y&&m&&d?`${d}/${m}/${y}`:String(v)};
  let abrindo=false;

  function modal(){
    const back=document.createElement('div');
    back.className='modalBack obrix-hist-pag-back';
    back.innerHTML=`<div class="modal obrix-hist-pag-modal">
      <div class="obrix-hist-pag-head"><div><h2>Histórico de pagamentos</h2><p>Pagamentos realizados da equipe e opção de estorno.</p></div><button type="button" class="obrix-hist-pag-x" aria-label="Fechar">×</button></div>
      <div class="obrix-hist-pag-resumo" id="obrixHistPagResumo"></div>
      <div class="obrix-hist-pag-lista" id="obrixHistPagLista"><div class="muted">Carregando pagamentos...</div></div>
    </div>`;
    document.body.appendChild(back);
    back.querySelector('.obrix-hist-pag-x').onclick=()=>back.remove();
    back.addEventListener('click',e=>{if(e.target===back)back.remove()});
    return back;
  }

  async function buscar(){
    const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),eid=p.empresa_id;
    const [pg,fn]=await Promise.all([
      sb.from('pagamentos_equipe').select('id,funcionario_id,valor_diarias,valor_bonus_extras,valor_vales,valor_bruto,valor_liquido,data_pagamento,observacoes,criado_em,estornado_em,motivo_estorno').eq('empresa_id',eid).order('data_pagamento',{ascending:false}).order('criado_em',{ascending:false}),
      sb.from('funcionarios').select('id,nome').eq('empresa_id',eid)
    ]);
    if(pg.error)throw pg.error;if(fn.error)throw fn.error;
    return {sb,eid,pagamentos:pg.data||[],funcs:new Map((fn.data||[]).map(x=>[String(x.id),x.nome||'Funcionário']))};
  }

  function render(back,base){
    const lista=back.querySelector('#obrixHistPagLista'),res=back.querySelector('#obrixHistPagResumo');
    const ativos=base.pagamentos.filter(x=>!x.estornado_em),estornados=base.pagamentos.filter(x=>!!x.estornado_em);
    const acumulados=new Map();
    ativos.forEach(x=>{const id=String(x.funcionario_id||'');if(id)acumulados.set(id,(acumulados.get(id)||0)+Number(x.valor_liquido||0))});
    res.innerHTML=`<div><small>Pagamentos válidos</small><strong>${ativos.length}</strong></div><div><small>Estornados</small><strong>${estornados.length}</strong></div>`;
    if(!base.pagamentos.length){lista.innerHTML='<div class="card muted">Nenhum pagamento registrado.</div>';return}
    lista.innerHTML=base.pagamentos.map(p=>{
      const est=!!p.estornado_em,nome=base.funcs.get(String(p.funcionario_id))||'Funcionário',acumulado=acumulados.get(String(p.funcionario_id))||0;
      return `<article class="card obrix-hist-pag-card ${est?'estornado':''}" data-pag-id="${esc(p.id)}">
        <div class="obrix-hist-pag-cardtop"><div><h3>${esc(nome)}</h3><p>${dataBR(p.data_pagamento)}</p></div><span class="obrix-hist-pag-status">${est?'Estornado':'Pago'}</span></div>
        <div class="obrix-hist-pag-grid">
          <div><small>Diárias</small><b>${money(p.valor_diarias)}</b></div>
          <div><small>Bônus e extras</small><b>${money(p.valor_bonus_extras)}</b></div>
          <div><small>Vales</small><b>-${money(p.valor_vales)}</b></div>
          <div><small>Bruto</small><b>${money(p.valor_bruto)}</b></div>
          <div class="liq"><small>Líquido pago</small><b>${money(p.valor_liquido)}</b></div>
          <div class="acum"><small>Total pago acumulado</small><b>${money(acumulado)}</b></div>
        </div>
        ${est?`<div class="obrix-hist-pag-estorno-info"><b>Estornado em ${dataBR(p.estornado_em)}</b>${p.motivo_estorno?`<span>Motivo: ${esc(p.motivo_estorno)}</span>`:''}</div>`:`<div class="obrix-hist-pag-actions"><button type="button" class="obrix-hist-pag-estornar" data-estornar-pag="${esc(p.id)}">Estornar pagamento</button></div>`}
      </article>`;
    }).join('');
    lista.querySelectorAll('[data-estornar-pag]').forEach(b=>b.onclick=()=>estornar(back,base,b.dataset.estornarPag,b));
  }

  async function estornar(back,base,id,btn){
    const p=base.pagamentos.find(x=>String(x.id)===String(id));if(!p||p.estornado_em)return;
    const nome=base.funcs.get(String(p.funcionario_id))||'Funcionário';
    if(!confirm(`Estornar o pagamento de ${nome}, no valor de ${money(p.valor_liquido)}?\n\nAs diárias, vales e bônus/extras deste pagamento voltarão para aberto e o lançamento no Financeiro será estornado.`))return;
    const motivo=prompt('Motivo do estorno (opcional):','')??null;
    if(motivo===null)return;
    btn.disabled=true;btn.textContent='Estornando...';
    try{
      const {data,error}=await base.sb.rpc('obrix_estornar_pagamento_equipe',{p_pagamento_id:id,p_motivo:String(motivo||'').trim()||null});
      if(error)throw error;if(data?.ok===false)throw new Error(data?.error||'Não foi possível estornar o pagamento.');
      const novo=await buscar();base.pagamentos=novo.pagamentos;base.funcs=novo.funcs;render(back,base);
      await window.OBRIX_EQUIPE?.refresh?.();
      await window.OBRIX_EQUIPE_TOTAL_PAGO?.refresh?.();
      try{await window.OBRIX_FIN?.render?.()}catch(_){}
      try{window.OBRIX_DASH?.paint?.()}catch(_){}
      alert('Pagamento estornado. Os valores voltaram para aberto e o Financeiro foi atualizado.');
    }catch(e){btn.disabled=false;btn.textContent='Estornar pagamento';alert(window.OBRIX_PT_ERROR?.(e)||e.message||'Não foi possível estornar o pagamento.')}
  }

  async function abrir(){
    if(abrindo)return;abrindo=true;const back=modal();
    try{const base=await buscar();render(back,base)}catch(e){back.querySelector('#obrixHistPagLista').innerHTML=`<div class="status">${esc(window.OBRIX_PT_ERROR?.(e)||e.message||'Não foi possível carregar o histórico de pagamentos.')}</div>`}finally{abrindo=false}
  }

  function instalarBotao(){
    const sec=document.querySelector('#equipe .obrix-equipe-secundario')||document.querySelector('#equipe .obrix-equipe-botoes');if(!sec)return false;
    let btn=sec.querySelector('.obrix-historico-pagamentos-topo');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='obrix-cmd obrix-historico-pagamentos-topo';sec.appendChild(btn)}
    btn.textContent='🧾 Histórico de pagamentos';btn.onclick=abrir;return true;
  }

  const css=document.createElement('style');css.textContent=`
    .obrix-historico-pagamentos-topo{background:#fff!important;color:#334155!important;border-color:#cbd5e1!important;box-shadow:none!important}
    .obrix-hist-pag-modal{width:min(760px,100%);max-height:90vh;overflow:auto}.obrix-hist-pag-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.obrix-hist-pag-head h2{margin:0 0 4px}.obrix-hist-pag-head p{margin:0;color:#64748b}.obrix-hist-pag-x{border:0;background:transparent;color:inherit;font-size:30px;line-height:1}
    .obrix-hist-pag-resumo{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:16px 0}.obrix-hist-pag-resumo>div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px}.obrix-hist-pag-resumo small{display:block;color:#64748b;font-weight:700}.obrix-hist-pag-resumo strong{display:block;margin-top:4px;font-size:18px}
    .obrix-hist-pag-card{margin-bottom:10px!important}.obrix-hist-pag-card.estornado{opacity:.72}.obrix-hist-pag-cardtop{display:flex;justify-content:space-between;gap:10px}.obrix-hist-pag-cardtop h3{margin:0}.obrix-hist-pag-cardtop p{margin:4px 0 0;color:#64748b}.obrix-hist-pag-status{height:max-content;border:1px solid #cbd5e1;border-radius:999px;padding:6px 9px;background:#fff;color:#334155;font-size:12px;font-weight:900}.obrix-hist-pag-card.estornado .obrix-hist-pag-status{background:#fff1f2;color:#991b1b;border-color:#fecaca}
    .obrix-hist-pag-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin-top:12px}.obrix-hist-pag-grid>div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:9px}.obrix-hist-pag-grid small{display:block;color:#64748b;font-size:11px;font-weight:700}.obrix-hist-pag-grid b{display:block;margin-top:4px}.obrix-hist-pag-grid .liq,.obrix-hist-pag-grid .acum{background:#f8fafc;border-color:#e2e8f0}
    .obrix-hist-pag-actions{display:flex;justify-content:flex-end;margin-top:12px}.obrix-hist-pag-estornar{border:1px solid #fecaca;background:#fff1f2;color:#991b1b;border-radius:10px;padding:10px 12px;font-weight:900}.obrix-hist-pag-estornar:disabled{opacity:.55}.obrix-hist-pag-estorno-info{display:grid;gap:3px;margin-top:10px;padding:10px;border-radius:10px;background:#fff1f2;color:#991b1b;font-size:13px}
    html[data-theme="dark"] .obrix-historico-pagamentos-topo,body.dark .obrix-historico-pagamentos-topo{background:#111827!important;color:#f8fafc!important;border-color:#334155!important;box-shadow:none!important}
    html[data-theme="dark"] .obrix-hist-pag-resumo>div,body.dark .obrix-hist-pag-resumo>div,html[data-theme="dark"] .obrix-hist-pag-grid>div,body.dark .obrix-hist-pag-grid>div,html[data-theme="dark"] .obrix-hist-pag-grid .liq,body.dark .obrix-hist-pag-grid .liq,html[data-theme="dark"] .obrix-hist-pag-grid .acum,body.dark .obrix-hist-pag-grid .acum{background:#111827;border-color:#334155}
    html[data-theme="dark"] .obrix-hist-pag-status,body.dark .obrix-hist-pag-status{background:#111827;color:#f8fafc;border-color:#334155}
    html[data-theme="dark"] .obrix-hist-pag-card.estornado .obrix-hist-pag-status,body.dark .obrix-hist-pag-card.estornado .obrix-hist-pag-status,html[data-theme="dark"] .obrix-hist-pag-estornar,body.dark .obrix-hist-pag-estornar,html[data-theme="dark"] .obrix-hist-pag-estorno-info,body.dark .obrix-hist-pag-estorno-info{background:#2b1217;border-color:#7f1d1d;color:#fecdd3}
    @media(max-width:620px){.obrix-hist-pag-resumo{grid-template-columns:1fr 1fr}.obrix-hist-pag-grid{grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(css);

  const t=setInterval(()=>{if(instalarBotao())clearInterval(t)},150);
  setTimeout(instalarBotao,1000);setTimeout(instalarBotao,2200);
  window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe')setTimeout(instalarBotao,80)});
  window.OBRIX_EQUIPE_HISTORICO_PAGAMENTOS={open:abrir};
})();