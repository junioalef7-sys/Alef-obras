(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const qtd=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let sb,compras=[],itens=[],estoques=[],materiais=[],fornecedores=[];
const matNome=id=>materiais.find(x=>x.id===id)?.nome||'Material';
const fornecedorNome=id=>fornecedores.find(x=>x.id===id)?.nome||'Fornecedor';
function show(el,text,ok=true){el.textContent=text;el.className='status '+(ok?'ok':'err');el.classList.remove('hidden')}
function pendentes(){return compras.filter(c=>c.status!=='cancelada'&&!c.estoque_processado)}
function recebidas(){return compras.filter(c=>c.estoque_processado)}
function itensCompra(id){return itens.filter(i=>i.compra_id===id)}
function optionExists(select,value){return [...select.options].some(o=>o.value===value)}
function preencherSelects(){
  const compraAtual=$('compra').value;
  const estoqueAtual=$('estoque').value;
  const ps=pendentes();
  $('compra').innerHTML=ps.length?ps.map(c=>`<option value="${c.id}">Pedido #${esc(c.numero_pedido)} · ${esc(fornecedorNome(c.fornecedor_id))} · ${money(c.valor_total)}</option>`).join(''):'<option value="">Nenhum pedido pendente</option>';
  $('estoque').innerHTML=estoques.filter(e=>e.ativo!==false).map(e=>`<option value="${e.id}">${esc(e.nome)}</option>`).join('')||'<option value="">Nenhum local ativo</option>';
  if(compraAtual&&optionExists($('compra'),compraAtual))$('compra').value=compraAtual;
  if(estoqueAtual&&optionExists($('estoque'),estoqueAtual))$('estoque').value=estoqueAtual;
  atualizarDetalhes();
}
function atualizarDetalhes(){
  const id=$('compra').value;
  const c=compras.find(x=>x.id===id);
  if(!c){$('detalhes').textContent='Selecione um pedido para ver os itens.';return;}
  const linhas=itensCompra(id);
  const texto=linhas.length?linhas.map(i=>`${i.descricao||matNome(i.material_id)}: ${qtd(i.quantidade)} ${i.unidade||'un'} × ${money(i.valor_unitario)} = ${money(i.valor_total)}`).join('\n'):'Nenhum item encontrado.';
  $('detalhes').textContent=`Pedido #${c.numero_pedido} · ${fornecedorNome(c.fornecedor_id)}\n${texto}\nTotal: ${money(c.valor_total)}`;
}
function render(){
  const ps=pendentes(),rs=recebidas();
  $('kPendentes').textContent=ps.length;
  $('kRecebidas').textContent=rs.length;
  $('kEstoques').textContent=estoques.filter(e=>e.ativo!==false).length;
  preencherSelects();
  $('pendentes').innerHTML=ps.length?ps.map(c=>`<div class="pedido"><b>Pedido #${esc(c.numero_pedido)}</b><br><span class="muted">${esc(fornecedorNome(c.fornecedor_id))} · ${money(c.valor_total)} · ${esc(c.status||'rascunho')}</span></div>`).join(''):'<div class="status ok">Nenhum pedido aguardando recebimento.</div>';
  const ult=[...rs].sort((a,b)=>String(b.atualizado_em||'').localeCompare(String(a.atualizado_em||''))).slice(0,20);
  $('recebidas').innerHTML=ult.length?ult.map(c=>`<div class="pedido"><b>Pedido #${esc(c.numero_pedido)}</b><br><span class="muted">${esc(fornecedorNome(c.fornecedor_id))} · ${money(c.valor_total)} · recebido</span></div>`).join(''):'Nenhum recebimento registrado ainda.';
}
async function carregar(){
  await OBRIX_BACKEND.profile();
  [compras,itens,estoques,materiais,fornecedores]=await Promise.all([
    OBRIX_BACKEND.readTable('compras','criado_em'),
    OBRIX_BACKEND.readTable('compra_itens','criado_em'),
    OBRIX_BACKEND.readTable('estoques','criado_em'),
    OBRIX_BACKEND.readTable('materiais','criado_em'),
    OBRIX_BACKEND.readTable('fornecedores','criado_em')
  ]);
  $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');
  render();
}
async function login(){
  try{const b=$('loginBtn');b.disabled=true;b.textContent='Entrando...';sb=await OBRIX_BACKEND.init();const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;await carregar();}
  catch(e){show($('loginStatus'),'Erro: '+(e.message||e),false)}
  finally{$('loginBtn').disabled=false;$('loginBtn').textContent='Entrar'}
}
async function receber(){
  const compra=$('compra').value,estoque=$('estoque').value;
  if(!compra)return show($('status'),'Não há pedido selecionado para receber.',false);
  if(!estoque)return show($('status'),'Selecione o local onde o material será armazenado.',false);
  const c=compras.find(x=>x.id===compra);
  if(!c||c.estoque_processado)return show($('status'),'Este pedido já foi recebido ou não está disponível.',false);
  try{
    const b=$('receberBtn');b.disabled=true;b.textContent='Recebendo...';
    sb=sb||await OBRIX_BACKEND.init();
    const {error}=await sb.rpc('obrix_receber_compra',{
      p_compra_id:compra,
      p_estoque_id:estoque,
      p_nota_fiscal:$('notaFiscal').value.trim()||null,
      p_numero_documento:$('documento').value.trim()||null
    });
    if(error)throw error;
    show($('status'),'Compra recebida com sucesso. Os materiais já foram adicionados ao estoque selecionado.');
    $('notaFiscal').value='';$('documento').value='';
    await carregar();
  }catch(e){show($('status'),'Erro: '+(e.message||e),false)}
  finally{$('receberBtn').disabled=false;$('receberBtn').textContent='Confirmar recebimento'}
}
$('loginBtn').addEventListener('click',login);
$('receberBtn').addEventListener('click',receber);
$('compra').addEventListener('change',atualizarDetalhes);
(async()=>{try{sb=await OBRIX_BACKEND.init();const {data}=await sb.auth.getSession();if(data?.session)await carregar();}catch(e){show($('loginStatus'),'Erro ao carregar: '+(e.message||e),false)}})();
})();
