(()=>{
  'use strict';
  const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const ativo=x=>!x.status_lancamento||x.status_lancamento==='ativo';
  const isReceita=x=>String(x.tipo||'').toLowerCase()==='receita';
  const isDespesa=x=>String(x.tipo||'').toLowerCase()==='despesa';

  function resumoDaObra(obra){
    const itens=(window.financeiro||financeiro||[]).filter(x=>x.obra_id===obra.id&&ativo(x));
    const recebido=itens.filter(isReceita).reduce((s,x)=>s+Number(x.valor||0),0);
    const despesas=itens.filter(isDespesa).reduce((s,x)=>s+Number(x.valor||0),0);
    const contrato=Number(obra.valor_contrato||0);
    return {contrato,recebido,despesas,aReceber:Math.max(0,contrato-recebido),resultado:recebido-despesas};
  }

  function aplicarResumo(){
    const host=document.getElementById('works');
    if(!host||!Array.isArray(obras)) return;
    const cards=[...host.querySelectorAll('.item')];
    obras.forEach((obra,i)=>{
      const card=cards[i]; if(!card) return;
      let box=card.querySelector('.obrix-resumo-obra');
      if(!box){
        box=document.createElement('div');
        box.className='obrix-resumo-obra';
        const actions=card.querySelector('.actions');
        card.insertBefore(box,actions||null);
      }
      const r=resumoDaObra(obra);
      box.innerHTML=`
        <div class="obrix-resumo-title">Resumo da obra</div>
        <div class="obrix-resumo-grid">
          <div><small>Contrato original</small><strong>${brl(r.contrato)}</strong></div>
          <div><small>Recebido</small><strong>${brl(r.recebido)}</strong></div>
          <div><small>A receber</small><strong>${brl(r.aReceber)}</strong></div>
          <div><small>Despesas</small><strong>${brl(r.despesas)}</strong></div>
          <div><small>Resultado atual</small><strong>${brl(r.resultado)}</strong></div>
        </div>`;
    });
  }

  const css=document.createElement('style');
  css.textContent=`
    .obrix-resumo-obra{margin-top:14px;padding-top:14px;border-top:1px solid #e5e7eb}
    .obrix-resumo-title{font-size:13px;font-weight:900;color:#344054;margin-bottom:9px}
    .obrix-resumo-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
    .obrix-resumo-grid>div{background:#f8fafc;border:1px solid #e5e7eb;border-radius:11px;padding:10px}
    .obrix-resumo-grid small{display:block;color:#667085;font-size:11px;font-weight:700;margin-bottom:4px}
    .obrix-resumo-grid strong{display:block;color:#111827;font-size:14px;word-break:break-word}
    @media(max-width:760px){.obrix-resumo-grid{grid-template-columns:1fr 1fr}}
    @media(max-width:420px){.obrix-resumo-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);

  if(typeof renderObras==='function'){
    const original=renderObras;
    window.renderObras=function(){original();aplicarResumo();};
    aplicarResumo();
  }else{
    document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicarResumo,300));
  }
})();
