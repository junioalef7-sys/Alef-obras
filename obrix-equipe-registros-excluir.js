(()=>{'use strict';
if(window.__OBRIX_EQUIPE_REGISTROS_EXCLUIR_V3)return;window.__OBRIX_EQUIPE_REGISTROS_EXCLUIR_V3=true;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dataBR=v=>v?new Date(v+'T12:00:00').toLocaleDateString('pt-BR'):'—';
function diariasList(){try{return typeof diarias!=='undefined'&&Array.isArray(diarias)?diarias:[]}catch(_){return[]}}
function bonusList(){try{return typeof bonus!=='undefined'&&Array.isArray(bonus)?bonus:[]}catch(_){return[]}}
function obrasList(){try{return typeof obras!=='undefined'&&Array.isArray(obras)?obras:[]}catch(_){return[]}}
function nomeObra(id){return obrasList().find(o=>String(o.id)===String(id))?.nome||'Sem obra'}
async function empresaId(){try{return (await OBRIX_BACKEND.profile?.())?.empresa_id||profile?.empresa_id||null}catch(_){try{return profile?.empresa_id||null}catch(__){return null}}}
function modalRegistros(){return [...document.querySelectorAll('.modalBack')].reverse().find(back=>{const t=back.querySelector('.obrix-modal-head h2,h2')?.textContent||'';return /Registros do funcionário/i.test(t)&&back.querySelector('.obrix-registros-acoes')})||null}
function reabrir(id){setTimeout(()=>document.querySelector(`#equipe [data-acao="registros"][data-id="${CSS.escape(String(id))}"]`)?.click(),80)}
async function excluirDiaria(id,diariaId,back,btn){
 const item=diariasList().find(x=>String(x.id)===String(diariaId));if(!item)return alert('Diária não encontrada.');
 if(item.paga)return alert('Esta diária já foi paga e deve permanecer no histórico.');
 if(!confirm(`Excluir esta ${Number(item.quantidade||1)<1?'meia diária':'diária'} de ${dataBR(item.data)}?`))return;
 btn.disabled=true;
 try{const sb=await OBRIX_BACKEND.init(),eid=await empresaId();if(!eid)throw new Error('Empresa não identificada.');
  const atual=await sb.from('diarias').select('id,paga').eq('id',diariaId).eq('empresa_id',eid).maybeSingle();
  if(atual.error)throw atual.error;if(!atual.data)throw new Error('Registro não encontrado.');if(atual.data.paga)throw new Error('Esta diária já foi paga e não pode ser excluída.');
  const r=await sb.from('diarias').delete().eq('id',diariaId).eq('empresa_id',eid).eq('funcionario_id',id).eq('paga',false).select('id');
  if(r.error)throw r.error;if(!r.data?.length)throw new Error('A exclusão não foi confirmada.');back.remove();await window.OBRIX_EQUIPE?.refresh?.();reabrir(id)
 }catch(e){btn.disabled=false;alert(e.message||'Não foi possível excluir a diária.')}
}
async function excluirBonus(id,bonusId,chooser,registros,btn){
 const item=bonusList().find(x=>String(x.id)===String(bonusId));if(!item)return alert('Bônus/Extra não encontrado.');
 if(item.pago)return alert('Este Bônus/Extra já foi pago e deve permanecer no histórico.');
 if(!confirm(`Excluir este ${item.tipo==='extra'?'Extra':'Bônus'} de ${money(item.valor)}?`))return;
 btn.disabled=true;
 try{const sb=await OBRIX_BACKEND.init(),eid=await empresaId();if(!eid)throw new Error('Empresa não identificada.');
  const atual=await sb.from('bonus_extras').select('id,pago').eq('id',bonusId).eq('empresa_id',eid).maybeSingle();
  if(atual.error)throw atual.error;if(!atual.data)throw new Error('Registro não encontrado.');if(atual.data.pago)throw new Error('Este Bônus/Extra já foi pago e não pode ser excluído.');
  const r=await sb.from('bonus_extras').delete().eq('id',bonusId).eq('empresa_id',eid).eq('funcionario_id',id).select('id');
  if(r.error)throw r.error;if(!r.data?.length)throw new Error('A exclusão não foi confirmada.');chooser.remove();registros?.remove();await window.OBRIX_EQUIPE?.refresh?.();reabrir(id)
 }catch(e){btn.disabled=false;alert(e.message||'Não foi possível excluir o Bônus/Extra.')}
}
function abrirExcluirBonus(id,registros){
 const abertos=bonusList().filter(x=>String(x.funcionario_id)===String(id)&&!x.pago);
 if(!abertos.length)return alert('Não há Bônus/Extras em aberto para excluir.');
 const back=document.createElement('div');back.className='modalBack obrix-excluir-bonus-modal';
 back.innerHTML=`<div class="modal obrix-modelo-modal"><div class="obrix-modal-head"><h2>Excluir Bônus/Extras</h2><button type="button" class="obrix-modal-x" aria-label="Fechar">×</button></div><label>Selecione o registro</label><select class="obrix-bonus-excluir-select">${abertos.slice().sort((a,b)=>String(b.data||'').localeCompare(String(a.data||''))).map(x=>`<option value="${esc(x.id)}">${esc(x.tipo==='extra'?'Extra':'Bônus')} · ${dataBR(x.data)} · ${money(x.valor)} · ${esc(nomeObra(x.obra_id))}</option>`).join('')}</select><div class="modalActions"><button type="button" class="btn cancelar">Cancelar</button><button type="button" class="btn confirmar">Excluir Bônus/Extra</button></div></div>`;
 document.body.appendChild(back);back.querySelector('.obrix-modal-x').onclick=()=>back.remove();back.querySelector('.cancelar').onclick=()=>back.remove();back.addEventListener('click',e=>{if(e.target===back)back.remove()});
 back.querySelector('.confirmar').onclick=()=>excluirBonus(id,back.querySelector('.obrix-bonus-excluir-select').value,back,registros,back.querySelector('.confirmar'))
}
function decorar(id){
 const back=modalRegistros();if(!back)return false;
 const acoes=back.querySelector('.obrix-registros-acoes');
 if(acoes&&!acoes.querySelector('[data-obrix-excluir-bonus]')){const b=document.createElement('button');b.type='button';b.textContent='Excluir Bônus/Extras';b.dataset.obrixExcluirBonus='1';b.className='obrix-excluir-bonus-registro';b.onclick=e=>{e.preventDefault();e.stopPropagation();abrirExcluirBonus(id,back)};acoes.appendChild(b)}
 const registros=[...back.querySelectorAll('.obrix-registros-lista .obrix-registro-linha')];
 const ds=diariasList().filter(x=>String(x.funcionario_id)===String(id)).map(x=>({id:x.id,data:x.data,paga:!!x.paga,tipo:Number(x.quantidade||1)<1?'Meia diária':'Diária'}));
 registros.forEach(linha=>{if(linha.querySelector('[data-obrix-diaria-excluir]'))return;const texto=linha.textContent||'';const d=ds.find(x=>!x.paga&&texto.includes(dataBR(x.data))&&texto.includes(x.tipo));if(!d)return;const alvo=linha.querySelector('.obrix-registro-valor')||linha;const b=document.createElement('button');b.type='button';b.textContent='Excluir';b.dataset.obrixDiariaExcluir=d.id;b.className='obrix-excluir-diaria-registro';b.onclick=e=>{e.preventDefault();e.stopPropagation();excluirDiaria(id,d.id,back,b)};alvo.appendChild(b)});
 return true
}
function agendar(id){[0,30,80,160].forEach(ms=>setTimeout(()=>decorar(id),ms))}
document.addEventListener('click',e=>{const b=e.target.closest?.('#equipe [data-acao="registros"]');if(!b)return;agendar(String(b.dataset.id||''))},true);
window.OBRIX_EQUIPE_EXCLUIR_BONUS={open:id=>{const back=modalRegistros();if(back)abrirExcluirBonus(String(id),back)}};
const css=document.createElement('style');css.id='obrix-equipe-registros-excluir-v3-css';css.textContent=`.obrix-excluir-diaria-registro{display:block;margin:7px 0 0 auto!important;padding:6px 10px!important;min-height:30px!important;border:1px solid #dc2626!important;border-radius:9px!important;background:transparent!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;font-weight:900!important}.obrix-registros-acoes .obrix-excluir-bonus-registro{grid-column:1/-1!important;border-color:#dc2626!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;background:transparent!important}html[data-theme="dark"] .obrix-excluir-diaria-registro,html[data-theme="dark"] .obrix-registros-acoes .obrix-excluir-bonus-registro,body.dark .obrix-excluir-diaria-registro,body.dark .obrix-registros-acoes .obrix-excluir-bonus-registro{color:#fca5a5!important;-webkit-text-fill-color:#fca5a5!important;border-color:#ef4444!important}`;document.head.appendChild(css);
})();