(()=>{'use strict';
  if(window.__OBRIX_SYNC_FAST)return;window.__OBRIX_SYNC_FAST=true;
  let canal=null,timer=null,executando=false,pendente=false,eid=null;
  const visivel=id=>{const el=document.getElementById(id);return !!el&&!el.classList.contains('hidden')};
  const appAtivo=()=>{const app=document.getElementById('app');return !!app&&!app.classList.contains('hidden')};
  function agendar(ms=120){clearTimeout(timer);timer=setTimeout(sincronizar,ms)}
  async function contexto(){if(eid)return eid;const p=await window.OBRIX_BACKEND.profile();eid=p.empresa_id;return eid}
  async function atualizarFinanceiro(){
    await window.OBRIX_FIN?.render?.(true);
    const periodo=document.querySelector('#financeiroMain #obxPer');
    if(periodo){periodo.dispatchEvent(new Event('change',{bubbles:false}));setTimeout(()=>window.OBRIX_FIN_MOBILE_COMPACTO?.refresh?.(),180)}
  }
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
        await atualizarFinanceiro();
      }else if(visivel('estoqueMain')&&window.OBRIX_EST?.refresh){
        await window.OBRIX_EST.refresh();
      }else if(visivel('obras')){
        const id=await contexto(),sb=await window.OBRIX_BACKEND.init();
        const [ob,ex,fi]=await Promise.all([
          sb.from('obras').select('*').eq('empresa_id',id),
          sb.from('servicos_extras').select('*').eq('empresa_id',id),
          sb.from('financeiro').select('*').eq('empresa_id',id)
        ]);
        if(!ob.error&&!ex.error&&!fi.error){
          const o=ob.data||[],x=ex.data||[],f=fi.data||[];window.obras=o;window.extras=x;window.financeiro=f;
          try{obras=o;extras=x;financeiro=f}catch(_){}
          window.OBRIX_OBRAS?.render?.();setTimeout(()=>window.OBRIX_OBRAS_FIEL?.refresh?.(),80);
        }
      }else if(visivel('inicio')&&window.OBRIX_DASH?.sync){
        await window.OBRIX_DASH.sync(true);
      }
    }catch(e){console.warn('Sincronização rápida indisponível',e)}finally{executando=false;if(pendente){pendente=false;agendar(180)}}
  }
  async function iniciar(){
    if(canal||!window.OBRIX_BACKEND||!appAtivo()||!navigator.onLine)return;
    try{
      const id=await contexto(),sb=await window.OBRIX_BACKEND.init(),filtro=`empresa_id=eq.${id}`;
      canal=sb.channel('obrix-sync-fast-'+String(id));
      ['obras','servicos_extras','checklist_itens','financeiro','funcionarios','diarias','vales','bonus_extras','faltas','pagamentos_equipe','materiais','estoques','estoque_saldos','estoque_movimentacoes','compras','compra_itens'].forEach(t=>canal.on('postgres_changes',{event:'*',schema:'public',table:t,filter:filtro},()=>agendar(90)));
      canal.subscribe(status=>{
        if(status==='SUBSCRIBED')agendar(60);
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
          try{sb.removeChannel(canal)}catch(_){}canal=null;setTimeout(iniciar,1500);
        }
      });
    }catch(e){console.warn('Realtime rápido indisponível',e);canal=null;setTimeout(iniciar,1800)}
  }
  function ativar(){if(!appAtivo())return;void iniciar()}
  const app=document.getElementById('app');if(app)new MutationObserver(ativar).observe(app,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){ativar();agendar(180)}});
  window.addEventListener('focus',()=>{ativar();agendar(180)});
  window.addEventListener('pageshow',()=>{ativar();agendar(180)});
  window.addEventListener('online',()=>{canal=null;setTimeout(ativar,80);agendar(220)});
  document.addEventListener('click',e=>{const b=e.target.closest?.('.bottom button,#bInicio,#entrar');if(b)setTimeout(ativar,120)},true);
  setInterval(()=>{if(appAtivo()&&!canal)void iniciar()},45000);
  setTimeout(ativar,900);
  window.OBRIX_SYNC_FAST_API={sync:sincronizar,start:iniciar,status:()=>({ativo:!!canal,executando})};
})();
