(()=>{'use strict';
if(window.__OBRIX_CORRECOES_CIRURGICAS_0211)return;window.__OBRIX_CORRECOES_CIRURGICAS_0211=true;
const st=document.createElement('style');st.id='obrix-correcoes-cirurgicas-0211-style';st.textContent=`
#obras .obxStatus.andamento{color:#fff!important;-webkit-text-fill-color:#fff!important}
@media(max-width:430px){
 #fmFiltrosPanel .fmFiltrosGrid{gap:7px!important}
 #fmFiltrosPanel .fmFiltrosGrid label{min-width:0!important;overflow:visible!important}
 #fmFiltroDataInicio,#fmFiltroDataFim{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;font-size:11px!important;padding-left:2px!important;padding-right:2px!important}
 #fmFiltroDataInicio::-webkit-date-and-time-value,#fmFiltroDataFim::-webkit-date-and-time-value{min-width:0!important;padding:0!important;text-align:left!important}
 #fmFiltroDataInicio::-webkit-calendar-picker-indicator,#fmFiltroDataFim::-webkit-calendar-picker-indicator{margin:0!important;padding:0!important;width:16px!important}
}
`;document.head.appendChild(st);
let sb=null,eid='',canal=null,timer=null,busy=false,ultimo=0;
async function ctx(){if(sb&&eid)return{sb,eid};const p=await window.OBRIX_BACKEND?.profile?.();if(!p?.empresa_id)return null;sb=await window.OBRIX_BACKEND.init();eid=p.empresa_id;return{sb,eid}}
function aplicarProgresso(rows){const m=new Map();for(const x of rows||[]){if(!x.obra_id)continue;const k=String(x.obra_id),g=m.get(k)||[0,0];g[0]+=Math.max(0,Math.min(100,Number(x.progresso||0)));g[1]++;m.set(k,g)}let mudou=false;for(const o of window.obras||[]){const s=String(o.status||'').toLowerCase();const g=m.get(String(o.id));const p=s==='concluida'||s==='concluída'?100:(g&&g[1]?Math.round((g[0]/g[1])*10)/10:null);if(p===null)continue;if(Number(o.progresso)!==p){o.progresso=p;mudou=true}}if(mudou){try{window.OBRIX_OBRAS_FIEL?.refresh?.()}catch(_){}}}
async function progresso(){if(busy||!navigator.onLine)return;busy=true;try{const c=await ctx();if(!c)return;const r=await c.sb.from('checklist_itens').select('obra_id,progresso').eq('empresa_id',c.eid);if(r.error)throw r.error;aplicarProgresso(r.data||[])}catch(e){console.warn('OBRIX: progresso não sincronizou agora',e)}finally{busy=false}}
async function dados(){if(!navigator.onLine||Date.now()-ultimo<800)return;ultimo=Date.now();try{if(typeof window.carregar==='function')await window.carregar()}catch(e){console.warn('OBRIX: sincronização será repetida depois',e)}finally{progresso()}}
function agendar(ms=120){clearTimeout(timer);timer=setTimeout(dados,ms)}
async function realtime(){if(canal||!navigator.onLine)return;try{const c=await ctx();if(!c)return;canal=c.sb.channel('obrix-sync-cirurgico-'+c.eid)
 .on('postgres_changes',{event:'*',schema:'public',table:'checklist_itens',filter:`empresa_id=eq.${c.eid}`},()=>{progresso();agendar(350)})
 .on('postgres_changes',{event:'*',schema:'public',table:'obras',filter:`empresa_id=eq.${c.eid}`},()=>agendar(180))
 .on('postgres_changes',{event:'*',schema:'public',table:'financeiro',filter:`empresa_id=eq.${c.eid}`},()=>agendar(180))
 .on('postgres_changes',{event:'*',schema:'public',table:'funcionarios',filter:`empresa_id=eq.${c.eid}`},()=>agendar(180))
 .on('postgres_changes',{event:'*',schema:'public',table:'diarias',filter:`empresa_id=eq.${c.eid}`},()=>agendar(180))
 .on('postgres_changes',{event:'*',schema:'public',table:'vales',filter:`empresa_id=eq.${c.eid}`},()=>agendar(180))
 .on('postgres_changes',{event:'*',schema:'public',table:'bonus_extras',filter:`empresa_id=eq.${c.eid}`},()=>agendar(180))
 .subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){try{canal?.unsubscribe?.()}catch(_){}canal=null;setTimeout(realtime,1500)}})}catch(e){console.warn('OBRIX: realtime indisponível',e);canal=null}}
document.addEventListener('change',e=>{if(e.target.closest?.('[data-check-range]'))setTimeout(progresso,500)},true);
window.addEventListener('focus',()=>{progresso();agendar(150);realtime()});window.addEventListener('pageshow',()=>{progresso();agendar(150);realtime()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){progresso();agendar(150);realtime()}});window.addEventListener('online',()=>{progresso();agendar(120);realtime()});
setTimeout(()=>{progresso();realtime()},800);setTimeout(progresso,1800);
})();
