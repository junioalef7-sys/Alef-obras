(function(){
  'use strict';

  let channel=null;
  let timer=null;
  let syncing=false;

  function scheduleRefresh(){
    clearTimeout(timer);
    timer=setTimeout(async()=>{
      if(syncing)return;
      syncing=true;
      try{
        if(typeof window.loadAll==='function') await window.loadAll();
        else if(window.OBRIX_EQUIPE?.refresh) await window.OBRIX_EQUIPE.refresh();
        else if(typeof window.carregar==='function') await window.carregar();
      }catch(e){
        console.warn('OBRIX realtime: atualização indisponível',e);
      }finally{
        syncing=false;
      }
    },250);
  }

  async function start(){
    try{
      if(!window.OBRIX_BACKEND)return;
      const sb=await window.OBRIX_BACKEND.init();
      const p=await window.OBRIX_BACKEND.profile();
      if(channel){try{await sb.removeChannel(channel)}catch(_){}}
      channel=sb.channel('obrix-realtime-'+p.empresa_id)
        .on('postgres_changes',{event:'*',schema:'public'},payload=>{
          const row=payload?.new||payload?.old||{};
          if(!row.empresa_id||String(row.empresa_id)===String(p.empresa_id))scheduleRefresh();
        })
        .subscribe();
    }catch(e){
      console.warn('OBRIX realtime: não foi possível iniciar',e);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,300));
  else setTimeout(start,300);

  window.OBRIX_REALTIME={start,refresh:scheduleRefresh};
})();
