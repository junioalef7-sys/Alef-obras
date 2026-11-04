(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qtd=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let sb,materiais=[],saldos=[],fornecedores=[],compras=[];
const mat=id=>materiais.find(x=>x.id===id)||null;
const fornecedorNome=id=>fornecedores.find(x=>x.id===id)?.nome||'Fornecedor';
const inteiro=id=>['un','unidade','unidades','saco','sacos','cx','caixa','caixas'].includes(String(mat(id)?.unidade||'').toLowerCase());
function show(el,text,ok=true){el.textContent=text;el.className='status '+(ok?'ok':'err');el.classList.remove('hidden')}
function saldoTotal(materialId){return saldos.filter(s=>s.material_id===materialId).reduce((a,s)=>a+Number(s.quantidade||0),0)}
function alertasEstoque(){
  return materiais.filter(m=>m.ativo!==false&&Number(m.estoque_minimo||0)>0).map(m=>{
    const saldo=saldoTotal(m.id),min=Number(m.estoque_minimo||0),falta=Math.max(min-saldo,0);
    return {...m,saldo,min,falta};
  }).filter(x=>x.falta>0).sort((a,b)=>b.falta-a.falta);
}
function preencherMaterial(preservar){
  const alertas=alertasEstoque();
  const anterior=preservar||$('material').value;
  $('material').innerHTML=alertas.length?alertas.map(a=>`<option value="${a.id}">${esc(a.nome)} · faltam ${qtd(a.falta)} ${esc(a.unidade||'un')}</option>`).join(''):'<option value="">Nenhum material em alerta</option>';
  if(anterior&&alertas.some(a=>a.id===anterior))$('material').value=anterior;
  atualizarSugestao();
}
function preencherFornecedores(){
  const atual=$('fornecedor').value;
  $('fornecedor').innerHTML='<option value="">Selecione ou cadastre abaixo</option>'+fornecedores.filter(f=>f.ativo!==false).map(f=>`<option value="${f.id}">${esc(f.nome)}</option>`).join('');
  if(atual&&fornecedores.some(f=>f.id===atual))$('fornecedor').value=atual;
}
function atualizarSugestao(){
  const id=$('material').value,a=alertasEstoque().find(x=>x.id===id);
  if(!a){$('quantidade').value='';$('valorUnitario').value='';return;}
  $('quantidade').step=inteiro(id)?'1':'0.001';
  $('quantidade').min=inteiro(id)?'1':'0.001';
  $('quantidade').inputMode=inteiro(id)?'numeric':'decimal';
  $('quantidade').value=inteiro(id)?String(Math.ceil(a.falta)):String(Number(a.falta.toFixed(3)));
  $('valorUnitario').value=Number(a.custo_medio||0).toFixed(2);
}
function render(){
  const alertas=alertasEstoque();
  $('kAlertas').textContent=alertas.length;
  $('kRascunhos').textContent=compras.filter(c=>c.status==='rascunho').length;
  $('kFornecedores').textContent=fornecedores.filter(f=>f.ativo!==false).length;
  preencherMaterial();
  preencherFornecedores();
  $('alertas').innerHTML=alertas.length?alertas.map(a=>`<div class="warn"><b>${esc(a.nome)}</b><br><span class="muted">Saldo total ${qtd(a.saldo)} ${esc(a.unidade||'un')} · mínimo ${qtd(a.min)} · comprar ${qtd(a.falta)} ${esc(a.unidade||'un')}</span></div>`).join(''):'<div class="status ok">Nenhum material abaixo do estoque mínimo.</div>';
  const recentes=[...compras].sort((a,b)=>String(b.criado_em||'').localeCompare(String(a.criado_em||''))).slice(0,20);
  $('pedidos').innerHTML=recentes.length?recentes.map(c=>`<div class="row"><b>Pedido #${esc(c.numero_pedido)}</b> · ${esc(c.status||'rascunho')}<br><span class="muted">${esc(fornecedorNome(c.fornecedor_id))} · ${money(c.valor_total)} · ${esc(c.data_compra||'')}</span></div>`).join(''):'Nenhum pedido criado ainda.';
}
async function carregar(preservarMaterial){
  await OBRIX_BACKEND.profile();
  [materiais,saldos,fornecedores,compras]=await Promise.all([
    OBRIX_BACKEND.readTable('materiais','criado_em'),
    OBRIX_BACKEND.readTable('estoque_saldos','atualizado_em'),
    OBRIX_BACKEND.readTable('fornecedores','criado_em'),
    OBRIX_BACKEND.readTable('compras','criado_em')
  ]);
  $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');
  render();
  if(preservarMaterial&&alertasEstoque().some(a=>a.id===preservarMaterial)){$('material').value=preservarMaterial;atualizarSugestao();}
}
async function login(){
  try{const b=$('loginBtn');b.disabled=true;b.textContent='Entrando...';sb=await OBRIX_BACKEND.init();const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;await carregar();}
  catch(e){show($('loginStatus'),'Erro: '+(e.message||e),false)}
  finally{$('loginBtn').disabled=false;$('loginBtn').textContent='Entrar'}
}
async function gerar(){
  const material=$('material').value;
  const quantidade=Number($('quantidade').value);
  const valor=Number($('valorUnitario').value||0);
  const fornecedorId=$('fornecedor').value||null;
  const novo=$('novoFornecedor').value.trim();
  if(!material)return show($('status'),'Não há material em alerta selecionado.',false);
  if(!Number.isFinite(quantidade)||quantidade<=0)return show($('status'),'Informe uma quantidade válida.',false);
  if(inteiro(material)&&quantidade!==Math.trunc(quantidade))return show($('status'),'Este material só aceita quantidade inteira.',false);
  if(!fornecedorId&&!novo)return show($('status'),'Selecione um fornecedor ou informe um novo fornecedor.',false);
  if(!Number.isFinite(valor)||valor<0)return show($('status'),'Informe um valor unitário válido.',false);
  try{
    const b=$('gerarBtn');b.disabled=true;b.textContent='Gerando pedido...';
    sb=sb||await OBRIX_BACKEND.init();
    const {data,error}=await sb.rpc('obrix_criar_reposicao_estoque',{
      p_material_id:material,
      p_quantidade:quantidade,
      p_fornecedor_id:novo?null:fornecedorId,
      p_fornecedor_nome:novo||null,
      p_valor_unitario:valor,
      p_observacoes:$('observacoes').value.trim()||null
    });
    if(error)throw error;
    show($('status'),'Pedido de reposição criado em rascunho com sucesso. O estoque ainda não foi alterado.');
    $('novoFornecedor').value='';$('observacoes').value='';
    await carregar(material);
  }catch(e){show($('status'),'Erro: '+(e.message||e),false)}
  finally{$('gerarBtn').disabled=false;$('gerarBtn').textContent='Gerar pedido de reposição'}
}
$('loginBtn').addEventListener('click',login);
$('gerarBtn').addEventListener('click',gerar);
$('material').addEventListener('change',atualizarSugestao);
(async()=>{try{sb=await OBRIX_BACKEND.init();const {data}=await sb.auth.getSession();if(data?.session)await carregar();}catch(e){show($('loginStatus'),'Erro ao carregar: '+(e.message||e),false)}})();
})();
