(()=>{'use strict';
  let canal=null,timer=null,executando=false,pendente=false,eid=null,checando=false;
  let sigEquipe='',sigGeral='';
  const visivel=id=>{const el=document.getElementById(id);return !!el&&!el.classList.contains('hidden')};
  const appAtivo=()=>{const app=document.getElementById('app');return !!app&&!app.classList.contains('hidden')};
  const normalizar=rows=>(rows||[]).slice().sort((a,b)=>String(a.id||'').localeCompare(String(b.id||'')));
  const assinatura=grupos=>JSON.stringify(grupos.map(normalizar));
  function agendar(ms=70){clearTimeout(timer);timer=setTimeout(sincronizar,ms)}
  async function contexto(){if(eid)return eid;const p=await OBRIX_BACKEND.profile();eid=p.empresa_id;return eid}
  async function sincronizar(){
    if(executando){pendente=true;return}
    if(!window.OBRIX_BACKEND||document.visibilityState==='hidden'||!appAtivo())return;
    executando=true;
    try{
      if(visivel('equipe')&&window.OBRIX_EQUIPE?.refresh){
        await window.OBRIX_EQUIPE.refresh();
        setTimeout(()=>window.OBRIX_EQUIPE_TOTAL_PAGO?.refresh?.(),80);
      }else if(visivel('financeiroMain')&&window.OBRIX_FIN?.render){
        await window.OBRIX_FIN.render();
      }else if(visivel('obras')){
        const id=await contexto(),sb=await OBRIX_BACKEND.init();
        const [ob,ex,fi]=await Promise.all([
          sb.from('obras').select('*').eq('empresa_id',id),
          sb.from('servicos_extras').select('*').eq('empresa_id',id),
          sb.from('financeiro').select('*').eq('empresa_id',id)
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
    finally{executando=false;if(pendente){pendente=false;agendar(100)}}
  }
  async function iniciar(){
    if(canal||!window.OBRIX_BACKEND||!appAtivo())return;
    try{
      const id=await contexto(),sb=await OBRIX_BACKEND.init(),filtro=`empresa_id=eq.${id}`;
      canal=sb.channel('obrix-sync-fast-'+String(id));
      ['obras','servicos_extras','financeiro','funcionarios','diarias','vales','bonus_extras','pagamentos_equipe'].forEach(t=>{
        canal.on('postgres_changes',{event:'*',schema:'public',table:t,filter:filtro},()=>agendar(40));
      });
      canal.subscribe(status=>{
        if(status==='SUBSCRIBED')agendar(30);
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
          try{sb.removeChannel(canal)}catch(_){}
          canal=null;
          setTimeout(iniciar,1000);
        }
      });
    }catch(e){console.warn('Realtime rápido indisponível',e);canal=null;setTimeout(iniciar,1200)}
  }
  async function verificarMudancas(){
    if(checando||!appAtivo()||document.visibilityState==='hidden'||!window.OBRIX_BACKEND)return;
    checando=true;
    try{
      const id=await contexto(),sb=await OBRIX_BACKEND.init();
      if(visivel('equipe')){
        const [fn,di,va,bo,pa]=await Promise.all([
          sb.from('funcionarios').select('*').eq('empresa_id',id),
          sb.from('diarias').select('*').eq('empresa_id',id),
          sb.from('vales').select('*').eq('empresa_id',id),
          sb.from('bonus_extras').select('*').eq('empresa_id',id),
          sb.from('pagamentos_equipe').select('*').eq('empresa_id',id)
        ]);
        if([fn,di,va,bo,pa].every(r=>!r.error)){
          const s=assinatura([fn.data,di.data,va.data,bo.data,pa.data]);
          if(sigEquipe&&s!==sigEquipe)agendar(20);
          sigEquipe=s;
        }
      }else if(visivel('obras')||visivel('financeiroMain')||visivel('inicio')){
        const [ob,ex,fi,fn]=await Promise.all([
          sb.from('obras').select('*').eq('empresa_id',id),
          sb.from('servicos_extras').select('*').eq('empresa_id',id),
          sb.from('financeiro').select('*').eq('empresa_id',id),
          sb.from('funcionarios').select('*').eq('empresa_id',id)
        ]);
        if([ob,ex,fi,fn].every(r=>!r.error)){
          const s=assinatura([ob.data,ex.data,fi.data,fn.data]);
          if(sigGeral&&s!==sigGeral)agendar(20);
          sigGeral=s;
        }
      }
    }catch(e){console.warn('Verificação de sincronização indisponível',e)}finally{checando=false}
  }
  function ativar(){if(!appAtivo())return;iniciar();agendar(30);setTimeout(verificarMudancas,120)}
  const app=document.getElementById('app');
  if(app)new MutationObserver(ativar).observe(app,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)ativar()});
  window.addEventListener('focus',ativar);
  window.addEventListener('pageshow',ativar);
  document.addEventListener('click',e=>{const b=e.target.closest?.('.bottom button,#bInicio,#entrar');if(b)setTimeout(ativar,120)},true);
  setInterval(()=>{if(appAtivo()){if(!canal)iniciar();verificarMudancas()}},1500);
  setTimeout(ativar,500);
  window.OBRIX_SYNC_FAST={sync:sincronizar,start:iniciar,check:verificarMudancas};
})();