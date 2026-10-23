(()=>{'use strict';
if(window.__OBRIX_EQUIPE_REALTIME_SYNC)return;window.__OBRIX_EQUIPE_REALTIME_SYNC=true;
let canal=null,iniciando=false,timer=0;
function visivel(){const app=document.getElementById('app'),sec=document.getElementById('equipe');return !!(app&&sec&&!app.classList.contains('hidden')&&!sec.classList.contains('hidden'))}
function agendar(){
  if(!navigator.onLine||!visivel())return;
  clearTimeout(timer);timer=setTimeout(async()=>{
    try{
      if(!visivel())return;
      await window.OBRIX_EQUIPE?.refresh?.();
      window.OBRIX_EQUIPE_MODELO?.render?.();
      window.OBRIX_EQUIPE_CONTROLES_GUARD?.ensure?.();
    }catch(e){console.warn('Equipe: sincronização da tela atual indisponível',e)}
  },180);
}
async function iniciar(){
  if(canal||iniciando||!navigator.onLine||!window.OBRIX_BACKEND)return;
  iniciando=true;
  try{
    const p=await window.OBRIX_BACKEND.profile(),sb=await window.OBRIX_BACKEND.init();
    if(!p?.empresa_id)return;
    const filtro=`empresa_id=eq.${p.empresa_id}`,mudou=()=>agendar();
    canal=sb.channel('obrix-equipe-realtime-'+p.empresa_id)
      .on('postgres_changes',{event:'*',schema:'public',table:'funcionarios',filter:filtro},mudou)
      .on('postgres_changes',{event:'*',schema:'public',table:'diarias',filter:filtro},mudou)
      .on('postgres_changes',{event:'*',schema:'public',table:'vales',filter:filtro},mudou)
      .on('postgres_changes',{event:'*',schema:'public',table:'bonus_extras',filter:filtro},mudou)
      .on('postgres_changes',{event:'*',schema:'public',table:'faltas',filter:filtro},mudou)
      .on('postgres_changes',{event:'*',schema:'public',table:'pagamentos_equipe',filter:filtro},mudou)
      .subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){canal=null;setTimeout(iniciar,1500)}});
  }catch(e){console.warn('Equipe realtime indisponível',e);canal=null}
  finally{iniciando=false}
}
window.addEventListener('online',()=>{setTimeout(iniciar,250);setTimeout(agendar,500)});
window.addEventListener('focus',()=>{if(visivel()){void iniciar();agendar()}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&visivel()){void iniciar();agendar()}});
['obrix:modules-ready','obrix:modules-online-ready','obrix:session-shell'].forEach(n=>window.addEventListener(n,()=>setTimeout(iniciar,250)));
document.addEventListener('click',e=>{const b=e.target.closest?.('#bEquipe,.bottom button');if(!b)return;const t=(b.textContent||'').trim();if(b.id==='bEquipe'||/Equipe/i.test(t)){setTimeout(iniciar,80);setTimeout(agendar,220)}},true);
setTimeout(iniciar,700);setTimeout(iniciar,2200);
window.OBRIX_EQUIPE_REALTIME_SYNC={start:iniciar,refresh:agendar,status:()=>({ativo:!!canal,iniciando,visivel:visivel(),online:navigator.onLine})};
})();