(()=>{
'use strict';
const $=id=>document.getElementById(id);
const qtd=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
let sb,materiais=[],estoques=[],saldos=[],movimentos=[];
const mat=id=>materiais.find(x=>x.id===id)||null;
const matNome=id=>mat(id)?.nome||'Material';
const estNome=id=>estoques.find(x=>x.id===id)?.nome||'Estoque';
const inteiroMaterial=id=>['un','unidade','unidades','saco','sacos','cx','caixa','caixas'].includes(String(mat(id)?.unidade||'').toLowerCase());
function show(el,text,ok=true){el.textContent=text;el.className='status '+(ok?'ok':'err');el.classList.remove('hidden')}
function saldo(materialId,estoqueId){return Number(saldos.find(s=>s.material_id===materialId&&s.estoque_id===estoqueId)?.quantidade||0)}
function atualizarCampos(){
  const m=$('material').value,e=$('estoque').value;
  const atual=saldo(m,e),real=Number($('quantidadeReal').value||0),dif=real-atual;
  $('saldoAtual').textContent=qtd(atual);
  $('diferenca').textContent=(dif>0?'+':'')+qtd(dif);
  $('quantidadeReal').step=inteiroMaterial(m)?'1':'0.001';
  $('quantidadeReal').inputMode=inteiroMaterial(m)?'numeric':'decimal';
}
function render(){
  $('material').innerHTML=materiais.filter(x=>x.ativo!==false).map(x=>`<option value="${x.id}">${x.nome} (${x.unidade||'un'})</option>`).join('');
  $('estoque').innerHTML=estoques.filter(x=>x.ativo!==false).map(x=>`<option value="${x.id}">${x.nome}</option>`).join('');
  $('saldos').innerHTML=saldos.length?saldos.map(s=>`<div class="row"><b>${matNome(s.material_id)}</b><br><span class="muted">${estNome(s.estoque_id)} · saldo ${qtd(s.quantidade)}</span></div>`).join(''):'Nenhum saldo registrado.';
  const ajustes=movimentos.filter(m=>m.tipo==='ajuste').slice(0,20);
  $('movimentos').innerHTML=ajustes.length?ajustes.map(m=>`<div class="row"><b>${matNome(m.material_id)} · ${qtd(m.quantidade)}</b><br><span class="muted">${m.estoque_destino_id?'Acréscimo':'Redução'} · ${estNome(m.estoque_destino_id||m.estoque_origem_id)} · ${m.data||''}</span></div>`).join(''):'Nenhum ajuste registrado.';
  atualizarCampos();
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
async function ajustar(){
  const material=$('material').value,estoque=$('estoque').value,real=Number($('quantidadeReal').value);
  if(!material||!estoque)return show($('status'),'Selecione material e local de estoque.',false);
  if(!Number.isFinite(real)||real<0)return show($('status'),'Informe uma quantidade real válida.',false);
  if(inteiroMaterial(material)&&real!==Math.trunc(real))return show($('status'),'Este material só aceita quantidade inteira.',false);
  const atual=saldo(material,estoque);
  if(real===atual)return show($('status'),'A quantidade informada já é igual ao saldo atual. Nenhum ajuste é necessário.',false);
  try{
    const b=$('ajustarBtn');b.disabled=true;b.textContent='Ajustando...';
    sb=sb||await OBRIX_BACKEND.init();
    const {error}=await sb.rpc('obrix_ajustar_estoque',{p_material_id:material,p_estoque_id:estoque,p_quantidade_real:real,p_data:$('data').value||null,p_documento:$('documento').value.trim()||null,p_observacoes:$('observacoes').value.trim()||null});
    if(error)throw error;
    show($('status'),'Ajuste registrado com sucesso.');
    $('quantidadeReal').value='';$('documento').value='';$('observacoes').value='';
    await carregar();
  }catch(e){show($('status'),'Erro: '+(e.message||e),false)}
  finally{$('ajustarBtn').disabled=false;$('ajustarBtn').textContent='Confirmar ajuste'}
}
$('loginBtn').addEventListener('click',login);
$('ajustarBtn').addEventListener('click',ajustar);
['material','estoque','quantidadeReal'].forEach(id=>$(id).addEventListener('input',atualizarCampos));
$('data').value=new Date().toISOString().slice(0,10);
(async()=>{try{sb=await OBRIX_BACKEND.init();const {data}=await sb.auth.getSession();if(data?.session)await carregar();}catch(e){show($('loginStatus'),'Erro ao carregar: '+(e.message||e),false)}})();
})();
