(()=>{
'use strict';
if(window.__OBRIX_EQUIPE_REGISTROS_FALTAS)return;window.__OBRIX_EQUIPE_REGISTROS_FALTAS=true;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function lista(nome){try{const v=window[nome];return Array.isArray(v)?v:[]}catch(_){return[]}}
function nomeObra(id){return lista('obras').find(o=>String(o.id)===String(id))?.nome||'Sem obra'}
function nomeFuncionario(id){return lista('funcionarios').find(f=>String(f.id)===String(id))?.nome||'Funcionário'}
function limparRemovidos(){document.querySelectorAll('#equipe [data-acao="faltas"],#equipe [data-acao="editar"]').forEach(b=>b.remove())}
function criarModal(id){
 const back=document.createElement('div');back.className='modalBack obrix-registros-faltas-back';
 back.innerHTML=`<div class="modal obrix-modelo-modal"><div class="obrix-modal-head"><h2>Registros do funcionário</h2><button type="button" class="obrix-modal-x" aria-label="Fechar">×</button></div><p class="muted"><b>${esc(nomeFuncionario(id))}</b></p><label class="obrix-registros-busca-label">Buscar registros</label><input type="search" class="obrix-registros-busca" placeholder="Data, obra, tipo, valor ou situação..." autocomplete="off"><div class="obrix-registros-busca-status muted" aria-live="polite"></div><div class="obrix-registros-corpo"><div class="obrix-carregando">Carregando...</div></div></div>`;
 document.body.appendChild(back);back.querySelector('.obrix-registros-busca').addEventListener('input',()=>aplicarBusca(back));back.querySelector('.obrix-modal-x').onclick=()=>back.remove();back.addEventListener('click',e=>{if(e.target===back)back.remove()});return back;
}
function linhasLocais(id){
 const rows=[];
 lista('diarias').filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({kind:'diaria',id:x.id,data:x.data,tipo:Number(x.quantidade||1)<1?'Meia diária':'Diária',obra:nomeObra(x.obra_id),valor:Number(x.valor_total||0),status:x.paga?'Quitada':'Em aberto',paga:!!x.paga}));
 lista('vales').filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({kind:'vale',id:x.id,data:x.data,tipo:'Vale',obra:nomeObra(x.obra_id),valor:-Number(x.valor||0),status:x.quitado?'Quitado':'Em aberto'}));
 lista('bonus').filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({kind:'bonus',id:x.id,data:x.data,tipo:x.tipo==='extra'?'Extra':'Bônus',obra:nomeObra(x.obra_id),valor:Number(x.valor||0),status:x.pago?'Pago':'Em aberto'}));
 return rows;
}
function linhaHtml(x){
 const data=x.data?new Date(x.data+'T12:00:00').toLocaleDateString('pt-BR'):'—';
 if(x.kind==='falta')return `<div class="obrix-registro-linha obrix-registro-falta" data-falta-row="${esc(x.id)}"><div><b>${data}</b><span>Falta · ${esc(x.obra)}</span>${x.motivo?`<small>Motivo: ${esc(x.motivo)}</small>`:''}${x.observacoes?`<small>${esc(x.observacoes)}</small>`:''}</div><div class="obrix-registro-valor"><b>${x.justificada?'Justificada':'Injustificada'}</b><button type="button" class="obrix-excluir-registro" data-excluir-falta="${esc(x.id)}">Excluir</button></div></div>`;
 if(x.kind==='diaria')return `<div class="obrix-registro-linha" data-diaria-row="${esc(x.id)}"><div><b>${data}</b><span>${esc(x.tipo)} · ${esc(x.obra)}</span></div><div class="obrix-registro-valor"><b>${money(x.valor)}</b><small>${esc(x.status)}</small>${x.paga?'':`<button type="button" class="obrix-excluir-registro" data-excluir-diaria="${esc(x.id)}">Excluir</button>`}</div></div>`;
 return `<div class="obrix-registro-linha"><div><b>${data}</b><span>${esc(x.tipo)} · ${esc(x.obra)}</span></div><div class="obrix-registro-valor"><b>${money(x.valor)}</b><small>${esc(x.status)}</small></div></div>`;
}
function aplicarBusca(back){
 const campo=back?.querySelector('.obrix-registros-busca');
 const termo=String(campo?.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
 const linhas=[...back.querySelectorAll('.obrix-registros-corpo .obrix-registro-linha')];
 let visiveis=0;
 linhas.forEach(linha=>{
   const texto=linha.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
   const exibir=!termo||texto.includes(termo);
   linha.classList.toggle('hidden',!exibir);
   if(exibir)visiveis++;
 });
 const status=back.querySelector('.obrix-registros-busca-status');
 if(status)status.textContent=linhas.length?visiveis+' de '+linhas.length+' registro(s)':'';
 let vazio=back.querySelector('.obrix-registros-busca-vazio');
 if(!vazio&&linhas.length){
   vazio=document.createElement('p');vazio.className='muted obrix-registros-busca-vazio hidden';
   vazio.textContent='Nenhum registro encontrado para esta busca.';
   back.querySelector('.obrix-registros-corpo')?.appendChild(vazio);
 }
 if(vazio)vazio.classList.toggle('hidden',!termo||visiveis>0);
}
const excluindoRegistros=new Set();
async function excluirLinha(table,idRegistro,funcionarioId,back){
 const chave=table+':'+idRegistro;
 if(excluindoRegistros.has(chave))return;
 excluindoRegistros.add(chave);
 try{
  if(typeof window.OBRIX_CONFIRMAR_EXCLUSAO!=='function')throw Error('Confirmação indisponível. Atualize o OBRIX.');
  if(!await window.OBRIX_CONFIRMAR_EXCLUSAO({
    titulo:table==='diarias'?'Excluir diária':'Excluir falta',
    mensagem:table==='diarias'?'Excluir esta diária em aberto?':'Excluir esta falta?',
    confirmar:'Excluir'
  }))return;
  if(!navigator.onLine)throw Error('Conecte-se à internet para excluir.');
  const sb=await window.OBRIX_BACKEND.init(),p=await window.OBRIX_BACKEND.profile();
  if(!p?.empresa_id)throw Error('Conta não identificada.');
  if(table==='diarias'){
    const vinculo=await sb.from('pagamento_diarias').select('id')
      .eq('empresa_id',p.empresa_id).eq('diaria_id',idRegistro).limit(1);
    if(vinculo.error)throw vinculo.error;
    if(vinculo.data?.length)throw Error('Diária vinculada a pagamento. Exclusão bloqueada.');
  }
  let q=sb.from(table).delete().eq('id',idRegistro)
    .eq('empresa_id',p.empresa_id).eq('funcionario_id',funcionarioId);
  if(table==='diarias')q=q.eq('paga',false);
  const {data,error}=await q.select('id');
  if(error)throw error;
  if(!data?.length)throw Error(table==='diarias'?'Diária já quitada, removida ou bloqueada.':'Falta já excluída ou não localizada.');
  try{await window.OBRIX_EQUIPE?.refresh?.()}catch(err){console.warn('Equipe: atualização pós-exclusão',err)}
  window.OBRIX_EQUIPE_REALTIME_SYNC?.refresh?.();
  await carregar(funcionarioId,back);
 }catch(e){
  if(window.OBRIX_AVISO)await window.OBRIX_AVISO(e?.message||'Não foi possível excluir.','Equipe');
  else alert(e?.message||'Não foi possível excluir.');
 }finally{excluindoRegistros.delete(chave)}
}
async function carregar(id,back){
 if(!back?.isConnected)return;
 const corpo=back.querySelector('.obrix-registros-corpo');if(!corpo)return;corpo.innerHTML='<div class="obrix-carregando">Carregando...</div>';
 try{
  const sb=await window.OBRIX_BACKEND.init(),p=await window.OBRIX_BACKEND.profile();
  const {data,error}=await sb.from('faltas').select('id,obra_id,data,justificada,motivo,observacoes').eq('empresa_id',p.empresa_id).eq('funcionario_id',id).order('data',{ascending:false});if(error)throw error;
  const rows=linhasLocais(id);(data||[]).forEach(x=>rows.push({kind:'falta',id:x.id,data:x.data,obra:nomeObra(x.obra_id),justificada:!!x.justificada,motivo:x.motivo||'',observacoes:x.observacoes||''}));rows.sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  corpo.innerHTML=`<div class="obrix-registros-lista">${rows.length?rows.map(linhaHtml).join(''):'<p class="muted">Nenhum registro encontrado.</p>'}</div>`;
  aplicarBusca(back);
  corpo.querySelectorAll('[data-excluir-diaria]').forEach(btn=>btn.onclick=()=>excluirLinha('diarias',btn.dataset.excluirDiaria,id,back));
  corpo.querySelectorAll('[data-excluir-falta]').forEach(btn=>btn.onclick=()=>excluirLinha('faltas',btn.dataset.excluirFalta,id,back));
 }catch(e){corpo.innerHTML=`<div class="status">${esc(e.message||'Não foi possível carregar os registros.')}</div>`}
}
function abrir(id){const back=criarModal(id);void carregar(id,back)}
document.addEventListener('click',e=>{const b=e.target.closest?.('#equipe [data-acao="registros"]');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();abrir(b.dataset.id)},true);
function instalar(){limparRemovidos();const box=document.getElementById('listaEquipe');if(box&&!box.__obrixRegistrosObserver){box.__obrixRegistrosObserver=true;new MutationObserver(limparRemovidos).observe(box,{childList:true,subtree:true})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0),{once:true});else instalar();
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe')setTimeout(instalar,0)});
const css=document.createElement('style');css.id='obrixRegistrosEquipeCss';css.textContent='.obrix-registros-busca-label{display:block;font-weight:800;margin:12px 0 5px}.obrix-registros-busca{width:100%;box-sizing:border-box;min-height:44px;padding:10px 12px;border:1px solid var(--ob-border,#cbd5e1);border-radius:10px;background:var(--ob-surface,#fff);color:var(--ob-text,#0f172a);font-size:16px}.obrix-registros-busca-status{font-size:12px;margin:5px 0 10px}#equipe .obrix-atualizar-equipe{display:none!important}.obrix-excluir-registro{display:block;margin-top:8px;border:1px solid #ef4444!important;background:#fff!important;color:#dc2626!important;border-radius:9px;padding:7px 10px;font-weight:900}.obrix-registro-falta .obrix-registro-valor{min-width:104px}html[data-theme="dark"] .obrix-excluir-registro,body.dark .obrix-excluir-registro{background:#161d25!important;color:#f87171!important;border-color:#ef4444!important}';document.head.appendChild(css);
window.OBRIX_EQUIPE_REGISTROS_FALTAS={open:abrir,refreshButtons:limparRemovidos};
})();