(function(){
  'use strict';
  let channel=null;
  let timer=null;
  let syncing=false;

  function badge(){
    let el=document.getElementById('obrixRealtimeStatus');
    if(el)return el;
    el=document.createElement('div');
    el.id='obrixRealtimeStatus';
    el.textContent='Sincronização: aguardando login';
    el.style.cssText='position:fixed;right:12px;bottom:12px;z-index:9999;padding:9px 12px;border-radius:999px;background:#e5e7eb;color:#111827;font:700 12px system-ui,Arial;box-shadow:0 4px 14px rgba(0,0,0,.15)';
    document.body.appendChild(el);
    return el;
  }

  function setStatus(text,ok){
    const el=badge();
    el.textContent=text;
    el.style.background=ok===true?'#dcfce7':ok===false?'#fee2e2':'#e5e7eb';
    el.style.color=ok===true?'#166534':ok===false?'#991b1b':'#111827';
  }

  async function refreshSoon(){
    clearTimeout(timer);
    timer=setTimeout(async()=>{
      try{
        if(typeof window.loadAll==='function') await window.loadAll();
        else if(typeof window.load==='function') await window.load();
        setStatus('Sincronização: atualizada agora',true);
      }catch(e){
        console.error('OBRIX realtime refresh',e);
        setStatus('Sincronização: falha ao atualizar',false);
      }
    },180);
  }

  async function stop(){
    if(!channel)return;
    try{
      const sb=await window.OBRIX_BACKEND.init();
      await sb.removeChannel(channel);
    }catch(_){}
    channel=null;
  }

  async function start(){
    if(syncing||!window.OBRIX_BACKEND)return;
    syncing=true;
    try{
      const sb=await window.OBRIX_BACKEND.init();
      const {data:{session}}=await sb.auth.getSession();
      if(!session){setStatus('Sincronização: aguardando login');return}
      const p=await window.OBRIX_BACKEND.profile();
      if(!p?.empresa_id)throw new Error('empresa_id ausente');
      await stop();
      setStatus('Sincronização: conectando...');
      const filter='empresa_id=eq.'+p.empresa_id;
      channel=sb.channel('obrix-core-'+p.empresa_id)
        .on('postgres_changes',{event:'*',schema:'public',table:'obras',filter},refreshSoon)
        .on('postgres_changes',{event:'*',schema:'public',table:'funcionarios',filter},refreshSoon)
        .on('postgres_changes',{event:'*',schema:'public',table:'financeiro',filter},refreshSoon)
        .on('postgres_changes',{event:'*',schema:'public',table:'diarias',filter},refreshSoon)
        .on('postgres_changes',{event:'*',schema:'public',table:'pagamentos_equipe',filter},refreshSoon)
        .on('postgres_changes',{event:'*',schema:'public',table:'pagamento_diarias',filter},refreshSoon)
        .subscribe(status=>{
          if(status==='SUBSCRIBED')setStatus('Sincronização em tempo real: conectada',true);
          else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')setStatus('Sincronização em tempo real: erro',false);
          else if(status==='CLOSED')setStatus('Sincronização: desconectada');
        });
    }catch(e){
      console.error('OBRIX realtime start',e);
      setStatus('Sincronização em tempo real: erro',false);
    }finally{syncing=false}
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    badge();
    try{
      const sb=await window.OBRIX_BACKEND.init();
      sb.auth.onAuthStateChange((_event,session)=>{if(session) setTimeout(start,100); else {stop();setStatus('Sincronização: aguardando login')}});
      start();
      window.addEventListener('focus',()=>refreshSoon());
      document.addEventListener('visibilitychange',()=>{if(!document.hidden){start();refreshSoon()}});
    }catch(e){setStatus('Sincronização em tempo real: erro',false)}
  });
})();
