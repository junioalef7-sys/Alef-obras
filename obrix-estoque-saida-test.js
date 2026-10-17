(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(String(v??'0').replace(/\./g,'').replace(',','.'))||0;
  const qtd=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  let perfil=null,materiais=[],estoques=[],saldos=[],movimentos=[];

  async function init(){return OBRIX_BACKEND.init();}
  function st(msg,erro=false){$('status').textContent=msg;$('status').style.color=erro?'#9f1d20':'#166534';}
  function materialNome(id){return materiais.find(x=>x.id===id)?.nome||'Material';}
  function estoqueNome(id){return estoques.find(x=>x.id===id)?.nome||'Estoque';}

  async function carregar(){
    perfil=await OBRIX_BACKEND.profile();
    $('login').classList.add('hidden');
    $('app').classList.remove('hidden');
    [materiais,estoques,saldos,movimentos]=await Promise.all([
      OBRIX_BACKEND.readTable('materiais','criado_em'),
      OBRIX_BACKEND.readTable('estoques','criado_em'),
      OBRIX_BACKEND.readTable('estoque_saldos','atualizado_em'),
      OBRIX_BACKEND.readTable('estoque_movimentacoes','criado_em')
    ]);

    const mats=materiais.filter(x=>x.ativo!==false);
    const ests=estoques.filter(x=>x.ativo!==false);
    $('material').innerHTML='<option value="">Selecione</option>'+mats.map(x=>`<option value="${x.id}">${esc(x.nome)} (${esc(x.unidade||'un')})</option>`).join('');
    $('estoque').innerHTML='<option value="">Selecione</option>'+ests.map(x=>`<option value="${x.id}">${esc(x.nome)}</option>`).join('');
    $('data').value=new Date().toISOString().slice(0,10);
    render();
  }

  function saldoSelecionado(){
    const material_id=$('material').value,estoque_id=$('estoque').value;
    return saldos.find(x=>x.material_id===material_id&&x.estoque_id===estoque_id)||null;
  }

  function render(){
    $('saldos').innerHTML=saldos.length?saldos.map(s=>`<div class="row"><b>${esc(materialNome(s.material_id))}</b><br><span class="muted">${esc(estoqueNome(s.estoque_id))} · saldo ${qtd(s.quantidade)}</span></div>`).join(''):'Nenhum saldo registrado ainda.';
    const saidas=movimentos.filter(x=>x.tipo==='saida').slice(0,20);
    $('movimentos').innerHTML=saidas.length?saidas.map(m=>`<div class="row"><b>${esc(materialNome(m.material_id))} · ${qtd(m.quantidade)}</b><br><span class="muted">${esc(estoqueNome(m.estoque_origem_id))} · ${esc(m.data||'')} · custo ${money(m.custo_unitario||0)}${m.documento?' · doc. '+esc(m.documento):''}</span></div>`).join(''):'Nenhuma saída registrada ainda.';
    atualizarSaldoSelecionado();
  }

  function atualizarSaldoSelecionado(){
    const s=saldoSelecionado();
    const saldo=Number(s?.quantidade||0);
    $('saldoAtual').textContent=qtd(saldo);
    $('saldoAviso').textContent=s? (saldo<=0?'Sem saldo disponível.':'') : (($('material').value&&$('estoque').value)?'Este material não possui saldo neste local.':'');
    atualizarLimite();
  }

  function atualizarLimite(){
    const s=saldoSelecionado();
    const saldo=Number(s?.quantidade||0);
    const quantidade=num($('quantidade').value);
    if(quantidade>0&&quantidade>saldo){
      $('saldoAviso').textContent=`Quantidade maior que o saldo disponível (${qtd(saldo)}).`;
    }else if(saldo>0){
      $('saldoAviso').textContent='';
    }
  }

  async function registrar(){
    const btn=$('registrar');
    try{
      const material_id=$('material').value,estoque_id=$('estoque').value;
      const quantidade=num($('quantidade').value);
      const s=saldoSelecionado();
      const saldo=Number(s?.quantidade||0);

      if(!material_id)throw new Error('Selecione o material.');
      if(!estoque_id)throw new Error('Selecione o local de estoque.');
      if(quantidade<=0)throw new Error('Informe uma quantidade maior que zero.');
      if(!s)throw new Error('Saldo não encontrado para este material neste estoque.');
      if(quantidade>saldo)throw new Error(`Saldo insuficiente. Disponível: ${qtd(saldo)}.`);

      btn.disabled=true;
      btn.textContent='Registrando...';
      st('Registrando saída...');
      const sb=await init();
      const {error}=await sb.rpc('obrix_registrar_saida_estoque',{
        p_material_id:material_id,
        p_estoque_id:estoque_id,
        p_quantidade:quantidade,
        p_data:$('data').value||null,
        p_documento:$('documento').value.trim()||null,
        p_observacoes:$('observacoes').value.trim()||null
      });
      if(error)throw error;

      st('Saída registrada com sucesso.');
      $('quantidade').value='';
      $('documento').value='';
      $('observacoes').value='';
      [saldos,movimentos]=await Promise.all([
        OBRIX_BACKEND.readTable('estoque_saldos','atualizado_em'),
        OBRIX_BACKEND.readTable('estoque_movimentacoes','criado_em')
      ]);
      render();
    }catch(e){
      st('Erro: '+(e.message||e),true);
    }finally{
      btn.disabled=false;
      btn.textContent='Registrar saída';
    }
  }

  async function entrar(){
    const btn=$('entrar'),s=$('loginStatus');
    try{
      btn.disabled=true;
      btn.textContent='Entrando...';
      s.textContent='Autenticando...';
      const sb=await init();
      const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('senha').value});
      if(error)throw error;
      s.textContent='Login confirmado.';
      await carregar();
    }catch(e){
      s.textContent='Erro ao entrar: '+(e.message||e);
    }finally{
      btn.disabled=false;
      btn.textContent='Entrar';
    }
  }

  $('entrar').addEventListener('click',entrar);
  $('registrar').addEventListener('click',registrar);
  $('material').addEventListener('change',atualizarSaldoSelecionado);
  $('estoque').addEventListener('change',atualizarSaldoSelecionado);
  $('quantidade').addEventListener('input',atualizarLimite);

  (async()=>{
    try{
      const sb=await init();
      const {data,error}=await sb.auth.getSession();
      if(error)throw error;
      if(data?.session)await carregar();
    }catch(e){
      $('loginStatus').textContent='Erro ao carregar sessão: '+(e.message||e);
    }
  })();
})();
