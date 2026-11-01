(()=>{
'use strict';
if(window.__OBRIX_FIN_MOBILE_RESUMO_OBRA)return;
if(!window.matchMedia('(max-width:620px)').matches)return;
window.__OBRIX_FIN_MOBILE_RESUMO_OBRA=1;

const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ativos=()=>Array.isArray(window.financeiro)?window.financeiro.filter(x=>!x.status_lancamento||x.status_lancamento==='ativo'):[];
const vals=x=>x?.checklist_valores&&typeof x.checklist_valores==='object'&&!Array.isArray(x.checklist_valores)?x.checklist_valores:{};
const ids=x=>{const v=vals(x),a=Object.keys(v).filter(k=>Number(v[k]||0)>0);if(a.length)return a;if(Array.isArray(x?.checklist_ids)&&x.checklist_ids.length)return x.checklist_ids.map(String);return x?.checklist_id?[String(x.checklist_id)]:[]};
const parte=(x,id)=>{const v=vals(x);if(Object.prototype.hasOwnProperty.call(v,id))return Number(v[id]||0);const a=ids(x);return a.length===1&&a[0]===String(id)?Number(x.valor||0):0};
let obraAberta='',checkAberto='',ctxPromise=null,extrasCache=[],checksCache=[],auxCarregado=false,auxCarregando=false,timer=0;

const css=document.createElement('style');
css.id='obrix-fin-mobile-resumo-obra-css';
css.textContent=`@media(max-width:620px){
#financeiroMain #fmResumoObras{display:none!important}
#financeiroMain .obmResumoObrasAprovado{margin:12px 0;border:1px solid var(--ob-border,#d7e5f2);border-radius:11px;background:var(--ob-surface,#fff);overflow:hidden}
#financeiroMain .obmResumoObrasHead{min-height:39px;padding:8px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--ob-border,#d7e5f2)}
#financeiroMain .obmResumoObrasHead strong{font-size:14px;display:flex;gap:7px;align-items:center}
#financeiroMain .obmResumoItem,#financeiroMain .obmCheckItem{border-bottom:1px solid var(--ob-border,#e6edf4)}
#financeiroMain .obmResumoItem:last-child,#financeiroMain .obmCheckItem:last-child{border-bottom:0}
#financeiroMain .obmResumoLinha{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px}
#financeiroMain .obmResumoLinha>b{font-size:12px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#financeiroMain .obmObraToggle,#financeiroMain .obmCheckToggle{flex:0 0 auto;border:1px solid var(--ob-border,#d7e5f2)!important;background:var(--ob-surface-2,#eef3f7)!important;color:#1688ff!important;-webkit-text-fill-color:#1688ff!important;border-radius:8px!important;padding:6px 8px!important;font-size:10px!important;font-weight:900!important;min-height:0!important;white-space:nowrap!important}
#financeiroMain .obmResumoGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:0 10px 10px}
#financeiroMain .obmResumoBloco{border:1px solid var(--ob-border,#d7e5f2);border-radius:9px;padding:8px;background:var(--ob-surface-2,#f3f6f9);min-width:0}
#financeiroMain .obmResumoBloco small{display:block;font-size:9px;font-weight:800;color:var(--ob-muted,#64748b);margin-bottom:4px}
#financeiroMain .obmResumoBloco b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#financeiroMain .obmResumoBloco.recebido b,#financeiroMain .obmResumoBloco.lucro b{color:#0aa950!important;-webkit-text-fill-color:#0aa950!important}
#financeiroMain .obmResumoBloco.despesas b,#financeiroMain .obmResumoBloco.prejuizo b{color:#ef332b!important;-webkit-text-fill-color:#ef332b!important}
#financeiroMain .obmResumoBloco.servico b{color:#1688ff!important;-webkit-text-fill-color:#1688ff!important}
#financeiroMain .obmChecklistDentro{margin:0 8px 10px;border:1px solid var(--ob-border,#d7e5f2);border-radius:10px;overflow:hidden}
#financeiroMain .obmChecklistTitulo{padding:8px 10px;font-size:11px;font-weight:900;background:var(--ob-surface-2,#f3f6f9);border-bottom:1px solid var(--ob-border,#d7e5f2)}
#financeiroMain .obmVazio{padding:12px;text-align:center;color:var(--ob-muted,#64748b);font-size:10px}
html[data-theme="dark"] #financeiroMain .obmResumoObrasAprovado{background:#0d1722!important;border-color:#293b4d!important}
html[data-theme="dark"] #financeiroMain .obmResumoObrasHead,html[data-theme="dark"] #financeiroMain .obmResumoItem,html[data-theme="dark"] #financeiroMain .obmCheckItem,html[data-theme="dark"] #financeiroMain .obmChecklistDentro{border-color:#293b4d!important}
html[data-theme="dark"] #financeiroMain .obmResumoBloco,html[data-theme="dark"] #financeiroMain .obmObraToggle,html[data-theme="dark"] #financeiroMain .obmCheckToggle,html[data-theme="dark"] #financeiroMain .obmChecklistTitulo{background:#111e2c!important;border-color:#33475a!important}
}`;
document.head.appendChild(css);

function bloco(label,valor,cls=''){return `<div class="obmResumoBloco ${cls}"><small>${label}</small><b>${esc(valor)}</b></div>`}
function filtros(){return {obra:document.getElementById('fmFiltroObra')?.value||'',tipo:document.getElementById('fmFiltroTipo')?.value||'',categoria:document.getElementById('fmFiltroCategoria')?.value||'',inicio:document.getElementById('fmFiltroDataInicio')?.value||'',fim:document.getElementById('fmFiltroDataFim')?.value||''}}
function linhas(){const f=filtros();return ativos().filter(x=>(!f.obra||String(x.obra_id||'')===f.obra)&&(!f.tipo||x.tipo===f.tipo)&&(!f.categoria||x.categoria===f.categoria)&&(!f.inicio||String(x.data||'')>=f.inicio)&&(!f.fim||String(x.data||'')<=f.fim))}
function calcObra(o,rows){const r=rows.filter(x=>String(x.obra_id||'')===String(o.id)),recebido=r.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),despesas=r.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0),extras=extrasCache.filter(x=>String(x.obra_id)===String(o.id)).reduce((s,x)=>s+Number(x.valor||0),0),servico=Number(o.valor_contrato||0)+extras,lucro=recebido-despesas;return{r,recebido,despesas,servico,lucro}}
function renderChecklist(o,t){if(!auxCarregado)return '<div class="obmVazio">Carregando checklist...</div>';const checks=checksCache.filter(c=>String(c.obra_id)===String(o.id));if(!checks.length)return '<div class="obmVazio">Nenhuma etapa cadastrada nesta obra.</div>';return `<div class="obmChecklistDentro"><div class="obmChecklistTitulo">☑ Resumo por checklist</div>${checks.map(c=>{const key=`${o.id}:${c.id}`,aberto=checkAberto===key,rr=t.r.filter(x=>ids(x).includes(String(c.id))),rec=rr.filter(x=>x.tipo==='receita').reduce((s,x)=>s+parte(x,String(c.id)),0),des=rr.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+parte(x,String(c.id)),0),total=Number(c.valor||c.valor_servico||0),lucro=rec-des;return `<article class="obmCheckItem"><div class="obmResumoLinha"><b>${esc(c.nome||'Etapa')}</b><button type="button" class="obmCheckToggle" data-obra="${esc(o.id)}" data-check="${esc(c.id)}" aria-expanded="${aberto}">${aberto?'Ocultar resumo':'Ver resumo'}</button></div>${aberto?`<div class="obmResumoGrid">${bloco('Total serviço',money(total),'servico')}${bloco('Total recebido',money(rec),'recebido')}${bloco('Total despesas',money(des),'despesas')}${bloco('Lucro líquido',money(lucro),lucro>=0?'lucro':'prejuizo')}</div>`:''}</article>`}).join('')}</div>`}
function ligar(box){box.querySelectorAll('.obmObraToggle').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const id=String(b.dataset.obra);obraAberta=obraAberta===id?'':id;checkAberto='';montar();if(obraAberta)carregarAux()});box.querySelectorAll('.obmCheckToggle').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();const key=`${b.dataset.obra}:${b.dataset.check}`;checkAberto=checkAberto===key?'':key;montar()})}
function montar(){const main=document.getElementById('financeiroMain'),lista=document.getElementById('fmLista');if(!main||main.classList.contains('hidden')||!lista)return false;const f=filtros(),todas=Array.isArray(window.obras)?window.obras:[],obras=f.obra?todas.filter(o=>String(o.id)===f.obra):todas,rows=linhas();let box=document.getElementById('obmResumoObrasAprovado');if(!box){box=document.createElement('section');box.id='obmResumoObrasAprovado';box.className='obmResumoObrasAprovado';lista.parentNode.insertBefore(box,lista)}if(obraAberta&&!obras.some(o=>String(o.id)===obraAberta)){obraAberta='';checkAberto=''}box.innerHTML=`<div class="obmResumoObrasHead"><strong><span>🏗️</span>Resumo por obra</strong></div><div>${obras.length?obras.map(o=>{const t=calcObra(o,rows),aberto=obraAberta===String(o.id);return `<article class="obmResumoItem"><div class="obmResumoLinha"><b>${esc(o.nome||'Obra')}</b><button type="button" class="obmObraToggle" data-obra="${esc(o.id)}" aria-expanded="${aberto}">${aberto?'Ocultar resumo':'Ver resumo'}</button></div>${aberto?`<div class="obmResumoGrid">${bloco('Total serviço',money(t.servico),'servico')}${bloco('Total recebido',money(t.recebido),'recebido')}${bloco('Total despesas',money(t.despesas),'despesas')}${bloco('Lucro líquido',money(t.lucro),t.lucro>=0?'lucro':'prejuizo')}</div>${renderChecklist(o,t)}`:''}</article>`}).join(''):'<div class="obmVazio">Nenhuma obra encontrada.</div>'}</div>`;ligar(box);return true}
async function ctx(){if(!ctxPromise)ctxPromise=(async()=>{const p=await OBRIX_BACKEND.profile();return{sb:await OBRIX_BACKEND.init(),eid:p.empresa_id}})();return ctxPromise}
async function carregarAux(){if(auxCarregado||auxCarregando)return;auxCarregando=true;try{const {sb,eid}=await ctx();const [er,cr]=await Promise.all([sb.from('servicos_extras').select('obra_id,valor').eq('empresa_id',eid),sb.from('checklist_itens').select('*').eq('empresa_id',eid).order('ordem',{ascending:true})]);if(!er.error)extrasCache=er.data||[];if(!cr.error)checksCache=cr.data||[];auxCarregado=true;montar()}catch(e){console.warn('Resumo por obra mobile: complemento indisponível',e)}finally{auxCarregando=false}}
function schedule(ms=40){clearTimeout(timer);timer=setTimeout(()=>{if(montar())carregarAux()},ms)}
function observar(){const main=document.getElementById('financeiroMain');if(!main)return setTimeout(observar,200);new MutationObserver(()=>schedule(30)).observe(main,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});const lista=document.getElementById('fmLista');if(lista)new MutationObserver(()=>schedule(40)).observe(lista,{childList:true});schedule(0)}
['change','input'].forEach(ev=>document.addEventListener(ev,e=>{if(['fmFiltroObra','fmFiltroTipo','fmFiltroCategoria','fmFiltroDataInicio','fmFiltroDataFim'].includes(e.target?.id))schedule(0)},true));
window.addEventListener('obrix-financeiro-atualizado',()=>{auxCarregado=false;extrasCache=[];checksCache=[];schedule(20)});
window.addEventListener('pageshow',()=>schedule(80));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observar,{once:true});else observar();
window.OBRIX_FIN_MOBILE_RESUMO_OBRA={refresh:()=>schedule(0)};
})();
