(()=>{'use strict';
if(window.__OBRIX_CORRECOES_REAIS_20261102)return;window.__OBRIX_CORRECOES_REAIS_20261102=true;
let obraChecklistId='',filaVisual=false,saveTimer=null,refreshTimer=null,canal=null,retryTimer=null,ctxCache=null,finObs=null;
const estilo=document.createElement('style');estilo.id='obrix-correcoes-reais-20261102-style';estilo.textContent=`@media(max-width:760px){#fmFiltrosPanel .fmFiltrosGrid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important}#fmFiltrosPanel .fmFiltrosGrid label.obrixDataCompact{grid-column:auto!important;min-width:0!important;width:100%!important;max-width:100%!important}#fmFiltroDataInicio,#fmFiltroDataFim{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:40px!important;box-sizing:border-box!important;font-size:12px!important;padding:7px 5px!important;letter-spacing:-.2px!important}}`;
function estiloPorUltimo(){if(estilo.parentNode!==document.head||document.head.lastElementChild!==estilo)document.head.appendChild(estilo)}
function brancoAndamento(){document.querySelectorAll('#obras .obxStatus.andamento,#listaObras .obxStatus.andamento').forEach(el=>{el.style.setProperty('color','#fff','important');el.style.setProperty('-webkit-text-fill-color','#fff','important')})}
function corrigirDatas(){if(innerWidth>760)return;const a=document.getElementById('fmFiltroDataInicio'),b=document.getElementById('fmFiltroDataFim');if(!a&&!b)return;const grid=(a||b)?.closest?.('.fmFiltrosGrid');if(grid){grid.style.setProperty('grid-template-columns','minmax(0,1fr) minmax(0,1fr)','important');grid.style.setProperty('gap','8px','important');[...grid.children].forEach(ch=>{if(!(ch instanceof HTMLElement))return;const ehData=ch.contains(a)||ch.contains(b);if(ehData){ch.classList.add('obrixDataCompact');ch.style.setProperty('grid-column','auto','important');ch.style.setProperty('min-width','0','important');ch.style.setProperty('width','100%','important')}else if(ch.matches('label')){ch.style.setProperty('grid-column','1 / -1','important')}})}for(const el of [a,b]){if(!el)continue;const lab=el.closest('label');lab?.classList.add('obrixDataCompact');el.style.setProperty('width','100%','important');el.style.setProperty('max-width','100%','important');el.style.setProperty('min-width','0','important');el.style.setProperty('height','40px','important');el.style.setProperty('box-sizing','border-box','important');el.style.setProperty('font-size','12px','important');el.style.setProperty('padding','7px 5px','important')}}
function detectarObraModal(){if(!document.querySelector('.checkModalBack'))return;if(obraChecklistId)return;const nome=document.querySelector('.checkModalBack .checkHead .muted')?.textContent?.trim();if(!nome)return;const o=(window.obras||[]).find(x=>String(x.nome||'').trim()===nome);if(o)obraChecklistId=String(o.id)}
function aplicarVisuais(){filaVisual=false;estiloPorUltimo();brancoAndamento();corrigirDatas();detectarObraModal()}
function agendarVisuais(){if(filaVisual)return;filaVisual=true;requestAnimationFrame(aplicarVisuais)}
function capturarObraChecklist(alvo){const card=alvo?.closest?.('.obxObraCard[data-obra-id]');if(card&&alvo.closest?.('.obxChecklist')){obraChecklistId=String(card.dataset.obraId||'');return}const b=alvo?.closest?.('[data-check-open]');if(b?.dataset?.checkOpen)obraChecklistId=String(b.dataset.checkOpen)}
function mediaAtual(){const ranges=[...document.querySelectorAll('.checkModalBack [data-check-range]')];if(!ranges.length)return null;const soma=ranges.reduce((s,r)=>s+Math.max(0,Math.min(100,Number(r.value||0))),0);return Math.round((soma/ranges.length)*10)/10}
function pintarCardProgresso(id,p){const card=document.querySelector(`.obxObraCard[data-obra-id="${CSS.escape(String(id))}"]`);if(!card)return;const num=card.querySelector('.obxObraProgress b');const barra=card.querySelector('.obxTrack span');if(num)num.textContent=`${Math.round(Number(p||0))}%`;if(barra)barra.style.width=`${Math.max(0,Math.min(100,Number(p||0)))}%`}
function aplicarProgressoLocal(id,p){if(!id||p==null)return;const val=Math.max(0,Math.min(100,Number(p||0)));const o=(window.obras||[]).find(x=>String(x.id)===String(id));if(o)o.progresso=val;pintarCardProgresso(id,val);try{window.OBRIX_DASH?.paint?.()}catch(_){}agendarVisuais()}
async function contexto(){if(ctxCache)return ctxCache;const p=await window.OBRIX_BACKEND?.profile?.();if(!p?.empresa_id)return null;ctxCache={sb:await window.OBRIX_BACKEND.init(),eid:p.empresa_id};return ctxCache}
async function mediaRemota(id){try{const c=await contexto();if(!c||!id)return null;const r=await c.sb.from('checklist_itens').select('progresso').eq('empresa_id',c.eid).eq('obra_id',id);if(r.error)throw r.error;const rows=r.data||[];if(!rows.length)return 0;const soma=rows.reduce((s,x)=>s+Math.max(0,Math.min(100,Number(x.progresso||0))),0);return Math.round((soma/rows.length)*10)/10}catch(e){console.warn('OBRIX: não foi possível recalcular o progresso agora',e);return null}}
let atualizandoGeral=false,ultimaAtualizacaoGeral=0,equipeTimer=null;
let obrasRefreshTimer=null,obrasRefreshing=false,obrasRefreshFila=false;
const obrasVisiveis=()=>{const el=document.getElementById('obras');return !!el&&!el.classList.contains('hidden')};
function agendarObrasRemotas(ms=250){
  clearTimeout(obrasRefreshTimer);
  obrasRefreshTimer=setTimeout(()=>void atualizarObrasRemotas(),ms);
}
async function atualizarObrasRemotas(){
  if(!navigator.onLine||document.hidden||!window.OBRIX_BACKEND)return;
  if(obrasRefreshing){obrasRefreshFila=true;return}
  obrasRefreshing=true;
  try{
    if(typeof window.carregar==='function'){
      await window.carregar();
    }else if(typeof window.OBRIX_REFRESH_ALL==='function'){
      await window.OBRIX_REFRESH_ALL();
    }else{
      const c=await contexto();if(!c)return;
      const [o,e]=await Promise.all([
        c.sb.from('obras').select('*').eq('empresa_id',c.eid),
        c.sb.from('servicos_extras').select('*').eq('empresa_id',c.eid)
      ]);
      if(o.error||e.error)throw(o.error||e.error);
      window.obras=o.data||[];window.extras=e.data||[];
    }
    if(obrasVisiveis())window.OBRIX_OBRAS_FIEL?.refresh?.();
    window.OBRIX_DASH?.paint?.();
  }catch(e){
    console.warn('OBRIX Obras: atualização remota indisponível',e);
  }finally{
    obrasRefreshing=false;
    if(obrasRefreshFila){obrasRefreshFila=false;agendarObrasRemotas(700)}
  }
}
const equipeVisivel=()=>{const e=document.getElementById('equipe');return !!(e&&!e.classList.contains('hidden'))};
const financeiroVisivel=()=>{const e=document.getElementById('financeiroMain');return !!(e&&!e.classList.contains('hidden'))};
async function atualizarDados(){
  if(!navigator.onLine||document.hidden||atualizandoGeral||Date.now()-ultimaAtualizacaoGeral<1800)return;
  atualizandoGeral=true;ultimaAtualizacaoGeral=Date.now();
  try{
    if(typeof window.carregar==='function')await window.carregar();
    else if(typeof window.OBRIX_REFRESH_ALL==='function')await window.OBRIX_REFRESH_ALL();
    if(obrasVisiveis())try{window.OBRIX_OBRAS_FIEL?.refresh?.()}catch(_){}
    if(financeiroVisivel())try{await window.OBRIX_FIN?.render?.(true)}catch(_){}
    if(equipeVisivel()&&!window.__OBRIX_EQUIPE_LAST_LOAD)try{await window.OBRIX_EQUIPE?.refresh?.()}catch(_){}
    window.OBRIX_DASH?.paint?.();
  }catch(e){console.warn('OBRIX: sincronização será repetida',e)}
  finally{atualizandoGeral=false;agendarVisuais()}
}
function agendarDados(ms=300){clearTimeout(refreshTimer);refreshTimer=setTimeout(atualizarDados,ms)}
function agendarEquipe(ms=350){
  clearTimeout(equipeTimer);
  equipeTimer=setTimeout(async()=>{
    if(!navigator.onLine||document.hidden)return;
    try{
      if(window.OBRIX_EQUIPE?.refresh)await window.OBRIX_EQUIPE.refresh();
      else agendarDados(320);
    }catch(e){console.warn('Equipe: sincronização será repetida',e)}
  },ms);
}
async function salvarProgresso(forcarRemoto=false){detectarObraModal();const id=obraChecklistId;if(!id||!navigator.onLine)return;let p=mediaAtual();if(forcarRemoto||p==null){const pr=await mediaRemota(id);if(pr!=null)p=pr}if(p==null)return;aplicarProgressoLocal(id,p);setTimeout(()=>{try{window.OBRIX_OBRAS?.render?.()}catch(_){}agendarVisuais()},40)}
function agendarSalvar(ms=260,forcarRemoto=false){clearTimeout(saveTimer);saveTimer=setTimeout(()=>salvarProgresso(forcarRemoto),ms)}
async function sincronizarObraAberta(){detectarObraModal();if(!obraChecklistId)return;const p=mediaAtual();if(p!=null)aplicarProgressoLocal(obraChecklistId,p);agendarSalvar(120,true)}
function acompanharFinanceiro(){const form=document.getElementById('fmForm');if(!form||finObs)return;finObs=new MutationObserver(()=>{if(!form.classList.contains('hidden'))return;finObs.disconnect();finObs=null;agendarDados(80)});finObs.observe(form,{attributes:true,attributeFilter:['class']});setTimeout(()=>{if(finObs){finObs.disconnect();finObs=null}},8000)}
function pararCanal(){clearTimeout(retryTimer);retryTimer=null;if(canal){try{canal.unsubscribe?.()}catch(_){}canal=null}}
async function realtime(){if(canal||!navigator.onLine)return;try{const c=await contexto();if(!c)return;let ch=c.sb.channel('obrix-sync-real-'+c.eid);
ch=ch.on('postgres_changes',{event:'*',schema:'public',table:'obras',filter:`empresa_id=eq.${c.eid}`},payload=>{
  const novo=payload?.new||null;
  const atual=novo?.id?(window.obras||[]).find(x=>String(x.id)===String(novo.id)):null;
  if(novo?.id&&atual){
    Object.assign(atual,novo);
    pintarCardProgresso(novo.id,novo.progresso);
    if(obrasVisiveis())try{window.OBRIX_OBRAS_FIEL?.render?.()||window.OBRIX_OBRAS?.render?.()}catch(_){}
    try{window.OBRIX_DASH?.paint?.()}catch(_){}
    agendarVisuais();
  }
  // INSERT e DELETE precisam recarregar a coleção: atualizar só um cartão não inclui/exclui obras.
  // UPDATE também reconcilia o cache offline, sem sobrescrever o servidor.
  agendarObrasRemotas(novo?.id&&atual?850:220);
});
for(const tabela of ['financeiro','servicos_extras'])ch=ch.on('postgres_changes',{event:'*',schema:'public',table:tabela,filter:`empresa_id=eq.${c.eid}`},()=>agendarDados(320));
for(const tabela of ['funcionarios','diarias','vales','bonus_extras'])ch=ch.on('postgres_changes',{event:'*',schema:'public',table:tabela,filter:`empresa_id=eq.${c.eid}`},()=>agendarEquipe(350));
ch=ch.on('postgres_changes',{event:'*',schema:'public',table:'faltas',filter:`empresa_id=eq.${c.eid}`},payload=>{
  window.dispatchEvent(new CustomEvent('obrix:equipe-registro',{detail:{table:'faltas',funcionarioId:payload?.new?.funcionario_id||payload?.old?.funcionario_id||null}}));
});
ch=ch.on('postgres_changes',{event:'*',schema:'public',table:'checklist_itens',filter:`empresa_id=eq.${c.eid}`},payload=>{const id=String(payload?.new?.obra_id||payload?.old?.obra_id||obraChecklistId||'');if(id&&(!obraChecklistId||String(obraChecklistId)===id)){obraChecklistId=id;agendarSalvar(180,true)}});
canal=ch.subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){pararCanal();retryTimer=setTimeout(realtime,1500)}})}catch(e){console.warn('OBRIX: realtime indisponível',e);pararCanal();retryTimer=setTimeout(realtime,1800)}}
document.addEventListener('click',e=>{capturarObraChecklist(e.target);if(e.target.closest?.('#fmSalvar'))acompanharFinanceiro();if(e.target.closest?.('.checkClose'))agendarSalvar(0,true);setTimeout(agendarVisuais,0);setTimeout(agendarVisuais,160);if(e.target.closest?.('.obxChecklist,[data-check-open]'))setTimeout(sincronizarObraAberta,350)},true);
document.addEventListener('input',e=>{if(!e.target.closest?.('[data-check-range]'))return;detectarObraModal();const p=mediaAtual();if(obraChecklistId&&p!=null){aplicarProgressoLocal(obraChecklistId,p);agendarSalvar(220,false)}},true);
document.addEventListener('change',e=>{if(!e.target.closest?.('[data-check-range]'))return;detectarObraModal();const p=mediaAtual();if(obraChecklistId&&p!=null)aplicarProgressoLocal(obraChecklistId,p);agendarSalvar(80,true)},true);
const root=document.getElementById('app')||document.body;new MutationObserver(agendarVisuais).observe(root,{childList:true,subtree:true});
window.addEventListener('focus',()=>{agendarVisuais();agendarDados(100);if(obrasVisiveis())agendarObrasRemotas(1200);realtime()});window.addEventListener('pageshow',()=>{agendarVisuais();agendarDados(100);realtime()});document.addEventListener('visibilitychange',()=>{if(!document.hidden){agendarVisuais();agendarDados(100);if(obrasVisiveis())agendarObrasRemotas(1200);realtime()}});window.addEventListener('online',()=>{pararCanal();agendarDados(80);realtime()});window.addEventListener('offline',pararCanal);window.addEventListener('resize',agendarVisuais);
setTimeout(()=>{agendarVisuais();realtime()},300);setTimeout(agendarVisuais,1000);
})();