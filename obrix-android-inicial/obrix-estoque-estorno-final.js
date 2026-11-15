(()=>{'use strict';const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),qtd=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});async function estornar(id,btn){if(!await window.OBRIX_CONFIRMAR_EXCLUSAO({titulo:'Estornar saída',mensagem:'Estornar esta saída? O material voltará ao estoque e a despesa correspondente será estornada no Financeiro.',confirmar:'Estornar'}))return;try{btn.disabled=true;btn.textContent='Estornando...';const sb=await OBRIX_BACKEND.init(),r=await sb.rpc('obrix_estornar_saida_estoque',{p_movimento_id:id});if(r.error)throw r.error;document.querySelector('.estOp')?.remove();await window.OBRIX_EST?.render?.();window.OBRIX_FIN?.render?.();window.OBRIX_OBRAS?.render?.();alert('Saída estornada com sucesso.')}catch(e){btn.disabled=false;btn.textContent='Estornar saída';alert(e.message||'Erro ao estornar saída.')}}async function historico(){
  document.querySelector('.estOp')?.remove();
  const b=document.createElement('div');
  b.className='modalBack estOp';
  b.innerHTML='<div class="modal"><div class="estHistCabecalho" style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px"><h2 style="margin:0">Histórico do estoque</h2><button type="button" class="btn estHistFechar" aria-label="Fechar histórico">Fechar ×</button></div>'+
    '<label for="estHistPeriodo">Período das movimentações</label>'+
    '<select id="estHistPeriodo" class="estHistPeriodo"><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="custom">Selecionar período</option><option value="all">Todas as datas</option></select>'+
    '<div class="estHistDatas" hidden style="display:none;gap:8px;grid-template-columns:repeat(2,minmax(0,1fr));margin-top:8px"><label style="min-width:0">De<input type="date" class="estHistDe" style="width:100%;min-width:0;box-sizing:border-box"></label><label style="min-width:0">Até<input type="date" class="estHistAte" style="width:100%;min-width:0;box-sizing:border-box"></label></div>'+
    '<label for="estHistBusca" style="display:block;margin-top:12px">Buscar movimentações</label>'+
    '<input id="estHistBusca" class="estHistBusca" type="search" placeholder="Material, local, tipo, data ou documento..." autocomplete="off" style="width:100%;min-width:0;box-sizing:border-box;font-size:16px">'+
    '<div class="muted estHistStatus" aria-live="polite" style="margin:8px 0"></div>'+
    '<div class="estHist estHistLista"></div></div>';
  document.body.appendChild(b);
  const campo=b.querySelector('.estHistBusca'),periodo=b.querySelector('.estHistPeriodo'),
    datas=b.querySelector('.estHistDatas'),de=b.querySelector('.estHistDe'),
    ate=b.querySelector('.estHistAte'),status=b.querySelector('.estHistStatus'),
    lista=b.querySelector('.estHistLista');
  b.querySelector('.estHistFechar').onclick=()=>b.remove();
  const localDia=d=>{const v=new Date();v.setHours(12,0,0,0);v.setDate(v.getDate()-d);return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0')};
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  de.value=localDia(29);ate.value=localDia(0);
  let xs=[],estornados=new Set(),mats=[],ests=[],versao=0;
  const matNome=id=>mats.find(x=>String(x.id)===String(id))?.nome||'Material';
  const estNome=id=>ests.find(x=>String(x.id)===String(id))?.nome||'Estoque';
  const mostrar=()=>{
    if(!b.isConnected)return;
    const q=norm(campo.value).trim();
    const rows=q?xs.filter(x=>norm([x.tipo,matNome(x.material_id),estNome(x.estoque_origem_id),
      estNome(x.estoque_destino_id),x.data,x.criado_em,x.documento,x.observacoes,
      x.quantidade,x.obra_id].join(' ')).includes(q)):xs;
    status.textContent=rows.length+' movimentação(ões) encontrada(s)'+
      (xs.length>=500?' · exibindo até 500 registros do período':'');
    lista.innerHTML=rows.length?rows.map(x=>'<div class="item"><b>'+
      esc(String(x.tipo||'').toUpperCase())+' · '+esc(matNome(x.material_id))+
      (estornados.has(String(x.id))?' · ESTORNADA':'')+'</b><div class="muted">'+
      esc(x.data||'')+' · '+qtd(x.quantidade)+' · '+esc(estNome(x.estoque_origem_id))+
      (x.estoque_destino_id?' → '+esc(estNome(x.estoque_destino_id)):'')+
      (x.documento?' · '+esc(x.documento):'')+'</div>'+
      (x.tipo==='saida'&&!x.estorno_de_id&&!estornados.has(String(x.id))?
        '<div class="actions"><button class="btn estornar" type="button" data-id="'+esc(x.id)+'">Estornar saída</button></div>':'')+
      '</div>').join(''):'<div class="muted">Nenhuma movimentação encontrada neste período.</div>';
  };
  let backend=null,emp='';
  async function carregar(){
    const ordem=++versao;
    if(!b.isConnected)return;
    const modo=periodo.value;
    const inicio=modo==='30'?localDia(29):modo==='90'?localDia(89):modo==='custom'?de.value:null;
    const fim=modo==='custom'?ate.value:localDia(0);
    if(modo==='custom'&&(!inicio||!fim||inicio>fim)){
      status.textContent='Informe uma data inicial e uma final válidas.';lista.textContent='';return;
    }
    status.textContent='Carregando movimentações...';
    try{
      if(!backend){const p=await OBRIX_BACKEND.profile();if(!p?.empresa_id)throw Error('Conta não identificada. Entre novamente.');emp=p.empresa_id;backend=await OBRIX_BACKEND.init()}
      const query=backend.from('estoque_movimentacoes').select('*').eq('empresa_id',emp);
      if(inicio)query.gte('data',inicio);
      if(fim&&modo!=='all')query.lte('data',fim);
      const [movimentos,materiais,locais]=await Promise.all([
        query.order('data',{ascending:false}).limit(500),
        mats.length?Promise.resolve({data:mats,error:null}):backend.from('materiais').select('id,nome').eq('empresa_id',emp),
        ests.length?Promise.resolve({data:ests,error:null}):backend.from('estoques').select('id,nome').eq('empresa_id',emp)
      ]);
      if(movimentos.error)throw movimentos.error;
      if(materiais.error)throw materiais.error;
      if(locais.error)throw locais.error;
      if(!b.isConnected||ordem!==versao)return;
      xs=movimentos.data||[];mats=materiais.data||[];ests=locais.data||[];
      estornados=new Set(xs.filter(x=>x.estorno_de_id).map(x=>String(x.estorno_de_id)));
      const ids=xs.filter(x=>x.tipo==='saida'&&!estornados.has(String(x.id))).map(x=>x.id);
      for(let i=0;i<ids.length;i+=100){
        const {data,error}=await backend.from('estoque_movimentacoes').select('estorno_de_id')
          .eq('empresa_id',emp).in('estorno_de_id',ids.slice(i,i+100));
        if(error)throw error;
        if(!b.isConnected||ordem!==versao)return;
        (data||[]).forEach(x=>{if(x.estorno_de_id)estornados.add(String(x.estorno_de_id))});
      }
      if(ordem===versao)mostrar();
    }catch(e){
      if(b.isConnected&&ordem===versao){status.textContent='Não foi possível carregar o histórico: '+String(window.OBRIX_PT_ERROR?.(e)??e?.message??e);lista.textContent=''}
    }
  }
  periodo.addEventListener('change',()=>{
    datas.hidden=periodo.value!=='custom';
    datas.style.display=periodo.value==='custom'?'grid':'none';
    if(periodo.value==='custom'){de.value=localDia(30);ate.value=localDia(0)}
    void carregar();
  });
  [de,ate].forEach(el=>el.addEventListener('change',()=>{if(periodo.value==='custom')void carregar()}));
  campo.addEventListener('input',mostrar);
  lista.addEventListener('click',e=>{
    const btn=e.target.closest?.('button.estornar');if(!btn)return;
    e.preventDefault();e.stopPropagation();
    void estornar(btn.dataset.id,btn);
  });
  await carregar();
}
window.addEventListener('click',e=>{const x=e.target.closest?.('[data-est="historico"]');if(!x)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();historico()},true);window.OBRIX_ESTORNO={historico,estornar};})();