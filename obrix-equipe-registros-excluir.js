(()=>{'use strict';
if(window.__OBRIX_EQUIPE_REGISTROS_EXCLUIR)return;window.__OBRIX_EQUIPE_REGISTROS_EXCLUIR=true;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function funcs(){try{return typeof funcionarios!=='undefined'&&Array.isArray(funcionarios)?funcionarios:[]}catch(_){return[]}}
function obrasList(){try{return typeof obras!=='undefined'&&Array.isArray(obras)?obras:[]}catch(_){return[]}}
function diariasList(){try{return typeof diarias!=='undefined'&&Array.isArray(diarias)?diarias:[]}catch(_){return[]}}
function valesList(){try{return typeof vales!=='undefined'&&Array.isArray(vales)?vales:[]}catch(_){return[]}}
function bonusList(){try{return typeof bonus!=='undefined'&&Array.isArray(bonus)?bonus:[]}catch(_){return[]}}
function acharFunc(id){return funcs().find(f=>String(f.id)===String(id))||null}
function nomeObra(id){return obrasList().find(o=>String(o.id)===String(id))?.nome||'Sem obra'}
function abrirModal(titulo,conteudo){
  document.querySelector('.obrix-registros-excluir-back')?.remove();
  const back=document.createElement('div');back.className='modalBack obrix-registros-excluir-back';
  back.innerHTML=`<div class="modal obrix-modelo-modal"><div class="obrix-modal-head"><h2>${esc(titulo)}</h2><button type="button" class="obrix-modal-x" aria-label="Fechar">×</button></div>${conteudo}</div>`;
  document.body.appendChild(back);back.querySelector('.obrix-modal-x').onclick=()=>back.remove();back.addEventListener('click',e=>{if(e.target===back)back.remove()});return back;
}
function linha(x){
  const data=x.data?new Date(x.data+'T12:00:00').toLocaleDateString('pt-BR'):'—';
  const excluir=x.kind==='bonus'&&!x.pago?`<button type="button" class="obrix-excluir-bonus-aberto" data-bonus-id="${esc(x.id)}">Excluir</button>`:'';
  return `<div class="obrix-registro-linha"><div><b>${data}</b><span>${esc(x.tipo)} · ${esc(x.obra)}</span></div><div class="obrix-registro-excluir-direita"><div class="obrix-registro-valor"><b>${money(x.valor)}</b><small>${esc(x.status)}</small></div>${excluir}</div></div>`;
}
function montarRows(id){
  const rows=[];
  diariasList().filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({id:x.id,kind:'diaria',data:x.data,tipo:Number(x.quantidade||1)<1?'Meia diária':'Diária',obra:nomeObra(x.obra_id),valor:Number(x.valor_total||0),status:x.paga?'Quitada':'Em aberto'}));
  valesList().filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({id:x.id,kind:'vale',data:x.data,tipo:'Vale',obra:nomeObra(x.obra_id),valor:-Number(x.valor||0),status:x.quitado?'Quitado':'Em aberto'}));
  bonusList().filter(x=>String(x.funcionario_id)===String(id)).forEach(x=>rows.push({id:x.id,kind:'bonus',data:x.data,tipo:x.tipo==='extra'?'Extra':'Bônus',obra:nomeObra(x.obra_id),valor:Number(x.valor||0),status:x.pago?'Pago':'Em aberto',pago:!!x.pago}));
  return rows.sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
}
async function excluirBonus(funcionarioId,bonusId,back){
  const item=bonusList().find(x=>String(x.id)===String(bonusId));
  if(!item)return alert('Bônus/Extra não encontrado.');
  if(item.pago)return alert('Este Bônus/Extra já foi pago e deve permanecer no histórico.');
  const rotulo=item.tipo==='extra'?'Extra':'Bônus';
  if(!confirm(`Excluir este ${rotulo} de ${money(item.valor)}?`))return;
  const btn=back.querySelector(`[data-bonus-id="${CSS.escape(String(bonusId))}"]`);if(btn){btn.disabled=true;btn.textContent='Excluindo...'}
  try{
    const sb=await OBRIX_BACKEND.init();let empresaId=null;
    try{empresaId=(await OBRIX_BACKEND.profile?.())?.empresa_id||null}catch(_){ }
    if(!empresaId)try{empresaId=profile?.empresa_id||null}catch(_){ }
    if(!empresaId)throw new Error('Empresa não identificada.');
    const atual=await sb.from('bonus_extras').select('id,pago').eq('id',bonusId).eq('empresa_id',empresaId).maybeSingle();
    if(atual.error)throw atual.error;if(!atual.data)throw new Error('Registro não encontrado.');
    if(atual.data.pago)throw new Error('Este Bônus/Extra já foi pago e não pode ser excluído.');
    const r=await sb.from('bonus_extras').delete().eq('id',bonusId).eq('empresa_id',empresaId).select('id');
    if(r.error)throw r.error;if(!r.data?.length)throw new Error('A exclusão não foi confirmada.');
    await window.OBRIX_EQUIPE?.refresh?.();back.remove();abrir(funcionarioId);
  }catch(e){if(btn){btn.disabled=false;btn.textContent='Excluir'}alert(e.message||'Não foi possível excluir o Bônus/Extra.')}
}
function abrir(id){
  const f=acharFunc(id);if(!f)return alert('Funcionário não encontrado.');
  const rows=montarRows(id);
  const html=`<p class="muted"><b>${esc(f.nome)}</b></p><div class="obrix-registros-lista">${rows.length?rows.map(linha).join(''):'<p class="muted">Nenhum registro encontrado.</p>'}</div><div class="obrix-registros-acoes"><button type="button" data-extra="vale">Vale</button><button type="button" data-extra="bonus">Bônus e Extras</button><button type="button" class="pagar" data-extra="pagar">Pagar</button></div>`;
  const back=abrirModal('Registros do funcionário',html);
  back.querySelectorAll('[data-extra]').forEach(btn=>btn.onclick=()=>{back.remove();window.equipeAcao?.(String(id),btn.dataset.extra)});
  back.querySelectorAll('[data-bonus-id]').forEach(btn=>btn.onclick=()=>excluirBonus(id,btn.dataset.bonusId,back));
}
document.addEventListener('click',e=>{
  const b=e.target.closest?.('#equipe [data-acao="registros"]');if(!b)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();abrir(String(b.dataset.id||''));
},true);
const css=document.createElement('style');css.id='obrix-equipe-registros-excluir-css';css.textContent=`.obrix-registro-excluir-direita{display:flex;align-items:center;gap:10px}.obrix-excluir-bonus-aberto{margin-top:6px!important;min-height:32px!important;padding:6px 10px!important;border:1px solid #dc2626!important;border-radius:9px!important;background:transparent!important;background-color:transparent!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;font-weight:900!important;box-shadow:none!important}.obrix-excluir-bonus-aberto:disabled{opacity:.55!important}html[data-theme="dark"] .obrix-excluir-bonus-aberto,body.dark .obrix-excluir-bonus-aberto{background:transparent!important;background-color:transparent!important;color:#fca5a5!important;-webkit-text-fill-color:#fca5a5!important;border-color:#ef4444!important}@media(max-width:520px){.obrix-registro-excluir-direita{flex-direction:column;align-items:flex-end}.obrix-excluir-bonus-aberto{min-width:82px}}`;document.head.appendChild(css);
window.OBRIX_EQUIPE_REGISTROS={open:abrir};
})();