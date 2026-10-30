(()=>{'use strict';
if(window.__OBRIX_EQUIPE_REALTIME_SYNC)return;window.__OBRIX_EQUIPE_REALTIME_SYNC=true;
let canal=null,iniciando=false,reconcileTimer=0;
function visivel(){const app=document.getElementById('app'),sec=document.getElementById('equipe');return !!(app&&sec&&!app.classList.contains('hidden')&&!sec.classList.contains('hidden'))}
function lista(table){
  try{
    if(table==='funcionarios')return Array.isArray(funcionarios)?funcionarios:[];
    if(table==='diarias')return Array.isArray(diarias)?diarias:[];
    if(table==='vales')return Array.isArray(vales)?vales:[];
    if(table==='bonus_extras')return Array.isArray(bonus)?bonus:[];
  }catch(_){ }
  const k=table==='bonus_extras'?'bonus':table;return Array.isArray(window[k])?window[k]:[];
}
function salvar(table,next){
  try{
    if(table==='funcionarios'){funcionarios=next;window.funcionarios=next;return}
    if(table==='diarias'){diarias=next;window.diarias=next;return}
    if(table==='vales'){vales=next;window.vales=next;return}
    if(table==='bonus_extras'){bonus=next;window.bonus=next;return}
  }catch(_){ }
  window[table==='bonus_extras'?'bonus':table]=next;
}
function aplicarPayload(table,payload){
  if(!['funcionarios','diarias','vales','bonus_extras'].includes(table))return false;
  const event=String(payload?.eventType||'').toUpperCase(),oldRow=payload?.old||{},newRow=payload?.new||{},id=String((event==='DELETE'?oldRow?.id:newRow?.id)||'');
  if(!id)return false;
  let xs=lista(table).slice(),i=xs.findIndex(x=>String(x?.id)===id);
  if(event==='DELETE'){if(i>=0)xs.splice(i,1)}
  else if(i>=0)xs[i]={...xs[i],...newRow};
  else xs.unshift(newRow);
  salvar(table,xs);return true;
}
function pintar(){
  if(!visivel())return;
  try{window.OBRIX_EQUIPE_MODELO?.render?.()}catch(_){try{window.renderEquipe?.()}catch(__){}}
  try{window.OBRIX_EQUIPE_CONTROLES_GUARD?.ensure?.()}catch(_){ }
  const k=document.getElementById('funcs');if(k){try{k.textContent=String(lista('funcionarios').filter(f=>f.ativo!==false).length)}catch(_){}}
}
function reconciliar(){
  if(!navigator.onLine)return;
  clearTimeout(reconcileTimer);reconcileTimer=setTimeout(async()=>{
    try{await window.OBRIX_EQUIPE?.refresh?.();if(visivel())pintar()}catch(e){console.warn('Equipe: conferência de sincronização indisponível',e)}
  },2200);
}
function mudou(table,payload){
  const aplicado=aplicarPayload(table,payload);
  if(aplicado&&visivel())requestAnimationFrame(pintar);
  else if(visivel()&&!['faltas','pagamentos_equipe'].includes(table))requestAnimationFrame(pintar);
  reconciliar();
}
async function iniciar(){
  if(canal||iniciando||!navigator.onLine||!window.OBRIX_BACKEND)return;
  iniciando=true;
  try{
    const p=await window.OBRIX_BACKEND.profile(),sb=await window.OBRIX_BACKEND.init();if(!p?.empresa_id)return;
    const filtro=`empresa_id=eq.${p.empresa_id}`;
    canal=sb.channel('obrix-equipe-realtime-v2-'+p.empresa_id)
      .on('postgres_changes',{event:'*',schema:'public',table:'funcionarios',filter:filtro},p=>mudou('funcionarios',p))
      .on('postgres_changes',{event:'*',schema:'public',table:'diarias',filter:filtro},p=>mudou('diarias',p))
      .on('postgres_changes',{event:'*',schema:'public',table:'vales',filter:filtro},p=>mudou('vales',p))
      .on('postgres_changes',{event:'*',schema:'public',table:'bonus_extras',filter:filtro},p=>mudou('bonus_extras',p))
      .on('postgres_changes',{event:'*',schema:'public',table:'faltas',filter:filtro},p=>mudou('faltas',p))
      .on('postgres_changes',{event:'*',schema:'public',table:'pagamentos_equipe',filter:filtro},p=>mudou('pagamentos_equipe',p))
      .subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){canal=null;setTimeout(iniciar,800)}});
  }catch(e){console.warn('Equipe realtime indisponível',e);canal=null}finally{iniciando=false}
}
function atualizarAgora(){if(visivel())pintar();reconciliar()}
window.addEventListener('online',()=>{setTimeout(iniciar,80);setTimeout(atualizarAgora,180)});
window.addEventListener('focus',()=>{if(visivel()){void iniciar();atualizarAgora()}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&visivel()){void iniciar();atualizarAgora()}});
['obrix:modules-ready','obrix:modules-online-ready','obrix:session-shell'].forEach(n=>window.addEventListener(n,()=>setTimeout(iniciar,80)));
document.addEventListener('click',e=>{const b=e.target.closest?.('#bEquipe,.bottom button');if(!b)return;const t=(b.textContent||'').trim();if(b.id==='bEquipe'||/Equipe/i.test(t)){setTimeout(iniciar,20)}},true);
setTimeout(iniciar,250);setTimeout(iniciar,900);
window.OBRIX_EQUIPE_REALTIME_SYNC={start:iniciar,refresh:atualizarAgora,status:()=>({ativo:!!canal,iniciando,visivel:visivel(),online:navigator.onLine})};
})();