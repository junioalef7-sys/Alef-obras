(()=>{
  'use strict';
  if(window.__OBRIX_PAGAR_SELECAO)return;
  window.__OBRIX_PAGAR_SELECAO=true;

  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hoje=()=>new Date().toISOString().slice(0,10);

  function modal(html){
    const back=document.createElement('div');
    back.className='modalBack';
    back.innerHTML=`<div class="modal obrix-pagar-selecao-modal">${html}</div>`;
    document.body.appendChild(back);
    back.addEventListener('click',e=>{if(e.target===back)back.remove()});
    return back;
  }

  async function dadosAbertos(){
    const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),eid=p.empresa_id;
    const [fr,dr,vr,br]=await Promise.all([
      sb.from('funcionarios').select('id,nome,ativo').eq('empresa_id',eid).order('nome'),
      sb.from('diarias').select('*').eq('empresa_id',eid).eq('paga',false),
      sb.from('vales').select('*').eq('empresa_id',eid).eq('quitado',false),
      sb.from('bonus_extras').select('*').eq('empresa_id',eid).eq('pago',false)
    ]);
    for(const r of [fr,dr,vr,br])if(r.error)throw r.error;
    return {sb,eid,funcs:fr.data||[],ds:dr.data||[],vs:vr.data||[],bs:br.data||[]};
  }

  function calc(base,fid){
    const ds=base.ds.filter(x=>String(x.funcionario_id)===String(fid));
    const vs=base.vs.filter(x=>String(x.funcionario_id)===String(fid));
    const bs=base.bs.filter(x=>String(x.funcionario_id)===String(fid));
    const td=ds.reduce((s,x)=>s+Number(x.valor_total||0),0),tv=vs.reduce((s,x)=>s+Number(x.valor||0),0),tb=bs.reduce((s,x)=>s+Number(x.valor||0),0),liq=td+tb-tv;
    const por={};
    ds.forEach(i=>{if(i.obra_id)por[i.obra_id]=(por[i.obra_id]||0)+Number(i.valor_total||0)});
    bs.forEach(i=>{if(i.obra_id)por[i.obra_id]=(por[i.obra_id]||0)+Number(i.valor||0)});
    vs.forEach(i=>{if(i.obra_id)por[i.obra_id]=(por[i.obra_id]||0)-Number(i.valor||0)});
    return {ds,vs,bs,td,tv,tb,bruto:td+tb,liq,por,tem:ds.length||vs.length||bs.length,invalido:liq<0||Object.values(por).some(v=>v<0)};
  }

  async function abrir(){
    try{
      const base=await dadosAbertos();
      const itens=base.funcs.map(f=>({f,r:calc(base,f.id)})).filter(x=>x.r.tem);
      if(!itens.length)return alert('Não há valores em aberto para pagar.');
      const back=modal(`<div class="obrix-pagar-head"><div><h2>Pagar equipe</h2><p>Selecione um, vários ou todos os funcionários.</p></div><button type="button" class="obrix-pagar-x">×</button></div>
        <label class="obrix-pagar-todos"><input type="checkbox" id="obrixPagarTodos"> <b>Selecionar todos</b></label>
        <div class="obrix-pagar-lista">${itens.map(({f,r})=>`<label class="obrix-pagar-item ${r.invalido?'invalido':''}"><input type="checkbox" class="obrix-pagar-check" value="${esc(f.id)}" ${r.invalido?'disabled':''}><span><b>${esc(f.nome||'Funcionário')}</b><small>Bruto ${money(r.bruto)} · Vales ${money(r.tv)} · Líquido ${money(r.liq)}</small>${r.invalido?'<em>Revise os valores deste funcionário antes de pagar.</em>':''}</span></label>`).join('')}</div>
        <div class="obrix-pagar-total"><span>Selecionados</span><b id="obrixPagarQtd">0</b><span>Total líquido</span><strong id="obrixPagarTotal">${money(0)}</strong></div>
        <label class="obrix-pagar-data-label">Data do pagamento<input id="obrixPagarData" type="date" value="${hoje()}"></label>
        <div class="modalActions"><button type="button" class="btn obrix-pagar-cancelar">Cancelar</button><button type="button" class="btn obrix-pagar-confirmar">Confirmar pagamento</button></div>`);
      const checks=[...back.querySelectorAll('.obrix-pagar-check')],todos=back.querySelector('#obrixPagarTodos');
      const atualizarTotal=()=>{const ids=checks.filter(c=>c.checked).map(c=>c.value),total=itens.filter(x=>ids.includes(String(x.f.id))).reduce((s,x)=>s+x.r.liq,0);back.querySelector('#obrixPagarQtd').textContent=String(ids.length);back.querySelector('#obrixPagarTotal').textContent=money(total);const habilitados=checks.filter(c=>!c.disabled);todos.checked=habilitados.length>0&&habilitados.every(c=>c.checked);todos.indeterminate=habilitados.some(c=>c.checked)&&!todos.checked};
      todos.onchange=()=>{checks.filter(c=>!c.disabled).forEach(c=>c.checked=todos.checked);atualizarTotal()};
      checks.forEach(c=>c.onchange=atualizarTotal);
      back.querySelector('.obrix-pagar-x').onclick=()=>back.remove();back.querySelector('.obrix-pagar-cancelar').onclick=()=>back.remove();
      back.querySelector('.obrix-pagar-confirmar').onclick=async()=>{
        const ids=checks.filter(c=>c.checked).map(c=>c.value),data=back.querySelector('#obrixPagarData').value;
        if(!ids.length)return alert('Selecione pelo menos um funcionário.');
        if(!data)return alert('Informe a data do pagamento.');
        const btn=back.querySelector('.obrix-pagar-confirmar');btn.disabled=true;btn.textContent='Pagando...';
        try{
          const fresco=await dadosAbertos();
          let feitos=0;
          for(const id of ids){
            const f=fresco.funcs.find(x=>String(x.id)===String(id));if(!f)continue;
            const r=calc(fresco,id);if(!r.tem)continue;
            if(r.invalido)throw new Error(`Revise os valores de ${f.nome}. O líquido ou a distribuição por obra ficou negativo.`);
            const {data:p,error}=await fresco.sb.from('pagamentos_equipe').insert({empresa_id:fresco.eid,funcionario_id:f.id,valor_diarias:r.td,valor_bonus_extras:r.tb,valor_vales:r.tv,valor_bruto:r.bruto,valor_liquido:r.liq,data_pagamento:data}).select('id').single();
            if(error)throw error;const pid=p.id;
            if(r.ds.length){let q=await fresco.sb.from('pagamento_diarias').insert(r.ds.map(i=>({empresa_id:fresco.eid,pagamento_id:pid,diaria_id:i.id,obra_id:i.obra_id,valor:Number(i.valor_total||0)})));if(q.error)throw q.error;q=await fresco.sb.from('diarias').update({paga:true,pago_em:new Date().toISOString()}).in('id',r.ds.map(i=>i.id));if(q.error)throw q.error}
            if(r.vs.length){let q=await fresco.sb.from('pagamento_vales').insert(r.vs.map(i=>({empresa_id:fresco.eid,pagamento_id:pid,vale_id:i.id,valor:Number(i.valor||0)})));if(q.error)throw q.error;q=await fresco.sb.from('vales').update({quitado:true,quitado_em:new Date().toISOString()}).in('id',r.vs.map(i=>i.id));if(q.error)throw q.error}
            if(r.bs.length){let q=await fresco.sb.from('pagamento_bonus_extras').insert(r.bs.map(i=>({empresa_id:fresco.eid,pagamento_id:pid,bonus_extra_id:i.id,valor:Number(i.valor||0)})));if(q.error)throw q.error;q=await fresco.sb.from('bonus_extras').update({pago:true,pago_em:new Date().toISOString()}).in('id',r.bs.map(i=>i.id));if(q.error)throw q.error}
            const rows=Object.entries(r.por).filter(([,v])=>v>0).map(([obra_id,valor])=>({empresa_id:fresco.eid,obra_id,tipo:'despesa',categoria:'mao_de_obra',descricao:'Pagamento de equipe - '+f.nome,valor,data,origem:'pagamento_equipe',pagamento_equipe_id:pid,status_lancamento:'ativo'}));
            if(rows.length){const q=await fresco.sb.from('financeiro').insert(rows);if(q.error)throw q.error}
            feitos++;
          }
          back.remove();await window.OBRIX_EQUIPE?.refresh?.();window.OBRIX_FIN?.render?.();alert(`${feitos} pagamento${feitos===1?'':'s'} concluído${feitos===1?'':'s'} e lançado${feitos===1?'':'s'} no Financeiro.`);
        }catch(e){btn.disabled=false;btn.textContent='Confirmar pagamento';alert(e.message||'Não foi possível concluir os pagamentos.')}
      };
      atualizarTotal();
    }catch(e){alert(e.message||'Não foi possível carregar os pagamentos em aberto.')}
  }

  function instalarBotao(){
    const sec=document.querySelector('#equipe .obrix-equipe-secundario');if(!sec)return false;
    let btn=sec.querySelector('.obrix-pagar-equipe-topo');
    const antigo=sec.querySelector('.obrix-atualizar-equipe');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='obrix-cmd obrix-pagar-equipe-topo';btn.textContent='💳 Pagar';if(antigo)antigo.replaceWith(btn);else sec.appendChild(btn)}
    btn.onclick=abrir;return true;
  }

  const css=document.createElement('style');css.textContent=`
    .obrix-pagar-equipe-topo{background:#0f172a!important;color:#fff!important;border-color:#0f172a!important}
    .obrix-pagar-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.obrix-pagar-head h2{margin:0 0 4px}.obrix-pagar-head p{margin:0;color:#64748b}.obrix-pagar-x{border:0;background:transparent;color:inherit;font-size:30px}
    .obrix-pagar-todos{display:flex!important;gap:9px;align-items:center;margin:15px 0 10px!important;padding:12px;border:1px solid #cbd5e1;border-radius:12px}.obrix-pagar-todos input,.obrix-pagar-item input{width:auto!important;margin:0!important;transform:scale(1.15)}
    .obrix-pagar-lista{display:grid;gap:8px;max-height:42vh;overflow:auto}.obrix-pagar-item{display:flex!important;gap:10px;align-items:flex-start;padding:12px;border:1px solid #e2e8f0;border-radius:12px;margin:0!important}.obrix-pagar-item span{display:grid;gap:3px}.obrix-pagar-item small{color:#64748b}.obrix-pagar-item em{font-size:12px;color:#be123c;font-style:normal;font-weight:700}.obrix-pagar-item.invalido{opacity:.72}
    .obrix-pagar-total{display:grid;grid-template-columns:1fr auto;gap:6px 12px;margin:12px 0;padding:12px;border-radius:12px;background:#f8fafc}.obrix-pagar-total strong{font-size:20px}.obrix-pagar-data-label{display:block!important;font-weight:800}.obrix-pagar-data-label input{display:block;width:100%}
    html[data-theme="dark"] .obrix-pagar-equipe-topo,body.dark .obrix-pagar-equipe-topo{background:#2563eb!important;border-color:#2563eb!important}html[data-theme="dark"] .obrix-pagar-item,body.dark .obrix-pagar-item,html[data-theme="dark"] .obrix-pagar-todos,body.dark .obrix-pagar-todos{border-color:#334155}html[data-theme="dark"] .obrix-pagar-total,body.dark .obrix-pagar-total{background:#111827}
  `;document.head.appendChild(css);

  const t=setInterval(()=>{if(instalarBotao())clearInterval(t)},120);setTimeout(instalarBotao,1200);setTimeout(instalarBotao,2600);
  new MutationObserver(()=>instalarBotao()).observe(document.documentElement,{childList:true,subtree:true});
  window.OBRIX_PAGAR_EQUIPE={open:abrir};
})();