(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const qtd=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:3});
let sb,compras=[],itens=[],fornecedores=[];
const fornecedorNome=id=>fornecedores.find(f=>f.id===id)?.nome||'Fornecedor';
const itensCompra=id=>itens.filter(i=>i.compra_id===id);
function show(el,text,ok=true){el.textContent=text;el.className='status '+(ok?'ok':'err');el.classList.remove('hidden')}
function hojeLocal(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
function pendentes(){return compras.filter(c=>c.status==='recebida'&&c.estoque_processado===true&&c.financeiro_processado!==true)}
function pagas(){return compras.filter(c=>c.status==='paga'||c.financeiro_processado===true).sort((a,b)=>String(b.atualizado_em||b.criado_em||'').localeCompare(String(a.atualizado_em||a.criado_em||'')))}
function preencherCompra(preservar){
  const lista=pendentes();
  const anterior=preservar||$('compra').value;
  $('compra').innerHTML=lista.length?lista.map(c=>`<option value="${c.id}">Pedido #${esc(c.numero_pedido)} · ${esc(fornecedorNome(c.fornecedor_id))} · ${money(c.valor_total)}</option>`).join(''):'<option value="">Nenhuma compra aguardando pagamento</option>';
  if(anterior&&lista.some(c=>c.id===anterior))$('compra').value=anterior;
  atualizarDetalhes();
}
function atualizarDetalhes(){
  const c=compras.find(x=>x.id===$('compra').value);
  if(!c){$('detalhes').textContent='Nenhuma compra recebida aguardando pagamento.';return;}
  const its=itensCompra(c.id);
  const linhas=its.map(i=>`${i.descricao}: ${qtd(i.quantidade)} ${i.unidade||'un'} × ${money(i.valor_unitario)} = ${money(i.valor_total)}`).join('\n');
  $('detalhes').textContent=`Pedido #${c.numero_pedido}\nFornecedor: ${fornecedorNome(c.fornecedor_id)}\nValor total: ${money(c.valor_total)}${linhas?'\n\nItens:\n'+linhas:''}`;
}
function render(){
  const p=pendentes(),pg=pagas();
  $('kPendentes').textContent=p.length;
  $('kTotal').textContent=money(p.reduce((a,c)=>a+Number(c.valor_total||0),0));
  $('kPagas').textContent=pg.length;
  preencherCompra();
  $('pendentes').innerHTML=p.length?p.map(c=>`<div class="pedido"><b>Pedido #${esc(c.numero_pedido)}</b><br><span class="muted">${esc(fornecedorNome(c.fornecedor_id))} · ${money(c.valor_total)} · recebida em ${esc(c.data_compra||'')}</span></div>`).join(''):'<div class="status ok">Nenhuma compra aguardando pagamento.</div>';
  $('pagas').innerHTML=pg.length?pg.slice(0,20).map(c=>`<div class="row"><b>Pedido #${esc(c.numero_pedido)}</b> · pago<br><span class="muted">${esc(fornecedorNome(c.fornecedor_id))} · ${money(c.valor_total)} · ${esc(c.forma_pagamento||'forma não informada')}</span></div>`).join(''):'Nenhuma compra paga ainda.';
}
async function carregar(preservar){
  await OBRIX_BACKEND.profile();
  [compras,itens,fornecedores]=await Promise.all([
    OBRIX_BACKEND.readTable('compras','criado_em'),
    OBRIX_BACKEND.readTable('compra_itens','criado_em'),
    OBRIX_BACKEND.readTable('fornecedores','criado_em')
  ]);
  $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');
  render();
  if(preservar&&pendentes().some(c=>c.id===preservar)){$('compra').value=preservar;atualizarDetalhes();}
}
async function login(){
  try{const b=$('loginBtn');b.disabled=true;b.textContent='Entrando...';sb=await OBRIX_BACKEND.init();const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;await carregar();}
  catch(e){show($('loginStatus'),'Erro: '+(e.message||e),false)}
  finally{$('loginBtn').disabled=false;$('loginBtn').textContent='Entrar'}
}
async function pagar(){
  const compra=$('compra').value,forma=$('forma').value,data=$('dataPagamento').value;
  if(!compra)return show($('status'),'Não há compra recebida selecionada para pagamento.',false);
  if(!forma)return show($('status'),'Informe a forma de pagamento.',false);
  if(!data)return show($('status'),'Informe a data do pagamento.',false);
  const c=compras.find(x=>x.id===compra);
  if(!c||c.status!=='recebida'||c.estoque_processado!==true||c.financeiro_processado===true)return show($('status'),'Esta compra não está disponível para pagamento.',false);
  try{
    const b=$('pagarBtn');b.disabled=true;b.textContent='Registrando pagamento...';
    sb=sb||await OBRIX_BACKEND.init();
    const {error}=await sb.rpc('obrix_pagar_compra',{
      p_compra_id:compra,
      p_forma_pagamento:forma,
      p_data_pagamento:data,
      p_numero_documento:$('documento').value.trim()||null
    });
    if(error)throw error;
    show($('status'),'Pagamento registrado com sucesso. A despesa foi lançada no Financeiro e o estoque não foi alterado novamente.');
    $('documento').value='';
    await carregar();
  }catch(e){show($('status'),'Erro: '+(e.message||e),false)}
  finally{$('pagarBtn').disabled=false;$('pagarBtn').textContent='Confirmar pagamento'}
}
$('loginBtn').addEventListener('click',login);
$('pagarBtn').addEventListener('click',pagar);
$('compra').addEventListener('change',atualizarDetalhes);
$('dataPagamento').value=hojeLocal();
(async()=>{try{sb=await OBRIX_BACKEND.init();const {data}=await sb.auth.getSession();if(data?.session)await carregar();}catch(e){show($('loginStatus'),'Erro ao carregar: '+(e.message||e),false)}})();
})();
