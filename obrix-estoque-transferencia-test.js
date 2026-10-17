(()=>{
'use strict';
const $=id=>document.getElementById(id);
const qtd=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
let sb,materiais=[],estoques=[],saldos=[],movimentos=[];
const matNome=id=>materiais.find(x=>x.id===id)?.nome||'Material';
const estNome=id=>estoques.find(x=>x.id===id)?.nome||'Estoque';
function show(el,text,ok=true){el.textContent=text;el.className='status '+(ok?'ok':'err');el.classList.remove('hidden')}
function saldo(materialId,estoqueId){return Number(saldos.find(s=>s.material_id===materialId&&s.estoque_id===estoqueId)?.quantidade||0)}
function renderSelects(){
  $('material').innerHTML=materiais.filter(x=>x.ativo!==false).map(x=>`<option value="${x.id}">${x.nome}</option>`).join('');
  const opts=estoques.filter(x=>x.ativo!==false).map(x=>`<option value="${x.id}">${x.nome}</option>`).join('');
  $('origem').innerHTML=opts;$('destino').innerHTML=opts;
  if(estoques.length>1){$('origem').selectedIndex=0;$('destino').selectedIndex=1;}
  atualizarSaldos();
}
function atualizarSaldos(){
  $('saldoOrigem').textContent=qtd(saldo($('material').value,$('origem').value));
  $('saldoDestino').textContent=qtd(saldo($('material').value,$('destino').value));
}
function render(){
  renderSelects();
  $('saldos').innerHTML=saldos.length?saldos.map(s=>`<div class="row"><b>${matNome(s.material_id)}</b><br><span class="muted">${estNome(s.estoque_id)} · ${qtd(s.quantidade)}</span></div>`).join(''):'Nenhum saldo.';
  const trs=movimentos.filter(m=>m.tipo==='transferencia').slice(0,20);
  $('movimentos').innerHTML=trs.length?trs.map(m=>`<div class="row"><b>${matNome(m.material_id)} · ${qtd(m.quantidade)}</b><br><span class="muted">${estNome(m.estoque_origem_id)} → ${estNome(m.estoque_destino_id)} · ${m.data||''}</span></div>`).join(''):'Nenhuma transferência registrada.';
}
async function carregar(){
  await OBRIX_BACKEND.profile();
  [materiais,estoques,saldos,movimentos]=await Promise.all([
    OBRIX_BACKEND.readTable('materiais','criado_em'),
    OBRIX_BACKEND.readTable('estoques','criado_em'),
    OBRIX_BACKEND.readTable('estoque_saldos','atualizado_em'),
    OBRIX_BACKEND.readTable('estoque_movimentacoes','criado_em')
  ]);
  $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');
  render();
}
async function login(){
  try{const b=$('loginBtn');b.disabled=true;b.textContent='Entrando...';sb=await OBRIX_BACKEND.init();const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;await carregar();}
  catch(e){show($('loginStatus'),'Erro: '+(e.message||e),false)}
  finally{$('loginBtn').disabled=false;$('loginBtn').textContent='Entrar'}
}
async function transferir(){
  const material=$('material').value,origem=$('origem').value,destino=$('destino').value,q=Number($('quantidade').value);
  if(!material||!origem||!destino)return show($('status'),'Selecione material, origem e destino.',false);
  if(origem===destino)return show($('status'),'Origem e destino precisam ser diferentes.',false);
  if(!q||q<=0)return show($('status'),'Informe uma quantidade maior que zero.',false);
  const disp=saldo(material,origem);if(q>disp)return show($('status'),'Saldo insuficiente. Disponível: '+qtd(disp)+'.',false);
  try{const b=$('transferirBtn');b.disabled=true;b.textContent='Transferindo...';sb=sb||await OBRIX_BACKEND.init();const {error}=await sb.rpc('obrix_transferir_estoque',{p_material_id:material,p_estoque_origem_id:origem,p_estoque_destino_id:destino,p_quantidade:q,p_data:$('data').value||null,p_documento:$('documento').value.trim()||null,p_observacoes:$('observacoes').value.trim()||null});if(error)throw error;show($('status'),'Transferência registrada com sucesso.');$('quantidade').value='';$('documento').value='';$('observacoes').value='';await carregar();}
  catch(e){show($('status'),'Erro: '+(e.message||e),false)}
  finally{$('transferirBtn').disabled=false;$('transferirBtn').textContent='Transferir material'}
}
$('loginBtn').addEventListener('click',login);
$('transferirBtn').addEventListener('click',transferir);
['material','origem','destino'].forEach(id=>$(id).addEventListener('change',atualizarSaldos));
$('data').value=new Date().toISOString().slice(0,10);
(async()=>{try{sb=await OBRIX_BACKEND.init();const {data}=await sb.auth.getSession();if(data?.session)await carregar();}catch(e){show($('loginStatus'),'Erro ao carregar: '+(e.message||e),false)}})();
})();
