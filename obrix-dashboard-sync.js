(()=>{
  'use strict';
  const $=id=>document.getElementById(id),money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  let syncing=false,channel=null,timer=null,lastFetch=0;
  function appAtivo(){const app=$('app');return !!app&&!app.classList.contains('hidden')}
  function paint(){
    const obras=window.obras||[],extras=window.extras||[],financeiro=window.financeiro||[],funcionarios=window.funcionarios||[];
    const total=obras.reduce((s,o)=>s+Number(o.valor_contrato||0),0)+extras.reduce((s,x)=>s+Number(x.valor||0),0),recebido=financeiro.filter(x=>x.tipo==='receita'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0),ativas=obras.filter(o=>['andamento','em_andamento'].includes(String(o.status||'').toLowerCase())).length,funcs=funcionarios.filter(f=>f.ativo!==false).length;
    if($('contratado'))$('contratado').textContent=money(total);if($('receber'))$('receber').textContent=money(Math.max(0,total-recebido));if($('ativas'))$('ativas').textContent=String(ativas);if($('funcs'))$('funcs').textContent=String(funcs);
  }
  async function sync(force=false){
    if(syncing||!window.OBRIX_BACKEND||!appAtivo())return;
    if(!force&&Date.now()-lastFetch<15000){paint();return}
    syncing=true;
    try{
      const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),eid=p.empresa_id;
      const [ob,ex,fi,fn]=await Promise.all([
        sb.from('obras').select('id,valor_contrato,status').eq('empresa_id',eid),
        sb.from('servicos_extras').select('id,obra_id,valor').eq('empresa_id',eid),
        sb.from('financeiro').select('id,obra_id,tipo,valor,status_lancamento').eq('empresa_id',eid),
        sb.from('funcionarios').select('id,ativo').eq('empresa_id',eid)
      ]);
      for(const r of [ob,ex,fi,fn])if(r.error)throw r.error;
      window.obras=ob.data||[];window.extras=ex.data||[];window.financeiro=fi.data||[];window.funcionarios=fn.data||[];lastFetch=Date.now();paint();
    }catch(e){console.warn('Visão Geral: atualização indisponível',e)}finally{syncing=false}
  }
  function agendar(){clearTimeout(timer);timer=setTimeout(()=>sync(true),180)}
  async function realtime(){
    if(channel||!appAtivo())return;
    try{
      const p=await OBRIX_BACKEND.profile(),sb=await OBRIX_BACKEND.init(),filtro=`empresa_id=eq.${p.empresa_id}`;
      channel=sb.channel('obrix-dashboard-sync-'+p.empresa_id);
      ['obras','servicos_extras','financeiro','funcionarios'].forEach(table=>channel.on('postgres_changes',{event:'*',schema:'public',table,filter:filtro},agendar));
      channel.subscribe();
    }catch(e){console.warn('Visão Geral realtime indisponível',e)}
  }
  function ativar(){if(!appAtivo())return;paint();void realtime();if(Date.now()-lastFetch>30000)void sync(false)}
  document.addEventListener('click',e=>{const b=e.target.closest?.('.bottom button,#bInicio');if(!b)return;if(b.id==='bInicio'||(b.textContent||'').trim()==='Início')setTimeout(ativar,0)},true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ativar()});window.addEventListener('focus',ativar);window.addEventListener('pageshow',ativar);
  setInterval(()=>{const inicio=$('inicio');if(inicio&&!inicio.classList.contains('hidden')&&appAtivo())void sync(false)},60000);
  setTimeout(ativar,1200);
  window.OBRIX_DASH={sync,paint};
})();
