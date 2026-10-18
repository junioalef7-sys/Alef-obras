(()=>{'use strict';
  let canal=null,timer=null,executando=false,pendente=false;
  const visivel=id=>{const el=document.getElementById(id);return !!el&&!el.classList.contains('hidden')};
  function agendar(ms=90){clearTimeout(timer);timer=setTimeout(sincronizar,ms)}
  async function sincronizar(){
    if(executando){pendente=true;return}
    if(!window.OBRIX_BACKEND||document.visibilityState==='hidden')return;
    const app=document.getElementById('app');
    if(!app||app.classList.contains('hidden'))return;
    executando=true;
    try{
      if(visivel('equipe')&&window.OBRIX_EQUIPE?.refresh){
        await window.OBRIX_EQUIPE.refresh();
        setTimeout(()=>window.OBRIX_EQUIPE_TOTAL_PAGO?.refresh?.(),120);
      }else if(visivel('financeiroMain')&&window.OBRIX_FIN?.render){
        await window.OBRIX_FIN.render();
      }else if(visivel('obras')){
        const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),eid=p.empresa_id;
        const [ob,ex,fi]=await Promise.all([
          sb.from('obras').select('*').eq('empresa_id',eid),
          sb.from('servicos_extras').select('*').eq('empresa_id',eid),
          sb.from('financeiro').select('*').eq('empresa_id',eid)
        ]);
        if(!ob.error&&!ex.error&&!fi.error){
          obras=ob.data||[];extras=ex.data||[];financeiro=fi.data||[];
          window.obras=obras;window.financeiro=financeiro;
          window.OBRIX_OBRAS?.render?.();
        }
      }else if(visivel('inicio')&&window.OBRIX_DASH?.sync){
        await window.OBRIX_DASH.sync();
      }
    }catch(e){console.warn('Sincronização rápida indisponível',e)}
    finally{
      executando=false;
      if(pendente){pendente=false;agendar(120)}
    }
  }
  async function iniciar(){
    if(canal||!window.OBRIX_BACKEND)return;
    try{
      const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),filtro=`empresa_id=eq.${p.empresa_id}`;
      canal=sb.channel('obrix-sync-fast-'+String(p.empresa_id));
      ['obras','servicos_extras','financeiro','funcionarios','diarias','vales','bonus_extras','pagamentos_equipe'].forEach(t=>{
        canal.on('postgres_changes',{event:'*',schema:'public',table:t,filter:filtro},()=>agendar(70));
      });
      canal.subscribe();
    }catch(e){console.warn('Realtime rápido indisponível',e);canal=null}
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){iniciar();agendar(80)}});
  window.addEventListener('focus',()=>{iniciar();agendar(80)});
  window.addEventListener('pageshow',()=>{iniciar();agendar(80)});
  document.addEventListener('click',e=>{const b=e.target.closest?.('.bottom button,#bInicio');if(b)setTimeout(()=>agendar(80),0)},true);
  setTimeout(iniciar,700);
  window.OBRIX_SYNC_FAST={sync:sincronizar,start:iniciar};
})();