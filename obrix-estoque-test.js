(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(String(v??'0').replace(/\./g,'').replace(',','.'))||0;
  const qtd=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  let perfil=null, obras=[], materiais=[], estoques=[], saldos=[];

  async function init(){return OBRIX_BACKEND.init();}
  function status(id,msg,erro=false){const el=$(id);if(!el)return;el.textContent=msg;el.style.color=erro?'#9f1d20':'#166534';}
  function mostrarApp(){$('login').classList.add('hidden');$('app').classList.remove('hidden');}
  function obraNome(id){return obras.find(x=>x.id===id)?.nome||'Sem obra';}
  function materialNome(id){return materiais.find(x=>x.id===id)?.nome||'Material';}
  function estoqueNome(id){return estoques.find(x=>x.id===id)?.nome||'Estoque';}
  function saldoTotalMaterial(materialId){return saldos.filter(s=>s.material_id===materialId).reduce((a,s)=>a+Number(s.quantidade||0),0);}

  function garantirAreaAlertas(){
    const kMateriais=$('kMateriais');
    const kpis=kMateriais?.closest('.kpis');
    if(kpis&&!$('kAlertas')){
      const box=document.createElement('div');
      box.className='kpi';
      box.innerHTML='<span>Alertas de estoque</span><br><b id="kAlertas">0</b>';
      kpis.appendChild(box);
      kpis.style.gridTemplateColumns='repeat(4,1fr)';
    }
    if(!$('estoqueAlertasCard')){
      const saldosCard=$('listaSaldos')?.closest('.card');
      if(saldosCard){
        const card=document.createElement('div');
        card.className='card';
        card.id='estoqueAlertasCard';
        card.innerHTML='<h3>Alertas de estoque mínimo</h3><p class="muted">Materiais que chegaram ou ficaram abaixo do limite configurado.</p><div id="listaAlertasEstoque"></div>';
        saldosCard.parentNode.insertBefore(card,saldosCard);
      }
    }
  }

  function renderAlertas(matsAtivos){
    garantirAreaAlertas();
    const alertas=matsAtivos.map(m=>{
      const minimo=Number(m.estoque_minimo||0);
      const total=saldoTotalMaterial(m.id);
      return {m,minimo,total,falta:Math.max(0,minimo-total)};
    }).filter(x=>x.minimo>0&&x.total<=x.minimo)
      .sort((a,b)=>(a.total/a.minimo)-(b.total/b.minimo));

    if($('kAlertas'))$('kAlertas').textContent=String(alertas.length);
    const lista=$('listaAlertasEstoque');
    if(!lista)return;
    if(!alertas.length){
      lista.innerHTML='<div class="row"><b>Estoque em dia</b><br><span class="muted">Nenhum material está no limite mínimo.</span></div>';
      return;
    }
    lista.innerHTML=alertas.map(({m,minimo,total,falta})=>{
      const critico=total<=0;
      const statusTxt=critico?'SEM ESTOQUE':'ESTOQUE BAIXO';
      const cor=critico?'#9f1d20':'#92400e';
      return `<div class="row" style="border-left:4px solid ${cor};padding-left:12px"><b>${esc(m.nome)}</b> <span style="font-weight:800;color:${cor}">· ${statusTxt}</span><br><span class="muted">Saldo total ${qtd(total)} ${esc(m.unidade||'un')} · mínimo ${qtd(minimo)} · faltam ${qtd(falta)} para atingir o mínimo</span></div>`;
    }).join('');
  }

  async function carregar(){
    perfil=await OBRIX_BACKEND.profile();
    mostrarApp();
    [obras,materiais,estoques,saldos]=await Promise.all([
      OBRIX_BACKEND.readTable('obras','criado_em'),
      OBRIX_BACKEND.readTable('materiais','criado_em'),
      OBRIX_BACKEND.readTable('estoques','criado_em'),
      OBRIX_BACKEND.readTable('estoque_saldos','atualizado_em')
    ]);
    render();
  }

  function render(){
    const matsAtivos=materiais.filter(x=>x.ativo!==false);
    const estAtivos=estoques.filter(x=>x.ativo!==false);
    $('kMateriais').textContent=matsAtivos.length;
    $('kEstoques').textContent=estAtivos.length;
    $('kSaldos').textContent=saldos.filter(x=>Number(x.quantidade||0)>0).length;

    renderAlertas(matsAtivos);

    $('estObra').innerHTML='<option value="">Sem obra vinculada</option>'+obras.map(o=>`<option value="${o.id}">${esc(o.nome)}</option>`).join('');

    $('listaMateriais').innerHTML=materiais.length?materiais.map(m=>`<div class="row"><b>${esc(m.nome)}</b><br><span class="muted">${esc(m.categoria||'Sem categoria')} · ${esc(m.unidade||'un')} · mínimo ${qtd(m.estoque_minimo)} · custo médio ${money(m.custo_medio)} · ${m.ativo===false?'inativo':'ativo'}</span><div class="row-actions"><button class="secondary" type="button" data-editar-material="${m.id}">Editar</button>${m.ativo===false?`<button type="button" data-ativar-material="${m.id}">Ativar</button>`:`<button class="danger" type="button" data-desativar-material="${m.id}">Desativar</button>`}</div></div>`).join(''):'Nenhum material cadastrado.';

    $('listaEstoques').innerHTML=estoques.length?estoques.map(e=>`<div class="row"><b>${esc(e.nome)}</b><br><span class="muted">${esc(e.tipo)} · ${esc(obraNome(e.obra_id))} · ${e.ativo===false?'inativo':'ativo'}</span><div class="row-actions"><button class="secondary" type="button" data-editar-estoque="${e.id}">Editar</button>${e.ativo===false?`<button type="button" data-ativar-estoque="${e.id}">Ativar</button>`:`<button class="danger" type="button" data-desativar-estoque="${e.id}">Desativar</button>`}</div></div>`).join(''):'Nenhum local de estoque cadastrado.';

    $('listaSaldos').innerHTML=saldos.length?saldos.map(s=>`<div class="row"><b>${esc(materialNome(s.material_id))}</b><br><span class="muted">${esc(estoqueNome(s.estoque_id))} · saldo ${qtd(s.quantidade)}</span></div>`).join(''):'Nenhum saldo registrado ainda.';
  }

  function limparMaterial(){
    $('materialId').value='';$('matNome').value='';$('matCategoria').value='';$('matUnidade').value='un';$('matMinimo').value='0';$('matCusto').value='0';$('salvarMaterial').textContent='Salvar material';status('matStatus','');
  }
  function limparEstoque(){
    $('estoqueId').value='';$('estNome').value='';$('estTipo').value='geral';$('estObra').value='';$('salvarEstoque').textContent='Salvar local';status('estStatus','');
  }

  async function salvarMaterial(){
    const btn=$('salvarMaterial');
    try{
      const nome=$('matNome').value.trim();
      if(!nome)throw new Error('Informe o nome do material.');
      const sb=await init();
      const id=$('materialId').value;
      const payload={empresa_id:perfil.empresa_id,nome,categoria:$('matCategoria').value.trim()||null,unidade:$('matUnidade').value||'un',estoque_minimo:num($('matMinimo').value),custo_medio:num($('matCusto').value),ativo:true};
      btn.disabled=true;btn.textContent='Salvando...';
      const q=id?sb.from('materiais').update(payload).eq('id',id):sb.from('materiais').insert(payload);
      const {error}=await q;if(error)throw error;
      status('matStatus',id?'Material atualizado.':'Material cadastrado.');
      limparMaterial();
      materiais=await OBRIX_BACKEND.readTable('materiais','criado_em');render();
    }catch(e){status('matStatus','Erro: '+(e.message||e),true);}finally{btn.disabled=false;if(!$('materialId').value)btn.textContent='Salvar material';}
  }

  async function salvarEstoque(){
    const btn=$('salvarEstoque');
    try{
      const nome=$('estNome').value.trim();
      if(!nome)throw new Error('Informe o nome do local.');
      const tipo=$('estTipo').value||'geral';
      const obra_id=$('estObra').value||null;
      if(tipo==='obra'&&!obra_id)throw new Error('Selecione a obra para um estoque do tipo Obra.');
      const sb=await init();
      const id=$('estoqueId').value;
      const payload={empresa_id:perfil.empresa_id,nome,tipo,obra_id,ativo:true};
      btn.disabled=true;btn.textContent='Salvando...';
      const q=id?sb.from('estoques').update(payload).eq('id',id):sb.from('estoques').insert(payload);
      const {error}=await q;if(error)throw error;
      status('estStatus',id?'Local atualizado.':'Local cadastrado.');
      limparEstoque();
      estoques=await OBRIX_BACKEND.readTable('estoques','criado_em');render();
    }catch(e){status('estStatus','Erro: '+(e.message||e),true);}finally{btn.disabled=false;if(!$('estoqueId').value)btn.textContent='Salvar local';}
  }

  async function mudarAtivo(tabela,id,ativo){
    try{
      const sb=await init();
      const {error}=await sb.from(tabela).update({ativo}).eq('id',id);if(error)throw error;
      if(tabela==='materiais')materiais=await OBRIX_BACKEND.readTable('materiais','criado_em');
      else estoques=await OBRIX_BACKEND.readTable('estoques','criado_em');
      render();
    }catch(e){alert('Erro: '+(e.message||e));}
  }

  function editarMaterial(id){
    const m=materiais.find(x=>x.id===id);if(!m)return;
    $('materialId').value=m.id;$('matNome').value=m.nome||'';$('matCategoria').value=m.categoria||'';$('matUnidade').value=m.unidade||'un';$('matMinimo').value=String(m.estoque_minimo??0).replace('.',',');$('matCusto').value=String(m.custo_medio??0).replace('.',',');$('salvarMaterial').textContent='Atualizar material';window.scrollTo({top:0,behavior:'smooth'});
  }
  function editarEstoque(id){
    const e=estoques.find(x=>x.id===id);if(!e)return;
    $('estoqueId').value=e.id;$('estNome').value=e.nome||'';$('estTipo').value=e.tipo||'geral';$('estObra').value=e.obra_id||'';$('salvarEstoque').textContent='Atualizar local';window.scrollTo({top:0,behavior:'smooth'});
  }

  async function entrar(){
    const btn=$('entrar'),st=$('loginStatus');
    try{btn.disabled=true;btn.textContent='Entrando...';st.textContent='Autenticando...';const sb=await init();const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('senha').value});if(error)throw error;st.textContent='Login confirmado.';await carregar();}
    catch(e){st.textContent='Erro ao entrar: '+(e.message||e);}finally{btn.disabled=false;btn.textContent='Entrar';}
  }

  function tab(nome){const mats=nome==='materiais';$('painelMateriais').classList.toggle('hidden',!mats);$('painelEstoques').classList.toggle('hidden',mats);$('tabMateriais').classList.toggle('active',mats);$('tabEstoques').classList.toggle('active',!mats);}

  $('entrar').addEventListener('click',entrar);
  $('tabMateriais').addEventListener('click',()=>tab('materiais'));
  $('tabEstoques').addEventListener('click',()=>tab('estoques'));
  $('salvarMaterial').addEventListener('click',salvarMaterial);
  $('cancelarMaterial').addEventListener('click',limparMaterial);
  $('salvarEstoque').addEventListener('click',salvarEstoque);
  $('cancelarEstoque').addEventListener('click',limparEstoque);
  document.addEventListener('click',e=>{
    const em=e.target.closest?.('[data-editar-material]');if(em)return editarMaterial(em.dataset.editarMaterial);
    const dm=e.target.closest?.('[data-desativar-material]');if(dm)return mudarAtivo('materiais',dm.dataset.desativarMaterial,false);
    const am=e.target.closest?.('[data-ativar-material]');if(am)return mudarAtivo('materiais',am.dataset.ativarMaterial,true);
    const ee=e.target.closest?.('[data-editar-estoque]');if(ee)return editarEstoque(ee.dataset.editarEstoque);
    const de=e.target.closest?.('[data-desativar-estoque]');if(de)return mudarAtivo('estoques',de.dataset.desativarEstoque,false);
    const ae=e.target.closest?.('[data-ativar-estoque]');if(ae)return mudarAtivo('estoques',ae.dataset.ativarEstoque,true);
  });

  (async()=>{try{const sb=await init();const {data,error}=await sb.auth.getSession();if(error)throw error;if(data?.session)await carregar();}catch(e){$('loginStatus').textContent='Erro ao carregar sessão: '+(e.message||e);}})();
})();
