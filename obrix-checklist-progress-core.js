(()=>{
'use strict';
if(window.__OBRIX_CHECKLIST_PROGRESS_CORE)return;
window.__OBRIX_CHECKLIST_PROGRESS_CORE=true;
const medias=new Map(),etapasRemovidas=new Set();
let empresaId='',sb=null,canal=null,detailId='',checklistObraId='',timer=null,buscando=false,recebeuSnapshot=false;
const limitar=v=>Math.max(0,Math.min(100,Number.isFinite(Number(v))?Number(v):0));
const arred=v=>Math.round(limitar(v)*10)/10;
async function contexto(){if(sb&&empresaId)return{sb,eid:empresaId};const p=await window.OBRIX_BACKEND?.profile?.();if(!p?.empresa_id)return null;empresaId=String(p.empresa_id);sb=await window.OBRIX_BACKEND.init();return{sb,eid:empresaId}}
function calcular(rows){
 const anteriores=new Set(medias.keys());
 medias.clear();const grupos=new Map();
 for(const x of rows||[]){
   const id=String(x.obra_id||'');
   if(!id)continue;
   if(!grupos.has(id))grupos.set(id,[]);
   grupos.get(id).push(limitar(x.progresso));
 }
 for(const [id,vals] of grupos){
   medias.set(id,arred(vals.length?vals.reduce((s,v)=>s+v,0)/vals.length:0));
   etapasRemovidas.delete(id);
 }
 // Apenas a exclusão confirmada de uma etapa antes conhecida zera o progresso.
 // Obra sem checklist continua exibindo o progresso já registrado, sem piscar.
 for(const id of anteriores)if(!medias.has(id))etapasRemovidas.add(id);
}
function mediaConhecida(id){
 const key=String(id||'');
 return medias.has(key)?medias.get(key):etapasRemovidas.has(key)?0:null;
}
function aplicarObjetos(){for(const o of window.obras||[]){const p=mediaConhecida(o.id);if(p===null)continue;if(Number(o.progresso)!==p)o.progresso=p}}
function texto(v){return Number.isInteger(v)?String(v):String(v).replace('.',',')}
function pintar(){aplicarObjetos();document.querySelectorAll('#listaObras .obxObraCard').forEach(card=>{const id=String(card.dataset.id||card.dataset.obraId||'');if(!id)return;const p=mediaConhecida(id);if(p===null)return;const linha=card.querySelector('.obxStatusLinha,.obxObraProgress');if(linha){const bar=linha.querySelector('.obxBar i,.obxTrack span');if(bar&&bar.style.width!==p+'%')bar.style.width=p+'%';const bs=[...linha.querySelectorAll('b,strong')];const alvo=bs.find(x=>/%/.test(x.textContent||''))||bs[bs.length-1];if(alvo&&alvo.textContent!==texto(p)+'%')alvo.textContent=texto(p)+'%'}});const det=document.querySelector('#listaObras .obxDetalhe');if(det){let id=detailId;if(!id){const nome=det.querySelector('.obxDetalheHead h2')?.textContent?.trim()||'';const candidatos=(window.obras||[]).filter(o=>String(o.nome||'').trim()===nome);if(candidatos.length===1)id=String(candidatos[0].id)}if(id){const p=mediaConhecida(id);if(p===null)return;const prog=det.querySelector('.obxProg');if(prog){const bar=prog.querySelector('.obxBar i');if(bar&&bar.style.width!==p+'%')bar.style.width=p+'%';const b=prog.querySelector('b');if(b&&b.textContent!==texto(p)+'%')b.textContent=texto(p)+'%'}}}}
async function buscar(){if(buscando||!navigator.onLine)return;buscando=true;try{const c=await contexto();if(!c)return;const r=await c.sb.from('checklist_itens').select('obra_id,progresso,atualizado_em').eq('empresa_id',c.eid);if(r.error)throw r.error;const assinaturaAnterior=JSON.stringify([...medias].sort());calcular(r.data||[]);recebeuSnapshot=true;aplicarObjetos();pintar();if(assinaturaAnterior!==JSON.stringify([...medias].sort()))window.dispatchEvent(new Event('obrix:progresso-atualizado'))}catch(e){console.warn('OBRIX: não foi possível calcular o progresso do checklist',e)}finally{buscando=false}}
function agendar(ms=100){clearTimeout(timer);timer=setTimeout(buscar,ms)}
function mediaModal(){const rs=[...document.querySelectorAll('.checkModalBack [data-check-range]')];if(!rs.length)return null;return arred(rs.reduce((s,r)=>s+limitar(r.value),0)/rs.length)}
function aplicarModal(){const id=checklistObraId||detailId;if(!id)return;const p=mediaModal();if(p==null)return;medias.set(String(id),p);const o=(window.obras||[]).find(x=>String(x.id)===String(id));if(o)o.progresso=p;pintar()}
function capturar(e){const abrir=e.target.closest?.('[data-abrir]');if(abrir?.dataset?.abrir)detailId=String(abrir.dataset.abrir);const card=e.target.closest?.('.obxObraCard');if(card&&(card.dataset.id||card.dataset.obraId))detailId=String(card.dataset.id||card.dataset.obraId);const check=e.target.closest?.('[data-check-open]');if(check?.dataset?.checkOpen)checklistObraId=String(check.dataset.checkOpen);if(e.target.closest?.('.obxAcao')&&detailId)checklistObraId=detailId;if(e.target.closest?.('#obxVoltarObras'))detailId=''}
document.addEventListener('click',e=>{capturar(e);if(e.target.closest?.('[data-abrir],#obxVoltarObras,[data-check-open],.obxAcao'))setTimeout(pintar,30);if(e.target.closest?.('#checkAdicionar,[data-check-del],.checkClose'))agendar(300)},true);
document.addEventListener('input',e=>{if(e.target.closest?.('[data-check-range]'))aplicarModal()},true);
document.addEventListener('change',e=>{if(e.target.closest?.('[data-check-range]'))agendar(220)},true);
let paintFrame=null;const obs=new MutationObserver(()=>{if(document.hidden||paintFrame!==null)return;paintFrame=requestAnimationFrame(()=>{paintFrame=null;pintar()})});
function observar(){const box=document.getElementById('listaObras');if(box&&!box.__obrixProgressObserved){box.__obrixProgressObserved=1;obs.observe(box,{childList:true,subtree:true})}pintar()}
async function realtime(){try{const c=await contexto();if(!c||canal)return;canal=c.sb.channel('obrix-progress-source-'+c.eid).on('postgres_changes',{event:'*',schema:'public',table:'checklist_itens',filter:`empresa_id=eq.${c.eid}`},()=>agendar(80)).subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){try{c.sb.removeChannel(canal)}catch(_){}canal=null;setTimeout(realtime,1200)}})}catch(e){console.warn('OBRIX: realtime do progresso indisponível',e)}}
window.addEventListener('pageshow',()=>{observar();agendar(0)});window.addEventListener('focus',()=>agendar(50));document.addEventListener('visibilitychange',()=>{if(!document.hidden)agendar(50)});
let ultimaReconciliacao=0;
setInterval(()=>{
  if(document.hidden)return;
  const app=document.getElementById('app');
  if(!app||app.classList.contains('hidden'))return;
  const obrasEl=document.getElementById('obras'),inicioEl=document.getElementById('inicio');
  if(!((obrasEl&&!obrasEl.classList.contains('hidden'))||(inicioEl&&!inicioEl.classList.contains('hidden'))))return;
  observar();
  if(Date.now()-ultimaReconciliacao>=60000){ultimaReconciliacao=Date.now();agendar(0)}
},12000);
setTimeout(()=>{observar();buscar();realtime()},120);setTimeout(()=>{observar();buscar()},700);
window.OBRIX_PROGRESS_CORE={refresh:buscar,paint:pintar,progressFor:mediaConhecida,status:()=>({empresaId,detailId,checklistObraId,medias:Object.fromEntries(medias)})};
})();
