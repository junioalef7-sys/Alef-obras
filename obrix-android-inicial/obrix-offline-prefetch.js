(()=>{'use strict';
if(window.__OBRIX_OFFLINE_PREFETCH)return;window.__OBRIX_OFFLINE_PREFETCH=true;
let running=false,last=0;
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
async function run(force=false){
  if(running||!navigator.onLine||!window.OBRIX_BACKEND)return false;
  if(!force&&Date.now()-last<60000)return true;
  running=true;
  try{
    const p=await OBRIX_BACKEND.profile();if(!p?.empresa_id)return false;
    const sb=await OBRIX_BACKEND.init(),e=p.empresa_id;
    const [notas,diarios,checks]=await Promise.all([
      sb.from('notas').select('*').eq('empresa_id',e).order('atualizado_em',{ascending:false}),
      sb.from('diarios_obra').select('*').eq('empresa_id',e).order('data',{ascending:false}),
      sb.from('checklist_itens').select('*').eq('empresa_id',e).order('ordem',{ascending:true})
    ]);
    if(!notas.error)write('obrix_notas_cache_v1:'+e,notas.data||[]);
    if(!diarios.error)write('obrix_diario_cache_v3:'+e,diarios.data||[]);
    if(!checks.error)write('obrix_checklist_cache_v1:'+e,checks.data||[]);
    last=Date.now();
    window.dispatchEvent(new CustomEvent('obrix:offline-prefetch',{detail:{ok:!notas.error&&!diarios.error&&!checks.error,notas:(notas.data||[]).length,diarios:(diarios.data||[]).length,checklists:(checks.data||[]).length}}));
    return true;
  }catch(e){console.warn('OBRIX: preparação offline complementar indisponível',e);return false}finally{running=false}
}
window.addEventListener('online',()=>setTimeout(()=>run(true),1500));
window.addEventListener('obrix:modules-ready',()=>setTimeout(()=>run(true),900));
window.addEventListener('pageshow',()=>setTimeout(()=>run(false),2500));
setTimeout(()=>run(false),3500);
window.OBRIX_OFFLINE_PREFETCH={run,status:()=>({online:navigator.onLine,running,last})};
})();