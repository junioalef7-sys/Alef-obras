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
 back.innerHTML=`<div class="modal obrix-modelo-modal"><div class="obrix-modal-head"><h2>Registros do funcionário</h2><button type="button" class="obrix-modal-x" aria-label="Fechar">×</button></div><p class="muted"><b>${esc(nomeFuncionario(id))}</b></p><div class="obrix-registros-corpo"><div class="obrix-carregando">Carregando...</div></div></div>`;
 document.body.appendChild(back);back.querySelector('.obrix-modal-x').onclick=()=>back.remove();back.addEventListener('click',e=>{if(e.target===back)back.remove()});return back;
}
function linhasLocais(id){
 const rows=[];
 lista('diarias').filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({kind:'diaria',data:x.data,tipo:Number(x.quantidade||1)<1?'Meia diária':'Diária',obra:nomeObra(x.obra_id),valor:Number(x.valor_total||0),status:x.paga?'Quitada':'Em aberto'}));
 lista('vales').filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({kind:'vale',data:x.data,tipo:'Vale',obra:nomeObra(x.obra_id),valor:-Number(x.valor||0),status:x.quitado?'Quitado':'Em aberto'}));
 lista('bonus').filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({kind:'bonus',data:x.data,tipo:x.tipo==='extra'?'Extra':'Bônus',obra:nomeObra(x.obra_id),valor:Number(x.valor||0),status:x.pago?'Pago':'Em aberto'}));
 return rows;
}
function linhaHtml(x){
 const data=x.data?new Date(x.data+'T12:00:00').toLocaleDateString('pt-BR'):'—';
 if(x.kind==='falta')return `<div class="obrix-registro-linha obrix-registro-falta" data-falta-row="${esc(x.id)}"><div><b>${data}</b><span>Falta · ${esc(x.obra)}</span>${x.motivo?`<small>Motivo: ${esc(x.motivo)}</small>`:''}${x.observacoes?`<small>${esc(x.observacoes)}</small>`:''}</div><div class="obrix-registro-valor"><b>${x.justificada?'Justificada':'Injustificada'}</b><button type="button" class="obrix-excluir-falta" data-excluir-falta="${esc(x.id)}">Excluir</button></div></div>`;
 return `<div class="obrix-registro-linha"><div><b>${data}</b><span>${esc(x.tipo)} · ${esc(x.obra)}</span></div><div class="obrix-registro-valor"><b>${money(x.valor)}</b><small>${esc(x.status)}</small></div></div>`;
}
async function carregar(id,back){
 if(!back?.isConnected)return;
 const corpo=back.querySelector('.obrix-registros-corpo');if(!corpo)return;corpo.innerHTML='<div class="obrix-carregando">Carregando...</div>';
 try{
  const sb=await window.OBRIX_BACKEND.init(),p=await window.OBRIX_BACKEND.profile();
  const {data,error}=await sb.from('faltas').select('id,obra_id,data,justificada,motivo,observacoes').eq('empresa_id',p.empresa_id).eq('funcionario_id',id).order('data',{ascending:false});if(error)throw error;
  const rows=linhasLocais(id);(data||[]).forEach(x=>rows.push({kind:'falta',id:x.id,data:x.data,obra:nomeObra(x.obra_id),justificada:!!x.justificada,motivo:x.motivo||'',observacoes:x.observacoes||''}));rows.sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  corpo.innerHTML=`<div class="obrix-registros-lista">${rows.length?rows.map(linhaHtml).join(''):'<p class="muted">Nenhum registro encontrado.</p>'}</div><div class="obrix-registros-acoes"><button type="button" data-extra="vale">Vale</button><button type="button" data-extra="bonus">Bônus e Extras</button><button type="button" class="pagar" data-extra="pagar">Pagar</button><button type="button" class="pagamentos" data-historico-pagamentos="1">Pagamentos</button></div>`;
  corpo.querySelectorAll('[data-extra]').forEach(btn=>btn.onclick=()=>{back.remove();window.equipeAcao?.(String(id),btn.dataset.extra)});
  const hist=corpo.querySelector('[data-historico-pagamentos]');if(hist)hist.onclick=()=>{const abrir=window.OBRIX_EQUIPE_HISTORICO_PAGAMENTOS?.open;if(!abrir)return alert('Histórico de pagamentos indisponível.');back.remove();abrir()};
  corpo.querySelectorAll('[data-excluir-falta]').forEach(btn=>btn.onclick=async()=>{
   const faltaId=btn.dataset.excluirFalta;if(!confirm('Excluir esta falta?'))return;btn.disabled=true;
   try{const s=await window.OBRIX_BACKEND.init(),pr=await window.OBRIX_BACKEND.profile(),r=await s.from('faltas').delete().eq('id',faltaId).eq('empresa_id',pr.empresa_id).eq('funcionario_id',id);if(r.error)throw r.error;await carregar(id,back);window.OBRIX_EQUIPE_REALTIME_SYNC?.refresh?.()}catch(e){alert(e.message||'Não foi possível excluir a falta.');btn.disabled=false}
  });
 }catch(e){corpo.innerHTML=`<div class="status">${esc(e.message||'Não foi possível carregar os registros.')}</div>`}
}
function abrir(id){const back=criarModal(id);void carregar(id,back)}
document.addEventListener('click',e=>{const b=e.target.closest?.('#equipe [data-acao="registros"]');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();abrir(b.dataset.id)},true);
function instalar(){limparRemovidos();const box=document.getElementById('listaEquipe');if(box&&!box.__obrixFaltasObserver){box.__obrixFaltasObserver=true;new MutationObserver(limparRemovidos).observe(box,{childList:true,subtree:true})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(instalar,0),{once:true});else instalar();
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe')setTimeout(instalar,0)});
const css=document.createElement('style');css.textContent='#equipe .obrix-atualizar-equipe,#equipe .obrix-pagar-equipe-topo,#equipe .obrix-historico-pagamentos-topo,.obrix-pessoal-editar-btn{display:none!important}.obrix-excluir-falta{margin-top:8px;border:1px solid #ef4444!important;background:#fff!important;color:#dc2626!important;border-radius:9px;padding:7px 10px;font-weight:900}.obrix-registro-falta .obrix-registro-valor{min-width:104px}.obrix-registros-acoes{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.obrix-registros-acoes .pagar{grid-column:1!important}.obrix-registros-acoes .pagamentos{grid-column:2!important}html[data-theme="dark"] .obrix-excluir-falta,body.dark .obrix-excluir-falta{background:#161d25!important;color:#f87171!important;border-color:#ef4444!important}@media(max-width:390px){.obrix-registros-acoes{grid-template-columns:repeat(2,minmax(0,1fr))!important}}';document.head.appendChild(css);
window.OBRIX_EQUIPE_REGISTROS_FALTAS={open:abrir,refreshButtons:limparRemovidos};
})();