(()=>{
'use strict';
if(window.__OBRIX_CHECKLIST_PROGRESS_CORE)return;
window.__OBRIX_CHECKLIST_PROGRESS_CORE=true;
let obraId='',timer=null,salvando=false,ultimaMedia=null;
function limitar(v){v=Number(v||0);return Math.max(0,Math.min(100,Number.isFinite(v)?v:0))}
function mediaLocal(){const rs=[...document.querySelectorAll('.checkModalBack [data-check-range]')];if(!rs.length)return null;return rs.reduce((s,r)=>s+limitar(r.value),0)/rs.length}
function acharObraId(){if(obraId)return obraId;const nome=document.querySelector('.checkModalBack .checkHead .muted')?.textContent?.trim();if(!nome)return'';const o=(window.obras||[]).find(x=>String(x.nome||'').trim()===nome);if(o)obraId=String(o.id);return obraId}
function atualizarLocal(id,p){if(!id||p==null)return;const v=limitar(p);const o=(window.obras||[]).find(x=>String(x.id)===String(id));if(o)o.progresso=v;try{window.OBRIX_OBRAS?.render?.()}catch(_){}try{window.OBRIX_DASH?.paint?.()}catch(_){}ultimaMedia=v}
async function contexto(){const p=await window.OBRIX_BACKEND?.profile?.();if(!p?.empresa_id)return null;return{eid:p.empresa_id,sb:await window.OBRIX_BACKEND.init()}}
async function mediaRemota(id){const c=await contexto();if(!c||!id)return null;const r=await c.sb.from('checklist_itens').select('progresso').eq('empresa_id',c.eid).eq('obra_id',id);if(r.error)throw r.error;const rows=r.data||[];if(!rows.length)return 0;return rows.reduce((s,x)=>s+limitar(x.progresso),0)/rows.length}
async function salvar(forcarRemoto=false){if(salvando||!navigator.onLine)return;const id=acharObraId();if(!id)return;salvando=true;try{let p=forcarRemoto?await mediaRemota(id):mediaLocal();if(p==null)p=await mediaRemota(id);p=Math.round(limitar(p)*10)/10;atualizarLocal(id,p);const c=await contexto();if(!c)return;const r=await c.sb.from('obras').update({progresso:p}).eq('empresa_id',c.eid).eq('id',id);if(r.error)throw r.error;atualizarLocal(id,p)}catch(e){console.warn('OBRIX: falha ao sincronizar progresso geral da obra',e)}finally{salvando=false}}
function agendar(ms=120,forcarRemoto=false){clearTimeout(timer);timer=setTimeout(()=>salvar(forcarRemoto),ms)}
function capturar(alvo){const card=alvo?.closest?.('.obxObraCard[data-obra-id]');if(card&&(alvo.closest?.('.obxChecklist')||alvo.closest?.('[data-check-open]'))){obraId=String(card.dataset.obraId||'');return}const b=alvo?.closest?.('[data-check-open]');if(b?.dataset?.checkOpen)obraId=String(b.dataset.checkOpen)}
document.addEventListener('click',e=>{capturar(e.target);if(e.target.closest?.('#checkAdicionar,[data-check-del]'))agendar(500,true);if(e.target.closest?.('.checkClose'))agendar(0,true);if(e.target.closest?.('.obxChecklist,[data-check-open]'))setTimeout(()=>{acharObraId();agendar(200,true)},250)},true);
document.addEventListener('input',e=>{if(!e.target.closest?.('[data-check-range]'))return;acharObraId();const p=mediaLocal();if(p!=null)atualizarLocal(obraId,p)},true);
document.addEventListener('change',e=>{if(!e.target.closest?.('[data-check-range]'))return;acharObraId();agendar(180,true)},true);
new MutationObserver(()=>{if(document.querySelector('.checkModalBack')){acharObraId()}else{obraId=''}}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('focus',()=>{if(document.querySelector('.checkModalBack'))agendar(100,true)});window.addEventListener('pageshow',()=>{if(document.querySelector('.checkModalBack'))agendar(100,true)});
window.OBRIX_PROGRESS_CORE={sync:()=>salvar(true),status:()=>({obraId,ultimaMedia})};
})();
