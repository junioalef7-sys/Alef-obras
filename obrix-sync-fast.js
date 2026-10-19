(()=>{'use strict';
  let canal=null,timer=null,executando=false,pendente=false,eid=null;
  const visivel=id=>{const el=document.getElementById(id);return !!el&&!el.classList.contains('hidden')};
  const appAtivo=()=>{const app=document.getElementById('app');return !!app&&!app.classList.contains('hidden')};
  function agendar(ms=120){clearTimeout(timer);timer=setTimeout(sincronizar,ms)}
  async function contexto(){if(eid)return eid;const p=await OBRIX_BACKEND.profile();eid=p.empresa_id;return eid}
  async function sincronizar(){
    if(executando){pendente=true;return}
    if(!window.OBRIX_BACKEND||document.visibilityState==='hidden'||!appAtivo())return;
    executando=true;
    try{
      if(document.querySelector('.checkModalBack')&&window.OBRIX_CHECKLIST?.check){
        await window.OBRIX_CHECKLIST.check();
      }else if(visivel('equipe')&&window.OBRIX_EQUIPE?.refresh){
        await window.OBRIX_EQUIPE.refresh();setTimeout(()=>window.OBRIX_EQUIPE_TOTAL_PAGO?.refresh?.(),120);
      }else if(visivel('financeiroMain')&&window.OBRIX_FIN?.render){
        await window.OBRIX_FIN.render(true);
      }else if(visivel('obras')){
        const id=await contexto(),sb=await OBRIX_BACKEND.init();
        const [ob,ex,fi]=await Promise.all([
          sb.from('obras').select('*').eq('empresa_id',id),
          sb.from('servicos_extras').select('*').eq('empresa_id',id),
          sb.from('financeiro').select('*').eq('empresa_id',id)
        ]);
        if(!ob.error&&!ex.error&&!fi.error){
          const o=ob.data||[],x=ex.data||[],f=fi.data||[];window.obras=o;window.extras=x;window.financeiro=f;
          try{obras=o;extras=x;financeiro=f}catch(_){}
          window.OBRIX_OBRAS?.render?.();
        }
      }else if(visivel('inicio')&&window.OBRIX_DASH?.sync){
        await window.OBRIX_DASH.sync(true);
      }
    }catch(e){console.warn('Sincronização rápida indisponível',e)}finally{executando=false;if(pendente){pendente=false;agendar(180)}}
  }
  async function iniciar(){
    if(canal||!window.OBRIX_BACKEND||!appAtivo())return;
    try{
      const id=await contexto(),sb=await OBRIX_BACKEND.init(),filtro=`empresa_id=eq.${id}`;
      canal=sb.channel('obrix-sync-fast-'+String(id));
      ['obras','servicos_extras','checklist_itens','financeiro','funcionarios','diarias','vales','bonus_extras','pagamentos_equipe'].forEach(t=>canal.on('postgres_changes',{event:'*',schema:'public',table:t,filter:filtro},()=>agendar(100)));
      canal.subscribe(status=>{
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
          try{sb.removeChannel(canal)}catch(_){}canal=null;setTimeout(iniciar,1500);
        }
      });
    }catch(e){console.warn('Realtime rápido indisponível',e);canal=null;setTimeout(iniciar,1800)}
  }
  function ativar(){if(!appAtivo())return;void iniciar()}
  const app=document.getElementById('app');if(app)new MutationObserver(ativar).observe(app,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){ativar();agendar(250)}});window.addEventListener('focus',()=>{ativar();agendar(250)});window.addEventListener('pageshow',()=>{ativar();agendar(250)});
  document.addEventListener('click',e=>{const b=e.target.closest?.('.bottom button,#bInicio,#entrar');if(b)setTimeout(ativar,150)},true);
  setInterval(()=>{if(appAtivo()){if(!canal)void iniciar();agendar(0)}},45000);
  setTimeout(ativar,1200);
  window.OBRIX_SYNC_FAST={sync:sincronizar,start:iniciar};
})();
