(()=>{'use strict';
if(window.__OBRIX_SYNC_SETA_LEVE)return;window.__OBRIX_SYNC_SETA_LEVE=true;
const CORE=['inicio','obras','equipe','financeiroMain','estoqueMain'];
const TABELAS={
  inicio:['obras','servicos_extras','financeiro','funcionarios'],
  obras:['obras','servicos_extras','checklist_itens','financeiro'],
  equipe:['funcionarios','diarias','vales','bonus_extras','faltas','pagamentos_equipe'],
  financeiroMain:['financeiro','obras','servicos_extras','checklist_itens'],
  estoqueMain:['materiais','estoques','estoque_saldos','estoque_movimentacoes','compras']
};
let sb=null,empresaId=null,canal=null,telaCanal='',refreshTimer=0,screenTimer=0,refreshing=false,pending=false;
const observado=new WeakSet();
const vis=id=>{const e=document.getElementById(id);return !!e&&!e.classList.contains('hidden')&&getComputedStyle(e).display!=='none'};
const appAtivo=()=>{const a=document.getElementById('app');return !!a&&!a.classList.contains('hidden')};
function telaAtual(){if(!appAtivo())return'';return CORE.find(vis)||''}
function setaDesktop(){
  const b=document.getElementById('obrixHeaderVoltar');if(!b)return;
  const desktop=matchMedia('(min-width:701px)').matches;
  if(desktop){
    if(b.dataset.obrixSetaGrossa==='1')return;
    b.dataset.obrixSetaGrossa='1';
    b.innerHTML='<svg viewBox="0 0 32 32" width="29" height="29" aria-hidden="true" focusable="false"><path d="M18.5 7.5 10 16l8.5 8.5M10.5 16H26" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    b.style.setProperty('font-size','0','important');
  }else if(b.dataset.obrixSetaGrossa==='1'){
    delete b.dataset.obrixSetaGrossa;b.textContent='←';b.style.removeProperty('font-size');
  }
}
async function contexto(){
  if(sb&&empresaId)return{sb,id:empresaId};
  if(!window.OBRIX_BACKEND)throw new Error('Backend indisponível');
  sb=await window.OBRIX_BACKEND.init();const p=await window.OBRIX_BACKEND.profile();empresaId=p?.empresa_id;
  if(!empresaId)throw new Error('Empresa indisponível');return{sb,id:empresaId};
}
async function removerCanal(){
  const c=canal;canal=null;telaCanal='';
  if(c&&sb){try{await sb.removeChannel(c)}catch(_){}}
}
function agendarRefresh(ms=380){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>void atualizarTela(),ms)}
async function atualizarObras(){
  if(window.OBRIX_OBRAS?.refresh){await window.OBRIX_OBRAS.refresh();return}
  const [o,x,f]=await Promise.all([
    window.OBRIX_BACKEND.readTable('obras','criado_em'),
    window.OBRIX_BACKEND.readTable('servicos_extras','criado_em').catch(()=>[]),
    window.OBRIX_BACKEND.readTable('financeiro','data').catch(()=>[])
  ]);
  window.obras=o;window.extras=x;window.financeiro=f;
  try{obras=o;extras=x;financeiro=f}catch(_){ }
  window.OBRIX_OBRAS?.render?.();window.OBRIX_OBRAS_FIEL?.refresh?.();
}
async function atualizarTela(){
  if(refreshing){pending=true;return}
  if(document.visibilityState==='hidden'||!appAtivo())return;
  const t=telaAtual();if(!t)return;
  refreshing=true;
  try{
    if(t==='inicio')await window.OBRIX_DASH?.sync?.(true);
    else if(t==='equipe'){await window.OBRIX_EQUIPE?.refresh?.();setTimeout(()=>window.OBRIX_EQUIPE_TOTAL_PAGO?.refresh?.(),100)}
    else if(t==='financeiroMain'){
      await window.OBRIX_FIN?.render?.(true);
      window.OBRIX_FIN_BUSCA?.refreshOptions?.();window.OBRIX_FIN_BUSCA?.aplicar?.();window.OBRIX_FIN_VISUAL?.refresh?.();
    }
    else if(t==='estoqueMain')await window.OBRIX_EST?.refresh?.();
    else if(t==='obras')await atualizarObras();
  }catch(e){console.warn('OBRIX sincronização leve: atualização indisponível',e)}
  finally{refreshing=false;if(pending){pending=false;agendarRefresh(500)}}
}
async function assinarTela(force=false){
  setaDesktop();
  const t=telaAtual();
  if(!t){await removerCanal();return}
  if(!navigator.onLine)return;
  if(!force&&canal&&telaCanal===t)return;
  try{
    await removerCanal();const ctx=await contexto(),filtro=`empresa_id=eq.${ctx.id}`;
    const c=ctx.sb.channel('obrix-live-'+String(ctx.id)+'-'+t+'-'+Date.now());
    (TABELAS[t]||[]).forEach(tab=>c.on('postgres_changes',{event:'*',schema:'public',table:tab,filter:filtro},()=>agendarRefresh(420)));
    canal=c;telaCanal=t;
    c.subscribe(status=>{
      if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
        if(canal===c){canal=null;telaCanal='';setTimeout(()=>void assinarTela(true),1200)}
      }
    });
  }catch(e){console.warn('OBRIX sincronização leve: realtime indisponível',e);canal=null;telaCanal=''}
}
function agendarTela(ms=120){clearTimeout(screenTimer);screenTimer=setTimeout(()=>void assinarTela(false),ms)}
function observar(){
  const app=document.getElementById('app');
  if(app&&!observado.has(app)){observado.add(app);new MutationObserver(()=>{if(!appAtivo()){empresaId=null;sb=null;void removerCanal()}else agendarTela(80)}).observe(app,{attributes:true,attributeFilter:['class']})}
  CORE.forEach(id=>{const e=document.getElementById(id);if(!e||observado.has(e))return;observado.add(e);new MutationObserver(()=>agendarTela(80)).observe(e,{attributes:true,attributeFilter:['class']})});
  const top=document.querySelector('#app>.top');if(top&&!observado.has(top)){observado.add(top);new MutationObserver(setaDesktop).observe(top,{childList:true})}
  setaDesktop();
}
window.addEventListener('resize',setaDesktop,{passive:true});
window.addEventListener('focus',()=>{observar();void assinarTela(true);agendarRefresh(220)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){observar();void assinarTela(true);agendarRefresh(220)}});
window.addEventListener('online',()=>{setTimeout(()=>void assinarTela(true),100);agendarRefresh(260)});
window.addEventListener('offline',()=>void removerCanal());
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow'].forEach(n=>window.addEventListener(n,()=>{observar();agendarTela(80)}));
setTimeout(()=>{observar();void assinarTela(false)},250);
setTimeout(()=>{observar();void assinarTela(false)},900);
window.OBRIX_SYNC_SETA_LEVE={refresh:atualizarTela,start:()=>assinarTela(true),status:()=>({tela:telaAtual(),canal:telaCanal,ativo:!!canal})};
})();
